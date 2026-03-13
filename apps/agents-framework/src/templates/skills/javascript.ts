import { toMarkdown } from "../shared.js";

export function createJavaScriptSkill() {
  return toMarkdown([
    "# JavaScript and TypeScript",
    "",
    "Use this skill for modern JS or TS codebases.",
    "",
    "## Defaults",
    "",
    "- Match the repository package manager and task runner instead of introducing a new one.",
    "- Keep runtime code ESM-first when the repository already uses ESM.",
    "- Prefer typed boundaries for config, env parsing, and external inputs.",
    "",
    "## Implementation",
    "",
    "- Make side effects explicit at the application edge.",
    "- Keep modules focused on one responsibility.",
    "- Favor platform APIs and small utilities before adding a dependency.",
    "",
    "## Validation",
    "",
    "- Run format, lint, type-check, and tests through the repository toolchain.",
    "- Capture any skipped validation in the active task file.",
  ]);
}
