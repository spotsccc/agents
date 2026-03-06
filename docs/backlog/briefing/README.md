# Project: Briefing & Diary

> Automated утренние/вечерние брифинги с интеграцией календаря, задач и дневника. Сбор ответов на вопросы дневника через Telegram-бота.

## User Story

Каждое утро в заданное время пользователь получает в Telegram сообщение с расписанием на день, списком задач и вопросами дневника. Пользователь отвечает на вопросы голосом или текстом, бот парсит ответы и сохраняет. В веб-интерфейсе можно настраивать шаблоны дневника, конфигурацию брифингов и просматривать историю записей.

## Architecture

```
Supabase pg_cron (every 1 min)
        |
        └── net.http_post --> Edge Function (briefing-dispatch)
                                |
                                ├── Query briefing_configs (who needs briefing now?)
                                ├── For each user:
                                │   ├── Fetch tasks (Supabase)
                                │   ├── Fetch calendar events (Google Calendar API)
                                │   ├── Fetch diary template questions
                                │   └── Compose message
                                └── Send via Telegram Bot API

User responds to diary questions:
        Telegram --> Webhook --> LLM parses answers --> Save to diary_entries
```

## Prerequisites

- Bot infrastructure deployed (Calendar project)
- Account linking working
- Task tracker deployed (for task integration in briefings)
- Google Calendar connected (optional -- graceful degradation if not)

## Database Tables

- `diary_templates` -- configurable diary question templates
- `diary_entries` -- diary responses
- `briefing_configs` -- morning/evening briefing configuration per user
- `briefing_log` -- idempotency log for sent briefings

## Epics

| # | Epic | Description |
|---|------|-------------|
| 1 | [Diary Management](./diary-management/) | DB schema, template management web UI, diary history page |
| 2 | [Briefing System](./briefing-system/) | Briefing configuration, cron execution, diary collection via bot |

## Implementation Order

```
Epic 1: Diary Management
  1. Diary Schema + Templates (DB migration, RLS, web UI)
  2. Diary Viewing (history page, analytics)

Epic 2: Briefing System
  3. Briefing Configuration (DB schema, web UI)
  4. Briefing Execution (cron job, message composition)
  5. Diary Collection (bot collects diary responses)
```
