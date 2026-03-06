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
2. Workflow запускает команды `build`, `lint`, `test:unit`.
3. Любой non-zero exit code блокирует merge.

### Автоматический production deploy

1. После merge в default branch Vercel автоматически запускает production deploy через Git Integration.
2. Деплой использует директорию `apps/bot` и настройки проекта в Vercel (без отдельного `vercel.json` в репозитории).

---

## Технические решения

### Архитектурные решения

- `apps/bot/` создается как отдельный workspace-пакет с именем `bot`.
- Язык: TypeScript (`strict`), runtime: Node.js 22.
- Библиотека: [grammY](https://grammy.dev/) для создания Bot instance и локального polling.
- Production webhook в setup-задаче реализуется как transport stub без передачи update в grammY.
- Polling допускается только в `src/dev.ts`.

### Entry points и границы side-effects

| Назначение | Файл | Ограничения |
|-----------|------|-------------|
| Bot factory | `src/bot.ts` | Экспорт фабрики `createBot()`, без `bot.start()` и без side-effects на import. |
| Development polling | `src/dev.ts` | Единственное место, где разрешен `bot.start()`. |
| Production webhook stub | `api/telegram.ts` | Не импортирует `src/dev.ts`, не вызывает `bot.start()` и `bot.handleUpdate()`. |

### Скрипты пакета `apps/bot`

- `dev`: запуск polling (`tsx watch src/dev.ts`) с принудительным `BOT_MODE=polling`.
- `build`: `tsc --noEmit`.
- `lint`: `eslint .`.
- `lint:fix`: `eslint . --fix`.
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
- `api/telegram.ts` валидирует `Content-Type` и выполняет явный `JSON.parse` входного тела с обработкой ошибки;
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
- Шаги: install -> `build` -> `lint` -> `test:unit`.
- Дополнительно: `gitleaks`-проверка на утечку секретов.

### Затронутые компоненты

- `pnpm-workspace.yaml` (если требуется обновление workspace include).
- `turbo.json`/root scripts (чтобы `pnpm build` и `pnpm test:unit` включали `bot`).
- `.github/workflows/bot-ci.yml`.
- `apps/bot/package.json`.
- `apps/bot/tsconfig.json`.
- `apps/bot/eslint.config.ts`.
- `apps/bot/vitest.config.ts`.
- `apps/bot/src/config/env.ts`.
- `apps/bot/src/bot.ts`.
- `apps/bot/src/dev.ts`.
- `apps/bot/api/telegram.ts`.
- `apps/bot/.env.example`.
- `apps/bot/README.md`.
- `apps/bot/__tests__/env.spec.ts`.
- `apps/bot/__tests__/bot.spec.ts`.
- `apps/bot/__tests__/telegram.spec.ts`.

---

## Scope

- [ ] Создать `apps/bot/` как workspace-пакет `bot`.
- [ ] Добавить scripts: `dev`, `build`, `lint`, `lint:fix`, `test:unit`.
- [ ] Добавить `"engines": { "node": ">=22" }` в `apps/bot/package.json`.
- [ ] Настроить `tsconfig.json` (strict, ESM, target ES2023) и ESLint-конфиг в стиле репозитория.
- [ ] Добавить `vitest.config.ts` для server-only тестов (без browser mode).
- [ ] Реализовать `src/config/env.ts` с `loadEnv()` без side-effects на import.
- [ ] Реализовать `src/bot.ts` как чистую factory-функцию без запуска polling.
- [ ] Реализовать `src/dev.ts` как единственную точку запуска polling.
- [ ] Реализовать `api/telegram.ts` по контракту setup-версии с явным парсингом JSON.
- [ ] Добавить unit-тесты: `env.spec.ts`, `bot.spec.ts`, `telegram.spec.ts`.
- [ ] Добавить `.env.example` со всеми переменными и пометкой обязательности.
- [ ] Добавить `.github/workflows/bot-ci.yml`.
- [ ] Добавить автоматическую проверку секретов в CI (`gitleaks`).
- [ ] Обновить `apps/bot/README.md` (локальный запуск, env, команды, CI, Vercel Git Integration).

### Out of Scope

- Реализация бизнес-логики бота (`/start`, `/link`, обработка сообщений).
- Передача webhook request в `bot.handleUpdate()`.
- Настройка `setWebhook` в Telegram Bot API.
- Проверка `x-telegram-bot-api-secret-token`.
- Account linking, voice, LLM, БД-миграции, RLS.
- Выдача/ротация внешних токенов доступа (bootstrap платформы).

---

## Acceptance Criteria

- [ ] `pnpm install --frozen-lockfile` в корне завершается с exit code `0`.
- [ ] `pnpm --filter bot build` завершается с exit code `0`.
- [ ] `pnpm --filter bot lint` завершается с exit code `0`.
- [ ] `pnpm --filter bot test:unit` завершается с exit code `0`.
- [ ] `pnpm turbo run build --dry=json | rg '"taskId":"bot#build"'` находит задачу `bot#build`.
- [ ] `api/telegram.ts` соблюдает контракт:
  - валидный `POST` JSON -> `200` + `{ "ok": true }`;
  - невалидный JSON -> `400` + `{ "ok": false, "error": "invalid_json" }`;
  - неверный `Content-Type` -> `400` + `{ "ok": false, "error": "invalid_json" }`;
  - `GET`/`PUT` -> `405` + `Allow: POST`.
- [ ] В репозитории существуют файлы workflow:
  - `.github/workflows/bot-ci.yml`
- [ ] `pnpm dlx actionlint` завершается с exit code `0`.
- [ ] В `bot-ci.yml` path filters содержат фиксированный набор root-файлов:
  - `pnpm-lock.yaml`
  - `pnpm-workspace.yaml`
  - `package.json`
  - `turbo.json`
- [ ] В `bot-ci.yml` есть шаги: `build`, `lint`, `test:unit`, `gitleaks`.
- [ ] `apps/bot/.env.example` содержит полный список переменных без реальных секретов.
- [ ] `apps/bot/README.md` содержит локальные команды, env-конфигурацию, CI и Vercel Git Integration.

---

## Definition of Done

- [ ] Все пункты Acceptance Criteria выполнены.
- [ ] Последний запуск `Bot CI` в текущем PR завершился `success`.
- [ ] В CI нет manual approval/manual test шагов.
- [ ] В репозитории отсутствуют закоммиченные секреты (подтверждено CI secret scan).
- [ ] Все файлы и скрипты из секции Scope созданы и доступны в репозитории.

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

#### `api/telegram.ts` (`__tests__/telegram.spec.ts`)

- `POST` + `application/json` + валидный JSON -> `200` + `{ "ok": true }`.
- `POST` + `application/json; charset=utf-8` + валидный JSON -> `200` + `{ "ok": true }`.
- `POST` + невалидный JSON -> `400` + `{ "ok": false, "error": "invalid_json" }`.
- `POST` + отсутствующий/неверный `Content-Type` -> `400` + `{ "ok": false, "error": "invalid_json" }`.
- `GET`/`PUT` -> `405` + header `Allow: POST`.

### Integration Tests

- `pnpm --filter bot build`.
- `pnpm --filter bot lint`.
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
  - приводит к некорректному runtime-поведению и должен быть исключён архитектурой entry points + code review.
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
