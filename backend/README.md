# Backend (FastAPI)

Python API for the budget app. Implements the contract in `../frontend/src/lib/api/contract.ts`.

## Run locally

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate          # Windows (use `source .venv/bin/activate` on macOS/Linux)
pip install -r requirements.txt
copy .env.example .env          # then edit SECRET_KEY etc.
uvicorn app.main:app --reload --port 8000
```

- API: http://localhost:8000/api, interactive docs: http://localhost:8000/docs
- Uses PostgreSQL. Start just the database with `docker compose up -d database` from the repo root (set `POSTGRES_PASSWORD` in `../.env` to match `DATABASE_URL` in `backend/.env`).
- Tables are created automatically on startup and the lookup tables are seeded.
- Point the frontend at it with `VITE_USE_MOCK=false` and `VITE_API_URL=http://localhost:8000/api` in `frontend/.env`.

## Tests

```bash
.venv\Scripts\python -m pytest -q
```

## Architecture

```
app/
├── main.py            # app factory, CORS, routers, startup (create tables, seed, background job)
├── core/              # config (env), database (engine/session), security (bcrypt + JWT), errors, deps
├── models/            # SQLAlchemy tables: users, families, family_members, transaction_types, categories,
│                      #   transactions, scheduled_transactions, ai_insights, import_batches, password_reset_tokens
├── schemas/           # Pydantic request/response models (camelCase on the wire)
├── services/          # business logic per subject (auth, family, transactions, scheduled, imports, insights, dashboard)
└── api/               # one thin router per subject, mounted under /api
tests/                 # pytest + TestClient against a throwaway SQLite database
alembic/               # migrations for production databases
```

Every function has a short docstring describing what it does.

## Behaviour notes

- **Scope**: when a user belongs to a family, every transaction/schedule query is scoped to the family; otherwise to the user's personal rows. Joining a family moves the user's personal history into it.
- **Scheduled transactions** are materialised lazily whenever transactions, schedules or the dashboard are read, and by a background task every 6 hours.
- **Password reset**: the link is emailed when SMTP is configured, otherwise printed to the log. In development the token is also returned by `/auth/forgot-password` so the frontend can follow it locally.
- **AI insights**: with `ANTHROPIC_API_KEY` set, Claude (`ANTHROPIC_MODEL`, default `claude-opus-5-5`) writes the insights as structured JSON; without a key, or if the call fails, a rule-based generator produces them.
- **Errors**: business errors return `{ "message", "code" }`; the frontend maps `code` to translated text.

## Migrations (production)

```bash
alembic upgrade head                      # apply
alembic revision --autogenerate -m "..."  # after changing models
```
