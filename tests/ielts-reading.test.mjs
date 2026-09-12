import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";

const tool = fileURLToPath(new URL("../skills/ielts-reading/scripts/learning-store.mjs", import.meta.url));

function setup(t) {
  const root = mkdtempSync(join(tmpdir(), "ielts-reading-"));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  const run = (...args) => spawnSync(process.execPath, [tool, "--root", root, ...args], { encoding: "utf8" });
  const submit = (command, data) => {
    const file = join(root, "input.json");
    writeFileSync(file, JSON.stringify(data));
    return run(command, "--file", file);
  };
  const show = () => JSON.parse(run("show").stdout);
  assert.equal(run("init").status, 0);
  return { run, submit, show };
}

function event(id, type, details) {
  return { id, type, occurred_on: null, summary: "Practice record.", topics: ["cities"], details };
}

function material(id, sequence, passage = "Trees provide shade. Underground pipes limit planting locations.") {
  return event(id, "material_created", {
    material_id: id, sequence, title: id, passage,
    questions: [{ exercise_id: "q1", prompt: "What provides shade?" }],
    source: { kind: "original" },
  });
}

test("new sessions persist while renamed, reformatted and source-identical passages are rejected", (t) => {
  const store = setup(t);
  const first = material("reading-01", 1);
  assert.equal(store.submit("check", first.details).status, 0);
  assert.equal(store.submit("record", first).status, 0);
  const duplicate = material("renamed", 2, "TREES provide shade!\nUnderground pipes limit planting locations…");
  assert.equal(store.submit("check", duplicate.details).status, 2);
  assert.notEqual(store.submit("record", duplicate).status, 0);
  const second = material("reading-02", 2, "Scientists examine ice samples to reconstruct changes in ancient snowfall.");
  second.details.source = { kind: "official_sample", key: "publisher-test-1-passage-2" };
  assert.equal(store.submit("record", second).status, 0);
  const sameSource = material("reading-03", 3, "A different transcription of the same published source.");
  sameSource.details.source = second.details.source;
  assert.notEqual(store.submit("record", sameSource).status, 0);
  const near = material("near", 3, `${first.details.passage} Some roots spread widely.`);
  near.details.title = first.details.title;
  assert.ok(JSON.parse(store.submit("check", near.details).stdout).matches.length);
  assert.notEqual(store.submit("record", near).status, 0);
  const snapshot = store.show();
  assert.equal(snapshot.event_counts.material_created, 2);
  assert.equal(snapshot.next_sequence, 3);
  assert.equal(snapshot.event_counts.exercise_attempt, 0);
});

test("continuation preserves saved evidence and separates self-reports from assessed attempts", (t) => {
  const store = setup(t);
  assert.equal(store.submit("record", material("reading-01", 1)).status, 0);
  const directory = store.show().path;
  const profilePath = join(directory, "profile.json");
  const profile = store.show().profile;
  profile.baseline = { reading_band: null, self_report: "Already studied earlier material." };
  writeFileSync(profilePath, JSON.stringify(profile));
  const prior = readFileSync(join(directory, "events/reading-01.json"), "utf8");
  assert.equal(store.run("init").status, 0);
  assert.equal(store.submit("record", event("reported", "self_report", { material_id: "reading-01", accuracy_percent: 80, question_count: null })).status, 0);
  assert.equal(store.show().event_counts.exercise_attempt, 0);
  const attempt = event("attempt-01", "exercise_attempt", {
    material_id: "reading-01", stage: "first_attempt",
    answers: [{ exercise_id: "q1", prompt: "What provides shade?", answer: "Trees" }],
  });
  assert.equal(store.submit("record", attempt).status, 0);
  assert.equal(store.submit("record", event("feedback-01", "feedback", {
    attempt_id: "attempt-01", results: [{ exercise_id: "q1", result: "correct", correction: null, reason: "The passage names trees." }],
  })).status, 0);
  // Repeating an event or claiming feedback on an unsubmitted question cannot rewrite evidence.
  attempt.details.answers[0].answer = "Changed answer";
  assert.notEqual(store.submit("record", attempt).status, 0);
  assert.notEqual(store.submit("record", event("invalid-feedback", "feedback", {
    attempt_id: "attempt-01", results: [{ exercise_id: "q2", result: "correct", correction: null, reason: "Not submitted." }],
  })).status, 0);
  const snapshot = store.show();
  assert.deepEqual(snapshot.profile, profile);
  assert.equal(snapshot.events.find((entry) => entry.id === "attempt-01").details.answers[0].answer, "Trees");
  assert.equal(snapshot.event_counts.feedback, 1);
  assert.equal(readFileSync(join(directory, "events/reading-01.json"), "utf8"), prior);
});
