# Working in this repository

- This repository contains reusable learning skills, not learner data. Keep profiles, event history, generated PDFs, answers and personal paths outside the checkout.
- `skills/japanese-learning` is the canonical skill. The `liangmiQwQ/skills` repository distributes a managed copy; do not maintain two independent versions.
- Update the relevant reference when changing an event contract or teaching workflow. Generated materials and self-reports must never count as assessed exercises.
- Keep the private record helper on Python 3.10+ with the standard library. Run `python3 scripts/check.py` and `python3 -m unittest discover -s tests -v` for changes.
- Use Conventional Commits. Do not create a git worktree unless the user asks. Before branching from the default branch, require a clean checkout, switch to the default branch and pull.
