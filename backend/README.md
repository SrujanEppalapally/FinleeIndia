# Personal Finance — Python FastAPI Backend

## 1. Overview

The Finlee backend is a FastAPI application that connects directly to PostgreSQL via SQLAlchemy. Supabase is used only as a PostgreSQL provider — the backend does not use the Supabase JS client, Supabase Auth, or the Supabase database SDK. All database access goes through SQLAlchemy sessions and Alembic-managed migrations.

## 2. Environment Setup

Copy the example environment file and fill in your values:

```bash
cd backend
cp .env.example .env
```

| Variable | Description |
|----------|-------------|
| `APP_ENV` | Environment name (`development`, `staging`, `production`). Returned in health responses. |
| `DATABASE_URL` | PostgreSQL connection string in SQLAlchemy format: `postgresql+psycopg2://USER:PASSWORD@HOST:5432/DB` |
| `JWT_SECRET` | Long random string used for JWT signing. Use a different value per environment. |
| `CORS_ORIGINS` | Comma-separated list of allowed frontend origins. |

Never commit `backend/.env`. It is gitignored. Never place real credentials in `.env.example`, source code, or documentation.

## 3. Supabase Environment

Set `DATABASE_URL` using your Supabase PostgreSQL connection string:

```
DATABASE_URL=postgresql+psycopg2://postgres:YOUR_PASSWORD@db.YOUR_PROJECT.supabase.co:5432/postgres
```

Run Alembic migrations consistently:

```bash
cd backend
alembic upgrade head
```

Never manually create tables that Alembic will manage. The existing Supabase migration (`supabase/migrations/20260528002211_create_core_schema.sql`) created the baseline schema (users, transactions, budget_categories, networth_items, password_reset_otps) before Alembic was configured. Going forward, Alembic is the single source of truth for schema changes.

To align Alembic with the already-applied Supabase schema without recreating tables, stamp the current state:

```bash
alembic stamp head
```

This tells Alembic the database is already at the latest migration without running any DDL. Do not run `alembic stamp head` unless you have confirmed the existing schema matches the expected baseline.

## 4. MacBook Local PostgreSQL

Install and start PostgreSQL:

```bash
brew install postgresql@16
brew services start postgresql@16
```

Create a local database and user:

```bash
createuser -s finlee
createdb finlee
```

Set up the backend:

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
# Update DATABASE_URL in .env to: postgresql+psycopg2://finlee@localhost:5432/finlee
alembic upgrade head
uvicorn main:app --reload --host 127.0.0.1 --port 8000
```

## 5. Health Checks

```bash
curl http://127.0.0.1:8000/health
curl http://127.0.0.1:8000/api/v1/health
```

Both return:

```json
{
  "status": "ok",
  "service": "finlee-api",
  "environment": "development",
  "database": "connected"
}
```

If the database is unavailable, the response status is `503` and `database` is `"unavailable"`.

## 6. Swagger / OpenAPI

- Interactive docs: http://127.0.0.1:8000/docs
- ReDoc: http://127.0.0.1:8000/redoc
- OpenAPI JSON: http://127.0.0.1:8000/openapi.json

## 7. Postman

1. Open Postman and click **Import**.
2. Choose **Import from URL**.
3. Enter: `http://127.0.0.1:8000/openapi.json`
4. Postman will generate a collection from the OpenAPI spec.
5. Test the health endpoints: `GET /health` and `GET /api/v1/health`.

## 8. Alembic

Alembic reads `DATABASE_URL` from the environment — no credentials are hardcoded in `alembic.ini`.

```bash
# Create a new migration after adding models
alembic revision --autogenerate -m "description"

# Apply all migrations
alembic upgrade head

# Check current migration state
alembic current
```

**Baseline strategy:** The existing Supabase migration (`20260528002211_create_core_schema.sql`) already created the core tables (users, transactions, budget_categories, networth_items, password_reset_otps) with RLS policies. Alembic is configured to be the future source of truth for schema changes. To align Alembic with the already-applied schema, run:

```bash
alembic stamp head
```

This marks the current database state as "up to date" without running any DDL. Future `alembic revision --autogenerate` commands will detect only new changes from that point forward.

Do not make manual schema changes. All schema evolution goes through Alembic migrations.

## 9. Running Tests

```bash
cd backend
source .venv/bin/activate
pytest tests/
```

Tests use `TestClient` from FastAPI which does not require a running server. The health tests accept both `200` and `503` responses so they pass whether or not a database is connected. For full integration tests, set `DATABASE_URL` to a test PostgreSQL database — do not use SQLite, as all environments must remain PostgreSQL-compatible.

## 10. Future Phases

Phase 0 establishes the foundation only. Future phases will add:

- **Goals** — financial goal tracking
- **Transactions** — transaction CRUD and categorization
- **Budgets** — monthly budget planning and limits
- **Net Worth** — asset and liability tracking
- **Subscriptions** — recurring expense management
- **Dashboard aggregation** — combined financial overview

Each future phase will use Alembic migrations to create tables and SQLAlchemy models registered with `Base.metadata` in `backend/database.py`.
