import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, expect, test } from "vite-plus/test";
import { initializeProject } from "../src/index.js";

const temporaryDirectories: string[] = [];

afterEach(async () => {
  await Promise.all(
    temporaryDirectories
      .splice(0)
      .map((directory) => rm(directory, { recursive: true, force: true })),
  );
});

test("initializeProject scaffolds the requested agent workspace", async () => {
  const projectDir = await createTemporaryProject();
  const result = await initializeProject({
    agent: "claude",
    cwd: projectDir,
  });

  expect(result.createdFiles).toEqual(
    expect.arrayContaining([
      "AGENTS.md",
      ".agents/.claude/README.md",
      ".agents/.claude/skills/backlog-workflow/SKILL.md",
      ".agents/.claude/skills/backlog-research/SKILL.md",
      ".agents/.claude/skills/backlog-planning/SKILL.md",
      ".agents/.claude/skills/backlog-readiness/SKILL.md",
      ".agents/.claude/skills/backlog-execution/SKILL.md",
      ".agents/.claude/skills/testing-verification/SKILL.md",
      ".agents/backlog/README.md",
      ".agents/backlog/task-template.md",
    ]),
  );

  const agentsFile = await readFile(join(projectDir, "AGENTS.md"), "utf8");
  expect(agentsFile).toContain("Active agent profile: `claude`");
  expect(agentsFile).toContain("Shared backlog: `.agents/backlog`");

  const backlogSkill = await readFile(
    join(projectDir, ".agents", ".claude", "skills", "backlog-workflow", "SKILL.md"),
    "utf8",
  );
  expect(backlogSkill).toContain("# Backlog Workflow");
  expect(backlogSkill).toContain("## Scenario Routing");

  const researchSkill = await readFile(
    join(projectDir, ".agents", ".claude", "skills", "backlog-research", "SKILL.md"),
    "utf8",
  );
  expect(researchSkill).toContain("# Backlog Research");

  const testingSkill = await readFile(
    join(projectDir, ".agents", ".claude", "skills", "testing-verification", "SKILL.md"),
    "utf8",
  );
  expect(testingSkill).toContain("# Testing and Verification");

  const backlogReadme = await readFile(join(projectDir, ".agents", "backlog", "README.md"), "utf8");
  expect(backlogReadme).toContain("## Task Lifecycle");
});

test("initializeProject preserves user-authored AGENTS.md content while updating the managed block", async () => {
  const projectDir = await createTemporaryProject();
  const agentsFilePath = join(projectDir, "AGENTS.md");

  await writeFile(
    agentsFilePath,
    [
      "# Existing Notes",
      "",
      "This paragraph belongs to the repository owner.",
      "",
      "<!-- AI_FRAMEWORK:START -->",
      "Old managed content",
      "<!-- AI_FRAMEWORK:END -->",
      "",
    ].join("\n"),
    "utf8",
  );

  const result = await initializeProject({
    agent: "codex",
    cwd: projectDir,
  });

  expect(result.updatedFiles).toContain("AGENTS.md");

  const nextAgentsFile = await readFile(agentsFilePath, "utf8");
  expect(nextAgentsFile).toContain("This paragraph belongs to the repository owner.");
  expect(nextAgentsFile).toContain("Active agent profile: `codex`");
  expect(nextAgentsFile.match(/AI_FRAMEWORK:START/g)).toHaveLength(1);
});

async function createTemporaryProject() {
  const projectDir = await mkdtemp(join(tmpdir(), "agents-framework-"));
  temporaryDirectories.push(projectDir);
  return projectDir;
}
