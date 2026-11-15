# Budget App

Family budget manager: a FastAPI backend and a React dashboard frontend.

```
budget-app/
├── frontend/   # React + Vite + TypeScript dashboard
└── backend/    # Python (FastAPI + SQLAlchemy) API
```

## Running the backend

```bash
cd backend
python -m venv .venv
.venv\Scriptsctivate
pip install -r requirements.txt
copy .env.example .env
uvicorn app.main:app --reload --port 8000     # http://localhost:8000/docs
```

See `backend/README.md` for configuration (database, SMTP, Anthropic API key) and tests.

## Running the frontend

```bash
cd frontend
npm install
npm run dev          # http://localhost:5173
```

The frontend reads `frontend/.env`:

| Variable | Meaning |
|---|---|
| `VITE_USE_MOCK` | `true` runs against an in-browser mock API persisted to localStorage. Set to `false` to use the backend above. |
| `VITE_API_URL` | Backend base URL, e.g. `http://localhost:8000/api`. |

In mock mode the following demo accounts exist (password `password123` for all):

| Email | Role |
|---|---|
| `demo@example.com` | Head of the "Cohen family" |
| `yossi@example.com` | Approved family member |
| `noa@example.com` | Has a pending join request |

You can also register a new user. Mock data lives in `localStorage` (key `budget.mockdb.v1`); clear it to reset the demo.
Sample import files are in `frontend/fixtures/`.

## Frontend architecture

- `src/features/<subject>/` – one folder per business subject (auth, family, transactions, scheduled, imports, insights, dashboard). Each contains its pages, components, a `*Api.ts` file with typed API calls and `use*.ts` hooks.
- `src/lib/api/contract.ts` – the single interface every endpoint must satisfy. `httpApi.ts` implements it over HTTP and `mock/mockApi.ts` implements it in memory. This interface is the spec for the backend.
- `src/types/` – domain models mirroring the database tables.
- `src/lib/i18n/` – English and Hebrew translations; Hebrew switches the layout to RTL.
- `src/components/ui/` – shadcn/ui primitives; `components/layout/` – app shell; `components/common/` – shared widgets.

Every exported function and component has a short comment describing what it does.
