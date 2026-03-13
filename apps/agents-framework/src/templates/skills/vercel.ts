import { toMarkdown } from "../shared.js";

export function createVercelSkill() {
  return toMarkdown([
    "# Vercel",
    "",
    "Use this skill when the task affects deploy previews, production releases, or platform config.",
    "",
    "## Delivery Rules",
    "",
    "- Keep environment variable requirements explicit.",
    "- Separate preview-safe changes from production-only rollouts when risk is high.",
    "- Document build, output, and runtime assumptions in the task file.",
    "",
    "## Validation",
    "",
    "- Confirm the expected project root and output directory before changing config.",
    "- Prefer preview deployments for verification before production promotion.",
  ]);
}
