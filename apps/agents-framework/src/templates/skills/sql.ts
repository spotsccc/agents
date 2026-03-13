import { toMarkdown } from "../shared.js";

export function createSqlSkill() {
  return toMarkdown([
    "# SQL",
    "",
    "Use this skill when the task changes schemas, queries, or data workflows.",
    "",
    "## Safety Rules",
    "",
    "- Treat destructive data changes as opt-in and reversible whenever possible.",
    "- Keep schema migrations idempotent and reviewable.",
    "- Document assumptions about existing data shape before altering it.",
    "",
    "## Query Quality",
    "",
    "- Write queries for readability first, then optimize with evidence.",
    "- Validate joins, filters, and ordering against the acceptance criteria.",
    "- Call out indexes or explain-plan concerns when performance is part of the task.",
  ]);
}
