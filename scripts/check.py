"""Validate skill links, Python syntax and the public repository boundary."""

from pathlib import Path
import re
import subprocess

ROOT = Path(__file__).resolve().parents[1]
skill = ROOT / "skills/japanese-learning"
text = (skill / "SKILL.md").read_text(encoding="utf-8")
assert text.startswith("---\nname: japanese-learning\ndescription: ")
assert text.split("---", 2)[1].strip().splitlines()[1].removeprefix("description:").strip()
for path in ROOT.rglob("*.md"):
    if ".git" in path.parts:
        continue
    for link in re.findall(r"\]\(([^)]+)\)", path.read_text(encoding="utf-8")):
        if "://" not in link and not link.startswith("#"):
            assert (path.parent / link.split("#", 1)[0]).exists(), (path, link)
for path in ROOT.rglob("*.py"):
    compile(path.read_text(encoding="utf-8"), str(path), "exec")
# Check staged and untracked, non-ignored files before a first commit as well as in CI.
files = subprocess.check_output(["git", "ls-files", "--cached", "--others", "--exclude-standard", "-z"], cwd=ROOT).decode().split("\0")
for name in filter(None, files):
    path = Path(name)
    assert not {"private", "state", "events", "artifacts"}.intersection(path.parts), name
    assert path.name != "profile.json" and path.suffix not in {".pdf", ".png", ".jpg", ".docx"}, name
    content = (ROOT / path).read_text(encoding="utf-8")
    assert not re.search(r"/(?:Users|home)/[^/\s]+/", content), f"Personal path in {name}"
print("Skill structure, local links, Python syntax and public file boundary checked.")
