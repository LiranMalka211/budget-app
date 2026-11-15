# PostgreSQL database for the budget app
FROM postgres:17-alpine

# Defaults; override at runtime (docker-compose passes these from .env)
ENV POSTGRES_DB=budget \
    POSTGRES_USER=budget

# Any *.sql / *.sh placed in database/init runs once, on first start with an empty volume.
# The backend creates its own tables, so this is only for extras (extensions, roles, seed data).
COPY init/ /docker-entrypoint-initdb.d/

EXPOSE 5432

HEALTHCHECK --interval=10s --timeout=5s --start-period=10s --retries=5 \
    CMD pg_isready -U "$POSTGRES_USER" -d "$POSTGRES_DB" || exit 1
