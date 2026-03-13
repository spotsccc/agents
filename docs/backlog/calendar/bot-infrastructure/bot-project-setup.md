# Bot Project Setup

> Инициализация `apps/bot/` как TypeScript-пакета в монорепозитории с полностью автоматизируемыми локальным запуском, CI-проверками и готовностью к production-деплою webhook endpoint.

---

## Описание

### Проблема

В монорепозитории отсутствует отдельное приложение Telegram-бота. Из-за этого нет устойчивой базы для:
- локальной разработки в `polling`-режиме;
- деплоя webhook endpoint в отдельный runtime;
- запуска изолированных CI/CD-процессов для bot-кода.

### Цель

Создать минимальный инфраструктурный baseline для `apps/bot/`, чтобы следующие задачи эпика добавляли только бизнес-логику без инфраструктурных доработок.

### Кто использует результат

- Backend/fullstack-разработчики: локальная разработка, линт, типизация, unit-тесты.
- CI/CD: автоматическая валидация bot-пакета в PR.
- Vercel Git Integration: автоматический production deploy после merge в default branch.

### Связанные задачи эпика

- [bot-telegram-skeleton.md](./bot-telegram-skeleton.md)
- [bot-account-linking.md](./bot-account-linking.md)
- [bot-account-linking-web-ui.md](./bot-account-linking-web-ui.md)
- [bot-link-command.md](./bot-link-command.md)
- [bot-voice-processing.md](./bot-voice-processing.md)
- [bot-llm-integration.md](./bot-llm-integration.md)

---

## Предусловия выполнения (для AI-агента)

Все шаги в этой задаче автоматизированы, кроме настройки внешних интеграций платформы.

- Vercel-проект должен быть заранее связан с репозиторием и директорией `apps/bot` через Git Integration.
- В Vercel должны быть заданы production/preview env для bot-приложения (`BOT_MODE=webhook`, `TELEGRAM_BOT_TOKEN`).

> Настройка доступа к внешним системам (выдача токенов/секретов) не выполняется в рамках этой задачи и должна быть сделана отдельной задачей bootstrap-платформы.

---

## Бизнес-сценарии (операционные)

### Локальная разработка

1. Агент/разработчик запускает `pnpm install --frozen-lockfile` в корне.
2. Запускает `pnpm --filter bot dev`.
3. Бот стартует только в `polling`-режиме, без локального HTTP-listener.

### CI-валидация PR

1. На PR с изменениями в `apps/bot/**` или в фиксированном наборе root-файлов запускается workflow `bot-ci.yml`.
2. Workflow запускает команды `build`, `lint:check`, `test:unit`.
3. Любой non-zero exit code блокирует merge.

### Автоматический production deploy

1. После merge в default branch Vercel автоматически запускает production deploy через Git Integration.
2. Деплой использует директорию `apps/bot` и настройки проекта в Vercel (без отдельного `vercel.json` в репозитории).

---

## Технические решения

### Архитектурные решения

- `apps/bot/` создается как отдельный workspace-пакет с именем `bot`.
- Язык: TypeScript (`strict`), runtime: Node.js 24.
- Библиотека: [grammY](https://grammy.dev/) для создания Bot instance и локального polling.
- Production webhook в setup-задаче реализуется как transport stub без передачи update в grammY.
- Polling допускается только в `src/dev.ts`.

### Entry points и границы side-effects

| Назначение | Файл | Ограничения |
|-----------|------|-------------|
| Bot factory | `src/bot.ts` | Экспорт фабрики `createBot()`, без `bot.start()` и без side-effects на import. |
| Development polling | `src/dev.ts` | Единственное место, где разрешен `bot.start()`. |
| Production webhook stub | `src/index.ts` | Экспортирует `app` и `default app`, не импортирует `src/dev.ts`, не вызывает `bot.start()` и `bot.handleUpdate()`. |

### Скрипты пакета `apps/bot`

- `dev`: запуск polling (`tsx watch src/dev.ts`) с принудительным `BOT_MODE=polling`.
- `build`: `tsc --noEmit`.
- `lint`: `vp lint .`.
- `lint:check`: `vp lint .`.
- `lint:fix`: `vp lint . --fix`.
- `test:unit`: `vitest run`.

### Управление конфигурацией и секретами

- В репозитории хранится только `.env.example`.
- Локальные секреты: `.env.local` (в `.gitignore`).
- Production/Preview секреты задаются в Vercel Project Environment Variables.
- В setup-задаче обязательны только bot-переменные.

### Переменные окружения

| Variable | Local | Vercel Preview | Vercel Production | Обязателен в setup | Примечание |
|----------|-------|----------------|-------------------|--------------------|------------|
| `BOT_MODE` | required (`polling` для `dev`) | required (`webhook`) | required (`webhook`) | yes | Допустимые значения: `polling` \| `webhook` |
| `TELEGRAM_BOT_TOKEN` | required | required | required | yes | Fail-fast при отсутствии |
| `TELEGRAM_WEBHOOK_SECRET` | optional | optional | optional | no | Используется в следующей задаче |
| `SUPABASE_URL` | optional | optional | optional | no | Следующие задачи эпика |
| `SUPABASE_SERVICE_ROLE_KEY` | optional | optional | optional | no | Следующие задачи эпика |
| `OPENAI_API_KEY` | optional | optional | optional | no | Следующие задачи эпика |
| `LOG_LEVEL` | optional | optional | optional | no | По необходимости |

### API-контракт (setup-версия)

`POST /api/telegram`

- Request:
  - `Content-Type` должен начинаться с `application/json`;
  - тело должно быть валидным JSON (любой объект/массив).
- Response:
  - `200` + `{ "ok": true }` для валидного `POST`;
  - `400` + `{ "ok": false, "error": "invalid_json" }` для невалидного JSON или отсутствия/неверного `Content-Type`;
  - `405` + header `Allow: POST` для любых методов, кроме `POST`.

Техническое требование для детерминированного поведения:
- `src/index.ts` валидирует `Content-Type` и выполняет явный `JSON.parse` входного тела с обработкой ошибки;
- контракт не зависит от неявного body-parser runtime.

Ограничения setup-версии:
- не выполняется валидация схемы Telegram update;
- не проверяется `x-telegram-bot-api-secret-token`;
- не вызывается `bot.handleUpdate()`.

### Конфигурация Vercel

В setup-задаче отдельный `apps/bot/vercel.json` не добавляется.

Ожидается настройка проекта в Vercel UI:
- Root Directory: `apps/bot`;
- Production/Preview environment variables для bot-приложения;
- build/install команды и runtime используются из автонастроек Vercel для проекта.

### CI/CD конфигурация

Добавляется один workflow:

Фиксированный набор root-файлов для path filters:
- `pnpm-lock.yaml`
- `pnpm-workspace.yaml`
- `package.json`
- `turbo.json`

1. `.github/workflows/bot-ci.yml` (PR checks)
- Триггер: `pull_request` + path filters (`apps/bot/**` + фиксированный набор root-файлов выше).
- Шаги: install -> `build` -> `lint:check` -> `test:unit`.
- Дополнительно: `gitleaks`-проверка на утечку секретов.

### Затронутые компоненты

- `pnpm-workspace.yaml` (если требуется обновление workspace include).
- `turbo.json`/root scripts (чтобы `pnpm build` и `pnpm test:unit` включали `bot`).
- `.github/workflows/bot-ci.yml`.
- `apps/bot/package.json`.
- `apps/bot/tsconfig.json`.
- `apps/bot/vite.config.ts`.
- `apps/bot/vitest.config.ts`.
- `apps/bot/src/config/env.ts`.
- `apps/bot/src/bot.ts`.
- `apps/bot/src/dev.ts`.
- `apps/bot/src/index.ts`.
- `apps/bot/.env.example`.
- `apps/bot/README.md`.
- `apps/bot/__tests__/env.spec.ts`.
- `apps/bot/__tests__/bot.spec.ts`.
- `apps/bot/__tests__/telegram.spec.ts`.

---

## Scope

- [x] Создать `apps/bot/` как workspace-пакет `bot`.
- [x] Добавить scripts: `dev`, `build`, `lint`, `lint:check`, `lint:fix`, `test:unit`.
- [x] Добавить `"engines": { "node": "24" }` в `apps/bot/package.json`.
- [x] Настроить `tsconfig.json` (strict, ESM, target ES2023) и ESLint-конфиг в стиле репозитория.
- [x] Добавить `vitest.config.ts` для server-only тестов (без browser mode).
- [x] Реализовать `src/config/env.ts` с `loadEnv()` без side-effects на import.
- [x] Реализовать `src/bot.ts` как чистую factory-функцию без запуска polling.
- [x] Реализовать `src/dev.ts` как единственную точку запуска polling.
- [x] Реализовать `src/index.ts` по контракту setup-версии с явным парсингом JSON.
- [x] Добавить unit-тесты: `env.spec.ts`, `bot.spec.ts`, `telegram.spec.ts`.
- [x] Добавить `.env.example` со всеми переменными и пометкой обязательности.
- [x] Добавить `.github/workflows/bot-ci.yml`.
- [x] Добавить автоматическую проверку секретов в CI (`gitleaks`).
- [x] Обновить `apps/bot/README.md` (локальный запуск, env, команды, CI, Vercel Git Integration).

### Out of Scope

- Реализация бизнес-логики бота (`/start`, `/link`, обработка сообщений).
- Передача webhook request в `bot.handleUpdate()`.
- Настройка `setWebhook` в Telegram Bot API.
- Проверка `x-telegram-bot-api-secret-token`.
- Account linking, voice, LLM, БД-миграции, RLS.
- Выдача/ротация внешних токенов доступа (bootstrap платформы).

---

## Acceptance Criteria

- [x] `pnpm install --frozen-lockfile` в корне завершается с exit code `0`.
- [x] `pnpm --filter bot build` завершается с exit code `0`.
- [x] `pnpm --filter bot lint:check` завершается с exit code `0`.
- [x] `pnpm --filter bot test:unit` завершается с exit code `0`.
- [x] `pnpm turbo run build --dry=json | rg '"taskId":"bot#build"'` находит задачу `bot#build`.
- [x] `src/index.ts` соблюдает контракт:
  - валидный `POST` JSON -> `200` + `{ "ok": true }`;
  - невалидный JSON -> `400` + `{ "ok": false, "error": "invalid_json" }`;
  - неверный `Content-Type` -> `400` + `{ "ok": false, "error": "invalid_json" }`;
  - `GET`/`PUT` -> `405` + `Allow: POST`.
- [x] В репозитории существуют файлы workflow:
  - `.github/workflows/bot-ci.yml`
- [x] `pnpm dlx actionlint` завершается с exit code `0`.
- [x] В `bot-ci.yml` path filters содержат фиксированный набор root-файлов:
  - `pnpm-lock.yaml`
  - `pnpm-workspace.yaml`
  - `package.json`
  - `turbo.json`
- [x] В `bot-ci.yml` есть шаги: `build`, `lint:check`, `test:unit`, `gitleaks`.
- [x] `apps/bot/.env.example` содержит полный список переменных без реальных секретов.
- [x] `apps/bot/README.md` содержит локальные команды, env-конфигурацию, CI и Vercel Git Integration.

---

## Definition of Done

- [x] Все пункты Acceptance Criteria выполнены.
- [x] Workflow `bot-ci.yml` проходит локальную статическую валидацию (`actionlint`) и не содержит manual approval/manual test шагов.
- [x] В репозитории отсутствуют закоммиченные секреты (подтверждено CI secret scan).
- [x] Все файлы и скрипты из секции Scope созданы и доступны в репозитории.

---

## Тест-план

### Unit Tests (Vitest)

#### `src/config/env.ts` (`__tests__/env.spec.ts`)

- `BOT_MODE=invalid` -> `loadEnv()` выбрасывает ошибку с допустимыми значениями.
- отсутствие `TELEGRAM_BOT_TOKEN` -> `loadEnv()` выбрасывает явную ошибку.
- валидные переменные -> возвращается типизированный config.

#### `src/bot.ts` (`__tests__/bot.spec.ts`)

- factory возвращает корректный экземпляр `Bot`.
- импорт модуля не запускает polling.
- модуль не содержит side-effects, мешающих unit-тестам.

#### `src/index.ts` (`__tests__/telegram.spec.ts`)

- `POST` + `application/json` + валидный JSON -> `200` + `{ "ok": true }`.
- `POST` + `application/json; charset=utf-8` + валидный JSON -> `200` + `{ "ok": true }`.
- `POST` + невалидный JSON -> `400` + `{ "ok": false, "error": "invalid_json" }`.
- `POST` + отсутствующий/неверный `Content-Type` -> `400` + `{ "ok": false, "error": "invalid_json" }`.
- `GET`/`PUT` -> `405` + header `Allow: POST`.

### Integration Tests

- `pnpm --filter bot build`.
- `pnpm --filter bot lint:check`.
- `pnpm --filter bot test:unit`.
- `pnpm turbo run build --dry=json | rg '"taskId":"bot#build"'`.
- `pnpm dlx actionlint`.

---

## Edge Cases и обработка ошибок

- Отсутствует `TELEGRAM_BOT_TOKEN`:
  - fail-fast в `loadEnv()` с явной ошибкой.
- Невалидный `BOT_MODE`:
  - fail-fast с перечислением допустимых значений.
- Случайный запуск polling в serverless-коде:
  - приводит к некорректному runtime-поведению и должен быть исключён архитектурой entry points + автоматическими тестами на side-effects.
- Неверный HTTP-метод в webhook:
  - `405` + `Allow: POST`, без `500`.
- Невалидный JSON:
  - `400` + `invalid_json`, без `500`.
- `Content-Type` отсутствует или не `application/json`:
  - `400` + `invalid_json`.
- В Vercel отсутствуют обязательные env (`BOT_MODE`, `TELEGRAM_BOT_TOKEN`):
  - деплой проходит, но runtime стартует с ошибкой fail-fast в `loadEnv()`.
- Директория `apps/bot` не связана с Vercel-проектом:
  - изменения в репозитории не приводят к корректному автодеплою bot-приложения.
- Утечка секретов в diff:
  - `gitleaks` шаг в `bot-ci` блокирует merge.
