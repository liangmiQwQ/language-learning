# Working in this repository

- This repository contains reusable learning skills, not learner data. Keep profiles, event history, generated PDFs, answers and personal paths outside the checkout.
- `skills/` contains the canonical Japanese and IELTS reading skills. The `liangmiQwQ/skills` repository distributes a managed copy; do not maintain two independent versions.
- Update the relevant reference when changing an event contract or teaching workflow. Generated materials and self-reports must never count as assessed exercises.
- Keep the private record helper in JavaScript on Node.js 22+ with built-in modules so the installed skill runs without a package install. Run `node scripts/check.mjs` and `node --test` for changes.
- Use Conventional Commits. Do not create a git worktree unless the user asks. Before branching from the default branch, require a clean checkout, switch to the default branch and pull.
