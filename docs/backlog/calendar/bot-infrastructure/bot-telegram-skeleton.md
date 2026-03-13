# Telegram Bot Skeleton

> grammY bot with real webhook handling in `apps/bot`, `/start`, Telegram command menu, automated webhook setup, and local polling.

---

## Описание

### Проблема

После задачи [bot-project-setup.md](./bot-project-setup.md) пакет `apps/bot` уже существует, но остаётся только инфраструктурным каркасом:
- webhook endpoint ещё не передаёт update в grammY;
- бот не обрабатывает команду `/start`;
- Telegram-side настройка webhook и меню команд не автоматизирована;
- локальная разработка через polling должна работать детерминированно даже если webhook был ранее включён.

### Цель

Собрать минимальный рабочий skeleton бота без бизнес-логики account linking и без зависимостей от БД:
- production runtime принимает Telegram message updates через `POST /api/telegram`;
- бот обрабатывает `/start`;
- локальная разработка работает через polling;
- Telegram webhook и меню команд настраиваются скриптом без ручных шагов в UI.

Важно: эта задача даёт только функциональный skeleton ingress. Production hardening (`x-telegram-bot-api-secret-token` и durable idempotency по `update_id`) вынесен в следующую задачу [bot-webhook-hardening.md](./bot-webhook-hardening.md).

### Кто использует результат

- Следующие задачи эпика: [bot-account-linking.md](./bot-account-linking.md), [bot-voice-processing.md](./bot-voice-processing.md), [bot-llm-integration.md](./bot-llm-integration.md)
- Разработчики и AI-агенты: локальная разработка, request-level тесты, автоматизированная настройка Telegram Bot API

### Связь с другими задачами

- Зависит от завершения [bot-project-setup.md](./bot-project-setup.md)
- Должна быть завершена до [bot-webhook-hardening.md](./bot-webhook-hardening.md)
- Должна быть завершена до [bot-account-linking.md](./bot-account-linking.md)

---

## Предусловия выполнения (для AI-агента)

Все шаги в этой задаче автоматизируемы при наличии внешних секретов и production URL.

- `apps/bot` уже создан и проходит базовые проверки из setup-задачи
- Выполнен внешний bootstrap из [external-bot-bootstrap.md](./external-bot-bootstrap.md)
- Доступен production webhook URL для bot-приложения
- В окружении доступны:
  - `BOT_MODE`
  - `TELEGRAM_BOT_TOKEN`
  - `TELEGRAM_WEBHOOK_URL` для скрипта настройки webhook, полный absolute HTTPS URL до `POST /api/telegram`

Что не входит в эту задачу:
- создание Telegram-бота через BotFather
- provision/deploy Vercel-проекта
- ручная настройка webhook через Telegram UI

---

## Бизнес-сценарии

### `/start`

1. Пользователь отправляет `/start` или `/start <payload>` в чат с ботом
2. Бот отвечает точным сообщением:

```text
Привет! Бот работает. Привязка аккаунта появится в следующих задачах.
```

3. HTTP webhook handler завершает запрос ответом `200` + `{ "ok": true }`

### Обычное сообщение без команды

1. Telegram отправляет message update с текстом, отличным от `/start`
2. Бот не отправляет ответное сообщение
3. HTTP webhook handler возвращает `200` + `{ "ok": true }`

### Невалидный webhook payload

1. На `POST /api/telegram` приходит невалидный JSON или JSON, который не соответствует минимальной schema message update для этой задачи
2. Handler не вызывает grammY
3. Endpoint возвращает ошибку `400`

### Локальная разработка

1. Агент запускает `pnpm --filter bot dev`
2. `src/dev.ts` загружает env, удаляет активный webhook через Telegram Bot API
3. После успешного `deleteWebhook` бот стартует в polling-режиме
4. Команда `/start` работает через polling так же, как в production webhook runtime

### Автоматическая настройка Telegram webhook

1. Агент запускает `pnpm --filter bot setup:webhook`
2. Скрипт валидирует `TELEGRAM_BOT_TOKEN` и `TELEGRAM_WEBHOOK_URL`
3. Скрипт вызывает Telegram Bot API:
   - `setWebhook` c production URL и `allowed_updates: ['message']`
   - `setMyCommands` c одной командой `/start`
4. Любой non-OK ответ Telegram API завершает скрипт с non-zero exit code

---

## Технические решения

### Архитектурные решения

- Канонический webhook/serverless entrypoint: `apps/bot/src/index.ts`
- Локальный polling bootstrap: `apps/bot/src/dev.ts`
- Фабрика бота без side-effects: `apps/bot/src/bot.ts`
- Runtime env validation: `apps/bot/src/config/env.ts`
- Telegram API bootstrap script: отдельный script entrypoint внутри `apps/bot`
- После выполнения задачи `apps/bot/package.json` гарантированно содержит scripts: `type-check`, `lint:check`, `format:check`, `test:unit`, `setup:webhook`
- Если `type-check` и `format:check` отсутствуют в baseline после `bot-project-setup.md`, эта задача добавляет их вместе с остальной функциональностью skeleton
- Verification webhook secret и durable idempotency сознательно не реализуются здесь; они являются deliverable следующей задачи hardening

### Границы ответственности файлов

| Назначение | Файл | Ограничения |
|-----------|------|-------------|
| Webhook handler | `src/index.ts` | Экспортирует `app` и `default app`, принимает `POST /api/telegram`, не запускает polling |
| Bot factory | `src/bot.ts` | Создаёт `Bot`, регистрирует `/start`, не вызывает `bot.start()` на import |
| Polling runtime | `src/dev.ts` | Единственное место, где разрешён `bot.start()` |
| Env validation | `src/config/env.ts` | Fail-fast валидация `BOT_MODE`, `TELEGRAM_BOT_TOKEN`; отдельная validation-функция для `setup:webhook`, где обязательны `TELEGRAM_BOT_TOKEN` и `TELEGRAM_WEBHOOK_URL`, а `BOT_MODE` не требуется |
| Webhook setup | `scripts/setup-webhook.ts` или эквивалентный script entrypoint | Вызывает `setWebhook` и `setMyCommands` |

### HTTP-контракт webhook endpoint

Endpoint: `POST /api/telegram`

#### Поддерживаемый payload в рамках этой задачи

Поддерживаются только message updates. Минимально допустимый payload:
- верхнеуровневый объект;
- `update_id` типа `number`;
- `message` типа `object`;
- `message.chat.id` типа `number`;
- `message.from.id` типа `number`;
- `message.text` либо строка, либо отсутствует.

#### Поведение endpoint

- `Content-Type`, не начинающийся с `application/json` -> `400` + `{ "ok": false, "error": "invalid_json" }`
- Невалидный JSON -> `400` + `{ "ok": false, "error": "invalid_json" }`
- Валидный JSON, не проходящий минимальную schema-проверку message update -> `400` + `{ "ok": false, "error": "invalid_payload" }`
- Валидный message update с `/start` или `/start <payload>` -> `200` + `{ "ok": true }`
- Валидный message update без `/start` -> `200` + `{ "ok": true }`
- Ошибка во время `bot.handleUpdate()` или любого исходящего Telegram API вызова из обработчика -> `500` + `{ "ok": false, "error": "processing_failed" }`
- Любой HTTP method, кроме `POST` -> `405` + header `Allow: POST`

### Поведение `/start`

- Бот отвечает точным текстом:

```text
Привет! Бот работает. Привязка аккаунта появится в следующих задачах.
```

- `/start <payload>` трактуется так же, как обычный `/start`
- На этом этапе бот не проверяет, привязан ли пользователь к web-аккаунту
- На этом этапе бот не читает и не пишет данные в Supabase

### Telegram Bot API bootstrap

`setup:webhook` должен:
- использовать production `TELEGRAM_WEBHOOK_URL`, переданный через env как полный absolute HTTPS URL до `POST /api/telegram`;
- вызывать `setWebhook` c `allowed_updates: ['message']`;
- вызывать `setMyCommands` c массивом:

```json
[
  {
    "command": "start",
    "description": "Показать приветствие"
  }
]
```

- завершаться с exit code `1`, если любой Telegram API вызов вернул ошибку или сеть недоступна
- не требовать `BOT_MODE`; для script достаточно `TELEGRAM_BOT_TOKEN` и `TELEGRAM_WEBHOOK_URL`

### Polling runtime

Для детерминированной локальной разработки:
- `src/dev.ts` перед `bot.start()` вызывает `deleteWebhook({ drop_pending_updates: false })`
- если `deleteWebhook` завершился ошибкой, процесс завершается с non-zero exit code и polling не стартует

### Явно вне scope этой задачи

- account linking и различение привязанных/непривязанных пользователей
- дедупликация по `update_id`
- хранение каких-либо данных в Supabase
- проверка `x-telegram-bot-api-secret-token` (перенесена в [bot-webhook-hardening.md](./bot-webhook-hardening.md))
- обработка voice updates, callback queries, inline queries и других update types

### Затронутые компоненты

- `apps/bot/src/index.ts`
- `apps/bot/src/bot.ts`
- `apps/bot/src/dev.ts`
- `apps/bot/src/config/env.ts`
- `apps/bot/package.json`
- `apps/bot/.env.example`
- `apps/bot/scripts/setup-webhook.ts` или другой script entrypoint, подключённый через `package.json`
- `apps/bot/__tests__/telegram.spec.ts`
- `apps/bot/__tests__/bot.spec.ts`
- `apps/bot/__tests__/env.spec.ts`
- `apps/bot/README.md`

---

## Scope

- [ ] Передать webhook payload из `src/index.ts` в grammY bot instance
- [ ] Реализовать schema validation для входящего webhook payload в пределах message updates
- [ ] Реализовать обработку `/start` и `/start <payload>`
- [ ] Настроить no-op поведение для валидных message updates без `/start`
- [ ] Обновить `src/dev.ts`, чтобы перед polling выполнялся `deleteWebhook`
- [ ] Зафиксировать в `apps/bot/package.json` scripts `type-check`, `format:check` и `setup:webhook` (если `type-check`/`format:check` отсутствуют после setup-задачи, добавить их в рамках этой задачи)
- [ ] Реализовать script для `setWebhook` и `setMyCommands`
- [ ] Добавить автоматические unit/request-level тесты
- [ ] Обновить `apps/bot/.env.example`, добавив `TELEGRAM_WEBHOOK_URL` как обязательный только для `setup:webhook`
- [ ] Обновить `apps/bot/README.md` с командами, env и процессом локального запуска

### Out of Scope

- `/link` и любая логика account linking
- Дедупликация `update_id`
- Storage, migrations, RLS, Supabase access
- Secret token verification через `x-telegram-bot-api-secret-token`
- Provision production deploy URL или Vercel-проекта

---

## Acceptance Criteria

- [ ] `pnpm --filter bot type-check` завершается с exit code `0`
- [ ] `pnpm --filter bot lint:check` завершается с exit code `0`
- [ ] `pnpm --filter bot format:check` завершается с exit code `0`
- [ ] `pnpm --filter bot test:unit` завершается с exit code `0`
- [ ] Request-level тест для `POST /api/telegram` подтверждает:
  - невалидный JSON -> `400` + `{ "ok": false, "error": "invalid_json" }`
  - `Content-Type`, отличный от `application/json*` -> `400` + `{ "ok": false, "error": "invalid_json" }`
  - валидный JSON без минимальной message schema -> `400` + `{ "ok": false, "error": "invalid_payload" }`
  - валидный `/start` update -> `200` + `{ "ok": true }`
  - валидный message update без `message.text` -> `200` + `{ "ok": true }`
  - валидный text message без `/start` -> `200` + `{ "ok": true }`
  - ошибка внутри `bot.handleUpdate()` -> `500` + `{ "ok": false, "error": "processing_failed" }`
  - `GET` и `PUT` -> `405` + `Allow: POST`
- [ ] Тест с mocked Telegram API подтверждает, что `/start` update приводит ровно к одному вызову `sendMessage` с текстом:

```text
Привет! Бот работает. Привязка аккаунта появится в следующих задачах.
```

- [ ] Тест с mocked Telegram API подтверждает, что text message без `/start` не вызывает `sendMessage`
- [ ] Тест для polling bootstrap подтверждает, что `deleteWebhook({ drop_pending_updates: false })` вызывается до `bot.start()`
- [ ] Тест для `setup:webhook` подтверждает, что script вызывает:
  - `setWebhook` c `TELEGRAM_WEBHOOK_URL`
  - `allowed_updates: ['message']`
  - `setMyCommands` c одной командой `/start` и `description: 'Показать приветствие'`
- [ ] При ошибке Telegram API в `setup:webhook` script завершается с non-zero exit code
- [ ] `apps/bot/.env.example` содержит `TELEGRAM_WEBHOOK_URL` с пометкой, что переменная обязательна только для `setup:webhook` и должна указывать на полный `https://.../api/telegram`
- [ ] `apps/bot/README.md` описывает:
  - обязательные env variables
  - `pnpm --filter bot dev`
  - `pnpm --filter bot setup:webhook`
  - ограничение текущего skeleton только на `/start`

---

## Definition of Done

- [ ] Все пункты Acceptance Criteria выполнены
- [ ] В задаче нет manual steps и ручных проверок
- [ ] В коде отсутствуют side-effects на import вне `src/dev.ts` и script entrypoint для webhook setup
- [ ] Документация `apps/bot/README.md` обновлена вместе с кодом

---

## Тест-план

### Unit Tests

- `loadEnv()` валидирует `BOT_MODE` и `TELEGRAM_BOT_TOKEN`
- отдельная validation-функция для `setup:webhook` валидирует `TELEGRAM_BOT_TOKEN` и `TELEGRAM_WEBHOOK_URL`, при этом не требует `BOT_MODE`
- bot factory регистрирует `/start` handler без network side-effects на import
- polling bootstrap helper вызывает `deleteWebhook` до `bot.start()`
- webhook setup script корректно маппит success/error ответы Telegram API

### Request-Level Tests

- `app.request(new Request(...))` для `/api/telegram` покрывает:
  - invalid JSON
  - invalid content type
  - invalid payload shape
  - `/start`
  - `/start <payload>`
  - message update без `text`
  - обычный text message
  - runtime error внутри `bot.handleUpdate()`
  - `GET`/`PUT`

### Integration-Style Tests with Mocks

- mocked Telegram API подтверждает отправку приветственного сообщения на `/start`
- mocked Telegram API подтверждает отсутствие отправки сообщений на обычный text message
- mocked Telegram API / bot adapter подтверждает `500` + `processing_failed`, если обработка валидного update падает
- mocked Telegram API подтверждает вызовы `setWebhook` и `setMyCommands` из setup script

---

## Edge Cases и обработка ошибок

- `/start <payload>` -> бот отвечает тем же приветствием, payload игнорируется
- Message update без `text` -> `200` + `{ "ok": true }`, без `sendMessage`
- Message update с любым текстом, кроме `/start` -> `200` + `{ "ok": true }`, без `sendMessage`
- `Content-Type: text/plain` или отсутствующий `Content-Type` -> `400` + `invalid_json`
- Валидный JSON без `update_id` или без `message.chat.id`/`message.from.id` -> `400` + `invalid_payload`
- Ошибка во время `bot.handleUpdate()` или `sendMessage` -> `500` + `processing_failed`; Telegram может повторно доставить update, дедупликация по `update_id` остаётся вне scope
- Ошибка Telegram API при `deleteWebhook` в polling runtime -> процесс завершается, polling не запускается
- Ошибка Telegram API при `setWebhook` или `setMyCommands` -> `setup:webhook` завершается с non-zero exit code
