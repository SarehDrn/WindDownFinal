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

The OpenAPI schema is the source of truth (generated with drf-spectacular at `/api/schema/`, Swagger UI at `/api/docs/`).

**Auth:** DRF token auth. Send `Authorization: Token <token>` on every request except health, register and login. Missing or invalid token → `401`. Another user's object → `404`.

| Method | Path | Purpose |
|---|---|---|
| GET | `/api/health/` | Health check |
| POST | `/api/auth/register/` | Sign up with `email` + `password`; returns `{token, email}` |
| POST | `/api/auth/login/` | Log in with `email` + `password`; returns `{token, email}` |
| POST | `/api/auth/logout/` | Log out (deletes the caller's token); 204 |
| GET, POST | `/api/sleep/` | List (newest first) / create own sleep sessions. `end_time <= start_time` → 400 `{"end_time": ["Wake-up time must be after bedtime."]}` |
| GET, PUT, PATCH, DELETE | `/api/sleep/{id}/` | One session (own only; another user's id → 404) |
| GET | `/api/recommendation/?wake=07:00` | Bedtime recommendation (`wake` is 24-hour `HH:MM`; invalid/missing → 400). See below. |
| GET | `/auth/google/start` | Start Google OAuth |
| GET | `/auth/google/callback` | OAuth callback, stores tokens |
| POST | `/api/sync/google/` | Import sleep from Google Health |

### Recommendation response

Logic lives in `backend/sleep/recommendation.py` (pure functions, no DB). Currently **cold start only**: population averages (90-min cycles, 15 min to fall asleep), 5 or 6 cycles, picking the fewest cycles that give at least 7 h of sleep. Bedtime wraps past midnight; `previous_day` is true when it falls on the day before the wake-up time. Personal mode (7+ nights) is not implemented yet.

```json
{
  "wake": "07:00", "bedtime": "23:15", "previous_day": true,
  "cycles": 5, "cycle_length_minutes": 90, "minutes_to_fall_asleep": 15, "sleep_minutes": 450,
  "reason": "5 cycles of 90 min + 15 min to fall asleep",
  "mode": "population", "uses_population_averages": true, "nights_logged": 0,
  "message": "Based on population averages (90-min cycles, 15 min to fall asleep). Log 7 more nights to unlock personal recommendations."
}
```

## Data Model (draft)

- **User** — Django built-in user
- **SleepSession** — user, start_time, end_time, minutes_to_fall_asleep (nullable), source (`manual` / `google`), external_id (nullable; unique per user when set, prevents duplicates). DB check constraint: end_time > start_time. API also returns read-only `duration_minutes`; `source` is read-only and always `manual` for API-created sessions.
- **SleepStage** — session, start_time, end_time, type (`LIGHT` / `DEEP` / `REM` / `AWAKE`)
- **GoogleToken** — user, access_token, refresh_token, expires_at (encrypted, never logged)

## Demo Data

`python manage.py load_demo` creates (or refreshes) `demo@winddown.app` (password `winddown-demo`, override with `--password` or `DEMO_USER_PASSWORD`) with 30 nights of deterministic sample sleep ending today. Nights use `external_id = demo-YYYY-MM-DD`, so re-running updates instead of duplicating.

## Configuration

All secrets come from environment variables (`.env` locally, platform settings in deployment):
`DJANGO_SECRET_KEY`, `DATABASE_URL`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_REDIRECT_URI`.

## Later (Modules 3–4)

- Docker Compose: frontend, backend, Postgres
- Deployment on Render with staging and production
- OpenTelemetry → Grafana (metrics, traces, logs)
- Alert on failed recommendations / sync errors → on-call agent
