# Bot

Telegram bot application for the monorepo.

## Local Development

```bash
# 1. Install dependencies from the root
pnpm install --frozen-lockfile

# 2. Create local env file
cp .env.example .env.local

# 3. Fill in TELEGRAM_BOT_TOKEN in .env.local

# 4. Start in polling mode
pnpm --filter bot dev
```

## Environment Variables

| Variable                    | Required | Description                                 |
| --------------------------- | -------- | ------------------------------------------- |
| `BOT_MODE`                  | yes      | `polling` (local) or `webhook` (production) |
| `TELEGRAM_BOT_TOKEN`        | yes      | Telegram Bot API token                      |
| `TELEGRAM_WEBHOOK_SECRET`   | no       | Webhook secret (future)                     |
| `SUPABASE_URL`              | no       | Supabase project URL (future)               |
| `SUPABASE_SERVICE_ROLE_KEY` | no       | Supabase service role key (future)          |
| `OPENAI_API_KEY`            | no       | OpenAI API key (future)                     |
| `LOG_LEVEL`                 | no       | Log level                                   |

## Commands

```bash
pnpm --filter bot dev        # Start polling (local dev)
pnpm --filter bot build      # Type-check (tsc --noEmit)
pnpm --filter bot lint       # ESLint
pnpm --filter bot lint:fix   # ESLint with auto-fix
pnpm --filter bot test:unit  # Run unit tests
```

## CI

PR checks run automatically via `.github/workflows/bot-ci.yml` when changes are made to `apps/bot/**` or root config files. The workflow runs `build`, `lint`, `test:unit`, and `gitleaks` secret scanning.

## Vercel Git Integration

Production deploys happen automatically via Vercel Git Integration after merge to the default branch. The Vercel project is configured with:

- **Root Directory**: `apps/bot`
- **Environment Variables**: `BOT_MODE=webhook`, `TELEGRAM_BOT_TOKEN` set in Vercel UI
