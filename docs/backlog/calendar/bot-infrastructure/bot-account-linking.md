# Telegram Account Linking Backend Contracts

> Database schema, RLS, and typed backend contracts for linking a Telegram account to a web account.

---

## Описание

### Проблема

После [bot-telegram-skeleton.md](./bot-telegram-skeleton.md) бот уже может принимать сообщения, но у системы всё ещё нет серверного слоя для привязки Telegram-пользователя к `auth.users(id)`:
- нет таблиц для Telegram mapping и одноразовых linking codes;
- web app не может получить текущий статус привязки;
- web app не может сгенерировать код `/link`;
- bot runtime не может безопасно и атомарно потребить код привязки.

### Цель

Создать backend-контракты и схему данных, которые дадут один источник истины для linking flow:
- web app читает статус привязки;
- web app генерирует одноразовый код;
- bot runtime потребляет код и создаёт связь Telegram <-> web account;
- все операции выполняются без ручных действий и с проверяемыми доменными ошибками.

### Кто использует результат

- [bot-account-linking-web-ui.md](./bot-account-linking-web-ui.md): читает статус и генерирует код
- [bot-link-command.md](./bot-link-command.md): потребляет код из Telegram
- Следующие bot-задачи: lookup `user_id` по Telegram mapping

### Связанные задачи

- Требует завершённого [bot-telegram-skeleton.md](./bot-telegram-skeleton.md)
- Должна быть завершена до [bot-account-linking-web-ui.md](./bot-account-linking-web-ui.md)
- Должна быть завершена до [bot-link-command.md](./bot-link-command.md)

---

## Предусловия выполнения (для AI-агента)

- Локальный Supabase runtime доступен через `pnpm supabase:start`, если для проверки нужны DB/Auth services
- В `packages/supabase` можно добавлять миграции и Edge Functions
- Web client вызывает user-facing контракты только с валидной Supabase session
- Bot runtime вызывает bot-facing контракт с service-role доступом

Что не входит в эту задачу:
- UI в `apps/web`
- grammY handler `/link`
- unlink flow

---

## Бизнес-сценарии

### Чтение статуса привязки: пользователь не привязан

1. Аутентифицированный web client вызывает `getTelegramLinkStatus`
2. Backend не находит запись в `telegram_users`
3. Backend возвращает:
   - `linked = false`
   - `telegramUsername = null`
   - `linkedAt = null`
   - `activeCode = null`, если активного кода нет

### Генерация кода привязки

1. Аутентифицированный web client вызывает `generateTelegramLinkCode`
2. Backend убеждается, что пользователь ещё не привязан
3. Backend отзывает предыдущий незавершённый код пользователя, если он существует
4. Backend создаёт новый одноразовый код со сроком жизни 5 минут
5. Backend возвращает `activeCode`

### Повторная генерация кода

1. У пользователя уже есть незавершённый код
2. Пользователь вызывает `generateTelegramLinkCode` повторно
3. Предыдущий код получает `revoked_at`
4. Новый код становится единственным активным кодом пользователя

### Успешное потребление кода ботом

1. Bot runtime вызывает `consumeTelegramLinkCode` с кодом и Telegram metadata
2. Backend находит активный код
3. Backend атомарно:
   - помечает код как `consumed_at`;
   - создаёт запись в `telegram_users`
4. Backend возвращает успешный результат с `userId`

### Код недействителен

1. Bot runtime вызывает `consumeTelegramLinkCode` с несуществующим, истёкшим, уже consumed или revoked кодом
2. Backend не создаёт запись в `telegram_users`
3. Backend возвращает доменную ошибку:
   - `invalid_code`
   - `expired_code`
   - `code_already_used`

### Telegram или web account уже привязан

1. Поступает consume-запрос для Telegram account, который уже связан с другим `user_id`, либо для `user_id`, уже связанного с другим Telegram
2. Backend не создаёт дубликаты
3. Backend возвращает доменную ошибку:
   - `telegram_already_linked`
   - `account_already_linked`

---

## Технические решения

### Архитектурные решения

- Данные linking flow живут в `packages/supabase/migrations/*`
- Все backend-контракты реализуются как Edge Functions в `packages/supabase/functions/*`
- Контракты экспортируются из `packages/supabase/package.json`
- User-facing функции аутентифицируют `auth.users`
- Bot-facing функция доступна только с service-role ключом
- Каждая новая Edge Function обязана содержать `contract.ts`, `index.ts` и `deno.json`
- После изменения схемы `packages/supabase/scheme/index.ts` регенерируется через `pnpm gen:types` и становится частью deliverable этой задачи
- Отдельный bot-facing lookup function в этой задаче не добавляется; следующие bot-задачи используют таблицу `telegram_users` через service-role доступ и сгенерированные schema types

### Database Schema

```sql
create table telegram_users (
  user_id uuid primary key references auth.users(id) on delete cascade,
  telegram_chat_id bigint not null unique,
  telegram_user_id bigint not null unique,
  telegram_username text,
  linked_at timestamptz not null default now()
);

create table linking_codes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  code text not null unique,
  expires_at timestamptz not null,
  consumed_at timestamptz,
  revoked_at timestamptz,
  created_at timestamptz not null default now()
);

create index linking_codes_user_created_idx
  on linking_codes (user_id, created_at desc);
```

Доменные инварианты:
- один web account может быть привязан только к одному Telegram account;
- один Telegram account может быть привязан только к одному web account;
- активный linking code определяется как запись, у которой:
  - `consumed_at is null`
  - `revoked_at is null`
  - `expires_at > now()`

### Стратегия конкурентности

#### `generate-telegram-link-code`

- `generate-telegram-link-code` выполняется в одной транзакции
- В начале транзакции функция сериализует операции для конкретного пользователя, блокируя строку `auth.users(id)` через `for update` или эквивалентный per-user transaction lock
- После получения lock функция отзывает все незавершённые коды пользователя (`consumed_at is null` и `revoked_at is null`), включая уже истёкшие
- Затем создаётся новый код
- Инвариант после commit: у пользователя не остаётся более одной незавершённой записи в `linking_codes`

#### `consume-telegram-link-code`

- строка linking code блокируется `for update`
- consume и создание `telegram_users` выполняются в одной транзакции
- конкурентные consume-запросы не должны создавать дубликаты

### Формат кода привязки

- Длина: 8 символов
- Алфавит: `ABCDEFGHJKLMNPQRSTUVWXYZ23456789`
- Регистр: верхний
- Генерация: криптографически стойкий random source
- Перед созданием нового кода backend отзывает все незавершённые коды пользователя

### RLS Policies

- `telegram_users`
  - authenticated user может читать только строку со своим `user_id`
  - direct insert/update/delete от client запрещены
  - service role имеет полный доступ
- `linking_codes`
  - authenticated user может читать только свои строки
  - direct client insert/update/delete запрещены
  - service role имеет полный доступ

### Backend Contracts

#### Common HTTP behavior

Для всех трёх Edge Functions:
- поддерживается только `POST`
- любой другой HTTP method -> `405` + header `Allow: POST`
- `Content-Type`, не начинающийся с `application/json` -> `400` + `{ "error": "invalid_json" }`
- невалидный JSON body -> `400` + `{ "error": "invalid_json" }`
- валидный JSON, не проходящий request schema validation -> `400` + `{ "error": "invalid_payload" }`
- неожиданные internal errors -> `500` + `{ "error": "internal_error" }`

Приоритет ошибок:
1. method
2. `Content-Type`
3. JSON parsing
4. request schema validation
5. auth/authorization
6. domain logic

#### `get-telegram-link-status`

Расположение:
- `packages/supabase/functions/get-telegram-link-status/`

Аутентификация:
- обязательный user session

Request:

```ts
type GetTelegramLinkStatusRequest = Record<string, never>
```

Auth errors:

```ts
type AuthError =
  | { error: 'Missing authorization header' }
  | { error: 'Unauthorized' }
```

Поведение auth:
- отсутствует `Authorization` header -> `401` + `{ "error": "Missing authorization header" }`
- `Authorization` header есть, но session невалидна или истекла -> `401` + `{ "error": "Unauthorized" }`

Response `200`:

```ts
type TelegramLinkStatus = {
  linked: boolean
  telegramUsername: string | null
  linkedAt: string | null
  activeCode: {
    code: string
    expiresAt: string
  } | null
}
```

Поведение:
- если пользователь привязан, `linked = true` и `activeCode = null`
- если пользователь не привязан, но есть активный код, он возвращается в `activeCode`
- истёкшие или revoked-коды не возвращаются
- body должен быть пустым объектом `{}`; массив, `null`, строка или объект с неожиданными полями считаются `invalid_payload`

#### `generate-telegram-link-code`

Расположение:
- `packages/supabase/functions/generate-telegram-link-code/`

Аутентификация:
- обязательный user session

Request:

```ts
type GenerateTelegramLinkCodeRequest = Record<string, never>
```

Auth errors:

```ts
type AuthError =
  | { error: 'Missing authorization header' }
  | { error: 'Unauthorized' }
```

Поведение auth:
- отсутствует `Authorization` header -> `401` + `{ "error": "Missing authorization header" }`
- `Authorization` header есть, но session невалидна или истекла -> `401` + `{ "error": "Unauthorized" }`

Response `200`:

```ts
type GenerateTelegramLinkCodeResponse = {
  activeCode: {
    code: string
    expiresAt: string
  }
}
```

Domain error `409`:

```ts
type GenerateTelegramLinkCodeError = {
  error: 'already_linked'
}
```

Поведение:
- если пользователь уже привязан, новый код не создаётся
- при успехе всегда возвращается ровно один активный код
- два параллельных generate-вызова для одного пользователя не должны оставлять больше одной незавершённой записи в `linking_codes`
- body должен быть пустым объектом `{}`; массив, `null`, строка или объект с неожиданными полями считаются `invalid_payload`

#### `consume-telegram-link-code`

Расположение:
- `packages/supabase/functions/consume-telegram-link-code/`

Аутентификация:
- только service role

Auth errors:

```ts
type ConsumeTelegramLinkCodeAuthError =
  | { error: 'Missing authorization header' }
  | { error: 'Forbidden' }
```

Поведение auth:
- функция принимает только `Authorization: Bearer <SUPABASE_SERVICE_ROLE_KEY>`
- отсутствует `Authorization` header -> `401` + `{ "error": "Missing authorization header" }`
- передан любой bearer token, отличный от service-role ключа -> `403` + `{ "error": "Forbidden" }`

Request:

```ts
type ConsumeTelegramLinkCodeRequest = {
  code: string
  telegramChatId: number
  telegramUserId: number
  telegramUsername: string | null
}
```

Success `200`:

```ts
type ConsumeTelegramLinkCodeResponse = {
  userId: string
}
```

Domain error `409`:

```ts
type ConsumeTelegramLinkCodeError = {
  error:
    | 'invalid_code'
    | 'expired_code'
    | 'code_already_used'
    | 'telegram_already_linked'
    | 'account_already_linked'
}
```

Request validation:
- `code` обязателен, должен быть строкой длиной `8`
- `telegramChatId` обязателен, должен быть `number`
- `telegramUserId` обязателен, должен быть `number`
- `telegramUsername` обязателен и должен быть либо `string`, либо `null`
- лишние поля в body считаются `invalid_payload`

### Затронутые компоненты

- `packages/supabase/migrations/*`
- `packages/supabase/functions/get-telegram-link-status/deno.json`
- `packages/supabase/functions/get-telegram-link-status/contract.ts`
- `packages/supabase/functions/get-telegram-link-status/index.ts`
- `packages/supabase/functions/generate-telegram-link-code/deno.json`
- `packages/supabase/functions/generate-telegram-link-code/contract.ts`
- `packages/supabase/functions/generate-telegram-link-code/index.ts`
- `packages/supabase/functions/consume-telegram-link-code/deno.json`
- `packages/supabase/functions/consume-telegram-link-code/contract.ts`
- `packages/supabase/functions/consume-telegram-link-code/index.ts`
- `packages/supabase/package.json`
- `packages/supabase/config.toml`, если функциям нужна локальная конфигурация
- `packages/supabase/scheme/index.ts`

---

## Scope

- [ ] Добавить миграцию для `telegram_users`
- [ ] Добавить миграцию для `linking_codes`
- [ ] Настроить RLS policies для обеих таблиц
- [ ] Реализовать Edge Function `get-telegram-link-status`
- [ ] Реализовать Edge Function `generate-telegram-link-code`
- [ ] Реализовать Edge Function `consume-telegram-link-code`
- [ ] Добавить `deno.json` для всех трёх новых Edge Functions
- [ ] Реализовать auth/authorization checks и documented HTTP error mapping для всех трёх функций
- [ ] Реализовать сериализацию конкурентных `generate`-запросов для одного пользователя
- [ ] Экспортировать контракты из `packages/supabase/package.json`
- [ ] Регенерировать `packages/supabase/scheme/index.ts` через `pnpm gen:types`
- [ ] Добавить автоматические tests для happy path, auth, RLS, concurrency и доменных ошибок

### Out of Scope

- grammY команда `/link`
- UI в `apps/web`
- rate limiting для попыток `/link`
- unlink flow

---

## Acceptance Criteria

- [ ] `pnpm --filter supabase type-check` завершается с exit code `0`
- [ ] `pnpm --filter supabase lint:check` завершается с exit code `0`
- [ ] `pnpm --filter supabase format:check` завершается с exit code `0`
- [ ] `pnpm --filter supabase test:unit` завершается с exit code `0`
- [ ] `pnpm --filter supabase gen:types` завершается с exit code `0`
- [ ] `pnpm --filter supabase db:push` завершается с exit code `0` при запущенном локальном Supabase runtime
- [ ] В `packages/supabase/scheme/index.ts` присутствуют таблицы `telegram_users` и `linking_codes`
- [ ] Для `get-telegram-link-status`, `generate-telegram-link-code` и `consume-telegram-link-code` в репозитории существуют `contract.ts`, `index.ts` и `deno.json`
- [ ] `get-telegram-link-status` для непривязанного пользователя без активного кода возвращает:
  - `linked = false`
  - `telegramUsername = null`
  - `linkedAt = null`
  - `activeCode = null`
- [ ] `get-telegram-link-status` на `GET` возвращает `405` + `Allow: POST`
- [ ] `get-telegram-link-status` с невалидным JSON возвращает `400` + `invalid_json`
- [ ] `get-telegram-link-status` с невалидным body возвращает `400` + `invalid_payload`
- [ ] `get-telegram-link-status` для привязанного пользователя возвращает:
  - `linked = true`
  - `telegramUsername` равен сохранённому username или `null`
  - `linkedAt` содержит timestamp привязки
  - `activeCode = null`
- [ ] `get-telegram-link-status` без `Authorization` header возвращает `401` + `Missing authorization header`
- [ ] `get-telegram-link-status` с невалидной или истёкшей user session возвращает `401` + `Unauthorized`
- [ ] `generate-telegram-link-code` создаёт код длиной 8 символов из алфавита `ABCDEFGHJKLMNPQRSTUVWXYZ23456789`
- [ ] Повторный вызов `generate-telegram-link-code` отзывает предыдущий незавершённый код и возвращает новый
- [ ] `generate-telegram-link-code` на `GET` возвращает `405` + `Allow: POST`
- [ ] `generate-telegram-link-code` с невалидным JSON возвращает `400` + `invalid_json`
- [ ] `generate-telegram-link-code` с невалидным body возвращает `400` + `invalid_payload`
- [ ] `generate-telegram-link-code` без `Authorization` header возвращает `401` + `Missing authorization header`
- [ ] `generate-telegram-link-code` с невалидной или истёкшей user session возвращает `401` + `Unauthorized`
- [ ] `get-telegram-link-status` возвращает только один активный код
- [ ] Два параллельных вызова `generate-telegram-link-code` для одного пользователя не оставляют больше одной незавершённой записи в `linking_codes`; только один из возвращённых кодов затем может быть успешно consumed
- [ ] `consume-telegram-link-code` с валидным кодом создаёт запись в `telegram_users` и помечает код как consumed
- [ ] `consume-telegram-link-code` на `GET` возвращает `405` + `Allow: POST`
- [ ] `consume-telegram-link-code` с невалидным JSON возвращает `400` + `invalid_json`
- [ ] `consume-telegram-link-code` с невалидным body возвращает `400` + `invalid_payload`
- [ ] `consume-telegram-link-code` без `Authorization` header возвращает `401` + `Missing authorization header`
- [ ] `consume-telegram-link-code` с bearer token, отличным от `SUPABASE_SERVICE_ROLE_KEY`, возвращает `403` + `Forbidden`
- [ ] Повторное consume того же кода возвращает `409` + `code_already_used`
- [ ] Consume истёкшего кода возвращает `409` + `expired_code`
- [ ] Consume для уже привязанного Telegram возвращает `409` + `telegram_already_linked`
- [ ] Consume для уже привязанного web account возвращает `409` + `account_already_linked`
- [ ] Контракты трёх функций экспортированы из `packages/supabase/package.json` в `exports` и `typesVersions`

---

## Definition of Done

- [ ] Все пункты Acceptance Criteria выполнены
- [ ] В задаче нет manual steps и ручных проверок
- [ ] Доменные ошибки и auth/authorization ошибки consume/generate/status покрыты автоматическими тестами
- [ ] Для каждой новой Edge Function созданы `contract.ts`, `index.ts` и `deno.json`
- [ ] `packages/supabase/scheme/index.ts` регенерирован после миграций
- [ ] Документация backlog, `package.json` exports и generated schema types синхронизированы

---

## Тест-план

### Backend / Function Tests

- `get-telegram-link-status`
  - непривязанный пользователь без кода
  - непривязанный пользователь с активным кодом
  - привязанный пользователь
  - `GET` -> `405`
  - invalid JSON -> `400 invalid_json`
  - invalid body -> `400 invalid_payload`
  - отсутствие `Authorization` header
  - невалидная или истёкшая user session
- `generate-telegram-link-code`
  - создание первого кода
  - повторная генерация с отзывом предыдущего кода
  - отказ для уже привязанного пользователя
  - `GET` -> `405`
  - invalid JSON -> `400 invalid_json`
  - invalid body -> `400 invalid_payload`
  - отсутствие `Authorization` header
  - невалидная или истёкшая user session
- `consume-telegram-link-code`
  - happy path
  - invalid code
  - expired code
  - consumed code
  - already linked Telegram
  - already linked account
  - `GET` -> `405`
  - invalid JSON -> `400 invalid_json`
  - invalid body -> `400 invalid_payload`
  - отсутствие `Authorization` header
  - bearer token без service-role прав

### Database / RLS Tests

- authenticated user не читает чужой `telegram_users`
- authenticated user не читает чужие `linking_codes`
- direct client insert в `telegram_users` и `linking_codes` запрещён
- service role имеет доступ, достаточный для consume flow
- `pnpm gen:types` после миграций включает новые таблицы в `scheme/index.ts`

### Concurrency Tests

- два параллельных consume-запроса с одним кодом приводят ровно к одной успешной привязке
- параллельные generate-запросы для одного пользователя оставляют ровно один незавершённый код

---

## Edge Cases и обработка ошибок

- Пользователь уже привязан -> `generate-telegram-link-code` возвращает `already_linked`
- `telegram_username` отсутствует -> consume всё равно создаёт привязку с `telegram_username = null`
- Код введён в нижнем регистре -> backend нормализует в upper-case перед lookup
- Отсутствует `Authorization` header в user-facing function -> `401` + `Missing authorization header`
- `consume-telegram-link-code` вызван не service-role токеном -> `403` + `Forbidden`
- `GET` или другой не-`POST` method -> `405` + `Allow: POST`
- `Content-Type`, отличный от `application/json*`, или невалидный JSON -> `400` + `invalid_json`
- body не соответствует documented request schema -> `400` + `invalid_payload`
- У пользователя было несколько старых истёкших кодов -> status игнорирует их
- При новом generate истёкшие, но ещё не revoked коды тоже переводятся в завершённое состояние и не мешают созданию нового кода
- Два Telegram account пытаются использовать один и тот же код одновременно -> выигрывает только один consume
