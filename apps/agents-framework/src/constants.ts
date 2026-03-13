export const AI_FRAMEWORK_BLOCK_START = "<!-- AI_FRAMEWORK:START -->";
export const AI_FRAMEWORK_BLOCK_END = "<!-- AI_FRAMEWORK:END -->";

export const SUPPORTED_AGENTS = ["claude", "codex"] as const;

export type SupportedAgent = (typeof SUPPORTED_AGENTS)[number];

export interface SkillDefinition {
  slug: string;
  title: string;
  summary: string;
}

export const AGENT_DIRECTORY_MAP: Record<SupportedAgent, string> = {
  claude: ".claude",
  codex: ".codex",
};

export const SKILL_DEFINITIONS: readonly SkillDefinition[] = [
  {
    slug: "backlog-workflow",
    title: "Backlog Workflow",
    summary: "Run the agent through markdown tasks with explicit states and decision logs.",
  },
  {
    slug: "backlog-research",
    title: "Backlog Research",
    summary:
      "Turn feature or project ideas into concrete repository research and implementation context.",
  },
  {
    slug: "backlog-planning",
    title: "Backlog Planning",
    summary:
      "Convert research into ordered backlog items with dependencies and execution boundaries.",
  },
  {
    slug: "backlog-readiness",
    title: "Backlog Readiness",
    summary: "Evaluate whether a backlog item is ready for execution by an agent.",
  },
  {
    slug: "backlog-execution",
    title: "Backlog Execution",
    summary:
      "Execute ready backlog items while keeping status, notes, and validation synchronized.",
  },
  {
    slug: "engineering-standards",
    title: "Engineering Standards",
    summary: "Keep code, tests, and documentation changes aligned with the same working agreement.",
  },
  {
    slug: "testing-verification",
    title: "Testing and Verification",
    summary: "Plan and record the validation needed to ship backlog items with usable confidence.",
  },
  {
    slug: "javascript",
    title: "JavaScript and TypeScript",
    summary: "Apply common conventions for modern JS and TS projects.",
  },
  {
    slug: "sql",
    title: "SQL",
    summary: "Handle schema changes and query work safely and reviewably.",
  },
  {
    slug: "vercel",
    title: "Vercel",
    summary: "Keep deployments, previews, and environment management predictable.",
  },
  {
    slug: "playwright",
    title: "Playwright",
    summary: "Write browser tests that are stable, observable, and fast to debug.",
  },
  {
    slug: "vitest",
    title: "Vitest",
    summary: "Keep unit and integration tests close to the behavior they verify.",
  },
] as const;
