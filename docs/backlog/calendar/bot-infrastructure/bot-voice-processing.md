# Voice Message Transcription

> Telegram voice message download, transcription through OpenAI, and routing the transcript into the same text pipeline as regular messages.

---

## Описание

### Проблема

После [bot-llm-integration.md](./bot-llm-integration.md) бот умеет обрабатывать только текст. Голосовые сообщения всё ещё не встроены в общий message pipeline:
- бот не скачивает Telegram voice file;
- бот не умеет вызывать transcription API;
- downstream text handler не получает распознанный текст;
- ошибки voice flow не оформлены в детерминированный UX.

### Цель

Добавить поддержку `message.voice` как отдельного transport layer:
- скачивать voice file из Telegram;
- транскрибировать его через OpenAI;
- передавать результат в тот же text handler, что и обычное текстовое сообщение;
- обрабатывать ошибки размера, скачивания и распознавания без ручных проверок.

### Кто использует результат

- Конечный пользователь Telegram: может общаться с ботом голосом
- [bot-llm-integration.md](./bot-llm-integration.md): получает транскрибированный текст через единый вход
- Epic Google Calendar: переиспользует voice input без отдельной обработки transport слоя

### Связанные задачи

- Требует завершённых [bot-link-command.md](./bot-link-command.md) и [bot-llm-integration.md](./bot-llm-integration.md)

---

## Предусловия выполнения (для AI-агента)

- В bot runtime доступны:
  - `TELEGRAM_BOT_TOKEN`
  - `OPENAI_API_KEY`
- `OPENAI_TRANSCRIPTION_MODEL` может быть задан, но не обязателен: при отсутствии runtime использует `whisper-1`
- Access gate уже отделяет linked пользователей от non-linked
- Access gate и routing layer передают voice transport только linked `message.voice` из `private` chat
- Существует text entrypoint из [bot-llm-integration.md](./bot-llm-integration.md), принимающий `{ actor, text, source, telegramMessageId, receivedAt }`

Что не входит в эту задачу:
- обработка `audio`, `video_note` и других медиа-типов
- дневные лимиты использования
- Google Calendar actions
- долговременное хранение voice-файлов

---

## Бизнес-сценарии

### Успешная транскрипция voice message

1. Привязанный пользователь отправляет Telegram `message.voice`
2. Бот получает `file_path` через Telegram Bot API и скачивает аудио
3. Бот отправляет файл в OpenAI transcription API
4. API возвращает непустую транскрипцию
5. Бот передаёт транскрипцию в тот же `HandleLinkedText`, что и обычное сообщение, с `source: 'voice'`
6. Бот отправляет пользователю ровно один `replyText`, возвращённый text runtime

### Слишком большой файл

1. Пользователь отправляет voice file больше 25 MB
2. Бот не отправляет файл в OpenAI
3. Бот отвечает:

```text
Голосовое сообщение слишком большое. Отправьте более короткую запись.
```

### Ошибка транскрипции

1. OpenAI transcription API возвращает ошибку или таймаут
2. Бот не вызывает downstream text handler
3. Бот отвечает:

```text
Не удалось распознать голосовое сообщение. Попробуйте ещё раз или отправьте текст.
```

### Пустая транскрипция

1. OpenAI возвращает пустую строку или строку из пробелов
2. Бот считает распознавание неуспешным
3. Бот отвечает:

```text
Не удалось распознать речь. Попробуйте ещё раз или отправьте текст.
```

### Telegram file download недоступен

1. Бот не может получить `file_path` через `getFile` или не может скачать файл из Telegram
2. Бот не вызывает OpenAI transcription API
3. Бот отвечает:

```text
Не удалось распознать голосовое сообщение. Попробуйте ещё раз или отправьте текст.
```

### Ошибка в downstream text pipeline после успешной транскрипции

1. OpenAI возвращает непустую транскрипцию
2. Voice transport передаёт её в `HandleLinkedText`
3. Ошибка возникает уже в text pipeline
4. Voice transport не отправляет дополнительное transport-level сообщение; ошибка обрабатывается text runtime

---

## Технические решения

### Архитектурные решения

- Поддерживается только `message.voice`
- Voice handler живёт в `apps/bot/src/voice/*`
- Voice transport получает только linked `private` chat updates; повторный access lookup внутри voice handler не выполняется
- После успешной транскрипции используется тот же text entrypoint, что и для обычного `message.text`
- Повторная бизнес-логика для voice не создаётся

### Поддерживаемый вход

- Telegram update type: `message`
- Telegram message field: `voice`
- `audio`, `video_note`, `document`, `video` в scope не входят

### Runtime Env и зависимости

- `apps/bot/src/config/env.ts` валидирует `OPENAI_API_KEY` как обязательный runtime env для voice transport
- `OPENAI_TRANSCRIPTION_MODEL` остаётся опциональным env с fallback на `whisper-1`
- `apps/bot/.env.example` и `apps/bot/README.md` обновляются с описанием `OPENAI_API_KEY` и `OPENAI_TRANSCRIPTION_MODEL`
- Если в `apps/bot/package.json` ещё нет runtime dependency для OpenAI client, она добавляется в рамках этой задачи

### Ограничения и валидация

- Максимальный размер файла: `25 * 1024 * 1024` bytes
- Бот сначала использует `voice.file_size`, если он есть
- Если `file_size` отсутствует, скачивание выполняется со streaming guard и прерывается при превышении лимита
- Если `voice.file_id` отсутствует или Telegram `getFile` не возвращает `file_path`, voice flow считается неуспешным
- После завершения запроса voice binary не сохраняется в БД; временный файл, если он используется для OpenAI SDK, удаляется в рамках того же request lifecycle

### Граница между Access Gate, Voice Transport и Text Runtime

Voice transport переиспользует контракт `HandleLinkedText` из [bot-llm-integration.md](./bot-llm-integration.md) и не подменяет его собственным API:

```ts
type LinkedActor = {
  userId: string
  telegramUserId: number
  telegramChatId: number
}

type HandleLinkedText = (input: {
  actor: LinkedActor
  text: string
  source: 'text' | 'voice'
  telegramMessageId: number
  receivedAt: string
}) => Promise<{ replyText: string }>
```

Требования:
- voice handler получает `actor`, `telegramMessageId` и `receivedAt` от routing layer, а не вычисляет их заново;
- после успешной транскрипции вызывается `HandleLinkedText` с `source: 'voice'`;
- voice transport не делает прямых записей в `bot_conversations` и не дублирует LLM business logic;
- transport layer не отправляет отдельного success-message помимо `replyText`, который пришёл из text runtime.

### Telegram File Download

- Для получения файла используется Telegram Bot API `getFile` или эквивалентный helper поверх него
- После получения `file_path` аудио скачивается по authenticated Telegram file URL
- Если `voice.file_size` уже известен и превышает 25 MB, скачивание и вызов OpenAI не выполняются
- Если размер заранее неизвестен, скачивание идёт через bounded stream / bounded buffer с немедленным abort при превышении лимита
- Ошибки `getFile`, пустой `file_path` и сетевые ошибки download маппятся в сообщение распознавания
- Abort по лимиту во время bounded stream download маппится в сообщение о слишком большом файле
- Дополнительное долговременное хранение аудио вне request lifecycle не допускается

### Transcription API

- Используется OpenAI transcription API
- Модель берётся из `OPENAI_TRANSCRIPTION_MODEL`
- Если env не задан, используется значение по умолчанию `whisper-1`
- Язык не фиксируется, используется auto-detect
- В OpenAI передаётся корректный file payload с filename и MIME type; при отсутствии `voice.mime_type` используется безопасный fallback `audio/ogg`
- Результат transcription trim-ится; пустая строка и строка из пробелов считаются неуспешным распознаванием

### Роутинг результата

- После успешной транскрипции вызывается единый text handler
- В text handler передаётся:
  - `actor`: linked actor из access gate
  - `text`: распознанная строка
  - `source`: `'voice'`
  - `telegramMessageId`: исходный Telegram message id
  - `receivedAt`: timestamp обработки update
- Если `HandleLinkedText` возвращает `replyText`, bot transport отправляет его пользователю ровно один раз
- Если `HandleLinkedText` выбрасывает ошибку, её обрабатывает text pipeline; voice transport не добавляет второе сообщение поверх этой ошибки

### Затронутые компоненты

- `apps/bot/src/bot.ts`
- `apps/bot/src/index.ts`
- `apps/bot/src/config/env.ts`
- `apps/bot/.env.example`
- `apps/bot/src/voice/*`
- `apps/bot/src/llm/*`
- `apps/bot/package.json`
- `apps/bot/README.md`
- `apps/bot/__tests__/env.spec.ts`
- `apps/bot/__tests__/bot.spec.ts`
- `apps/bot/__tests__/telegram.spec.ts`

---

## Scope

- [ ] Реализовать handler для `message.voice`
- [ ] Переиспользовать `HandleLinkedText` contract из `bot-llm-integration.md` без отдельного voice-specific business pipeline
- [ ] Реализовать скачивание файла через Telegram Bot API
- [ ] Реализовать размерный лимит 25 MB
- [ ] Реализовать bounded streaming / bounded buffering для сценария без `voice.file_size`
- [ ] Реализовать вызов OpenAI transcription API
- [ ] Передавать успешную транскрипцию в общий text handler
- [ ] Реализовать bot UX для size/transcription/empty-result ошибок
- [ ] Добавить fail-fast env validation для OpenAI transcription runtime
- [ ] Обновить `apps/bot/.env.example`
- [ ] При необходимости обновить runtime dependencies в `apps/bot/package.json`
- [ ] Добавить автоматические unit/request-level tests
- [ ] Обновить `apps/bot/README.md`

### Out of Scope

- `audio` и `video_note`
- дневные лимиты использования
- fallback на сторонние transcription providers

---

## Acceptance Criteria

- [ ] `pnpm --filter bot type-check` завершается с exit code `0`
- [ ] `pnpm --filter bot lint:check` завершается с exit code `0`
- [ ] `pnpm --filter bot format:check` завершается с exit code `0`
- [ ] `pnpm --filter bot test:unit` завершается с exit code `0`
- [ ] `apps/bot/src/config/env.ts` падает с понятной ошибкой, если отсутствует `OPENAI_API_KEY`
- [ ] Если `OPENAI_TRANSCRIPTION_MODEL` не задан, runtime использует `whisper-1`
- [ ] `apps/bot/.env.example` и `apps/bot/README.md` документируют `OPENAI_API_KEY` и `OPENAI_TRANSCRIPTION_MODEL`
- [ ] Если для реализации нужны новые runtime dependencies, они добавлены в `apps/bot/package.json`
- [ ] `message.voice` с размером <= 25 MB получает `file_path` через Telegram Bot API и отправляется в OpenAI transcription API ровно один раз
- [ ] Если `voice.file_size` отсутствует, bounded stream / bounded buffer корректно пропускает файл <= 25 MB и прерывает download при превышении лимита
- [ ] Непустая транскрипция передаётся в `HandleLinkedText` ровно один раз с input вида `{ actor, text, source: 'voice', telegramMessageId, receivedAt }`
- [ ] Успешный voice flow не отправляет отдельного transport-level success message сверх одного `replyText`, который пришёл из text runtime
- [ ] Voice file > 25 MB не отправляется в OpenAI и приводит к сообщению:

```text
Голосовое сообщение слишком большое. Отправьте более короткую запись.
```

- [ ] Превышение лимита во время streaming download также приводит к сообщению `Голосовое сообщение слишком большое. Отправьте более короткую запись.`
- [ ] Ошибка transcription API приводит к сообщению:

```text
Не удалось распознать голосовое сообщение. Попробуйте ещё раз или отправьте текст.
```

- [ ] Ошибка Telegram `getFile`, отсутствие `file_path` или ошибка скачивания приводит к сообщению:

```text
Не удалось распознать голосовое сообщение. Попробуйте ещё раз или отправьте текст.
```

- [ ] Пустая транскрипция приводит к сообщению:

```text
Не удалось распознать речь. Попробуйте ещё раз или отправьте текст.
```

- [ ] Отсутствие `voice.file_id` приводит к сообщению `Не удалось распознать голосовое сообщение. Попробуйте ещё раз или отправьте текст.`
- [ ] `audio` и `video_note` не обрабатываются этим task-specific handler

---

## Definition of Done

- [ ] Все пункты Acceptance Criteria выполнены
- [ ] В задаче нет manual steps и ручных проверок
- [ ] Voice transport не дублирует text business logic
- [ ] Voice transport переиспользует `HandleLinkedText` contract без прямой записи в `bot_conversations`
- [ ] README содержит env и ограничения voice flow

---

## Тест-план

### Unit Tests

- env loading
  - `OPENAI_API_KEY` присутствует
  - `OPENAI_API_KEY` отсутствует -> fail-fast error
  - `OPENAI_TRANSCRIPTION_MODEL` fallback на `whisper-1`
- Проверка лимита размера
  - `file_size` меньше лимита
  - `file_size` больше лимита
  - `file_size` отсутствует, streaming guard пропускает допустимый файл
  - `file_size` отсутствует, streaming guard срабатывает
- Telegram file resolution / download
  - `voice.file_id` отсутствует
  - `getFile` возвращает `file_path`
  - `getFile` не возвращает `file_path`
  - download error
- Обработка transcription response
  - непустой текст
  - пустой текст
  - строка из пробелов
  - API error
  - timeout
- Routing в text pipeline
  - `HandleLinkedText` получает `actor`, `source: 'voice'`, `telegramMessageId`, `receivedAt`
  - transport отправляет ровно один `replyText`
  - transport не отправляет отдельное success-message

### Request-Level Tests

- `POST /api/telegram` с `message.voice` вызывает voice flow
- `POST /api/telegram` с oversized voice update возвращает `200` и отправляет size-limit message
- `POST /api/telegram` с transcription success вызывает downstream text handler
- `POST /api/telegram` с voice update без `file_id` возвращает `200` и отправляет transcription-error message
- `POST /api/telegram` с Telegram download failure возвращает `200` и отправляет transcription-error message
- `POST /api/telegram` с `audio` или `video_note` не попадает в task-specific voice handler

### Integration-Style Tests with Mocks

- mocked Telegram file API -> mocked OpenAI transcription -> mocked text handler
- voice flow не вызывает downstream text handler при transcription error
- voice flow не вызывает OpenAI, если лимит превышен до или во время download
- successful voice flow вызывает `HandleLinkedText` с тем же actor contract, что и text runtime

---

## Edge Cases и обработка ошибок

- Voice update приходит без `voice.file_id` -> бот отвечает ошибкой распознавания и не падает
- Telegram `getFile` вернул payload без `file_path` -> бот отвечает ошибкой распознавания и не падает
- Telegram file API недоступен -> бот отвечает `Не удалось распознать голосовое сообщение. Попробуйте ещё раз или отправьте текст.`
- Скачивание файла оборвалось по сети -> бот отвечает `Не удалось распознать голосовое сообщение. Попробуйте ещё раз или отправьте текст.`
- Bounded stream guard прервал download из-за превышения 25 MB -> бот отвечает `Голосовое сообщение слишком большое. Отправьте более короткую запись.`
- OpenAI вернул строку из пробелов -> трактуется как пустая транскрипция
- OpenAI вернул malformed response без текста -> бот отвечает `Не удалось распознать голосовое сообщение. Попробуйте ещё раз или отправьте текст.`
- Пользователь отправил несколько voice updates подряд -> каждый update обрабатывается независимо
- Downstream text handler вернул ошибку после успешной транскрипции -> ошибка обрабатывается в text pipeline, не в voice transport
