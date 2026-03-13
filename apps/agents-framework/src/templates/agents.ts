import {
  AGENT_DIRECTORY_MAP,
  AI_FRAMEWORK_BLOCK_END,
  AI_FRAMEWORK_BLOCK_START,
  SKILL_DEFINITIONS,
  type SupportedAgent,
} from "../constants.js";
import { toMarkdown } from "./shared.js";

export function createManagedAgentsBlock(agent: SupportedAgent) {
  const agentDirectory = `.agents/${AGENT_DIRECTORY_MAP[agent]}`;
  const starterSkills = SKILL_DEFINITIONS.map((skill) => `- \`${skill.slug}\``);

  return toMarkdown([
    AI_FRAMEWORK_BLOCK_START,
    "# AI Framework",
    "",
    "This repository uses `agents-framework` to keep agent work backlog-driven and repeatable.",
    "",
    `- Active agent profile: \`${agent}\``,
    `- Agent skills: \`${agentDirectory}/skills\``,
    "- Shared backlog: `.agents/backlog`",
    "",
    "## Required Flow",
    "",
    "1. Read `.agents/backlog/README.md` before starting new work.",
    "2. Pull the highest-priority task from `ready/` into `in-progress/`.",
    "3. Keep implementation notes, decisions, and verification inside the task markdown.",
    "4. Move completed work to `done/` only after code, tests, and docs are updated.",
    "",
    "## Starter Skills",
    "",
    ...starterSkills,
    AI_FRAMEWORK_BLOCK_END,
  ]);
}

export function createAgentsFile(agent: SupportedAgent) {
  return toMarkdown([
    "# Agent Workspace",
    "",
    "This file is partially managed by `agents-framework`.",
    "",
    createManagedAgentsBlock(agent).trimEnd(),
  ]);
}

export function createAgentReadme(agent: SupportedAgent) {
  const agentDirectory = AGENT_DIRECTORY_MAP[agent];

  return toMarkdown([
    `# ${agent.toUpperCase()} Agent Profile`,
    "",
    "This directory contains the managed skill set installed by `agents-framework`.",
    "",
    "## Layout",
    "",
    "- `skills/`: reusable instructions the agent should load when the task matches the skill domain.",
    "- `README.md`: quick orientation for maintainers updating the generated profile.",
    "",
    "## Working Agreement",
    "",
    "- Keep skill files short, specific, and operational.",
    "- Prefer referencing shared backlog assets in `.agents/backlog` instead of duplicating process docs.",
    "- Add new technology skills under the same agent profile when the project starts to rely on them.",
    "",
    `Managed directory: \`.agents/${agentDirectory}\``,
  ]);
}
