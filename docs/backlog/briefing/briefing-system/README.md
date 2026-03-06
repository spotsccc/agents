# Epic: Briefing System

> Конфигурация брифингов, cron-based execution, сбор ответов дневника через бота.

## Overview

Система автоматических брифингов: web UI для настройки расписания и содержания, Edge Function для отправки брифингов по cron, обработка ответов на вопросы дневника через Telegram-бота.

После выполнения этого эпика пользователь может:
- Настроить утренние/вечерние брифинги в web UI
- Получать автоматические брифинги в Telegram в заданное время
- Отвечать на вопросы дневника через бота (текстом или голосом)

## Prerequisites

- Diary Management epic completed
- Bot infrastructure deployed (Calendar project)
- Account linking working
- Task tracker deployed (for task integration)

## Tasks

| # | Task | File |
|---|------|------|
| 1 | Briefing Configuration | [briefing-config.md](./briefing-config.md) |
| 2 | Briefing Execution | [briefing-execution.md](./briefing-execution.md) |
| 3 | Diary Collection | [diary-collection.md](./diary-collection.md) |

## Database Tables (created in this epic)

- `briefing_configs` -- morning/evening briefing configuration per user
- `briefing_log` -- idempotency log for sent briefings
