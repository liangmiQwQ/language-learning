# Language learning

Reusable agent skills for Japanese study and IELTS Academic Reading, with printable materials, private progress records and reading passage deduplication.

| Skill | Workflow |
| --- | --- |
| [japanese-learning](skills/japanese-learning/SKILL.md) | Plan lessons, create printable workbooks, connect spoken expressions to writing, and review submitted exercises. |
| [ielts-reading](skills/ielts-reading/SKILL.md) | Continue reading practice, produce printable passage sessions, review answers, and avoid repeating previously generated passages. |

Both skills retain learning evidence across sessions. Generated materials, self-reported progress and assessed answers remain distinct.

## Install

```sh
npx skills add liangmiQwQ/language-learning --skill japanese-learning
npx skills add liangmiQwQ/language-learning --skill ielts-reading
```

The collection at [liangmiQwQ/skills](https://github.com/liangmiQwQ/skills) can also distribute these skills. This repository is its source of truth; edit the skill here rather than editing a generated collection copy.

## Japanese learning

Ask to use `$japanese-learning` to plan the next week, make a printable handout, or review your answers. The skill reads the saved profile and learning history before choosing new material. Its [workbook guide](skills/japanese-learning/references/workbooks.md) documents English-led materials with Chinese annotations, natural short exchanges, exercise design, PDF rendering and artifact archiving.

Personal records default to `~/.local/share/language-learning/japanese/default/`. Set `LANGUAGE_LEARNING_HOME` for another private location. Each learner has a profile, immutable event files and versioned artifact directories. No personal history is bundled in the repository or uploaded automatically.

```sh
node skills/japanese-learning/scripts/learning-store.mjs init
node skills/japanese-learning/scripts/learning-store.mjs context
node skills/japanese-learning/scripts/learning-store.mjs record --file /path/to/event.json
```

The default `context` view reads current preferences and a few learning summaries, leaving setup chatter and detailed evidence out until needed. Use `event --id ID` to retrieve one source record or `show` for the complete history. The [memory guide](skills/japanese-learning/references/memory.md) defines meaningful updates and preserves uncertainty.

See the [record contract](skills/japanese-learning/references/records.md) for event fields and separate classmate profiles. Creating a workbook records assigned material; only actual submissions record exercise attempts. Self-reported knowledge stays separate from assessed results.

## IELTS reading

Use `$ielts-reading` to continue a reading pack or record results. The [skill](skills/ielts-reading/SKILL.md) reads saved preferences and all previous passage records before selecting new material. It blocks reused passage text even when renamed or reformatted, flags similar passages, and keeps first attempts separate from revisions after hints.

Records live under `~/.local/share/language-learning/ielts-reading/default/` (or `LANGUAGE_LEARNING_HOME`), separate from Japanese progress. PDFs, sources and imported history remain private. See the [record contract](skills/ielts-reading/references/records.md) and [practice guide](skills/ielts-reading/references/practice.md).

```sh
node skills/ielts-reading/scripts/learning-store.mjs init
node skills/ielts-reading/scripts/learning-store.mjs show
node skills/ielts-reading/scripts/learning-store.mjs check --file /path/to/material-details.json
node skills/ielts-reading/scripts/learning-store.mjs record --file /path/to/event.json
```

## Development

Node.js 22+; no runtime packages are required for either record tool.

```sh
node scripts/check.mjs
node --test
```

CI runs the same checks. Use Conventional Commits, for example `feat(japanese): add a reading practice workflow`. There is no npm package or deployment step: skill installation consumes this Git repository directly. Push changes to update the source; consumers decide when to refresh their installed copy. Create a Git tag only when a named release is useful.

## Privacy

Public: reusable instructions, helpers, examples and tests. Private: learner names, abilities, exercise submissions, feedback, transcripts and personalized artifacts. Keep private data outside all public checkouts. Remote private backup is optional and requires an explicitly chosen destination; the included helpers only write local files.

## License

[MIT](LICENSE). System fonts and third-party learning materials are not distributed here.
