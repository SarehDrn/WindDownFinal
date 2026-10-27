# Architecture — Wind Down

## Overview

```
[React app (Vite)]  --HTTP/JSON-->  [Django REST API]  -->  [PostgreSQL]
                                          |
                                          +--> [Google Health API] (Fitbit sleep data)
```

## Components

| Part | Tech | Responsibility |
|---|---|---|
| Frontend | React + Vite | Screens: login, log sleep, recommendation, history, settings. Mobile-first layout. |
| Backend | Django + DRF | Auth, sleep sessions, recommendation, Google Health import |
| Database | PostgreSQL (SQLite locally until Docker is added) | Users, sleep sessions, OAuth tokens |
| External | Google Health API v4 | Read sleep sessions and stages (scope: sleep read-only) |

## API Contract (draft)

The OpenAPI schema is the source of truth (generated with drf-spectacular at `/api/schema/`).

| Method | Path | Purpose |
|---|---|---|
| GET | `/api/health/` | Health check |
| POST | `/api/auth/register/` | Sign up |
| POST | `/api/auth/login/` | Log in |
| GET, POST | `/api/sleep/` | List / create own sleep sessions |
| GET, PUT, DELETE | `/api/sleep/{id}/` | One session (own only) |
| GET | `/api/recommendation/?wake=07:00` | Bedtime recommendation |
| GET | `/auth/google/start` | Start Google OAuth |
| GET | `/auth/google/callback` | OAuth callback, stores tokens |
| POST | `/api/sync/google/` | Import sleep from Google Health |

## Data Model (draft)

- **User** — Django built-in user
- **SleepSession** — user, start_time, end_time, minutes_to_fall_asleep, source (`manual` / `google`), external_id (unique per user, prevents duplicates)
- **SleepStage** — session, start_time, end_time, type (`LIGHT` / `DEEP` / `REM` / `AWAKE`)
- **GoogleToken** — user, access_token, refresh_token, expires_at (encrypted, never logged)

## Configuration

All secrets come from environment variables (`.env` locally, platform settings in deployment):
`DJANGO_SECRET_KEY`, `DATABASE_URL`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_REDIRECT_URI`.

## Later (Modules 3–4)

- Docker Compose: frontend, backend, Postgres
- Deployment on Render with staging and production
- OpenTelemetry → Grafana (metrics, traces, logs)
- Alert on failed recommendations / sync errors → on-call agent
