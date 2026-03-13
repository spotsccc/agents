import { toMarkdown } from "../shared.js";

export function createEngineeringStandardsSkill() {
  return toMarkdown([
    "# Engineering Standards",
    "",
    "Use this skill on every non-trivial task to keep implementation quality consistent.",
    "",
    "## Code",
    "",
    "- Prefer simple, explicit code paths over clever abstractions.",
    "- Preserve existing architecture unless the task explicitly requires refactoring.",
    "- Keep changes small enough that rollback and review remain straightforward.",
    "",
    "## Tests",
    "",
    "- Add or update tests when behavior changes or bugs are fixed.",
    "- Keep tests close to the behavior they validate.",
    "- Avoid brittle mocks when an observable integration point can be exercised directly.",
    "",
    "## Documentation",
    "",
    "- Update README, task files, or operational docs when behavior or workflow changes.",
    "- Record non-obvious decisions in the task markdown instead of relying on memory.",
    "",
    "## Delivery",
    "",
    "- Run the smallest validation command that proves the change works.",
    "- If validation cannot run, state the blocker and the missing confidence explicitly.",
  ]);
}
