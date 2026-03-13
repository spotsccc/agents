import { toMarkdown } from "../shared.js";

export function createBacklogExecutionSkill() {
  return toMarkdown([
    "# Backlog Execution",
    "",
    "Use this skill when the agent is implementing a backlog item that is already considered ready.",
    "",
    "## Goal",
    "",
    "- Execute one ready backlog item with clear status tracking and repository-visible notes.",
    "- Keep code changes, task updates, and validation aligned with the same execution record.",
    "",
    "## Workflow",
    "",
    "1. Read the backlog item, its parent context, linked research, and dependencies.",
    "2. Move the item into active execution state before making substantive code changes.",
    "3. Implement only the scoped work needed for the current item.",
    "4. Update implementation notes and decision log when assumptions change.",
    "5. Run the smallest useful validation that proves the work.",
    "6. Record verification outcomes and move the item to done only when code, docs, and tests agree.",
    "",
    "## Execution Rules",
    "",
    "- Do not quietly expand scope; create or request follow-up backlog items instead.",
    "- If the item turns out to be under-specified, stop and route it through `backlog-readiness` or `backlog-planning`.",
    "- Keep evidence of validation inside the task file or the completion summary.",
    "- If validation cannot run, document the blocker and the residual risk.",
  ]);
}
