import { toMarkdown } from "../shared.js";

export function createVitestSkill() {
  return toMarkdown([
    "# Vitest",
    "",
    "Use this skill when writing or maintaining unit and integration tests.",
    "",
    "## Test Design",
    "",
    "- Test behavior, not implementation trivia.",
    "- Keep arrange, act, and assert phases easy to scan.",
    "- Prefer real modules unless isolation is needed to control a boundary.",
    "",
    "## Maintenance",
    "",
    "- Remove duplicate coverage that does not add confidence.",
    "- When fixing a bug, add a regression test close to the failing behavior.",
  ]);
}
