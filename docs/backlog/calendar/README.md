# Project: Calendar Management

> Управление Google Calendar через Telegram-бота с поддержкой голосовых сообщений и естественного языка.

## User Story

Пользователь отправляет боту текстовое или голосовое сообщение вида "Запланируй встречу завтра в 12 на 2 часа, звонок с Ильёй". Бот распознаёт речь (если голос), парсит намерение через LLM с function calling, показывает подтверждение и создаёт событие в Google Calendar.

## Architecture

```
User (Telegram) --> Vercel Serverless Function (webhook)
                        |
                        ├── Voice? --> Whisper API --> text
                        |
                        └── Text --> OpenAI GPT (function calling)
                                        |
                                        ├── createEvent / updateEvent / deleteEvent / listEvents
                                        |
                                        └── Google Calendar API (via googleapis)
                                                |
                                                └── Encrypted tokens from Supabase
```

## Key Technology Decisions

| Concern | Decision | Rationale |
|---------|----------|-----------|
| LLM | OpenAI GPT (via API key, pay-as-you-go) | User preference, good function calling support. May migrate to Max subscription later |
| STT | OpenAI Whisper API (via API key, $0.006/min) | High quality. Max subscription does NOT include API access -- requires separate API billing |
| Telegram | grammy framework | TypeScript-first, webhook support for serverless |
| Calendar | Google Calendar API (direct) | Called via OpenAI function calling tools. MCP is overkill for serverless |
| Hosting (bot) | Vercel Serverless Functions | Consistent with existing infra, webhook-based |
| Auth (Google) | OAuth2 via web UI | Better UX, user manages their own tokens |

## Prerequisites

- Supabase project (existing)
- Vercel project for bot deployment
- Google Cloud project with Calendar API enabled
- OpenAI API key (pay-as-you-go)
- Telegram bot token (from BotFather)

## Database Tables

- `telegram_users` -- Telegram <-> web account mapping
- `bot_conversations` -- short-lived conversation context
- `linking_codes` -- one-time account linking codes
- `user_google_tokens` -- encrypted Google OAuth2 tokens

## Epics

| # | Epic | Description |
|---|------|-------------|
| 1 | [Bot Infrastructure](./bot-infrastructure/) | Telegram bot setup, account linking, voice processing, LLM integration |
| 2 | [Google Calendar](./google-calendar/) | OAuth2 flow, Calendar API, calendar commands via bot |

## Implementation Order

```
Epic 1: Bot Infrastructure
  1. Project Setup (apps/bot/, tsconfig, turborepo, Vercel)
  2. Account Linking (DB + web UI + bot /link command)
  3. Telegram Bot Skeleton (grammy, webhook handler, /start)
  4. Voice Message Processing (Whisper API, limits)
  5. LLM Integration (OpenAI function calling, conversation context)

Epic 2: Google Calendar
  6. Google OAuth2 (DB migration, RLS, OAuth2 flow in web UI)
  7. Calendar API Service Module + Tool Schemas
  8. Calendar Commands via Bot (create, edit, delete, list)
```
