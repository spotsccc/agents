# Epic: Google Calendar

> Google OAuth2 flow, Calendar API integration, and concrete calendar actions on top of the generic bot runtime.

## Overview

Этот epic начинается после завершения bot infrastructure и добавляет именно domain layer для Google Calendar:
- OAuth2 и хранение токенов;
- серверный модуль работы с Calendar API;
- concrete tools и action execution для календарных команд бота.

После выполнения этого эпика пользователь может:
- подключить Google Calendar в web UI;
- создавать, редактировать, удалять и просматривать события через бота;
- использовать текстовые и голосовые сообщения для управления календарём через уже готовый bot runtime.

## Prerequisites

- Bot Infrastructure epic completed
- Google Cloud project with Calendar API enabled

## Tasks

| # | Task | File |
|---|------|------|
| 1 | Google OAuth2 | [google-oauth.md](./google-oauth.md) |
| 2 | Calendar API Service Module + Tool Registry | [calendar-api.md](./calendar-api.md) |
| 3 | Calendar Commands | [calendar-commands.md](./calendar-commands.md) |

## Implementation Order

```text
1. Google OAuth2
2. Calendar API Service Module + Tool Registry
3. Calendar Commands
```

## Database Tables Created In This Epic

- `user_google_tokens` -- encrypted Google OAuth2 tokens

