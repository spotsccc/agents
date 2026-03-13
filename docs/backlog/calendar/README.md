# Project: Calendar Management

> Управление Google Calendar через Telegram-бота с поддержкой голосовых сообщений и естественного языка.

## User Story

Пользователь отправляет боту текстовое или голосовое сообщение вида "Запланируй встречу завтра в 12 на 2 часа, звонок с Ильёй". Бот распознаёт речь, интерпретирует намерение через LLM, запрашивает подтверждение и выполняет действие в Google Calendar.

## Architecture

```text
User (Telegram) --> Vercel Serverless Function (webhook)
                        |
                        ├── Access Gate / Account Linking
                        |
                        ├── Voice? --> OpenAI Transcription --> text
                        |
                        └── Text --> Generic LLM Runtime
                                        |
                                        └── Calendar Tool Registry + Executor
                                                |
                                                ├── Google Calendar API
                                                |
                                                └── Encrypted tokens from Supabase
```

## Key Technology Decisions

| Concern | Decision | Rationale |
|---------|----------|-----------|
| LLM runtime | OpenAI API via reusable bot-side runtime | Bot infrastructure поставляет generic conversation engine, domain tools подключаются позже |
| STT | OpenAI transcription API | Отдельный transport слой для voice messages |
| Telegram | grammY | TypeScript-first, webhook support for serverless |
| Calendar | Google Calendar API | Domain-specific actions живут в отдельном epic |
| Hosting (bot) | Vercel Serverless Functions | Consistent with existing infra |
| Auth (Google) | OAuth2 via web UI | Пользователь сам управляет доступом к календарю |

## Prerequisites

- Supabase project (existing)
- Vercel project for bot deployment
- Google Cloud project with Calendar API enabled
- OpenAI API key (pay-as-you-go)
- Telegram bot token (from BotFather)

## Database Tables

- `telegram_users` -- Telegram <-> web account mapping
- `bot_conversations` -- short-lived generic conversation context
- `linking_codes` -- one-time account linking codes
- `user_google_tokens` -- encrypted Google OAuth2 tokens

## Epics

| # | Epic | Description |
|---|------|-------------|
| 1 | [Bot Infrastructure](./bot-infrastructure/) | Telegram runtime, account linking, generic LLM runtime, voice transcription |
| 2 | [Google Calendar](./google-calendar/) | OAuth2 flow, Calendar API integration, calendar action tools and execution |

## Implementation Order

```text
Epic 1: Bot Infrastructure
  1. Project Setup
  2. Telegram Bot Skeleton
  3. Telegram Account Linking Backend Contracts
  4. Telegram Account Linking Web UI
  5. Telegram /link Command and Access Gate
  6. LLM Conversation Core
  7. Voice Message Transcription

Epic 2: Google Calendar
  8. Google OAuth2
  9. Calendar API Service Module + Tool Registry
 10. Calendar Commands via Bot
```

## Cross-Epic Boundary

Epic 1 заканчивается на reusable bot platform:
- bot runtime;
- linking flow;
- generic LLM runtime;
- voice-to-text transport.

Epic 2 добавляет concrete business actions:
- Google OAuth tokens;
- Calendar API service;
- tool schemas и action execution для календаря.

