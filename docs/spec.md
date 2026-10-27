# Product Spec — Wind Down

## Goal

Help a user answer one question: **"I need to wake up at X. When should I go to bed tonight?"**

## Users

- **Main user:** an adult with a Fitbit (or no watch) who wants to wake up rested.
- **Reviewer / demo user:** someone trying the app without a watch, using manual entry or demo data.

## User Stories and Acceptance Criteria

Each story becomes a GitHub Issue. Status is tracked there.

### US-0 Project scaffold
As the developer, I want a working skeleton so features can be added safely.
- [ ] `backend/` has a Django + DRF project with a `/api/health/` endpoint and a passing test.
- [ ] `frontend/` has a React (Vite) app that calls `/api/health/` and shows the result, with a passing test.
- [ ] README explains how to run both locally.

### US-1 Sign up and log in
As a user, I want my own account so my sleep data is private.
- [ ] I can sign up with email and password.
- [ ] I can log in and log out.
- [ ] I cannot see or change another user's data (API returns 403/404).

### US-2 Log sleep manually
As a user without a watch, I want to enter my sleep by hand.
- [ ] I can add a sleep session with bedtime and wake-up time.
- [ ] Wake-up must be after bedtime; otherwise I see an error.
- [ ] I can edit and delete my own sessions.

### US-3 Import sleep from Google Health (Fitbit)
As a Fitbit user, I want my sleep imported automatically.
- [ ] I can connect my Google account from the settings page.
- [ ] After connecting, my recent sleep sessions (with stages if available) are imported.
- [ ] Importing twice does not create duplicates.
- [ ] I can disconnect, and my tokens are deleted.

### US-4 Get a bedtime recommendation
As a user, I want a bedtime for my target wake-up time.
- [ ] I enter a wake-up time and see a recommended bedtime.
- [ ] I see a short reason (e.g. "5 cycles of 90 min + 14 min to fall asleep").
- [ ] **Cold start:** with fewer than 7 nights of data, the app uses population averages and says so.
- [ ] **Personal:** with 7+ nights, the app uses my own average time to fall asleep and cycle length.

### US-5 View sleep history and trends
As a user, I want to see how I have been sleeping.
- [ ] I see a list of my past sessions, newest first.
- [ ] I see a simple chart of sleep duration over the last 30 days.

### US-6 Demo data
As a reviewer, I want to try the app without a watch.
- [ ] One command loads a demo user with 30 nights of sample sleep.

## Recommendation Logic (v1)

```
bedtime = wake_time - (cycles × cycle_length) - time_to_fall_asleep
```
- Default: cycle_length = 90 min, time_to_fall_asleep = 15 min, cycles = 5 or 6.
- Choose the number of cycles that gives at least 7 hours of sleep where possible.
- Personal mode replaces the defaults with the user's own averages.

## Non-Goals

- Reminders, alarms, or push notifications
- Wearables other than Fitbit / Google Health
- Medical advice or diagnosis
- Native mobile app (an APK wrapper may come later, outside the course scope)
