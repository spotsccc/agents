# Telegram Bot Skeleton

> Grammy bot, webhook handler на Vercel, команда `/start`, настройка webhook.

---

## Описание

Базовый скелет Telegram-бота на grammy с webhook handler как Vercel serverless function. Включает команду `/start`, меню команд, настройку webhook URL и режим разработки через long polling.

---

## Бизнес-сценарии

### `/start`

1. Пользователь открывает чат с ботом, нажимает "Start"
2. Бот отвечает приветственным сообщением с инструкцией по привязке аккаунта

### `/start` для уже привязанного пользователя

1. Привязанный пользователь отправляет `/start`
2. Бот отвечает приветствием и кратким описанием доступных команд

---

## Технические решения

### Webhook vs Polling

- **Production**: webhook на Vercel serverless function (`api/telegram.ts`)
- **Development**: long polling для локальной разработки

> TODO: Определить:
> - Переключение через env variable (`BOT_MODE=polling`) или отдельный npm script?

### Обработка webhook в рамках timeout

> TODO: Критичное решение:
> - Vercel serverless functions имеют timeout (~25s на Pro). Telegram retries при отсутствии ответа.
> - Варианты: (a) укладываемся в timeout, (b) Vercel Queue, (c) Vercel Fluid Compute
> - Выбрать и задокументировать подход

### Идемпотентность (дедупликация)

> TODO: Определить:
> - Telegram retries failed webhooks. Нужна дедупликация по `update_id`.
> - Где хранить обработанные `update_id`? Таблица в Supabase? С каким TTL?
> - Или достаточно idempotent операций без явной дедупликации?

### Настройка Webhook URL

> TODO: Определить:
> - npm script для вызова `setWebhook`?
> - Автоматически при деплое (CI/CD)?
> - Только production URL (не preview deployments)

---

## Scope

- [ ] Установить `grammy`, настроить bot instance
- [ ] Создать webhook handler (`api/telegram.ts`)
- [ ] Реализовать команду `/start`
- [ ] Настроить меню команд бота в Telegram
- [ ] Создать скрипт для установки webhook URL
- [ ] Настроить режим long polling для локальной разработки
- [ ] Реализовать дедупликацию по `update_id` (если выбран этот подход)

---

## Acceptance Criteria

- [ ] Webhook endpoint принимает POST-запросы от Telegram и возвращает 200
- [ ] `/start` возвращает приветственное сообщение
- [ ] Меню команд отображается в Telegram
- [ ] Webhook URL устанавливается через скрипт
- [ ] Локальная разработка работает через long polling
- [ ] Повторный webhook с тем же `update_id` не приводит к дублированию обработки

---

## Definition of Done

- [ ] Код прошёл code review
- [ ] Unit-тесты для handlers
- [ ] Webhook endpoint задеплоен и отвечает
- [ ] `/start` работает в Telegram (manual test)
- [ ] Документация обновлена

---

## Тест-план

### Unit Tests
- Handler `/start`: формирует корректный ответ
- Webhook handler: парсит Telegram update, вызывает нужный handler
- Дедупликация: повторный `update_id` не обрабатывается

### Integration Tests
- Webhook endpoint принимает валидный Telegram update и возвращает 200
- Webhook endpoint возвращает 200 на невалидный payload (не ломается)

### Manual Tests
- `/start` в Telegram -> приветственное сообщение
- Меню команд отображается
- Long polling режим работает локально

---

## Edge Cases

- Невалидный JSON в теле webhook-запроса
- Запрос без обязательных полей Telegram update
- Cold start serverless function + длительная обработка -> timeout
- Telegram отправляет webhook дважды (retry) — дедупликация
- Webhook URL указывает на preview deployment (не должен)
- Бот получает update типа, который не обрабатывается (inline query, callback и т.д.)
