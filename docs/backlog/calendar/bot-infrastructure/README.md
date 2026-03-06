# Epic: Bot Infrastructure

> Project setup, Telegram bot skeleton, account linking, voice processing, LLM integration.

## Overview

Создание инфраструктуры Telegram-бота: пакет `apps/bot/` в монорепозитории, webhook handler на Vercel, привязка Telegram-аккаунта к web-аккаунту, обработка голосовых сообщений через Whisper API, интеграция с OpenAI для обработки естественного языка с function calling.

После выполнения этого эпика бот умеет:
- Принимать текстовые и голосовые сообщения
- Транскрибировать голос в текст
- Обрабатывать намерения через LLM с function calling
- Показывать подтверждения и выполнять действия

## Prerequisites

- Supabase project (existing)
- Vercel account
- OpenAI API key (pay-as-you-go)
- Telegram bot token (from BotFather)

## Tasks

| # | Task | File |
|---|------|------|
| 1 | Project Setup | [bot-project-setup.md](./bot-project-setup.md) |
| 2 | Account Linking | [bot-account-linking.md](./bot-account-linking.md) |
| 3 | Telegram Bot Skeleton | [bot-telegram-skeleton.md](./bot-telegram-skeleton.md) |
| 4 | Voice Message Processing | [bot-voice-processing.md](./bot-voice-processing.md) |
| 5 | LLM Integration | [bot-llm-integration.md](./bot-llm-integration.md) |

## Implementation Order

Tasks are sequential -- each depends on the previous:

```
1. Project Setup        -- apps/bot/, tsconfig, turborepo, Vercel
2. Account Linking      -- DB + web UI + bot /link command
3. Telegram Skeleton    -- grammy, webhook handler, /start
4. Voice Processing     -- Whisper API, limits
5. LLM Integration      -- OpenAI function calling, conversation context
```

## Database Tables (created in this epic)

- `telegram_users` -- Telegram <-> web account mapping
- `linking_codes` -- one-time account linking codes
- `bot_conversations` -- short-lived conversation context
