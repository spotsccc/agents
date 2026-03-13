# Telegram `/link` Command And Access Gate

> grammY command handler for `/link`, mapping backend-domain errors to bot messages, and blocking non-linked users from feature handlers.

---

## Описание

### Проблема

После появления backend-контрактов linking flow всё ещё не завершён: бот не умеет принимать `/link <code>`, не умеет завершать привязку через Telegram и не умеет отделять непривязанных пользователей от будущих feature handlers.

### Цель

Завершить Telegram-side часть linking flow:
- бот обрабатывает `/link <code>` в личном чате;
- бот вызывает backend-контракт `consume-telegram-link-code`;
- непривязанные пользователи получают понятную инструкцию вместо доступа к следующим функциям;
- привязанные пользователи проходят дальше в downstream handlers без повторной блокировки.

### Кто использует результат

- Конечный пользователь Telegram: завершает linking flow
- [bot-llm-integration.md](./bot-llm-integration.md) и [bot-voice-processing.md](./bot-voice-processing.md): получают готовый access gate

### Связанные задачи

- Требует завершённых [bot-telegram-skeleton.md](./bot-telegram-skeleton.md), [bot-webhook-hardening.md](./bot-webhook-hardening.md) и [bot-account-linking.md](./bot-account-linking.md)
- Должна быть завершена до [bot-llm-integration.md](./bot-llm-integration.md)
- Должна быть завершена до [bot-voice-processing.md](./bot-voice-processing.md)

---

## Предусловия выполнения (для AI-агента)

- В `packages/supabase` уже существует контракт `consume-telegram-link-code`
- В `packages/supabase/scheme/index.ts` уже присутствует таблица `telegram_users` после `pnpm gen:types`
- В bot runtime доступны:
  - `SUPABASE_URL`
  - `SUPABASE_SERVICE_ROLE_KEY`
  - `TELEGRAM_BOT_TOKEN`
- Бот работает только в личном чате с пользователем для linking flow
- В рамках текущего bot skeleton до `createBot()` доходят только поддержанные `message` updates; unsupported update types остаются вне scope этой задачи

Что не входит в эту задачу:
- web UI генерации кода
- unlink flow
- LLM и voice handlers

---

## Бизнес-сценарии

### Успешная привязка через `/link`

1. Непривязанный пользователь открывает личный чат с ботом
2. Отправляет `/link ABCD2345`
3. Бот вызывает `consume-telegram-link-code`
4. Backend подтверждает привязку
5. Бот отвечает точным сообщением:

```text
Аккаунт привязан. Теперь можно отправлять команды боту.
```

### `/link` без кода

1. Пользователь отправляет `/link`
2. Бот не вызывает backend
3. Бот отвечает:

```text
Используйте команду /link <код> из настроек приложения.
```

### Неверный или уже использованный код

1. Пользователь отправляет `/link` с невалидным, revoked или already-used кодом
2. Backend возвращает доменную ошибку
3. Бот отвечает:

```text
Код недействителен. Сгенерируйте новый код в настройках приложения.
```

### Истёкший код

1. Пользователь отправляет `/link` с истёкшим кодом
2. Backend возвращает `expired_code`
3. Бот отвечает:

```text
Код истёк. Сгенерируйте новый код в настройках приложения.
```

### Telegram уже привязан

1. Пользователь уже завершил linking ранее
2. Пользователь повторно отправляет `/link`
3. Бот отвечает:

```text
Этот Telegram уже привязан к аккаунту.
```

### Непривязанный пользователь пишет обычное сообщение

1. Непривязанный пользователь отправляет обычный текст, voice message или любую команду, кроме `/start` и `/link`
2. Бот не передаёт update в downstream feature handlers
3. Бот отвечает:

```text
Сначала привяжите аккаунт. Откройте настройки приложения и отправьте сюда команду /link <код>.
```

### Привязанный пользователь пишет обычное сообщение

1. Пользователь уже привязан
2. Бот получает обычное сообщение
3. Access gate пропускает update в следующий handler без дополнительного сообщения

### `/link` в групповом чате

1. Команда `/link` приходит не из `private` chat
2. Бот не вызывает backend
3. Бот отвечает:

```text
Привязка доступна только в личном чате с ботом.
```

---

## Технические решения

### Архитектурные решения

- `/link` регистрируется в `createBot()` рядом с `/start`
- Access gate реализуется как middleware до voice/LLM handlers
- Для вызова `consume-telegram-link-code` используется typed bot-side adapter поверх контракта из `supabase/consume-telegram-link-code`
- Access gate не вызывает `get-telegram-link-status`; lookup выполняется напрямую по таблице `telegram_users` через service-role Supabase client и generated schema types из `supabase/scheme`
- Канонический ключ lookup в этой задаче: `telegram_user_id = message.from.id`
- `telegram_chat_id` хранится в схеме для будущих сценариев, но не используется как основной lookup key для access gate текущей задачи

### Runtime env и bot-side adapters

- `apps/bot/src/config/env.ts` валидирует `SUPABASE_URL` и `SUPABASE_SERVICE_ROLE_KEY` как обязательные переменные для linking/access gate runtime
- `apps/bot/.env.example` и `apps/bot/README.md` обновляются с описанием `SUPABASE_URL` и `SUPABASE_SERVICE_ROLE_KEY`
- `apps/bot/src/linking/*` содержит:
  - bot-side adapter для `consume-telegram-link-code`
  - Supabase client / helper для lookup в `telegram_users`
  - parser/normalizer для `/link`

### Обработка `/link`

- Поддерживаемая форма команды:
  - `/link <code>`
  - `/link    <code>`
- Код нормализуется:
  - trim
  - upper-case
- `/link <code>` разрешён только в `private` chat
- `/link CODE extra` считается невалидным payload и приводит к usage message без backend вызова

### Mapping доменных ошибок в bot UX

| Backend error | Bot response |
|---|---|
| `invalid_code` | `Код недействителен. Сгенерируйте новый код в настройках приложения.` |
| `code_already_used` | `Код недействителен. Сгенерируйте новый код в настройках приложения.` |
| `account_already_linked` | `Код недействителен. Сгенерируйте новый код в настройках приложения.` |
| `expired_code` | `Код истёк. Сгенерируйте новый код в настройках приложения.` |
| `telegram_already_linked` | `Этот Telegram уже привязан к аккаунту.` |

Если `consume-telegram-link-code` завершился integration error (network/relay/5xx) или service-role auth error (`401`/`403`), бот отвечает:

```text
Не удалось завершить привязку. Попробуйте ещё раз.
```

и не отправляет misleading success message.

### Access Gate

- До появления feature handlers gate пропускает только:
  - `/start`
  - `/link`
- Gate применяется только к `message` updates, которые уже прошли skeleton-level webhook validation
- Для остальных поддержанных `message` updates непривязанный пользователь получает инструкцию по привязке
- Привязанный пользователь не получает служебного ответа и передаётся дальше по pipeline

### Канонический downstream contract

Access gate обязан резолвить и передавать downstream handler-ам единый linked actor contract:

```ts
type LinkedActor = {
  userId: string
  telegramUserId: number
  telegramChatId: number
}
```

Требования:
- `userId` берётся из `telegram_users.user_id`
- `telegramUserId` берётся из `message.from.id`
- `telegramChatId` берётся из текущего `message.chat.id`
- middleware сохраняет actor в каноническом bot-runtime state, который затем читают [bot-llm-integration.md](./bot-llm-integration.md) и [bot-voice-processing.md](./bot-voice-processing.md)
- access gate не должен заставлять downstream handlers повторно делать lookup в `telegram_users`

### Lookup привязки

- Lookup выполняется на каждый incoming update
- Кэш не используется
- Lookup читает `telegram_users` по `telegram_user_id = message.from.id`
- Если backend lookup временно недоступен, bot отвечает нейтральной ошибкой:

```text
Не удалось проверить статус привязки. Попробуйте ещё раз.
```

- При lookup failure downstream handler не вызывается
- Lookup integration/auth errors обрабатываются in-band: бот отправляет нейтральную ошибку и request не должен падать в `500`, если только не сломан сам bot runtime до отправки ответа

### Затронутые компоненты

- `apps/bot/src/bot.ts`
- `apps/bot/src/index.ts`
- `apps/bot/src/config/env.ts`
- `apps/bot/.env.example`
- `apps/bot/src/linking/*`
- `apps/bot/package.json`
- `apps/bot/README.md`
- `apps/bot/__tests__/env.spec.ts`
- `apps/bot/__tests__/bot.spec.ts`
- `apps/bot/__tests__/telegram.spec.ts`

---

## Scope

- [ ] Реализовать grammY handler `/link`
- [ ] Реализовать parser и нормализацию кода
- [ ] Интегрировать bot runtime с контрактом `consume-telegram-link-code`
- [ ] Реализовать bot-side adapter для `consume-telegram-link-code`
- [ ] Реализовать lookup linking status для access gate через direct service-role query к `telegram_users`
- [ ] Реализовать middleware, блокирующий непривязанных пользователей
- [ ] Добавить fail-fast env validation для `SUPABASE_URL` и `SUPABASE_SERVICE_ROLE_KEY`
- [ ] Обновить `apps/bot/.env.example`
- [ ] Добавить автоматические unit/request-level tests
- [ ] Обновить `apps/bot/README.md`

### Out of Scope

- web UI генерации кода
- unlink flow
- feature handlers после access gate
- rate limiting попыток `/link`

---

## Acceptance Criteria

- [ ] `pnpm --filter bot type-check` завершается с exit code `0`
- [ ] `pnpm --filter bot lint:check` завершается с exit code `0`
- [ ] `pnpm --filter bot format:check` завершается с exit code `0`
- [ ] `pnpm --filter bot test:unit` завершается с exit code `0`
- [ ] `/link <valid-code>` приводит ровно к одному вызову `consume-telegram-link-code`
- [ ] Код из `/link abc12345` нормализуется в upper-case до вызова `consume-telegram-link-code`
- [ ] Успешный `/link <valid-code>` отправляет пользователю сообщение:

```text
Аккаунт привязан. Теперь можно отправлять команды боту.
```

- [ ] `/link` без аргумента отправляет сообщение:

```text
Используйте команду /link <код> из настроек приложения.
```

- [ ] `/link CODE extra` не вызывает backend и отправляет то же usage message
- [ ] `invalid_code`, `code_already_used` и `account_already_linked` маппятся в одно сообщение:

```text
Код недействителен. Сгенерируйте новый код в настройках приложения.
```

- [ ] `expired_code` маппится в сообщение:

```text
Код истёк. Сгенерируйте новый код в настройках приложения.
```

- [ ] `telegram_already_linked` маппится в сообщение:

```text
Этот Telegram уже привязан к аккаунту.
```

- [ ] integration error или service-role auth error при `consume-telegram-link-code` маппится в сообщение:

```text
Не удалось завершить привязку. Попробуйте ещё раз.
```

- [ ] `/link` в групповом чате не вызывает backend и отправляет:

```text
Привязка доступна только в личном чате с ботом.
```

- [ ] Непривязанный пользователь, отправивший не-`/start` и не-`/link`, получает:

```text
Сначала привяжите аккаунт. Откройте настройки приложения и отправьте сюда команду /link <код>.
```

- [ ] Access gate lookup читает `telegram_users` по `message.from.id` и не использует отдельный backend function
- [ ] При lookup failure бот отправляет:

```text
Не удалось проверить статус привязки. Попробуйте ещё раз.
```

- [ ] При lookup failure downstream handler не вызывается
- [ ] Привязанный пользователь проходит через access gate к downstream handler без служебного ответа от gate
- [ ] Для linked path access gate передаёт downstream handler-у канонический `LinkedActor { userId, telegramUserId, telegramChatId }`
- [ ] `apps/bot/.env.example` содержит `SUPABASE_URL` и `SUPABASE_SERVICE_ROLE_KEY` как обязательные для linking/access gate
- [ ] `apps/bot/README.md` описывает:
  - обязательные env variables `SUPABASE_URL` и `SUPABASE_SERVICE_ROLE_KEY`
  - `/link <code>` flow
  - private-chat limitation
  - access gate поведение для linked / non-linked пользователей

---

## Definition of Done

- [ ] Все пункты Acceptance Criteria выполнены
- [ ] В задаче нет manual steps и ручных проверок
- [ ] Access gate покрыт тестами для linked и non-linked путей
- [ ] `.env.example` и README синхронизированы с новым `/link` flow и Supabase env
- [ ] Access gate lookup и `/link` consume path используют service-role access без side-effects на import

---

## Тест-план

### Unit Tests

- parser `/link`
  - `/link CODE`
  - `/link    code`
  - `/link` без аргумента
  - `/link CODE extra`
- mapping backend ошибок в bot messages
- env validation для `SUPABASE_URL` и `SUPABASE_SERVICE_ROLE_KEY`
- access gate
  - linked user
  - non-linked user
  - backend lookup failure
  - lookup uses `message.from.id`
  - linked path публикует канонический `LinkedActor`

### Request-Level Tests

- `POST /api/telegram` с update для `/link <code>` вызывает consume path
- update для `/link` без кода возвращает `200` и отправляет usage message
- update для `/link CODE extra` возвращает `200` и отправляет usage message
- update для обычного сообщения от непривязанного пользователя возвращает `200` и отправляет linking instruction
- update для lookup failure возвращает `200` и отправляет нейтральную ошибку
- update для consume integration error возвращает `200` и отправляет нейтральную ошибку
- update для linked user вызывает следующий handler

### Integration-Style Tests with Mocks

- mocked backend consume success -> success message
- mocked backend consume domain errors -> корректные тексты
- mocked backend consume integration/auth errors -> нейтральное сообщение `Не удалось завершить привязку. Попробуйте ещё раз.`
- mocked private/group chat routing -> `/link` доступен только в личном чате
- mocked access gate with sentinel downstream handler -> linked path вызывает downstream, non-linked path нет
- sentinel downstream handler получает `LinkedActor { userId, telegramUserId, telegramChatId }` без повторного lookup

---

## Edge Cases и обработка ошибок

- Код введён в нижнем регистре -> бот нормализует его перед consume
- Пользователь отправил `/link CODE extra` -> бот считает payload невалидным и возвращает usage message
- Backend lookup временно недоступен -> бот отвечает `Не удалось проверить статус привязки. Попробуйте ещё раз.`
- `consume-telegram-link-code` вернул `401`, `403`, network error или relay error -> бот отвечает `Не удалось завершить привязку. Попробуйте ещё раз.`
- В update отсутствует `message.from.username` -> consume использует `telegramUsername = null`
- Пользователь уже привязался, но Telegram прислал повторный retry того же update -> пользователь видит сообщение про уже привязанный Telegram, без дублирования записи
