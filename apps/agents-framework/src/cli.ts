#!/usr/bin/env node

import { initializeProject, isSupportedAgent, SUPPORTED_AGENTS } from "./index.js";

interface ParsedArgs {
  command: "help" | "init";
  agent?: string;
  cwd?: string;
  force: boolean;
}

const HELP_TEXT = `agents-framework

Usage:
  agents-framework init --agent <claude|codex> [--cwd <path>] [--force]
  agents-framework init <claude|codex> [--cwd <path>] [--force]
  agents-framework --help

Commands:
  init    Scaffold agent folders, starter skills, backlog structure, and AGENTS.md.

Options:
  --agent <name>   Agent profile to install.
  --cwd <path>     Target project directory. Defaults to the current working directory.
  --force          Rewrite managed skill files when they already exist.
  --help           Show this message.
`;

async function main(argv: string[]) {
  const parsedArgs = parseArgs(argv);

  if (parsedArgs.command === "help") {
    process.stdout.write(HELP_TEXT);
    return;
  }

  if (!parsedArgs.agent || !isSupportedAgent(parsedArgs.agent)) {
    throw new Error(`Missing or invalid agent. Use one of: ${SUPPORTED_AGENTS.join(", ")}.`);
  }

  const result = await initializeProject({
    agent: parsedArgs.agent,
    cwd: parsedArgs.cwd,
    force: parsedArgs.force,
  });

  process.stdout.write(`Initialized agents-framework in ${result.rootDir}\n`);
  process.stdout.write(`Agent: ${result.agent}\n`);
  writeGroup("Created", result.createdFiles);
  writeGroup("Updated", result.updatedFiles);
  writeGroup("Skipped", result.skippedFiles);
}

function parseArgs(argv: string[]): ParsedArgs {
  if (argv.includes("--help") || argv.includes("-h")) {
    return {
      command: "help",
      force: false,
    };
  }

  const args = [...argv];
  let command: ParsedArgs["command"] = "init";

  if (args[0] === "init" || args[0] === "help") {
    command = args.shift() as ParsedArgs["command"];
  }

  if (command === "help") {
    return {
      command,
      force: false,
    };
  }

  let agent: string | undefined;
  let cwd: string | undefined;
  let force = false;

  while (args.length > 0) {
    const argument = args.shift();

    if (!argument) {
      continue;
    }

    if (!argument.startsWith("--") && !agent) {
      agent = argument;
      continue;
    }

    if (argument === "--agent") {
      agent = args.shift();
      continue;
    }

    if (argument === "--cwd") {
      cwd = args.shift();
      continue;
    }

    if (argument === "--force") {
      force = true;
      continue;
    }

    throw new Error(`Unknown argument: ${argument}`);
  }

  return {
    command,
    agent,
    cwd,
    force,
  };
}

function writeGroup(label: string, values: string[]) {
  if (values.length === 0) {
    return;
  }

  process.stdout.write(`${label}:\n`);
  for (const value of values) {
    process.stdout.write(`- ${value}\n`);
  }
}

void main(process.argv.slice(2)).catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  process.stderr.write(`${message}\n`);
  process.stderr.write("Run `agents-framework --help` for usage.\n");
  process.exitCode = 1;
});
