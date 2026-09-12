import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";

const tool = fileURLToPath(
  new URL("../skills/japanese-learning/scripts/learning-store.mjs", import.meta.url),
);

function setup(t, initialize = true) {
  const root = mkdtempSync(join(tmpdir(), "japanese-learning-"));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  const state = join(root, "state");
  function run(...args) {
    return spawnSync(process.execPath, [tool, "--root", state, ...args], { encoding: "utf8" });
  }
  function record(event) {
    const file = join(root, "input.json");
    writeFileSync(file, JSON.stringify(event));
    return run("record", "--file", file);
  }
  function show() {
    const result = run("show");
    assert.equal(result.status, 0, result.stderr);
    return JSON.parse(result.stdout);
  }
  if (initialize) assert.equal(run("init").status, 0);
  return { root, state, run, record, show };
}

function event(id, type, details, summary = "Learning evidence.") {
  return { id, type, occurred_on: null, summary, topics: ["hiragana"], details };
}

test("history preserves answers and separates assignment from practice", (t) => {
  const store = setup(t);
  // Delivering a worksheet does not create a completed exercise attempt.
  assert.equal(
    store.record(event("week-01", "material_created", { material_id: "week-01" })).status,
    0,
  );
  assert.equal(store.show().event_counts.exercise_attempt, 0);
  assert.equal(
    store.record(
      event("attempt-01", "exercise_attempt", {
        material_id: "week-01",
        answers: [{ exercise_id: "d1-q1", prompt: "Write book in kana.", answer: "ほん" }],
      }),
    ).status,
    0,
  );
  assert.equal(
    store.record(
      event("feedback-01", "feedback", {
        attempt_id: "attempt-01",
        results: [
          {
            exercise_id: "d1-q1",
            result: "correct",
            correction: null,
            reason: "The spelling matches book.",
          },
        ],
      }),
    ).status,
    0,
  );
  const snapshot = store.show();
  assert.equal(
    snapshot.events.find((entry) => entry.id === "attempt-01").details.answers[0].answer,
    "ほん",
  );
  assert.equal(snapshot.event_counts.exercise_attempt, 1);
  assert.equal(snapshot.event_counts.feedback, 1);
});

test("duplicate event cannot replace saved evidence", (t) => {
  const store = setup(t);
  const report = event("report-01", "self_report", {}, "Can recognize some kana.");
  assert.equal(store.record(report).status, 0);
  report.summary = "A conflicting replacement.";
  assert.notEqual(store.record(report).status, 0);
  assert.equal(store.show().events[0].summary, "Can recognize some kana.");
  assert.equal(store.show().events.length, 1);
});

test("existing Python-format records remain unchanged and accept accuracy-only reports", (t) => {
  const store = setup(t, false);
  const directory = join(store.state, "japanese", "default");
  mkdirSync(join(directory, "events"), { recursive: true });
  const profile = {
    schema_version: 1,
    learner_id: "default",
    language: "japanese",
    preferences: { require_answer_submission: false },
    baseline: {},
    current_material_id: "week-01",
    next_focus: [],
  };
  const oldEvent = {
    ...event("report-01", "self_report", {}, "Known kana."),
    schema_version: 1,
    recorded_at: "2026-01-01T12:00:00.123456+00:00",
  };
  const saved = [
    [join(directory, "profile.json"), `${JSON.stringify(profile, null, 2)}\n`],
    [join(directory, "events", "report-01.json"), `${JSON.stringify(oldEvent, null, 2)}\n`],
  ];
  for (const [path, text] of saved) writeFileSync(path, text);
  assert.deepEqual(store.show().profile, profile);
  assert.equal(store.run("init").status, 0);
  assert.equal(
    store.record(
      event("accuracy-01", "self_report", {
        material_id: "week-01",
        accuracy_percent: 80,
        question_count: null,
      }),
    ).status,
    0,
  );
  assert.equal(
    store.show().events.find((entry) => entry.id === "accuracy-01").details.accuracy_percent,
    80,
  );
  assert.equal(store.show().event_counts.exercise_attempt, 0);
  for (const [path, text] of saved) assert.equal(readFileSync(path, "utf8"), text);
});

test("compact context keeps learning evidence accessible without administrative or answer payload noise", (t) => {
  const store = setup(t);
  const report = event(
    "accuracy-01",
    "self_report",
    { material_id: "week-01", accuracy_percent: 80, question_count: null },
    "Reported 80% accuracy.",
  );
  assert.equal(store.record(report).status, 0);
  assert.equal(
    store.record(
      event(
        "admin-01",
        "note",
        { transcript: "Long repository setup details." },
        "Repository configured.",
      ),
    ).status,
    0,
  );
  assert.equal(
    store.record(
      event("week-01", "material_created", {
        material_id: "week-01",
        manifest: "artifacts/week-01/manifest.json",
        full_text: "Long workbook.",
      }),
    ).status,
    0,
  );
  const profilePath = join(store.state, "japanese", "default", "profile.json");
  const profile = JSON.parse(readFileSync(profilePath, "utf8"));
  profile.current_material_id = "week-01";
  writeFileSync(profilePath, JSON.stringify(profile));
  const context = JSON.parse(store.run("context", "--limit", "1").stdout);
  assert.equal(context.current_material.material_id, "week-01");
  assert.equal(context.recent_learning.length, 1);
  assert.equal(context.recent_learning[0].id, "accuracy-01");
  assert.equal(context.recent_learning[0].accuracy_percent, 80);
  assert(!JSON.stringify(context).includes("Long repository"));
  assert(!JSON.stringify(context).includes("Long workbook"));
  const full = JSON.parse(store.run("event", "--id", "admin-01").stdout);
  assert.equal(full.details.transcript, "Long repository setup details.");
  assert.equal(JSON.parse(store.run("context", "--limit", "0").stdout).recent_learning.length, 0);
  assert.equal(store.show().events.length, 3);
});
