# Agent Team — Wind Down

The project is built by one human (Sareh, product owner) working with a team of AI agents in Claude Code. Each agent has one job, its own instructions in `.claude/agents/`, and a clear handoff.

## The Team

| Agent | Role | Does | Does not |
|---|---|---|---|
| **Sareh** (human) | Product owner | Sets priorities, approves specs, reviews and merges PRs | — |
| **pm** | Product manager | Turns ideas into GitHub Issues with user stories and acceptance criteria; keeps `docs/spec.md` updated | Write code |
| **engineer** | Software engineer | Implements one issue on a branch, following the spec and architecture; writes unit tests | Change scope or acceptance criteria |
| **qa** | Quality assurance | Checks the change against the acceptance criteria, adds missing tests, runs all tests, reports pass/fail | Fix features itself (sends back to engineer) |
| **ops** | DevOps / on-call | Docker, CI/CD, deployment, monitoring; responds to alerts (Module 4) | Change app features |

## How They Work Together

```
Sareh: idea
   ↓
pm: creates GitHub Issue with acceptance criteria  →  Sareh approves
   ↓
engineer: branch + code + unit tests, commit mentions issue (#N)
   ↓
qa: checks each acceptance criterion, runs all tests
   ↓  fail → back to engineer
   ↓  pass
engineer: opens PR "Closes #N"
   ↓
Sareh: reviews and merges  →  CI/CD deploys (ops)
```

## How to Call an Agent in Claude Code

```
Use the pm agent to create an issue for US-2 (manual sleep logging).
Use the engineer agent to implement issue #5.
Use the qa agent to verify issue #5 against its acceptance criteria.
```
