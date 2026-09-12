# Language learning

Reusable learning skills with private, evidence-based study records. The first skill is **japanese-learning**: plan lessons, create printable workbooks, connect familiar spoken expressions to writing, and review submitted exercises across sessions.

## Install

```sh
npx skills add liangmiQwQ/language-learning --skill japanese-learning
```

The collection at [liangmiQwQ/skills](https://github.com/liangmiQwQ/skills) can also distribute this skill. This repository is its source of truth; edit the skill here rather than editing a generated collection copy.

## Use

Ask to use `$japanese-learning` to plan the next week, make a printable handout, or review your answers. The skill reads the saved profile and learning history before choosing new material. Its [workbook guide](skills/japanese-learning/references/workbooks.md) documents English-led materials with Chinese annotations, natural short exchanges, exercise design, PDF rendering and artifact archiving.

Personal records default to `~/.local/share/language-learning/japanese/default/`. Set `LANGUAGE_LEARNING_HOME` for another private location. Each learner has a profile, immutable event files and versioned artifact directories. No personal history is bundled in the repository or uploaded automatically.

```sh
node skills/japanese-learning/scripts/learning-store.mjs init
node skills/japanese-learning/scripts/learning-store.mjs show
node skills/japanese-learning/scripts/learning-store.mjs record --file /path/to/event.json
```

See the [record contract](skills/japanese-learning/references/records.md) for event fields and separate classmate profiles. Creating a workbook records assigned material; only actual submissions record exercise attempts. Self-reported knowledge stays separate from assessed results.

## Development

Node.js 22+; no runtime packages are required for the record tool.

```sh
node scripts/check.mjs
node --test
```

CI runs the same checks. Use Conventional Commits, for example `feat(japanese): add a reading practice workflow`. There is no npm package or deployment step: skill installation consumes this Git repository directly. Push changes to update the source; consumers decide when to refresh their installed copy. Create a Git tag only when a named release is useful.

## Privacy

Public: reusable instructions, helpers, examples and tests. Private: learner names, abilities, exercise submissions, feedback, transcripts and personalized artifacts. Keep private data outside all public checkouts. Remote private backup is optional and requires an explicitly chosen destination; the included helper only writes local files.

## License

[MIT](LICENSE). System fonts and third-party learning materials are not distributed here.
