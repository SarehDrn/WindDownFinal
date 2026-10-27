# AGENTS.md — Wind Down

Instructions for AI coding agents (Claude Code and others) working on this repo.

## What this project is

Wind Down is a mobile-friendly web app that recommends a bedtime for a target wake-up time, based on the user's sleep history (Google Health API / Fitbit, or manual entry). See [README.md](README.md).

## Read these first

| Doc | Read it when |
|---|---|
| [docs/spec.md](docs/spec.md) | Before any feature work: user stories, acceptance criteria, non-goals |
| [docs/architecture.md](docs/architecture.md) | Before touching structure, APIs, or the database |
| [docs/agents.md](docs/agents.md) | To know which role you are playing and who hands off to whom |
| [docs/process.md](docs/process.md) | For the workflow: issues, branches, commits, PRs, definition of done |

## Repo layout

Planned layout (created by the first issue, the project scaffold):

```
backend/    Django + Django REST Framework API
frontend/   React (Vite) web app
scripts/    One-command test runner (scripts/test.mjs, run via `npm test`)
docs/       Spec, architecture, agent team, process
.claude/agents/  Subagent definitions (pm, engineer, qa, ops)
```

## Commands

```bash
# Whole app (Postgres + Django API + Vite app) in Docker
docker compose up --build                             # app :5173, API :8000, Postgres :5433
docker compose exec backend python manage.py load_demo   # demo user + 30 nights
docker compose down                                   # stop (keeps the DB volume)

# Without Docker for the app (Postgres still via: docker compose up -d --wait db)
cd backend && .venv/Scripts/python manage.py runserver   # API on :8000 (macOS/Linux: .venv/bin/python)
cd backend && .venv/Scripts/python manage.py load_demo   # demo data
cd frontend && npm run dev                               # app on :5173, proxies /api to :8000
```

```bash
# Tests: one command (starts the Postgres container, runs backend unit +
# integration tests, then frontend tests; non-zero exit on any failure)
npm test

npm run test:backend:unit          # pytest -m "not integration"
npm run test:backend:integration   # pytest -m integration (real Postgres)
npm run test:frontend              # vitest run
```
Backend tests never read `backend/.env`; the runner sets `DJANGO_NO_DOTENV=1`, a dummy `DJANGO_SECRET_KEY` and `DATABASE_URL` (override with `TEST_DATABASE_URL`). Mark full API/DB flow tests with `@pytest.mark.integration`.

## Rules

- **Work from a GitHub Issue.** Every change links to an issue (`#12`). If there is no issue, ask for one first.
- **Spec first.** Do not build anything not in `docs/spec.md` or the issue's acceptance criteria.
- **Tests with every change.** New behavior needs a test. All tests must pass before you say you are done.
- **Small changes.** One issue = one branch = one PR.
- **Keep the API contract in sync.** If an endpoint changes, update the OpenAPI schema and `docs/architecture.md`.

## Security boundaries

- Never read, print, or commit `.env` or any secret. Secrets come from environment variables only.
- Never log sleep data, emails, tokens, or other personal data.
- Users may only access their own data. Every query must be filtered by the logged-in user.
- Do not run destructive commands (dropping databases, force-pushing, deleting branches) without asking.
