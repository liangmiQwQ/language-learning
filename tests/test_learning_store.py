"""Exercise the installed CLI with real, isolated disk records."""

import json
from pathlib import Path
import subprocess
import sys
import tempfile
import unittest

TOOL = Path(__file__).resolve().parents[1] / "skills/japanese-learning/scripts/learning_store.py"


class LearningStoreTest(unittest.TestCase):
    def setUp(self):
        self.temporary = tempfile.TemporaryDirectory()
        self.addCleanup(self.temporary.cleanup)
        self.root = Path(self.temporary.name)
        self.run_tool("init")

    def run_tool(self, *args, check=True):
        return subprocess.run([sys.executable, str(TOOL), "--root", str(self.root / "state"), *args], text=True, capture_output=True, check=check)

    def record(self, event, check=True):
        source = self.root / "input.json"
        source.write_text(json.dumps(event, ensure_ascii=False), encoding="utf-8")
        return self.run_tool("record", "--file", str(source), check=check)

    def test_history_preserves_answers_and_separates_assignment_from_practice(self):
        # A delivered worksheet must not appear as completed practice.
        self.record({"id": "week-01", "type": "material_created", "occurred_on": None, "summary": "Assigned reading.", "topics": ["hiragana"], "details": {"material_id": "week-01"}})
        snapshot = json.loads(self.run_tool("show").stdout)
        self.assertEqual(snapshot["event_counts"]["exercise_attempt"], 0)
        self.record({"id": "attempt-01", "type": "exercise_attempt", "occurred_on": None, "summary": "One answer submitted.", "topics": ["hiragana"], "details": {"material_id": "week-01", "answers": [{"exercise_id": "d1-q1", "prompt": "Write book in kana.", "answer": "ほん"}]}})
        self.record({"id": "feedback-01", "type": "feedback", "occurred_on": None, "summary": "One answer checked.", "topics": ["hiragana"], "details": {"attempt_id": "attempt-01", "results": [{"exercise_id": "d1-q1", "result": "correct", "correction": None, "reason": "The spelling matches book."}]}})
        snapshot = json.loads(self.run_tool("show").stdout)
        attempt = next(e for e in snapshot["events"] if e["id"] == "attempt-01")
        self.assertEqual(attempt["details"]["answers"][0]["answer"], "ほん")
        self.assertEqual(snapshot["event_counts"]["exercise_attempt"], 1)
        self.assertEqual(snapshot["event_counts"]["feedback"], 1)

    def test_duplicate_event_cannot_replace_saved_evidence(self):
        event = {"id": "report-01", "type": "self_report", "occurred_on": None, "summary": "Can recognize some kana.", "topics": ["hiragana"], "details": {}}
        self.record(event)
        event["summary"] = "A conflicting replacement."
        result = self.record(event, check=False)
        self.assertNotEqual(result.returncode, 0)
        snapshot = json.loads(self.run_tool("show").stdout)
        self.assertEqual(snapshot["events"][0]["summary"], "Can recognize some kana.")
        self.assertEqual(len(snapshot["events"]), 1)


if __name__ == "__main__":
    unittest.main()
