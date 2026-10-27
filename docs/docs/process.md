# Process — Wind Down

## Task Tracker

GitHub Issues is the public task tracker. Every piece of work starts as an issue.

- **Labels:** `feature`, `bug`, `docs`, `infra`
- **Each issue has:** a user story, acceptance criteria as a checklist, and a link to the spec section.

## Workflow

1. **Issue** — pm agent creates it; Sareh approves.
2. **Branch** — `feature/<issue-number>-short-name`, e.g. `feature/5-manual-sleep-log`
3. **Build** — engineer agent implements with tests.
4. **Verify** — qa agent checks every acceptance criterion and runs all tests.
5. **Commit** — message mentions the issue: `Add manual sleep form (#5)`
6. **PR** — description says `Closes #5`; CI must pass.
7. **Merge** — Sareh reviews and merges.

## Definition of Done

- [ ] All acceptance criteria in the issue are met
- [ ] Tests added and all tests pass
- [ ] No secrets or personal data in code or logs
- [ ] Docs updated if behavior or API changed
- [ ] PR merged and issue closed

## Reviewing AI-Generated Code

Before merging, Sareh checks:
- Does it do only what the issue asked?
- Are there tests for the new behavior, and do they actually test it?
- Is user data filtered by the logged-in user?
- Anything unclear → ask the agent to explain or simplify.
