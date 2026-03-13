# Supabase Package Guidelines

These instructions apply only to `packages/supabase`. Combine them with the repository root instructions.

## Commands

Run from `packages/supabase/` unless noted otherwise:

```bash
pnpm gen:types
pnpm db:push
pnpm functions:serve
pnpm type-check && pnpm lint:check && pnpm format:check && pnpm test:unit
```

Use `pnpm supabase:start` from the repository root when local DB/Auth services are required.

## Package Structure

```text
migrations/           # SQL migrations
scheme/
├── index.ts          # Generated Supabase schema types
└── kysely.ts         # Kysely adapter types derived from scheme/index.ts
functions/
└── <function-name>/
    ├── contract.ts   # Shared request contract + function name constant
    ├── deno.json     # Deno import map for the function
    └── index.ts      # Deno.serve entrypoint
config.toml           # Local Supabase CLI configuration
```

- Treat `scheme/index.ts` as generated output from `pnpm gen:types`
- Keep Kysely types derived from the generated schema instead of duplicating table definitions manually
- Each Edge Function should keep its contract and runtime code in the same function folder

## Edge Function Checklist

When adding a new Edge Function:

1. Create `functions/<function-name>/deno.json`
2. Add `functions/<function-name>/contract.ts` with exported request types and a function-name constant
3. Implement `functions/<function-name>/index.ts` with `Deno.serve(...)`
4. Export the contract from `package.json` in both `exports` and `typesVersions`
5. If a consumer workspace uses the function, add its local wrapper there following that workspace's instructions

If the function needs explicit local runtime config, add a matching `[functions.<function-name>]` section in `config.toml`.

## Function Patterns

- Authenticate the caller from the incoming `Authorization` header before privileged writes
- If a transaction uses `SET LOCAL ROLE service_role`, still validate user ownership explicitly inside the function
- Import shared DB types from `../../scheme/kysely.ts`
- Keep request and response payloads explicit and JSON-based

## Validation and Tests

- `pnpm type-check` runs `deno check` across `functions/*` and `scheme`
- `pnpm test:unit` currently allows no test files; add Deno tests when logic warrants it
- Run `pnpm format:check` and `pnpm lint:check` before finishing work in this package

## Coding Notes

- Follow `deno fmt` and `deno lint` output in this workspace, even where it differs from app TypeScript style
- Use `.ts` import specifiers for local Deno modules
- Keep cross-workspace contracts importable from the package root
