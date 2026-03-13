import { mkdir, readFile, writeFile } from "node:fs/promises";
import { access } from "node:fs/promises";
import { dirname, join, relative, resolve } from "node:path";
import {
  AGENT_DIRECTORY_MAP,
  AI_FRAMEWORK_BLOCK_END,
  AI_FRAMEWORK_BLOCK_START,
  SKILL_DEFINITIONS,
  SUPPORTED_AGENTS,
  type SupportedAgent,
} from "./constants.js";
import {
  createAgentReadme,
  createAgentsFile,
  createBacklogReadme,
  createManagedAgentsBlock,
  createSkillContent,
  createTaskTemplate,
} from "./templates.js";

export interface InitializeProjectOptions {
  agent: string;
  cwd?: string;
  force?: boolean;
}

export interface InitializeProjectResult {
  agent: SupportedAgent;
  rootDir: string;
  createdFiles: string[];
  updatedFiles: string[];
  skippedFiles: string[];
}

export function isSupportedAgent(value: string): value is SupportedAgent {
  return SUPPORTED_AGENTS.includes(value as SupportedAgent);
}

export async function initializeProject(
  options: InitializeProjectOptions,
): Promise<InitializeProjectResult> {
  const rootDir = resolve(options.cwd ?? process.cwd());
  const force = options.force ?? false;
  const agent = options.agent;

  if (!isSupportedAgent(agent)) {
    throw new Error(
      `Unsupported agent "${agent}". Expected one of: ${SUPPORTED_AGENTS.join(", ")}.`,
    );
  }

  const result: InitializeProjectResult = {
    agent,
    rootDir,
    createdFiles: [],
    updatedFiles: [],
    skippedFiles: [],
  };

  const agentRoot = join(rootDir, ".agents", AGENT_DIRECTORY_MAP[agent]);
  const backlogRoot = join(rootDir, ".agents", "backlog");

  const managedFiles = [
    {
      filePath: join(agentRoot, "README.md"),
      content: createAgentReadme(agent),
    },
    {
      filePath: join(backlogRoot, "README.md"),
      content: createBacklogReadme(),
    },
    {
      filePath: join(backlogRoot, "task-template.md"),
      content: createTaskTemplate(),
    },
    {
      filePath: join(backlogRoot, "inbox", ".gitkeep"),
      content: "",
    },
    {
      filePath: join(backlogRoot, "ready", ".gitkeep"),
      content: "",
    },
    {
      filePath: join(backlogRoot, "in-progress", ".gitkeep"),
      content: "",
    },
    {
      filePath: join(backlogRoot, "done", ".gitkeep"),
      content: "",
    },
  ];

  for (const skill of SKILL_DEFINITIONS) {
    managedFiles.push({
      filePath: join(agentRoot, "skills", skill.slug, "SKILL.md"),
      content: createSkillContent(skill.slug),
    });
  }

  for (const file of managedFiles) {
    await writeManagedFile(file.filePath, file.content, { force, result, rootDir });
  }

  const agentsFilePath = join(rootDir, "AGENTS.md");
  await upsertAgentsFile(agentsFilePath, agent, { result, rootDir });

  return result;
}

interface WriteContext {
  force: boolean;
  result: InitializeProjectResult;
  rootDir: string;
}

interface AgentsFileContext {
  result: InitializeProjectResult;
  rootDir: string;
}

async function writeManagedFile(filePath: string, content: string, context: WriteContext) {
  await mkdir(dirname(filePath), { recursive: true });

  const normalizedContent = ensureTrailingNewline(content);
  const relativePath = toRelativePath(context.rootDir, filePath);

  if (!(await fileExists(filePath))) {
    await writeFile(filePath, normalizedContent, "utf8");
    context.result.createdFiles.push(relativePath);
    return;
  }

  const currentContent = await readFile(filePath, "utf8");
  if (!context.force) {
    context.result.skippedFiles.push(relativePath);
    return;
  }

  if (currentContent === normalizedContent) {
    context.result.skippedFiles.push(relativePath);
    return;
  }

  await writeFile(filePath, normalizedContent, "utf8");
  context.result.updatedFiles.push(relativePath);
}

async function upsertAgentsFile(
  filePath: string,
  agent: SupportedAgent,
  context: AgentsFileContext,
) {
  await mkdir(dirname(filePath), { recursive: true });

  const relativePath = toRelativePath(context.rootDir, filePath);
  const nextBlock = createManagedAgentsBlock(agent).trim();

  if (!(await fileExists(filePath))) {
    await writeFile(filePath, createAgentsFile(agent), "utf8");
    context.result.createdFiles.push(relativePath);
    return;
  }

  const currentContent = await readFile(filePath, "utf8");
  const nextContent = ensureTrailingNewline(upsertManagedBlock(currentContent, nextBlock));

  if (nextContent === currentContent) {
    context.result.skippedFiles.push(relativePath);
    return;
  }

  await writeFile(filePath, nextContent, "utf8");
  context.result.updatedFiles.push(relativePath);
}

function upsertManagedBlock(currentContent: string, nextBlock: string) {
  const blockPattern = new RegExp(
    `${escapeForRegExp(AI_FRAMEWORK_BLOCK_START)}[\\s\\S]*?${escapeForRegExp(AI_FRAMEWORK_BLOCK_END)}`,
    "m",
  );

  if (blockPattern.test(currentContent)) {
    return currentContent.replace(blockPattern, nextBlock);
  }

  const trimmedContent = currentContent.trimEnd();
  return `${trimmedContent}\n\n${nextBlock}\n`;
}

function ensureTrailingNewline(content: string) {
  return content.endsWith("\n") ? content : `${content}\n`;
}

function toRelativePath(rootDir: string, targetPath: string) {
  return relative(rootDir, targetPath) || targetPath;
}

function escapeForRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

async function fileExists(filePath: string) {
  try {
    await access(filePath);
    return true;
  } catch {
    return false;
  }
}
