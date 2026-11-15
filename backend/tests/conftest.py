"""Shared fixtures: a fresh SQLite database per test and a TestClient with the app lifespan running."""

import os
import tempfile
from collections.abc import Iterator

import pytest
from fastapi.testclient import TestClient

# Settings are read once at import time, so the test database must be configured before importing the app.
_TMP = tempfile.mkdtemp(prefix="budget-tests-")
# Set TEST_DATABASE_URL to run the suite against Postgres (tables are dropped, so never point it at real data).
os.environ["DATABASE_URL"] = os.environ.get("TEST_DATABASE_URL") or f"sqlite:///{_TMP}/test.db"
os.environ["APP_ENV"] = "development"
os.environ["ANTHROPIC_API_KEY"] = ""
os.environ["SMTP_HOST"] = ""

import app.models  # noqa: E402,F401 - registers tables before the app is imported
from app.core.database import Base, engine  # noqa: E402
from app.main import app  # noqa: E402 - rebinds `app` to the FastAPI instance (must stay last)


@pytest.fixture()
def client() -> Iterator[TestClient]:
    """Recreates every table, then yields a client whose requests run through the full app (incl. lifespan)."""
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    with TestClient(app) as c:
        yield c


def register(client: TestClient, email: str, first: str = "Test", last: str = "User") -> dict[str, str]:
    """Registers a user and returns the Authorization header to act as them."""
    res = client.post(
        "/api/auth/register",
        json={"firstName": first, "lastName": last, "email": email, "password": "password123"},
    )
    assert res.status_code == 201, res.text
    return {"Authorization": f"Bearer {res.json()['token']}"}
