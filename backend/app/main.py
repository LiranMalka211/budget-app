import asyncio
import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api import auth, dashboard, families, imports, insights, lookups, scheduled, transactions
from app.core.config import get_settings
from app.core.database import Base, SessionLocal, engine
from app.core.errors import register_error_handlers
from app.services.scheduled_service import materialize_all
from app.services.seed import seed_lookups

logger = logging.getLogger(__name__)

# How often the background job turns due scheduled templates into transactions.
MATERIALIZE_INTERVAL_SECONDS = 6 * 60 * 60


async def _materialize_loop() -> None:
    """Background task: periodically generates transactions for schedules that became due."""
    while True:
        try:
            with SessionLocal() as db:
                created = materialize_all(db)
                if created:
                    logger.info("Materialised %d scheduled transactions", created)
        except Exception:  # noqa: BLE001 - keep the loop alive
            logger.exception("Scheduled materialisation failed")
        await asyncio.sleep(MATERIALIZE_INTERVAL_SECONDS)


@asynccontextmanager
async def lifespan(_: FastAPI):
    """Creates tables (dev convenience; Alembic owns production migrations), seeds lookups, starts the job."""
    import app.models  # noqa: F401 - registers every table on Base.metadata

    Base.metadata.create_all(bind=engine)
    with SessionLocal() as db:
        seed_lookups(db)
    task = asyncio.create_task(_materialize_loop())
    try:
        yield
    finally:
        task.cancel()


def create_app() -> FastAPI:
    """Builds the FastAPI application with CORS, error handlers and all routers under /api."""
    settings = get_settings()
    app = FastAPI(title="Family Budget API", version="0.1.0", lifespan=lifespan)
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origin_list,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )
    register_error_handlers(app)
    for router in (
        auth.router,
        families.router,
        lookups.router,
        transactions.router,
        scheduled.router,
        imports.router,
        insights.router,
        dashboard.router,
    ):
        app.include_router(router, prefix="/api")

    @app.get("/api/health", tags=["health"])
    def health() -> dict[str, str]:
        """Liveness probe."""
        return {"status": "ok"}

    return app


app = create_app()
