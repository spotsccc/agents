# Account Linking (Telegram <-> Web)

> Привязка Telegram-аккаунта к web-аккаунту через одноразовый код.

---

## Описание

Бот не может работать без привязки Telegram-чата к web-аккаунту. Таблицы `bot_conversations`, `user_google_tokens` и другие ссылаются на `auth.users(id)`, поэтому привязка должна произойти до использования любых функций бота.

---

## Бизнес-сценарии

### Happy Path

1. Пользователь открывает Settings в web UI, нажимает "Link Telegram"
2. Web app генерирует одноразовый код, показывает его пользователю
3. Пользователь отправляет `/link <code>` боту в Telegram
4. Бот верифицирует код, создаёт запись в `telegram_users`
5. Бот отвечает: подтверждение успешной привязки
6. Web UI обновляет статус привязки

### Неверный код

1. Пользователь отправляет `/link ABC123`
2. Код не найден в `linking_codes` (или уже использован)
3. Бот отвечает: "Неверный код. Сгенерируйте новый код в настройках приложения."

### Истёкший код

1. Пользователь отправляет `/link ABC123`
2. Код найден, но `expires_at < now()`
3. Бот отвечает: "Код истёк. Сгенерируйте новый код в настройках приложения."

### Повторная привязка

> TODO: Определить поведение:
> - Может ли один Telegram быть привязан к нескольким web-аккаунтам? (предположительно нет, 1:1)
> - Может ли один web-аккаунт иметь несколько Telegram-привязок? (предположительно нет, 1:1)
> - Что происходит при попытке привязать уже привязанный Telegram?

### Отвязка

> TODO: Определить:
> - Нужна ли возможность отвязать Telegram из web UI?
> - Что происходит с активными `bot_conversations` при отвязке?

### Непривязанный пользователь пишет боту

1. Пользователь отправляет обычное сообщение (не `/link`)
2. Бот не находит запись в `telegram_users` для этого `chat_id`
3. Бот отвечает: TODO (инструкция по привязке)

---

## Технические решения

### Генерация кода

> TODO: Определить:
> - Формат: 6 символов alphanumeric (a-z0-9)? Только цифры? Верхний регистр?
> - Метод генерации: `crypto.randomBytes`? Другой?
> - Как избегать коллизий?

### API для генерации кода

> TODO: Определить:
> - Edge Function / Supabase RPC / прямой insert через клиент с RLS?

### Rate Limiting

> TODO: Определить:
> - Max 5 попыток `/link` в минуту на chat — где хранить счётчик?
> - Отдельная таблица? Колонка? In-memory невозможен (serverless)

### Security Requirements

- Код одноразовый — помечается `used = true` после успешной привязки
- TTL: 5 минут, после чего код считается истёкшим
- Brute-force protection: rate limit `/link` (max 5 в минуту на chat)

---

## Database Schema

```sql
-- Telegram user mapping
create table telegram_users (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  telegram_chat_id bigint unique not null,
  telegram_username text,
  created_at timestamptz default now()
);

-- One-time linking codes
create table linking_codes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  code text unique not null,
  expires_at timestamptz not null,
  used boolean default false,
  created_at timestamptz default now()
);
```

### RLS Policies

- `telegram_users`: пользователи могут читать только свою запись. Bot service role может читать/писать.
- `linking_codes`: пользователи могут создавать коды для себя. Bot service role может читать и помечать как использованные.

---

## Scope

- [ ] Создать миграцию для `telegram_users` и `linking_codes`
- [ ] Настроить RLS policies
- [ ] Реализовать генерацию кода (API endpoint)
- [ ] Реализовать UI в Settings (кнопка, отображение кода, статус привязки)
- [ ] Реализовать обработчик `/link <code>` в боте
- [ ] Реализовать rate limiting для `/link`
- [ ] Реализовать обработку сообщений от непривязанных пользователей

---

## Acceptance Criteria

- [ ] Пользователь может сгенерировать код привязки в Settings
- [ ] Код отображается в UI и доступен для копирования
- [ ] Код истекает через 5 минут
- [ ] Код одноразовый — повторное использование возвращает ошибку
- [ ] После `/link <code>` бот подтверждает привязку
- [ ] Web UI показывает статус привязки (привязан / не привязан)
- [ ] Неверный/истёкший код — бот отвечает понятным сообщением об ошибке
- [ ] Rate limit: после 5 неудачных попыток `/link` за минуту бот отвечает "слишком много попыток"
- [ ] Непривязанный пользователь получает инструкцию при отправке сообщения боту

---

## Definition of Done

- [ ] Код прошёл code review
- [ ] Миграция применена на staging
- [ ] Unit-тесты покрывают happy path и error cases
- [ ] Web UI компоненты имеют тесты
- [ ] RLS policies протестированы
- [ ] Документация обновлена

---

## Тест-план

### Unit Tests
- Генерация кода: формат, уникальность
- Валидация кода: верный, неверный, истёкший, уже использованный
- Rate limiting: счётчик, сброс, блокировка
- Handler `/link`: все сценарии (happy path, ошибки)

### Integration Tests
- Полный flow: генерация кода в web -> `/link` в боте -> запись в `telegram_users`
- RLS: пользователь не видит чужие записи в `telegram_users`
- RLS: пользователь не может использовать чужой код

### Manual Tests
- E2E: Settings -> генерация кода -> Telegram -> `/link` -> подтверждение
- Web UI корректно отображает статус привязки

---

## Edge Cases

- Два кода для одного пользователя одновременно (оба активны — какой валиден?)
- Пользователь удалил web-аккаунт — каскадное удаление `telegram_users`
- Telegram chat_id меняется (маловероятно, но теоретически возможно)
- `/link` без аргумента — бот должен ответить подсказкой
- `/link` с пробелами/спецсимволами в коде
- Concurrent запросы `/link` с одним и тем же кодом от разных чатов (race condition)
