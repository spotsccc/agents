# Telegram Webhook Hardening

> Production webhook verification, durable idempotency for `update_id`, and deterministic failure behavior before stateful bot features go live.

---

## Описание

### Проблема

После [bot-telegram-skeleton.md](./bot-telegram-skeleton.md) webhook уже умеет принимать и передавать message updates в grammY, но ingress всё ещё не является production-safe:
- endpoint не проверяет `x-telegram-bot-api-secret-token`;
- повторная доставка одного и того же `update_id` может повторно запускать stateful handlers;
- `/link`, LLM runtime и voice pipeline пока не имеют гарантированно безопасного ingress-слоя.

### Цель

Подготовить production webhook к stateful bot-фичам:
- принимать updates только с корректным Telegram webhook secret;
- идемпотентно обрабатывать `update_id` через durable storage;
- детерминированно завершать request при ошибках verification или idempotency storage;
- расширить `setup:webhook`, чтобы webhook secret настраивался автоматически, а не вручную.

### Кто использует результат

- [bot-link-command.md](./bot-link-command.md): безопасный `/link` flow без повторного consume одного update
- [bot-llm-integration.md](./bot-llm-integration.md): защита от duplicate execution для text runtime
- [bot-voice-processing.md](./bot-voice-processing.md): защита от duplicate transcription/execution при retry webhook delivery

### Связанные задачи

- Требует завершённого [bot-telegram-skeleton.md](./bot-telegram-skeleton.md)
- Может выполняться параллельно с [bot-account-linking.md](./bot-account-linking.md)
- Должна быть завершена до [bot-link-command.md](./bot-link-command.md)

---

## Предусловия выполнения (для AI-агента)

- Внешний provider bootstrap уже выполнен: см. [external-bot-bootstrap.md](./external-bot-bootstrap.md)
- В окружении доступны:
  - `BOT_MODE`
  - `TELEGRAM_BOT_TOKEN`
  - `TELEGRAM_WEBHOOK_URL`
  - `TELEGRAM_WEBHOOK_SECRET`
  - `SUPABASE_URL`
  - `SUPABASE_SERVICE_ROLE_KEY`
- `apps/bot` уже содержит работающий skeleton webhook handler и `setup:webhook`
- В `packages/supabase` можно добавлять миграции и регенерировать schema types

Что не входит в эту задачу:
- account linking
- LLM runtime
- voice transcription
- бизнес-логика конкретных Telegram команд, кроме hardening существующего ingress

---

## Бизнес-сценарии

### Валидный production webhook request

1. Telegram отправляет `POST /api/telegram` с корректным `x-telegram-bot-api-secret-token`
2. `update_id` ещё не был обработан
3. Endpoint резервирует `update_id` в durable storage
4. Update передаётся в grammY runtime
5. После успешной обработки запись помечается как `processed`
6. Endpoint возвращает `200` + `{ "ok": true }`

### Request с отсутствующим или неверным secret token

1. На `POST /api/telegram` приходит request без `x-telegram-bot-api-secret-token` или с неверным значением
2. Endpoint не парсит JSON body и не обращается к idempotency storage
3. Endpoint возвращает `401` + `{ "ok": false, "error": "invalid_secret" }`

### Повторная доставка уже обработанного update

1. Telegram повторно доставляет тот же `update_id`
2. Idempotency storage показывает, что update уже имеет статус `processed`
3. Endpoint не вызывает grammY повторно
4. Endpoint возвращает `200` + `{ "ok": true }`

### Retry во время ещё незавершённой обработки

1. Первый request уже зарезервировал `update_id` и находится в статусе `processing`
2. Telegram или proxy повторно доставляет тот же update до завершения первой обработки
3. Endpoint распознаёт свежую активную reservation
4. Endpoint не вызывает grammY повторно и возвращает `200` + `{ "ok": true }`

### Ошибка обработки после резервирования update

1. Endpoint успешно резервирует `update_id`
2. Во время `bot.handleUpdate()` возникает ошибка
3. Endpoint освобождает reservation для текущего update, чтобы retry мог обработать его повторно
4. Endpoint возвращает `500` + `{ "ok": false, "error": "processing_failed" }`

### Idempotency storage временно недоступен

1. Endpoint не может прочитать или обновить `telegram_processed_updates`
2. Update не передаётся в grammY
3. Endpoint возвращает `503` + `{ "ok": false, "error": "idempotency_unavailable" }`

### Автоматическая настройка webhook

1. Агент запускает `pnpm --filter bot setup:webhook`
2. Скрипт валидирует `TELEGRAM_BOT_TOKEN`, `TELEGRAM_WEBHOOK_URL`, `TELEGRAM_WEBHOOK_SECRET`
3. Скрипт вызывает `setWebhook` с `secret_token`
4. Любой non-OK ответ Telegram API завершает скрипт с non-zero exit code

---

## Технические решения

### Архитектурные решения

- Hardening расширяет существующий `apps/bot/src/index.ts`, а не создаёт второй webhook endpoint
- Verification по `x-telegram-bot-api-secret-token` применяется только в `BOT_MODE=webhook`
- Local polling через `src/dev.ts` не использует webhook secret и не зависит от idempotency storage
- Durable idempotency реализуется через PostgreSQL в `packages/supabase`, а не через in-memory cache
- `setup:webhook` обновляется так, чтобы `secret_token` настраивался автоматически вместе с webhook URL

### Runtime env

- `apps/bot/src/config/env.ts` валидирует:
  - `BOT_MODE`
  - `TELEGRAM_BOT_TOKEN`
  - `TELEGRAM_WEBHOOK_SECRET` как обязательный env для `BOT_MODE=webhook`
  - `SUPABASE_URL` и `SUPABASE_SERVICE_ROLE_KEY` как обязательные env для `BOT_MODE=webhook`, где реально работает webhook idempotency runtime
- Для `setup:webhook` обязательны:
  - `TELEGRAM_BOT_TOKEN`
  - `TELEGRAM_WEBHOOK_URL`
  - `TELEGRAM_WEBHOOK_SECRET`

### HTTP-контракт hardening-версии

Endpoint: `POST /api/telegram`

- любой метод, кроме `POST` -> `405` + header `Allow: POST`
- отсутствует или неверен `x-telegram-bot-api-secret-token` в `BOT_MODE=webhook` -> `401` + `{ "ok": false, "error": "invalid_secret" }`
- `Content-Type`, не начинающийся с `application/json` -> `400` + `{ "ok": false, "error": "invalid_json" }`
- невалидный JSON -> `400` + `{ "ok": false, "error": "invalid_json" }`
- валидный JSON, не проходящий skeleton-level schema validation -> `400` + `{ "ok": false, "error": "invalid_payload" }`
- idempotency storage недоступен -> `503` + `{ "ok": false, "error": "idempotency_unavailable" }`
- новый валидный update -> `200` + `{ "ok": true }`
- duplicate/in-flight duplicate update -> `200` + `{ "ok": true }`
- ошибка во время `bot.handleUpdate()` после успешного reserve -> `500` + `{ "ok": false, "error": "processing_failed" }`

Требования к порядку обработки:
1. проверить HTTP method;
2. проверить webhook secret;
3. проверить `Content-Type`;
4. распарсить JSON;
5. провалидировать skeleton-level payload schema;
6. зарезервировать `update_id`;
7. вызвать grammY;
8. завершить reservation как `processed` или освободить её при ошибке.

### Durable idempotency storage

Используется таблица `public.telegram_processed_updates`:

```sql
create table public.telegram_processed_updates (
  update_id bigint primary key,
  status text not null check (status in ('processing', 'processed')),
  reservation_token uuid not null,
  reserved_at timestamptz not null default now(),
  processed_at timestamptz,
  created_at timestamptz not null default now()
);

create index telegram_processed_updates_status_reserved_idx
  on public.telegram_processed_updates (status, reserved_at);
```

Правила:
- `update_id` является каноническим idempotency key
- новый request сначала пытается создать reservation со статусом `processing`
- если запись уже существует со статусом `processed`, update считается duplicate
- если запись существует со статусом `processing` и `reserved_at` моложе 5 минут, update считается in-flight duplicate
- если запись существует со статусом `processing` и `reserved_at` старше 5 минут, request может atomically takeover reservation новым `reservation_token`
- после успешного `bot.handleUpdate()` текущий request переводит запись в `processed`
- если `bot.handleUpdate()` падает, текущий request удаляет reservation только если `reservation_token` всё ещё совпадает с его токеном

Технический компромисс:
- задача обеспечивает at-most-once dispatch при concurrent/retried webhook delivery;
- фоновая очистка старых `processed` записей не входит в scope этого эпика.

### Telegram Bot API bootstrap

`setup:webhook` должен вызывать:

```json
{
  "url": "https://<host>/api/telegram",
  "allowed_updates": ["message"],
  "secret_token": "<TELEGRAM_WEBHOOK_SECRET>"
}
```

Команда `/start` и command menu из skeleton-задачи сохраняются без изменений.

### Затронутые компоненты

- `apps/bot/src/index.ts`
- `apps/bot/src/config/env.ts`
- `apps/bot/src/dev.ts`, если helper-код env/shared transport меняется
- `apps/bot/scripts/setup-webhook.ts`
- `apps/bot/package.json`
- `apps/bot/.env.example`
- `apps/bot/README.md`
- `apps/bot/__tests__/env.spec.ts`
- `apps/bot/__tests__/telegram.spec.ts`
- `packages/supabase/migrations/*`
- `packages/supabase/scheme/index.ts`

---

## Scope

- [ ] Добавить verification `x-telegram-bot-api-secret-token` для webhook runtime
- [ ] Сделать `TELEGRAM_WEBHOOK_SECRET` обязательным для `BOT_MODE=webhook`
- [ ] Добавить durable idempotency storage для `update_id` в Supabase
- [ ] Реализовать reservation / processed flow с stale-reservation takeover
- [ ] Не вызывать grammY повторно для duplicate или in-flight duplicate updates
- [ ] Освобождать reservation при `processing_failed`, чтобы retry мог переобработать update
- [ ] Обновить `setup:webhook`, чтобы `setWebhook` отправлял `secret_token`
- [ ] Обновить `.env.example` и README
- [ ] Регенерировать `packages/supabase/scheme/index.ts`
- [ ] Добавить автоматические bot/supabase tests

### Out of Scope

- business handlers `/link`, LLM и voice
- rate limiting
- background cleanup старых `processed` receipts
- расширение на другие Telegram update types кроме уже поддержанных skeleton-задачей

---

## Acceptance Criteria

- [ ] `pnpm --filter bot type-check` завершается с exit code `0`
- [ ] `pnpm --filter bot lint:check` завершается с exit code `0`
- [ ] `pnpm --filter bot format:check` завершается с exit code `0`
- [ ] `pnpm --filter bot test:unit` завершается с exit code `0`
- [ ] `pnpm --filter supabase type-check` завершается с exit code `0`
- [ ] `pnpm --filter supabase lint:check` завершается с exit code `0`
- [ ] `pnpm --filter supabase format:check` завершается с exit code `0`
- [ ] `pnpm --filter supabase test:unit` завершается с exit code `0`
- [ ] `pnpm --filter supabase gen:types` завершается с exit code `0`
- [ ] `pnpm --filter supabase db:push` завершается с exit code `0` при запущенном локальном Supabase runtime
- [ ] В `packages/supabase/scheme/index.ts` присутствует таблица `telegram_processed_updates`
- [ ] В `BOT_MODE=webhook` отсутствие `TELEGRAM_WEBHOOK_SECRET` приводит к fail-fast ошибке env validation
- [ ] В `BOT_MODE=polling` отсутствие `TELEGRAM_WEBHOOK_SECRET` не мешает локальному запуску
- [ ] В `BOT_MODE=polling` отсутствие `SUPABASE_URL` и `SUPABASE_SERVICE_ROLE_KEY` не мешает локальному `/start` skeleton flow в рамках этой задачи
- [ ] `POST /api/telegram` без `x-telegram-bot-api-secret-token` возвращает `401` + `{ "ok": false, "error": "invalid_secret" }`
- [ ] `POST /api/telegram` с неверным `x-telegram-bot-api-secret-token` возвращает `401` + `{ "ok": false, "error": "invalid_secret" }`
- [ ] `POST /api/telegram` с корректным secret и новым `update_id` вызывает `bot.handleUpdate()` ровно один раз
- [ ] Повторный `POST /api/telegram` с тем же `update_id` возвращает `200` + `{ "ok": true }` и не вызывает `bot.handleUpdate()` повторно
- [ ] Fresh in-flight duplicate того же `update_id` также не вызывает второй `bot.handleUpdate()`
- [ ] При ошибке idempotency storage endpoint возвращает `503` + `{ "ok": false, "error": "idempotency_unavailable" }` и не вызывает `bot.handleUpdate()`
- [ ] При `processing_failed` reservation для текущего `update_id` освобождается, и следующий retry того же update может быть обработан повторно
- [ ] `setup:webhook` валидирует `TELEGRAM_WEBHOOK_SECRET` и вызывает `setWebhook` с `secret_token`
- [ ] `.env.example` и README документируют `TELEGRAM_WEBHOOK_SECRET`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` и webhook-mode ограничения

---

## Definition of Done

- [ ] Все пункты Acceptance Criteria выполнены
- [ ] В задаче нет manual steps и ручных проверок
- [ ] Production webhook fail-closed при invalid secret или недоступном idempotency storage
- [ ] Duplicate delivery одного `update_id` не приводит к повторному dispatch в grammY
- [ ] `setup:webhook` синхронизирован с runtime hardening requirements

---

## Тест-план

### Unit Tests

- env validation
  - `BOT_MODE=webhook` требует `TELEGRAM_WEBHOOK_SECRET`
  - `BOT_MODE=polling` не требует `TELEGRAM_WEBHOOK_SECRET`
  - `BOT_MODE=polling` не требует `SUPABASE_URL` и `SUPABASE_SERVICE_ROLE_KEY` в рамках hardening-задачи
  - `setup:webhook` требует `TELEGRAM_WEBHOOK_SECRET`
- idempotency helper
  - reserve нового `update_id`
  - duplicate `processed` update
  - duplicate `processing` update
  - stale reservation takeover
  - release reservation после `processing_failed`

### Request-Level Tests

- `POST /api/telegram` без secret -> `401 invalid_secret`
- `POST /api/telegram` с неверным secret -> `401 invalid_secret`
- `POST /api/telegram` с валидным secret и новым update -> `200 ok`
- повторный request с тем же `update_id` -> `200 ok` и без второго dispatch
- in-flight duplicate -> `200 ok` и без второго dispatch
- недоступный idempotency storage -> `503 idempotency_unavailable`
- `bot.handleUpdate()` выбрасывает ошибку -> `500 processing_failed` и reservation release

### Integration-Style Tests with Mocks

- mocked Supabase idempotency storage + mocked grammY bot
- `setup:webhook` вызывает `setWebhook` с `secret_token`
- retry после `processing_failed` повторно доходит до `bot.handleUpdate()`
- stale reservation takeover позволяет обработать update после зависшего предыдущего reservation

---

## Edge Cases и обработка ошибок

- `x-telegram-bot-api-secret-token` отсутствует -> fail-closed, без JSON parsing
- secret указан, но не совпадает -> fail-closed, без JSON parsing
- duplicate update приходит после уже успешной обработки -> `200 ok`, без повторного dispatch
- duplicate update приходит пока первый request ещё в работе -> `200 ok`, без повторного dispatch
- предыдущий worker завис и оставил stale reservation -> следующий retry может takeover-нуть reservation через 5 минут
- idempotency storage временно недоступен -> `503 idempotency_unavailable`, без dispatch
- `bot.handleUpdate()` падает после reserve -> reservation release и `500 processing_failed`
