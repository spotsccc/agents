# LLM Conversation Core

> Generic OpenAI-backed conversation runtime for linked users: text handling, short-lived context, pending action lifecycle, and confirmation flow without concrete Google Calendar execution.

---

## Описание

### Проблема

После linking flow бот может идентифицировать пользователя, но всё ещё не имеет reusable conversation runtime:
- текстовые сообщения не отправляются в OpenAI;
- нет краткоживущего conversation context;
- нет generic pending action flow;
- нет подтверждения `да` / `нет` перед выполнением domain actions;
- Google Calendar epic пока некуда подключать tool registry и action executor.

### Цель

Создать generic LLM runtime, который можно переиспользовать для любых downstream инструментов:
- принимает text input от linked пользователя;
- вызывает OpenAI с системным prompt и зарегистрированными tool schemas;
- умеет хранить короткий контекст переписки;
- умеет создавать pending action и ждать подтверждение;
- вызывает injected executor только после подтверждения.

### Кто использует результат

- [bot-voice-processing.md](./bot-voice-processing.md): передаёт сюда транскрибированный текст
- Epic Google Calendar: подключает concrete tool registry и executor

### Связанные задачи

- Требует завершённого [bot-link-command.md](./bot-link-command.md)
- Должна быть завершена до [bot-voice-processing.md](./bot-voice-processing.md)
- Должна быть завершена до `docs/backlog/calendar/google-calendar/calendar-api.md`

---

## Предусловия выполнения (для AI-агента)

- В bot runtime доступны:
  - `TELEGRAM_BOT_TOKEN`
  - `OPENAI_API_KEY`
  - `SUPABASE_URL`
  - `SUPABASE_SERVICE_ROLE_KEY`
- `OPENAI_CHAT_MODEL` может быть задан, но не обязателен: при отсутствии runtime использует `gpt-4o-mini`
- Telegram user уже привязан к `auth.users`
- Access gate из [bot-link-command.md](./bot-link-command.md) уже резолвит linked actor и передаёт в downstream handler `userId`, `telegramUserId` и `telegramChatId`
- Webhook ingress уже hardened задачей [bot-webhook-hardening.md](./bot-webhook-hardening.md), поэтому duplicate delivery одного и того же `update_id` не должна повторно доходить до text runtime
- В LLM runtime попадают только linked `message` updates из `private` chat
- Timezone пользователя для этой задачи читается из `public.user_settings.metadata.timezone`; если значение отсутствует, не является строкой или не проходит валидацию как IANA timezone, runtime использует `UTC`
- Downstream domain tools подключаются через интерфейс registry/executor, а не хардкодятся в runtime

Что не входит в эту задачу:
- конкретные Google Calendar tool schemas
- выполнение Google Calendar API calls
- OAuth и Google token storage

---

## Бизнес-сценарии

### LLM возвращает обычный текстовый ответ

1. Привязанный пользователь отправляет текстовое сообщение
2. Runtime загружает короткий conversation context
3. Runtime вызывает OpenAI
4. OpenAI возвращает assistant text без tool call
5. Бот отправляет этот текст пользователю
6. Контекст обновляется

### LLM возвращает action proposal

1. Пользователь отправляет текстовый запрос, который требует действия
2. OpenAI возвращает tool call из зарегистрированного registry
3. Runtime валидирует tool input через runtime validator из registry
4. Runtime строит `confirmationText` из валидированного input, сохраняет pending action в `bot_conversations`
5. Бот отправляет сообщение-подтверждение:

```text
<confirmationText>

Подтвердите действие. Ответьте "да" или "нет".
```

### Пользователь подтверждает действие

1. Для чата уже существует активный pending action
2. Пользователь отправляет `да`
3. Runtime вызывает injected executor
4. После успешного выполнения pending action очищается
5. Бот отправляет текст, возвращённый executor

### Пользователь отменяет действие

1. Для чата уже существует активный pending action
2. Пользователь отправляет `нет`, `no` или `/cancel`
3. Pending action очищается
4. Бот отвечает:

```text
Действие отменено.
```

### Новый запрос приходит вместо подтверждения

1. Для чата уже существует активный pending action
2. Пользователь отправляет новое сообщение, которое не является `да`, `yes`, `нет`, `no` или `/cancel`
3. Runtime отменяет предыдущий pending action
4. Бот сначала сообщает:

```text
Предыдущее действие отменено.
```

5. Затем обрабатывает новое сообщение как новый запрос

### Pending action истёк по TTL

1. Pending action хранится дольше 10 минут
2. Пользователь отправляет следующее сообщение
3. Runtime сбрасывает pending action
4. Бот сообщает:

```text
Предыдущее действие отменено по таймауту.
```

5. Новое сообщение обрабатывается как новый запрос

### Ошибка OpenAI API

1. OpenAI возвращает ошибку или таймаут
2. Runtime не создаёт pending action
3. Бот отвечает:

```text
Не удалось обработать запрос. Попробуйте ещё раз.
```

### Ошибка conversation storage

1. Runtime не может прочитать или записать `bot_conversations`
2. Runtime не вызывает executor и не оставляет частично записанный pending action
3. Бот отвечает:

```text
Не удалось обработать запрос. Попробуйте ещё раз.
```

### Executor падает после подтверждения

1. Пользователь подтверждает активный pending action
2. Runtime успевает атомарно очистить pending action для этого пользователя
3. Executor выбрасывает необработанную ошибку
4. Бот отвечает:

```text
Не удалось выполнить действие. Попробуйте ещё раз.
```

---

## Технические решения

### Архитектурные решения

- Runtime поддерживает только linked users; access gate уже работает на предыдущем слое
- Concrete tools/executor подставляются через интерфейсы, а не хардкодятся в LLM runtime
- Confirmation flow работает только через message updates:
  - `да`
  - `yes`
  - `нет`
  - `no`
  - `/cancel`
- Callback queries и inline keyboards в scope этой задачи не входят

### OpenAI Configuration

- Используется `OPENAI_CHAT_MODEL`
- Если env не задан, по умолчанию используется `gpt-4o-mini`
- Максимальный размер assistant text response: 500 output tokens

### Runtime Env и зависимости

- `apps/bot/src/config/env.ts` валидирует `OPENAI_API_KEY`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` как обязательные runtime env
- `OPENAI_CHAT_MODEL` остаётся опциональным env с fallback на `gpt-4o-mini`
- `apps/bot/.env.example` и `apps/bot/README.md` обновляются с описанием новых env
- Если в `apps/bot/package.json` ещё нет runtime dependencies для OpenAI и Supabase client, они добавляются в рамках этой задачи

### System Prompt

System prompt должен:
- отвечать на русском языке по умолчанию;
- использовать timezone пользователя из `user_settings.metadata.timezone`, если он доступен и валиден, иначе `UTC`;
- включать текущую дату/время в выбранной timezone;
- не выдумывать факты и недостающие параметры;
- использовать tool call только когда это действительно нужно;
- задавать уточняющий вопрос, если для действия не хватает обязательных данных.

### Граница между Access Gate и Text Runtime

LLM runtime экспортирует единый text entrypoint, который переиспользуется `message.text` handler-ом из этой задачи и voice pipeline из [bot-voice-processing.md](./bot-voice-processing.md):

```ts
type LinkedActor = {
  userId: string
  telegramUserId: number
  telegramChatId: number
}

type TextEntryInput = {
  actor: LinkedActor
  text: string
  source: 'text' | 'voice'
  telegramMessageId: number
  receivedAt: string
}

type TextEntryResult = {
  replyText: string
}

type HandleLinkedText = (
  input: TextEntryInput
) => Promise<TextEntryResult>
```

Требования:
- access gate резолвит linked actor до входа в LLM runtime; runtime не делает повторный lookup linking status;
- обычный текст и voice transcript вызывают один и тот же `HandleLinkedText`;
- runtime не зависит от raw Telegram update shape вне полей `TextEntryInput`.

### Tool Registry и Executor

Runtime работает с двумя абстракциями:

```ts
type ToolDefinition<TInput extends Record<string, unknown> = Record<string, unknown>> = {
  name: string
  description: string
  inputSchema: Record<string, unknown>
  parseInput: (input: unknown) => TInput
  buildConfirmationText: (input: TInput) => string
}

type PendingAction<TInput extends Record<string, unknown> = Record<string, unknown>> = {
  toolName: string
  toolInput: TInput
  confirmationText: string
  sourceText: string
  proposedAt: string
}

type ActionExecutor = (
  action: PendingAction,
  actor: LinkedActor
) => Promise<{ replyText: string }>
```

Требования:
- registry передаёт список tools в OpenAI runtime;
- tool input от OpenAI валидируется через `parseInput` до записи в БД и до вызова executor;
- `confirmationText` строится через `buildConfirmationText(validatedInput)`, а не берётся из свободного текста модели;
- executor вызывается только после подтверждения;
- runtime не знает ничего о Google Calendar implementation details.

### Concurrency и confirm-claim strategy

Чтобы сообщение `да` / `yes` не вызывало executor дважды при конкурентной обработке:
- confirm/cancel/new-request paths работают через транзакцию с `select ... for update` по строке `bot_conversations.user_id`
- при confirm runtime внутри транзакции:
  1. читает conversation row `for update`;
  2. убеждается, что pending action существует и не истёк;
  3. копирует pending action в локальную переменную;
  4. очищает `pending_action` и `pending_action_expires_at`;
  5. commit-ит транзакцию;
  6. только после commit вызывает executor
- если второй concurrent confirm приходит на тот же `user_id`, он ждёт lock и после commit первого request уже не видит активного pending action, поэтому executor второй раз не вызывается
- cancel path и path "новый запрос вместо подтверждения" используют тот же `for update`, чтобы не гоняться с confirm path

Технический компромисс:
- эта задача гарантирует at-most-once executor dispatch при конкурентных confirm-message;
- durable retry executor после process crash между commit и executor call в scope этой задачи не входит;
- если executor падает после commit, pending action остаётся очищенным, а пользователь получает `Не удалось выполнить действие. Попробуйте ещё раз.`

### Conversation Storage

Используется таблица `public.bot_conversations`:

```sql
create table public.bot_conversations (
  user_id uuid primary key references auth.users(id) on delete cascade,
  telegram_chat_id bigint not null unique,
  context jsonb not null default '{"messages":[]}'::jsonb,
  pending_action jsonb,
  pending_action_expires_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
```

Правила хранения:
- миграция включает `alter table public.bot_conversations enable row level security`;
- миграция подключает `public.set_updated_at()` trigger для `updated_at`;
- bot runtime работает через `SUPABASE_SERVICE_ROLE_KEY`; client-facing RLS policies в scope этой задачи не требуются;
- canonical lookup/update key для conversation state: `user_id`;
- `telegram_chat_id` хранит последний private chat id пользователя и обновляется на каждом успешно обработанном сообщении;
- все mutation-paths (`create pending action`, `confirm`, `cancel`, `replace pending action`) используют транзакцию и row lock по `user_id`;
- `context.messages` хранит только plain-text turns формата `role`, `content`, `createdAt`;
- в `context` и `pending_action` нельзя хранить raw Telegram payload, OpenAI response metadata, access tokens или другие секреты;
- в `context.messages` хранится не более 12 последних user/assistant entries;
- после каждого запроса oldest entries обрезаются;
- при чтении conversation с `updated_at` старше 30 минут сбрасывается только `context`, а сама строка сохраняется;
- pending action TTL: 10 минут.

### Подтверждение и нормализация ответов

- Сообщение при создании pending action:

```text
<confirmationText>

Подтвердите действие. Ответьте "да" или "нет".
```

- Подтверждение:
  - `да`
  - `yes`
- Отмена:
  - `нет`
  - `no`
  - `/cancel`
- Сравнение выполняется после `trim().toLowerCase()`

### Затронутые компоненты

- `apps/bot/src/bot.ts`
- `apps/bot/src/index.ts`
- `apps/bot/src/config/env.ts`
- `apps/bot/.env.example`
- `apps/bot/src/llm/*`
- `apps/bot/src/conversations/*`
- `apps/bot/package.json`
- `packages/supabase/migrations/*`
- `packages/supabase/scheme/index.ts`
- `apps/bot/README.md`
- `apps/bot/__tests__/env.spec.ts`
- `apps/bot/__tests__/bot.spec.ts`
- `apps/bot/__tests__/telegram.spec.ts`

---

## Scope

- [ ] Реализовать generic OpenAI client integration
- [ ] Экспортировать единый `HandleLinkedText` entrypoint для text и future voice pipeline
- [ ] Реализовать interfaces для tool registry и action executor
- [ ] Валидировать tool input и строить `confirmationText` на стороне registry/runtime, а не из свободного текста модели
- [ ] Реализовать conversation storage в `bot_conversations`
- [ ] Реализовать pending action lifecycle с TTL 10 минут
- [ ] Реализовать confirmation flow через `да` / `yes` / `нет` / `no` / `/cancel`
- [ ] Реализовать lazy reset для контекста старше 30 минут
- [ ] Добавить миграцию для `public.bot_conversations`, включить RLS и `updated_at` trigger
- [ ] Обновить generated schema types в `packages/supabase/scheme/index.ts`
- [ ] Добавить fail-fast env validation для OpenAI/Supabase runtime env
- [ ] Обновить `apps/bot/.env.example`
- [ ] При необходимости обновить runtime dependencies в `apps/bot/package.json`
- [ ] Добавить автоматические unit/request-level tests
- [ ] Обновить `apps/bot/README.md`

### Out of Scope

- concrete Google Calendar tools
- concrete Google Calendar action execution
- callback query / inline keyboard UX
- pg_cron или другая фоновая очистка

---

## Acceptance Criteria

- [ ] `pnpm --filter bot type-check` завершается с exit code `0`
- [ ] `pnpm --filter bot lint:check` завершается с exit code `0`
- [ ] `pnpm --filter bot format:check` завершается с exit code `0`
- [ ] `pnpm --filter bot test:unit` завершается с exit code `0`
- [ ] `apps/bot/src/config/env.ts` падает с понятной ошибкой, если отсутствует `OPENAI_API_KEY`, `SUPABASE_URL` или `SUPABASE_SERVICE_ROLE_KEY`
- [ ] Если `OPENAI_CHAT_MODEL` не задан, runtime использует `gpt-4o-mini`
- [ ] `apps/bot/.env.example` и `apps/bot/README.md` документируют `OPENAI_API_KEY`, `OPENAI_CHAT_MODEL`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`
- [ ] Если для реализации нужны новые runtime dependencies, они добавлены в `apps/bot/package.json`
- [ ] Локальная миграция создаёт таблицу `public.bot_conversations`, включает RLS и `updated_at` trigger
- [ ] `packages/supabase/scheme/index.ts` содержит типы для `bot_conversations`
- [ ] Runtime экспортирует reusable `HandleLinkedText`, который принимает `{ actor, text, source, telegramMessageId, receivedAt }` и не зависит от raw Telegram update
- [ ] Текстовое сообщение linked пользователя вызывает OpenAI runtime с загруженным context
- [ ] Plain-text ответ OpenAI отправляется пользователю без создания pending action
- [ ] Tool call от OpenAI сначала валидируется через registry parser; неизвестный `toolName` или невалидный payload не создают pending action
- [ ] Валидный tool call от OpenAI создаёт pending action и отправляет пользователю сообщение вида:

```text
<confirmationText>

Подтвердите действие. Ответьте "да" или "нет".
```

- [ ] Сообщение `да` вызывает injected executor ровно один раз и очищает pending action
- [ ] Сообщение `yes` вызывает injected executor ровно один раз и очищает pending action
- [ ] Два параллельных confirm-сообщения для одного и того же pending action приводят максимум к одному вызову executor
- [ ] Сообщение `нет` и команда `/cancel` очищают pending action и отправляют:

```text
Действие отменено.
```

- [ ] Сообщение `no` очищает pending action и отправляет `Действие отменено.`
- [ ] Новый не-confirmation запрос при активном pending action сначала отправляет:

```text
Предыдущее действие отменено.
```

- [ ] Pending action старше 10 минут при следующем сообщении приводит к сообщению:

```text
Предыдущее действие отменено по таймауту.
```

- [ ] Контекст старше 30 минут сбрасывается lazy-механизмом без внешнего cron
- [ ] В `context.messages` хранится не более 12 элементов
- [ ] Ошибка OpenAI API маппится в сообщение:

```text
Не удалось обработать запрос. Попробуйте ещё раз.
```

- [ ] Ошибка чтения или записи `bot_conversations` маппится в сообщение `Не удалось обработать запрос. Попробуйте ещё раз.` и не приводит к вызову executor
- [ ] Необработанная ошибка executor после подтверждения очищает pending action и маппится в сообщение `Не удалось выполнить действие. Попробуйте ещё раз.`

---

## Definition of Done

- [ ] Все пункты Acceptance Criteria выполнены
- [ ] В задаче нет manual steps и ручных проверок
- [ ] Generic runtime не содержит hardcoded Google Calendar logic
- [ ] Confirmation summary строится детерминированно из validated tool input
- [ ] Conversation state изолирован по `user_id` и не зависит от raw Telegram update shape
- [ ] README и backlog описывают интерфейсы registry/executor

---

## Тест-план

### Unit Tests

- env loading
  - обязательные OpenAI/Supabase env присутствуют
  - обязательный env отсутствует -> fail-fast error
  - `OPENAI_CHAT_MODEL` fallback на `gpt-4o-mini`
- context storage
  - создание новой conversation
  - lookup/update по `user_id`
  - trim до 12 messages
  - lazy reset после 30 минут
  - `telegram_chat_id` обновляется на последнее значение
- pending action lifecycle
  - создание
  - confirm
  - cancel
  - TTL expiry
  - confirmation text строится из registry `buildConfirmationText`
  - два параллельных confirm-message не вызывают executor дважды
- нормализация confirmation commands
  - `да`
  - `yes`
  - `нет`
  - `no`
  - `/cancel`
- tool call validation
  - unknown tool
  - invalid payload
  - несколько tool calls -> используется только первый
- storage errors
  - read failure
  - write failure
- executor failure
  - pending action очищается
  - пользователю возвращается generic runtime error

### Request-Level Tests

- linked text message -> OpenAI plain text -> bot reply
- linked text message -> OpenAI tool call -> pending action created
- pending action + `да` -> executor called
- pending action + `yes` -> executor called
- pending action + `нет` -> pending action cleared
- pending action + `no` -> pending action cleared
- pending action + `/cancel` -> pending action cleared
- pending action + новый text request -> old action canceled, new request processed
- conversation storage failure -> bot reply with generic processing error
- executor throw after `да` -> bot reply with execution error

### Integration-Style Tests with Mocks

- mocked OpenAI + fake tool registry + fake executor
- mocked access gate actor -> runtime reusable text entrypoint получает одинаковый contract для text и voice source
- runtime правильно маппит OpenAI errors и не оставляет сломанный pending action
- runtime не сохраняет pending action для unknown tool / invalid tool payload
- два concurrent confirm-request для одного `user_id` приводят максимум к одному вызову fake executor

---

## Edge Cases и обработка ошибок

- OpenAI возвращает tool call с неизвестным `toolName` -> бот отвечает `Не удалось обработать запрос. Попробуйте ещё раз.` и pending action не создаётся
- OpenAI возвращает tool call с payload, который не проходит `parseInput` -> бот отвечает `Не удалось обработать запрос. Попробуйте ещё раз.` и pending action не создаётся
- OpenAI возвращает несколько tool calls сразу -> runtime использует только первый, остальные игнорирует
- Пользователь отправляет `да` без активного pending action -> сообщение трактуется как обычный запрос
- Пользователь отправляет `yes`, `no` или значение с лишними пробелами/регистром -> сравнение проходит через `trim().toLowerCase()`
- Ошибка чтения или записи `bot_conversations` -> бот отвечает `Не удалось обработать запрос. Попробуйте ещё раз.` и request не падает в `500`, если bot runtime способен отправить ответ
- Executor выбрасывает необработанную ошибку после подтверждения -> pending action очищается, пользователю отправляется `Не удалось выполнить действие. Попробуйте ещё раз.`
- В БД нет conversation для первого сообщения -> runtime создаёт новую строку автоматически
- Два concurrent confirm-message приходят почти одновременно -> row lock и pre-execute clear гарантируют не более одного executor call
