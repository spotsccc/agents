import { toMarkdown } from "../shared.js";

export function createPlaywrightSkill() {
  return toMarkdown([
    "# Playwright",
    "",
    "Use this skill for browser automation, regression coverage, and UI diagnostics.",
    "",
    "## Authoring Rules",
    "",
    "- Use stable selectors that reflect user-facing semantics.",
    "- Wait on observable UI state instead of fixed timers.",
    "- Keep each test focused on one behavior slice.",
    "",
    "## Debugging",
    "",
    "- Save traces, screenshots, or console logs when failures are hard to reproduce.",
    "- Reduce flaky setup by reusing fixtures and avoiding hidden global state.",
  ]);
}
