# WindDownFinal
Wind Down

Wind Down tells you when to go to bed so you wake up feeling rested.

You set the time you need to wake up. Wind Down looks at your sleep history from your smartwatch and recommends a bedtime that fits your own sleep cycles.

The Problem

Most people pick a bedtime by guessing, or by counting back "8 hours" from their alarm. That ignores two things:

Sleep happens in cycles (about 90 minutes each). Waking up in the middle of a deep-sleep cycle leaves you groggy, even after a full night.
Everyone is different. How long you take to fall asleep and how long your cycles last vary from person to person.

Smartwatches already record this data, but their apps mostly show charts of the past. They do not answer the simple question: "I need to wake up at 7:00, so when should I go to bed tonight?"

What Wind Down Does
Accounts: each user signs up and sees only their own data.
Sleep logging: sleep sessions come from the Fitbit API, or users can enter them manually.
Bedtime recommendation: the user enters a target wake-up time and gets a recommended bedtime.
With enough personal history, the recommendation uses the user's own sleep patterns.
New users with little data get a recommendation based on population averages from a public sleep dataset (e.g. Sleep-EDF).
History and trends: users can see their past sleep sessions and how their sleep changes over time.
Expected Behavior
A new user can sign up, log in, and get a bedtime recommendation right away (cold start).
After connecting Fitbit or logging several nights manually, recommendations become personal.
The recommended bedtime lines up with the end of a sleep cycle at the target wake-up time.
Users only ever see their own sleep data.
Out of Scope (for now)
Reminders or push notifications (recommendations show inside the app only)
Wearables other than Fitbit
Medical advice or sleep-disorder diagnosis
Tech Stack
Frontend: React (Vite), mobile-friendly web app
Backend: Django + Django REST Framework
Database: PostgreSQL (SQLite for local development)
AI tools: Claude Code
Project Docs
Product spec
Architecture
Agent team and process
Task tracker
Running Locally

**With Docker (one command).** Requires Docker with Compose. From the repo root:

```bash
docker compose up --build        # add -d to run in the background
```

- App: http://localhost:5173 (Vite dev server; proxies `/api` to the backend)
- API: http://localhost:8000 (health at `/api/health/`, OpenAPI schema at `/api/schema/`, Swagger UI at `/api/docs/`)
- PostgreSQL: localhost:5433 (user / password / db: `winddown`)

The backend waits for Postgres to be healthy and runs migrations on start. All config comes from safe dev defaults in `docker-compose.yml` (it never reads `backend/.env`). Code changes need `docker compose up --build` to show up in the containers.

Load demo data (user `demo@winddown.app`, password `winddown-demo`, 30 nights of sleep; safe to run again):

```bash
docker compose exec backend python manage.py load_demo
```

Stop with `docker compose down` (add `-v` only if you want to wipe the database volume).

**Without Docker for the app.** Requires Python 3.14 and Node 24. Postgres still runs in Docker:

1. Start PostgreSQL: `docker compose up -d --wait db`
2. Backend (API on http://localhost:8000):
   ```bash
   cd backend
   python -m venv .venv
   .venv/Scripts/python -m pip install -r requirements.txt   # macOS/Linux: .venv/bin/python
   cp .env.example .env                                       # then edit values
   .venv/Scripts/python manage.py migrate
   .venv/Scripts/python manage.py load_demo                   # optional demo data
   .venv/Scripts/python manage.py runserver
   ```
3. Frontend (app on http://localhost:5173; proxies `/api` to `VITE_API_PROXY`, default http://localhost:8000):
   ```bash
   cd frontend
   npm install
   npm run dev
   ```

Tests

Coming soon

Deployment

Coming soon