# Epic: Diary Management

> DB schema для дневника, управление шаблонами в web UI, просмотр истории записей.

## Overview

Создание инфраструктуры для дневника: таблицы для шаблонов и записей, web UI для управления шаблонами вопросов, страница просмотра истории записей.

После выполнения этого эпика пользователь может:
- Создавать и редактировать шаблоны дневника (наборы вопросов) в web UI
- Просматривать историю записей дневника

## Prerequisites

- Supabase project (existing)
- Web app deployed (existing)

## Tasks

| # | Task | File |
|---|------|------|
| 1 | Diary Schema + Templates | [diary-schema-and-templates.md](./diary-schema-and-templates.md) |
| 2 | Diary Viewing | [diary-viewing.md](./diary-viewing.md) |

## Database Tables (created in this epic)

- `diary_templates` -- configurable diary question templates
- `diary_entries` -- diary responses
