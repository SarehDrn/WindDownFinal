# Wind Down

**Wind Down tells you when to go to bed so you wake up feeling rested.**

You set the time you need to wake up. Wind Down looks at your sleep history from your smartwatch and recommends a bedtime that fits your own sleep cycles.

## The Problem

Most people pick a bedtime by guessing, or by counting back "8 hours" from their alarm. That ignores two things:

- **Sleep happens in cycles** (about 90 minutes each). Waking up in the middle of a deep-sleep cycle leaves you groggy, even after a full night.
- **Everyone is different.** How long you take to fall asleep and how long your cycles last vary from person to person.

Smartwatches already record this data, but their apps mostly show charts of the past. They do not answer the simple question: *"I need to wake up at 7:00, so when should I go to bed tonight?"*

## What Wind Down Does

- **Accounts:** each user signs up and sees only their own data.
- **Sleep logging:** sleep sessions come from Fitbit through the Google Health API, or users can enter them manually.
- **Bedtime recommendation:** the user enters a target wake-up time and gets a recommended bedtime.
  - With enough personal history, the recommendation uses the user's own sleep patterns.
  - New users with little data get a recommendation based on population averages from a public sleep dataset (e.g. Sleep-EDF).
- **History and trends:** users can see their past sleep sessions and how their sleep changes over time.

## Expected Behavior

- A new user can sign up, log in, and get a bedtime recommendation right away (cold start).
- After connecting Google Health (Fitbit) or logging several nights manually, recommendations become personal.
- The recommended bedtime lines up with the end of a sleep cycle at the target wake-up time.
- Users only ever see their own sleep data.

## Out of Scope (for now)

- Reminders or push notifications (recommendations show inside the app only)
- Wearables other than Fitbit (via Google Health API)
- Medical advice or sleep-disorder diagnosis

## Tech Stack

- **Frontend:** React (Vite), mobile-friendly web app
- **Backend:** Django + Django REST Framework
- **Database:** PostgreSQL (SQLite for local development)
- **Sleep data:** Google Health API (Fitbit)
- **AI tools:** Claude Code

## Project Docs

- [Product spec](docs/spec.md)
- [Architecture](docs/architecture.md)
- [Agent team](docs/agents.md)
- [Process](docs/process.md)
- [AGENTS.md](AGENTS.md) (instructions for AI agents)
- [Task tracker](../../issues)

## Running Locally

_Coming soon_

## Tests

_Coming soon_

## Deployment

_Coming soon_
