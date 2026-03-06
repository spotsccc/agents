# Epic: Google Calendar

> Google OAuth2 flow, Calendar API service module, calendar commands via bot.

## Overview

Интеграция с Google Calendar: OAuth2 авторизация в web UI для получения токенов доступа, серверный модуль для работы с Calendar API, команды бота для создания/редактирования/удаления/просмотра событий.

После выполнения этого эпика пользователь может:
- Подключить Google Calendar в web UI
- Создавать, редактировать, удалять и просматривать события через бота
- Использовать естественный язык и голосовые сообщения для управления календарём

## Prerequisites

- Bot Infrastructure epic completed
- Google Cloud project with Calendar API enabled

## Tasks

| # | Task | File |
|---|------|------|
| 1 | Google OAuth2 | [google-oauth.md](./google-oauth.md) |
| 2 | Calendar API Service Module | [calendar-api.md](./calendar-api.md) |
| 3 | Calendar Commands | [calendar-commands.md](./calendar-commands.md) |

## Implementation Order

```
1. Google OAuth2          -- DB migration, RLS, OAuth2 flow in web UI
2. Calendar API Module    -- service module + OpenAI tool schemas
3. Calendar Commands      -- create, edit, delete, list via bot
```

## Database Tables (created in this epic)

- `user_google_tokens` -- encrypted Google OAuth2 tokens
