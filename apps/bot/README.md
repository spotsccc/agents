# Bot

Telegram bot application for the monorepo.

## Local Development

```bash
# 1. Install dependencies from the root
vp install

# 2. Create local env file
cp .env.example .env.local

# 3. Fill in TELEGRAM_BOT_TOKEN in .env.local

# 4. Start in polling mode from the workspace root
vp run bot#dev
```

## Environment Variables

| Variable                    | Required | Description                                             |
| --------------------------- | -------- | ------------------------------------------------------- |
| `BOT_MODE`                  | yes      | `polling` (local) or `webhook` (production)             |
| `TELEGRAM_BOT_TOKEN`        | yes      | Telegram Bot API token                                  |
| `TELEGRAM_WEBHOOK_URL`      | setup    | Full `https://.../api/telegram` URL for `setup:webhook` |
| `TELEGRAM_WEBHOOK_SECRET`   | no       | Optional webhook secret for `setup:webhook`             |
| `SUPABASE_URL`              | no       | Supabase project URL (future)                           |
| `SUPABASE_SERVICE_ROLE_KEY` | no       | Supabase service role key (future)                      |
| `OPENAI_API_KEY`            | no       | OpenAI API key (future)                                 |
| `LOG_LEVEL`                 | no       | Log level                                               |

## Commands

```bash
vp run bot#dev                   # Start polling (local dev)
vp build apps/bot                # Build the webhook entry with Vite+
vp check apps/bot                # Format, lint, and type-check the bot package
vp run bot#setup:webhook         # Configure Telegram webhook and /start command
vp test --config apps/bot/vite.config.ts  # Run bot unit tests from the workspace root
```

## Webhook Setup

Use the bot token and the deployed HTTPS endpoint to register the production webhook:

```bash
TELEGRAM_BOT_TOKEN=... \
TELEGRAM_WEBHOOK_URL=https://agents-bot.vercel.app/api/telegram \
vp run bot#setup:webhook
```

If `TELEGRAM_WEBHOOK_SECRET` is set, the script also sends it as `secret_token` to Telegram.

## CI

PR checks run automatically via `.github/workflows/bot-ci.yml` when changes are made to `apps/bot/**` or root config files. The workflow runs `build`, `lint`, `test:unit`, and `gitleaks` secret scanning.

## Vercel Git Integration

Production deploys happen automatically via Vercel Git Integration after merge to the default branch. The Vercel project is configured with:

- **Root Directory**: `apps/bot`
- **Environment Variables**: `BOT_MODE=webhook`, `TELEGRAM_BOT_TOKEN` set in Vercel UI
