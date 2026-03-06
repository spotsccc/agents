# Project: Task Tracker

> Управление задачами через веб-интерфейс с интеграцией в брифинги.

## User Story

Пользователь создаёт и управляет задачами в веб-интерфейсе. Задачи с дедлайном на сегодня и просроченные задачи автоматически включаются в утренний брифинг. В будущем бот сможет управлять задачами через Telegram.

## Prerequisites

- Supabase project (existing)
- Web app deployed (existing)

## Database Tables

- `tasks` -- user tasks with status, priority, due date

## Epics

| # | Epic | Description |
|---|------|-------------|
| 1 | [Tasks](./tasks/) | DB schema, RLS, API, web UI |

## Implementation Order

```
Epic 1: Tasks
  1. Tasks Backend (DB schema, RLS, triggers, composables)
  2. Tasks Web UI (page, CRUD, filters, sorting)
```
