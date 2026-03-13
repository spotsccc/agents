# Epic: Tasks

> DB schema, RLS policies, API composables, web UI for task management.

## Overview

Полный цикл управления задачами: база данных, серверная логика, веб-интерфейс для CRUD операций с фильтрацией и сортировкой.

После выполнения этого эпика пользователь может:
- Создавать, редактировать, удалять задачи в web UI
- Фильтровать и сортировать задачи по статусу, приоритету, дедлайну

## Prerequisites

- Supabase project (existing)
- Web app deployed (existing)

## Tasks

| # | Task | File |
|---|------|------|
| 1 | Tasks Backend | [tasks-backend.md](./tasks-backend.md) |
| 2 | Tasks Web UI | [tasks-web-ui.md](./tasks-web-ui.md) |

## Database Tables (created in this epic)

- `tasks` -- user tasks with status, priority, due date
