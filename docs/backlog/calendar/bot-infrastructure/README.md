# Epic: Bot Infrastructure

> Workspace setup, Telegram runtime, account linking, generic LLM runtime, and voice transcription.

## Overview

Этот epic должен закончиться не готовыми календарными действиями, а устойчивой bot-платформой, на которую можно безопасно навесить Google Calendar сценарии в следующем epic.

После выполнения этого эпика бот умеет:
- принимать Telegram updates в production и local polling;
- проверять подлинность production webhook-запросов и идемпотентно обрабатывать `update_id`;
- различать linked и non-linked пользователей;
- связывать Telegram account с web account;
- принимать текстовые сообщения linked пользователя;
- строить generic pending action / confirmation flow через LLM runtime;
- транскрибировать voice messages в текст и отправлять их в тот же text pipeline.

Что **не** является результатом этого эпика:
- Google OAuth2;
- конкретные Google Calendar API вызовы;
- create/update/delete/list events.

## Prerequisites

- Supabase project (existing)
- Vercel account
- OpenAI API key (pay-as-you-go)
- Telegram bot token (from BotFather)

External bootstrap, который не входит в AI-epic и должен быть завершён заранее:
- [external-bot-bootstrap.md](./external-bot-bootstrap.md)

## Tasks

| # | Task | File |
|---|------|------|
| 1 | Project Setup | [bot-project-setup.md](./bot-project-setup.md) |
| 2 | Telegram Bot Skeleton | [bot-telegram-skeleton.md](./bot-telegram-skeleton.md) |
| 3 | Telegram Webhook Hardening | [bot-webhook-hardening.md](./bot-webhook-hardening.md) |
| 4 | Telegram Account Linking Backend Contracts | [bot-account-linking.md](./bot-account-linking.md) |
| 5 | Telegram Account Linking Web UI | [bot-account-linking-web-ui.md](./bot-account-linking-web-ui.md) |
| 6 | Telegram `/link` Command and Access Gate | [bot-link-command.md](./bot-link-command.md) |
| 7 | LLM Conversation Core | [bot-llm-integration.md](./bot-llm-integration.md) |
| 8 | Voice Message Transcription | [bot-voice-processing.md](./bot-voice-processing.md) |

## Dependency Graph

```text
1. Project Setup
   -> 2. Telegram Bot Skeleton
      -> 3. Telegram Webhook Hardening
      -> 4. Telegram Account Linking Backend Contracts
         -> 5. Telegram Account Linking Web UI
      -> 6. Telegram /link Command and Access Gate (requires 3 and 4)
         -> 7. LLM Conversation Core
            -> 8. Voice Message Transcription
```

Примечание по параллелизации:
- задачи `3` и `4` можно вести параллельно после завершения `2`;
- задачи `5` и `6` больше нельзя считать полностью независимыми: web UI зависит только от backend contracts, а bot-side linking зависит и от contracts, и от hardened ingress;
- `8` сознательно идёт после `7`, потому что voice transport должен переиспользовать готовый text pipeline, а не дублировать его.

## Why This Split

- Backend contracts linking flow отделены от bot `/link` handler, потому что web UI и bot runtime зависят от одного и того же server-side источника истины, но не должны блокировать друг друга реализацией UI/grammY слоя.
- Webhook hardening вынесен в отдельную задачу между skeleton и stateful bot features, потому что секрет webhook и idempotency по `update_id` должны быть готовы до `/link`, LLM и voice flows.
- Generic LLM runtime отделён от Google Calendar действий, потому что bot infrastructure должна поставлять reusable conversation engine, а concrete tool schemas и action execution относятся к следующему epic.
- Voice task отделена от LLM task, потому что transcription transport и conversation runtime имеют разные риски, тесты и внешние зависимости.

## Database Tables Created In This Epic

- `telegram_users` -- Telegram <-> web account mapping
- `linking_codes` -- one-time account linking codes
- `telegram_processed_updates` -- durable webhook idempotency receipts for `update_id`
- `bot_conversations` -- short-lived generic conversation state
