import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { basename, dirname, extname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../", import.meta.url));
for (const name of readdirSync(join(root, "skills"))) {
  const skill = readFileSync(join(root, "skills", name, "SKILL.md"), "utf8");
  assert(skill.startsWith(`---\nname: ${name}\ndescription: `));
  assert(/^description: .+$/m.test(skill.split("---")[1]));
}
// Include non-ignored new files so the same check also works before committing.
const files = execFileSync(
  "git",
  ["ls-files", "--cached", "--others", "--exclude-standard", "-z"],
  { cwd: root, encoding: "utf8" },
)
  .split("\0")
  .filter(Boolean);
for (const name of new Set(files)) {
  const path = join(root, name);
  if (!existsSync(path)) continue;
  assert(
    !name.split("/").some((part) => ["private", "state", "events", "artifacts"].includes(part)),
    name,
  );
  assert(
    basename(name) !== "profile.json" && ![".pdf", ".png", ".jpg", ".docx"].includes(extname(name)),
    name,
  );
  const content = readFileSync(path, "utf8");
  assert(!/\/(?:Users|home)\/[^/\s]+\//.test(content), `Personal path in ${name}`);
  if (extname(name) === ".md") {
    for (const [, link] of content.matchAll(/\]\(([^)]+)\)/g)) {
      if (!link.includes("://") && !link.startsWith("#")) {
        assert(existsSync(resolve(dirname(path), link.split("#")[0])), `${name}: ${link}`);
      }
    }
  }
  if (extname(name) === ".mjs") execFileSync(process.execPath, ["--check", path]);
}
console.log("Skill structure, local links, JavaScript syntax and public file boundary checked.");
