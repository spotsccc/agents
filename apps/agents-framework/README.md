# agents-framework

`agents-framework` is a CLI package for bootstrapping a shared way of working with coding agents inside a repository.

## Goal

The project aims to collect strong practices for agent-assisted development and package them into a repeatable setup that can be installed in any codebase.

## Problem

When teams use agents ad hoc, working agreements usually live in chat history or individual habits:

- task handling is inconsistent
- code, tests, and documentation standards drift
- the agent has no durable backlog to operate on
- project-specific skills are scattered or missing

This reduces both speed and quality because every session has to rediscover the same rules.

## Solution

`agents-framework` turns those practices into project assets:

- creates an agent profile such as `.agents/.claude` or `.agents/.codex`
- installs starter skills for backlog workflow, research, planning, readiness review, execution, engineering standards, testing/verification, JavaScript/TypeScript, SQL, Vercel, Playwright, and Vitest
- initializes a markdown backlog in `.agents/backlog`
- creates `AGENTS.md` if needed or updates a managed block if it already exists

The intended result is a repository where the agent can work through explicit markdown tasks, reuse stable skill files, and follow one consistent delivery flow for code, tests, and documentation.

## Current MVP

The first version provides:

- `agents-framework init --agent claude`
- `agents-framework init --agent codex`
- managed starter skills and backlog templates
- safe `AGENTS.md` upsert behavior through a managed block

## Development

Run commands from `apps/agents-framework`:

```bash
vp lint .
vp test
vp pack
```

## Example

```bash
vp pack apps/agents-framework
node apps/agents-framework/dist/cli.mjs init --agent claude --cwd /path/to/project
```
