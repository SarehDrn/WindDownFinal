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
docs/       Spec, architecture, agent team, process
.claude/agents/  Subagent definitions (pm, engineer, qa, ops)
```

## Commands

```bash
# Backend
cd backend && python manage.py runserver      # run API on :8000
cd backend && pytest                          # backend tests

# Frontend
cd frontend && npm run dev                    # run app on :5173
cd frontend && npm test                       # frontend tests
```
(Docker Compose and one-command run will be added in Module 3; update this section then.)

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
