# Bot Guidelines

These instructions apply only to `apps/bot`. Combine them with the repository root instructions.

## Commands

Run from `apps/bot/`:

```bash
pnpm dev
pnpm type-check && pnpm lint:check && pnpm format:check && pnpm test:unit
pnpm lint:fix
```

## App Structure

```text
src/
├── index.ts          # Hono app for webhook/serverless entry
├── dev.ts            # Local polling bootstrap
├── bot.ts            # grammy bot factory
└── config/
    └── env.ts        # Runtime env validation

__tests__/            # Vitest specs
```

- Keep `createBot()` side-effect free in `src/bot.ts`
- Use `src/dev.ts` for local polling startup only
- Export `app` and `default app` from `src/index.ts` for HTTP/webhook handling
- Centralize runtime env parsing and validation in `src/config/env.ts`

## Runtime and Environment

- Required env vars: `BOT_MODE`, `TELEGRAM_BOT_TOKEN`
- Use `BOT_MODE=polling` for local development and `BOT_MODE=webhook` for deployed HTTP handling
- Validate env eagerly at startup and fail fast on missing or invalid values

## Testing Guidelines

Bot tests use Vitest in `__tests__/**/*.spec.ts`.

- Test HTTP behavior with `app.request(new Request(...))` instead of starting a real server
- Test pure helpers like `createBot()` and `loadEnv()` directly
- When mutating `process.env` in tests, restore the original object in `beforeEach`/`afterEach`

## Coding Notes

- Use ESM imports with `.js` suffix for local TypeScript modules
- Keep module imports safe: no polling startup or network side effects on import
- Prefer small pure functions in `src/` and request-level tests in `__tests__/`
