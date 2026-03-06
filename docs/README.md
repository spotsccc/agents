# Документация проекта Agents

> Agents — проект, который развивается как альтернатива OpenClaw: платформа для работы с AI-агентами, автоматизации инженерных сценариев и интеграции с внешними сервисами.

## Быстрые ссылки

| Раздел | Описание |
|--------|----------|
| [Обзор проекта](./overview.md) | Новое позиционирование, цели и приоритеты развития |
| [Архитектура](./architecture/README.md) | Техническая архитектура и ключевые решения |
| [Функциональность](./features/README.md) | Текущая прикладная функциональность веб-приложения |
| [Бэклог: Calendar](./backlog/calendar/README.md) | Сценарии управления календарём через бота |
| [Бэклог: Briefing](./backlog/briefing/README.md) | Утренние/вечерние брифинги и дневник |
| [Бэклог: Task Tracker](./backlog/task-tracker/README.md) | Управление задачами и интеграция в брифинги |

## Структура документации

```text
docs/
├── README.md                           # Вы здесь
├── overview.md                         # Обновлённое описание и цели проекта
├── architecture/
│   ├── README.md                       # Обзор архитектуры
│   ├── frontend.md                     # Архитектура web-приложения
│   ├── backend.md                      # Edge Functions и серверная логика
│   └── database.md                     # Схема PostgreSQL и RLS
├── features/
│   ├── README.md                       # Обзор продуктовых разделов
│   ├── authentication.md               # Аутентификация
│   ├── onboarding.md                   # Онбординг
│   ├── wallets.md                      # Управление кошельками
│   └── transactions.md                 # Транзакции
└── backlog/
    ├── calendar/                       # Telegram-бот + Google Calendar
    ├── briefing/                       # Брифинги и дневник
    ├── task-tracker/                   # Трекер задач
    └── operations/                     # Production readiness
```

## Быстрый старт

### Предварительные требования

- Node.js 18+
- pnpm 8+
- Docker (для локального Supabase)

### Запуск проекта

```bash
# Установка зависимостей
pnpm install

# Запуск локального Supabase
pnpm supabase:start

# Запуск разработки
pnpm dev
```

Полный список команд и архитектурные принципы frontend: [Архитектура Frontend](./architecture/frontend.md).

## Кратко о технологическом стеке

| Слой | Технологии |
|------|------------|
| Web | Vue 3, TypeScript, TanStack Query, Tailwind CSS |
| Bot | TypeScript, grammy, Hono |
| Backend | Supabase (Auth, PostgreSQL, Edge Functions) |
| Edge Functions | Deno, Kysely ORM |
| Инфраструктура | Vite, Turborepo, pnpm, Vercel |
| Тестирование | Vitest, Playwright |

## Ссылки проекта

| Ресурс | URL |
|--------|-----|
| Production | https://agents-web-chi.vercel.app |
| GitHub | https://github.com/spotsccc/agents |
| Vercel Dashboard | https://vercel.com/spotscccs-projects/agents-web |

## Связанные ресурсы

- [CLAUDE.md](../CLAUDE.md) — рабочие правила для AI-ассистента в репозитории
