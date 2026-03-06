# LLM Integration (OpenAI Function Calling)

> Интеграция с OpenAI для обработки естественного языка, function calling, confirmation flow, conversation context.

---

## Описание

Бот принимает текстовое сообщение (или транскрипцию голосового), отправляет в OpenAI с набором tool schemas для календарных операций. LLM определяет intent и вызывает нужную функцию. Перед выполнением действия бот запрашивает подтверждение у пользователя.

---

## Бизнес-сценарии

### Happy Path (создание события)

1. Пользователь: "Запланируй встречу завтра в 12 на 2 часа, звонок с Ильёй"
2. Бот отправляет в OpenAI с tool schemas
3. OpenAI возвращает tool call: `createEvent({ title: "Звонок с Ильёй", start: "...", duration: "2h" })`
4. Бот формирует сообщение-подтверждение с деталями события
5. Пользователь подтверждает
6. Бот выполняет действие через Google Calendar API
7. Бот отвечает: подтверждение создания

### Пользователь отменяет действие

1. Бот показывает подтверждение
2. Пользователь нажимает "Отмена" / пишет "нет"
3. Бот отвечает: "Действие отменено"
4. `pending_action` очищается

### Pending action истекает (TTL)

1. Бот показывает подтверждение
2. Пользователь не отвечает в течение TTL
3. При следующем сообщении бот проверяет `pending_action_expires_at`
4. Если истёк — бот информирует: "Предыдущее действие отменено по таймауту" и обрабатывает новое сообщение

### Новый запрос вместо подтверждения

> TODO: Определить поведение:
> - Бот отменяет pending action и обрабатывает новое сообщение?
> - Или бот просит сначала подтвердить/отменить текущее действие?

### LLM не смог определить intent

1. Пользователь: "Какая сегодня погода?"
2. OpenAI не вызывает tool call, возвращает текстовый ответ
3. Бот пересылает текстовый ответ LLM пользователю

### Ошибка OpenAI API

1. OpenAI возвращает 500 / таймаутит / rate limit (429)
2. Бот отвечает: TODO (сообщение об ошибке, предложение повторить)

---

## Технические решения

### Модель

> TODO: Определить:
> - `gpt-4o`? `gpt-4o-mini`? Разные модели для разных задач?
> - Max tokens для ответа

### System Prompt

> TODO: Определить:
> - Tone of voice бота (формальный, дружелюбный, лаконичный)
> - Контекст: какую информацию о пользователе включать (timezone, язык)
> - Черновик system prompt

### Confirmation Flow

> TODO: Определить:
> - Inline keyboard (кнопки) или текстовые команды ("да"/"нет")?
> - Формат сообщения-подтверждения (какие поля показывать)

### Conversation Context

> TODO: Определить:
> - Что хранится в `context jsonb`? OpenAI messages array?
> - Максимальное количество сообщений / токенов в контексте
> - Sliding window или фиксированный лимит?

### Pending Action TTL

> TODO: Определить конкретное значение (предварительно 10 минут)

### Context Cleanup

> TODO: Определить:
> - pg_cron job для очистки `bot_conversations`
> - TTL для conversation (предварительно 30 минут после последнего сообщения)
> - Удаляем строку или обнуляем `context`?
> - Кто создаёт pg_cron job (миграция)?

### Lookup user_id по telegram_chat_id

> TODO: Определить:
> - Запрос в `telegram_users` на каждый incoming message?
> - Или кэш? Где?

---

## Database Schema

```sql
-- Conversation context (short-lived)
create table bot_conversations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  telegram_chat_id bigint not null,
  context jsonb not null default '{}',
  pending_action jsonb,                  -- action awaiting confirmation
  pending_action_expires_at timestamptz, -- TTL for pending action
  updated_at timestamptz default now()
);
```

### RLS Policies

- `bot_conversations`: bot service role only (no direct client access)

---

## Scope

- [ ] Настроить OpenAI client с function calling
- [ ] Определить tool schemas для календарных операций (create, update, delete, list)
- [ ] Реализовать conversation flow: message -> LLM -> tool call -> confirmation -> execute
- [ ] Реализовать confirmation flow (inline keyboard / текстовые команды)
- [ ] Реализовать хранение conversation context в `bot_conversations`
- [ ] Реализовать pending action с TTL
- [ ] Создать миграцию для `bot_conversations`
- [ ] Настроить pg_cron job для cleanup

---

## Acceptance Criteria

- [ ] Текстовое сообщение обрабатывается LLM и возвращается ответ
- [ ] LLM корректно вызывает tool call для календарных запросов
- [ ] Бот показывает подтверждение перед выполнением действия
- [ ] Пользователь может подтвердить или отменить действие
- [ ] Pending action истекает по TTL — бот информирует пользователя
- [ ] Conversation context сохраняется между сообщениями
- [ ] Старые conversations очищаются автоматически
- [ ] Ошибки OpenAI API обрабатываются — пользователь получает сообщение об ошибке
- [ ] Сообщения не связанные с календарём обрабатываются корректно (LLM отвечает текстом)

---

## Definition of Done

- [ ] Код прошёл code review
- [ ] Unit-тесты для LLM handler, confirmation flow, context management
- [ ] Миграция для `bot_conversations` применена на staging
- [ ] pg_cron job настроен и работает
- [ ] Tool schemas задокументированы
- [ ] Документация обновлена

---

## Тест-план

### Unit Tests
- LLM handler: отправка сообщения, обработка tool call, обработка текстового ответа
- Confirmation flow: подтверждение, отмена, TTL expiry
- Context management: сохранение, загрузка, очистка
- Pending action: создание, подтверждение, отмена, expiry
- Lookup user_id: найден, не найден

### Integration Tests
- Message -> OpenAI -> tool call -> pending action -> confirm -> execute (с mock OpenAI)
- Context persistence: два сообщения подряд сохраняют контекст

### Manual Tests
- Отправить "Запланируй встречу завтра в 12" -> подтверждение -> создание события
- Отправить не-календарный запрос -> текстовый ответ LLM
- Подождать TTL -> отправить сообщение -> pending action отменена

---

## Edge Cases

- OpenAI возвращает невалидный tool call (несуществующая функция, невалидные параметры)
- OpenAI возвращает несколько tool calls одновременно
- Пользователь отправляет сообщение пока предыдущее ещё обрабатывается (race condition)
- `context jsonb` превышает разумный размер (слишком длинная переписка)
- OpenAI API rate limit (429) — retry strategy?
- Пользователь отправляет очень длинное сообщение (token limit)
- pg_cron job падает — старые conversations не очищаются
- `bot_conversations` не существует для нового пользователя (первое сообщение)
