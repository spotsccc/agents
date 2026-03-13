import { toMarkdown } from "../shared.js";

export function createTestingVerificationSkill() {
  return toMarkdown([
    "# Testing and Verification",
    "",
    "Use this skill whenever a backlog item is being researched, planned, reviewed, or executed.",
    "",
    "## Goal",
    "",
    "- Define the validation needed to trust a change before it is marked done.",
    "- Keep existing test impact, new coverage, and manual checks visible in the backlog record.",
    "",
    "## Core Rules",
    "",
    "- Identify which existing tests are affected before writing new ones.",
    "- Add or update automated tests when behavior changes and the repository has a stable test surface for it.",
    "- Use manual verification only when automated coverage is not realistic or would be disproportionate.",
    "- Record skipped validation explicitly instead of leaving confidence implicit.",
    "",
    "## Validation Planning",
    "",
    "- During research: note the test suites and behavioral areas likely to be touched.",
    "- During planning: add a concrete verification plan to every executable item.",
    "- During readiness review: reject items that have no credible validation path.",
    "- During execution: capture the actual commands run and the outcome.",
    "",
    "## Tooling Handoff",
    "",
    "- Use technology-specific skills such as `vitest` or `playwright` when the validation method is already known.",
    "- Keep this skill as the cross-cutting contract for what must be proven, even when another skill defines how to prove it.",
  ]);
}
