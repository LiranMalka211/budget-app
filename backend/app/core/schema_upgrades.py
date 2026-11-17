from sqlalchemy import Engine, inspect, text


def apply_schema_upgrades(engine: Engine) -> None:
    """
    Adds columns introduced after a database was first created. `create_all` only creates missing tables,
    so an existing database (e.g. the Docker Postgres volume) would otherwise lack them. Idempotent.
    Mirrors the Alembic revisions for deployments that do not run Alembic.
    """
    columns = {c["name"] for c in inspect(engine).get_columns("ai_insights")}
    if "language" not in columns:
        with engine.begin() as conn:
            conn.execute(text("ALTER TABLE ai_insights ADD COLUMN language VARCHAR(5) NOT NULL DEFAULT 'en'"))
            conn.execute(text("CREATE INDEX IF NOT EXISTS ix_ai_insights_language ON ai_insights (language)"))

    member_columns = {c["name"] for c in inspect(engine).get_columns("family_members")}
    if "can_edit" not in member_columns:
        with engine.begin() as conn:
            conn.execute(text("ALTER TABLE family_members ADD COLUMN can_edit BOOLEAN NOT NULL DEFAULT false"))
            # Heads already edit by rule; record it on their row too.
            conn.execute(
                text(
                    "UPDATE family_members SET can_edit = true WHERE EXISTS (SELECT 1 FROM families f "
                    "WHERE f.id = family_members.family_id AND f.head_user_id = family_members.user_id)"
                )
            )
