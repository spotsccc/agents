# Telegram Account Linking Web UI

> Authenticated settings UI in `apps/web` for generating a one-time Telegram linking code, copying the `/link` command, and showing the current linking status.

---

## Описание

### Проблема

Сейчас задача привязки аккаунта смешивает backend/bot поток и web UI. Из-за этого frontend-часть нельзя оценить и реализовать независимо: не определены route structure, UI states, polling strategy и набор автоматических тестов.

### Цель

Создать отдельную задачу для `apps/web`, чтобы пользователь мог:
- открыть settings в авторизованной web app;
- сгенерировать одноразовый код привязки;
- скопировать готовую команду `/link <code>`;
- увидеть, что Telegram успешно привязан, без ручного обновления страницы.

### Кто использует результат

- Конечный пользователь web app: запускает linking flow из браузера.
- Bot UX и другие product flows: могут безопасно ссылаться на settings page как на точку входа для привязки.
- Следующие задачи (`google-oauth`, calendar-related settings): переиспользуют settings route и integrations layout.

### Связанные задачи

- Backend contracts: [bot-account-linking.md](./bot-account-linking.md)
- Telegram-side consume flow: [bot-link-command.md](./bot-link-command.md)
- Future Google settings UX: [../google-calendar/google-oauth.md](../google-calendar/google-oauth.md)

---

## Предусловия выполнения (для AI-агента)

- Backend-задача [bot-account-linking.md](./bot-account-linking.md) должна предоставить web-доступные контракты для:
  - чтения текущего статуса привязки;
  - генерации нового одноразового кода.
- Фактическое завершение linking flow в Telegram происходит в [bot-link-command.md](./bot-link-command.md), но UI этой задачи должен тестироваться полностью на mock-контрактах без ручного шага в Telegram.
- Проверка linking flow должна быть полностью автоматизирована. Никаких ручных шагов в Telegram или браузере в рамках DoD.
- Если route `/settings` отсутствует, он создаётся в рамках этой задачи.
- Browser/E2E-проверки не должны требовать live Supabase project, реального Telegram bot или ручной авторизации; для них используются mocked auth state и mocked responses edge-function wrappers / network interception.
- Важно: текущий router guard запрашивает `user_settings.onboarding_finished` напрямую. Browser/E2E harness этой задачи обязан явно мокать и auth state, и onboarding lookup, иначе `/settings` будет зависеть от live Supabase.

---

## Бизнес-сценарии

### Happy Path

1. Авторизованный пользователь открывает `/settings`
2. В секции `Telegram` UI показывает статус `Not linked`
3. Пользователь нажимает `Generate code`
4. UI получает активный код и показывает:
   - код в monospace-виде;
   - время истечения;
   - кнопку `Copy command`
5. Кнопка копирует строку `/link <code>`
6. Пока код активен, UI автоматически обновляет статус привязки
7. После успешной привязки в Telegram UI переключается в состояние `Linked`

### Повторная генерация кода

1. У пользователя уже отображается активный код
2. Пользователь нажимает `Generate new code`
3. UI показывает новый код и новый TTL
4. Старый код больше не отображается

### Код истёк до привязки

1. UI получает статус с истёкшим кодом или countdown доходит до нуля
2. Секция показывает `Code expired`
3. Пользователь может нажать `Generate new code`

### Пользователь уже привязан

1. Пользователь открывает `/settings`
2. UI показывает статус `Linked`
3. Если backend вернул `telegram_username`, он отображается рядом со статусом
4. Кнопка генерации нового кода недоступна, пока unlink flow не реализован отдельной задачей

### Ошибка backend-контракта

1. Запрос на статус или генерацию кода завершается ошибкой
2. UI показывает inline error без поломки страницы
3. Пользователь может повторить запрос через `Retry` или повторный клик по `Generate code`

---

## Технические решения

### Route Structure

- Добавить route `/settings` в `apps/web/src/app/router/index.ts`, если он ещё не существует
- Route размещается под существующим защищённым layout (`AuthLayout`) и использует текущие guard'ы `requiresAuth`
- Задача не меняет существующую onboarding-логику router:
  - неавторизованный пользователь перенаправляется на `/auth/sign-in`
  - пользователь с незавершённым onboarding продолжает перенаправляться на `/onboarding`
  - browser/E2E happy-path этой задачи использует авторизованного пользователя с завершённым onboarding
  - browser/E2E и router-level tests обязаны стабилизировать `fetchOnboardingStatus()` через mock `supabase.from('user_settings')` или эквивалентный network intercept
- Создать page slice:
  - `apps/web/src/pages/settings/page.vue`
  - `apps/web/src/pages/settings/index.ts`
  - `apps/web/src/pages/settings/components/telegram-linking-card.vue`
  - `apps/web/src/pages/settings/composables/use-telegram-linking.ts`
- Добавить typed wrappers:
  - `apps/web/src/shared/supabase/edge-functions/get-telegram-link-status.ts`
  - `apps/web/src/shared/supabase/edge-functions/generate-telegram-link-code.ts`
  - экспорт из `apps/web/src/shared/supabase/edge-functions/index.ts`
- Структура страницы должна быть расширяемой для следующих integrations/settings sections, а не жёстко заточенной только под Telegram

### Backend Contract Consumed by UI

UI ожидает два действия, скрытые за page-level composable или typed wrapper:

1. `getTelegramLinkStatus()`
2. `generateTelegramLinkCode()`

Минимальная форма данных:

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

Требования к контракту:
- wrappers используют `invokeEdgeFunction()` и возвращают `EdgeFunctionResult<T>`
- `generateTelegramLinkCode()` возвращает только один активный код
- при повторной генерации UI получает уже новый `activeCode`
- если пользователь уже привязан, `activeCode` возвращается как `null`
- `generateTelegramLinkCode()` может вернуть HTTP-ошибку с `message = 'already_linked'`
- `getTelegramLinkStatus()` и `generateTelegramLinkCode()` могут вернуть auth-ошибки backend-контрактов:
  - `Missing authorization header`
  - `Unauthorized`

Если backend реализован как Supabase Edge Function, добавить typed wrapper в `apps/web/src/shared/supabase/edge-functions/`.

### Error Handling Contract

- `Missing authorization header` и `Unauthorized` во время initial load, generate или polling трактуются как потеря auth-сессии:
  - UI не остаётся в зависшем состоянии
  - пользователь перенаправляется на `/auth/sign-in`
  - отдельный inline error для этого кейса не обязателен
- `already_linked` при `generateTelegramLinkCode()` не показывается как generic error:
  - UI немедленно refetch-ит `getTelegramLinkStatus()`
  - если status подтверждает `linked = true`, секция переходит в состояние `linked`
- transient ошибки (`relay`, `fetch`, HTTP 5xx или другой неожиданный backend error) показываются inline:
  - последняя успешная версия `activeCode` и countdown не очищаются
  - пользователь может нажать `Retry` для немедленного refetch
- Пока запрос generate выполняется, CTA генерации disabled, чтобы не создавать дублирующие запросы из одного UI-сеанса

### UI States

Секция `Telegram` должна поддерживать состояния:
- `loading`
- `not-linked`
- `not-linked-with-active-code`
- `expired-code`
- `linked`
- `error`

Для активного кода показывать:
- текст кода;
- countdown до истечения;
- кнопку копирования `/link <code>`;
- helper text с инструкцией отправить команду боту.

### Polling Strategy

- Пока `linked = false` и `activeCode` существует, UI polling-ом обновляет статус каждые 5 секунд
- Polling останавливается, если:
  - `linked = true`;
  - `activeCode = null`;
  - код истёк
- Countdown вычисляется локально по `activeCode.expiresAt`
- Если countdown доходит до нуля до следующего poll, UI переходит в `expired-code` и останавливает polling без ожидания следующего server response
- После успешной генерации нового кода старый timer/polling cleanup выполняется до запуска нового цикла
- При unmount страницы/компонента все timers и polling cleanup обязательно останавливаются
- После reload страницы активный код должен восстанавливаться из `getTelegramLinkStatus()`, а не только из локального state

### UX Requirements

- Все CTA и статусы формулируются однозначно: `Generate code`, `Generate new code`, `Copy command`, `Linked`, `Not linked`, `Code expired`
- При успешном копировании UI показывает ненавязчивое подтверждение (`Copied`)
- При отказе Clipboard API UI показывает fallback error message, но код остаётся видимым

### Затронутые компоненты

- `apps/web/src/app/router/index.ts`
- `apps/web/src/pages/settings/page.vue`
- `apps/web/src/pages/settings/index.ts`
- `apps/web/src/pages/settings/components/telegram-linking-card.vue`
- `apps/web/src/pages/settings/composables/use-telegram-linking.ts`
- `apps/web/src/pages/settings/__tests__/*`
- `apps/web/src/shared/supabase/edge-functions/get-telegram-link-status.ts`
- `apps/web/src/shared/supabase/edge-functions/generate-telegram-link-code.ts`
- `apps/web/src/shared/supabase/edge-functions/index.ts`
- `apps/web/e2e/*`

---

## Scope

- [ ] Добавить защищённый route `/settings` в web app, если его ещё нет
- [ ] Создать settings page / integrations layout для будущих секций
- [ ] Добавить typed wrappers для `getTelegramLinkStatus()` и `generateTelegramLinkCode()`
- [ ] Реализовать Telegram linking card с загрузкой статуса
- [ ] Интегрировать генерацию одноразового кода через backend-контракт
- [ ] Реализовать отображение активного кода, TTL и copy action
- [ ] Реализовать polling статуса до успешной привязки или истечения кода
- [ ] Реализовать linked-state с Telegram metadata
- [ ] Реализовать auth-aware error handling и redirect для `Missing authorization header` / `Unauthorized`
- [ ] Реализовать graceful handling для `already_linked` и transient polling errors
- [ ] Покрыть page/composable/component автоматическими тестами
- [ ] Добавить automated browser/E2E coverage с mock auth и mock backend responses без ручного Telegram шага

### Out of Scope

- Database migrations и RLS policies
- Bot-side обработка `/link`
- Unlink flow
- Настройка Telegram Bot API или webhook

---

## Acceptance Criteria

- [ ] `pnpm --filter web type-check` завершается с exit code `0`
- [ ] `pnpm --filter web lint:check` завершается с exit code `0`
- [ ] `pnpm --filter web format:check` завершается с exit code `0`
- [ ] `pnpm --filter web test:unit` завершается с exit code `0`
- [ ] `pnpm --filter web test:e2e` завершается с exit code `0`
- [ ] В `apps/web/src/shared/supabase/edge-functions/` существуют wrappers `get-telegram-link-status.ts` и `generate-telegram-link-code.ts`, экспортированные через `index.ts`
- [ ] Неавторизованный пользователь при открытии `/settings` перенаправляется на `/auth/sign-in`
- [ ] Авторизованный пользователь может открыть `/settings`
- [ ] Авторизованный пользователь с незавершённым onboarding при открытии `/settings` продолжает перенаправляться на `/onboarding`
- [ ] Browser/E2E и router-level tests для `/settings` не используют live Supabase для onboarding guard; `user_settings.onboarding_finished` мокается явно
- [ ] На странице есть секция `Telegram` со статусом привязки
- [ ] Если пользователь не привязан и активного кода нет, UI показывает `Not linked` и кнопку `Generate code`
- [ ] После успешной генерации UI показывает одноразовый код и кнопку `Copy command`
- [ ] Кнопка `Copy command` копирует строку формата `/link <code>`
- [ ] На экране одновременно отображается не более одного активного кода
- [ ] Если код перегенерирован, UI заменяет старый код новым без reload страницы
- [ ] Пока код активен и пользователь не привязан, UI автоматически обновляет статус каждые 5 секунд
- [ ] После перехода в linked-state UI скрывает блок активного кода и останавливает polling
- [ ] Если код истёк, UI показывает `Code expired` и CTA для генерации нового кода
- [ ] `generateTelegramLinkCode()` с backend error `already_linked` приводит к refetch статуса и переходу UI в linked-state без generic error banner
- [ ] Auth-ошибки (`Missing authorization header`, `Unauthorized`) при initial load, generate или polling перенаправляют пользователя на `/auth/sign-in`
- [ ] Transient ошибки загрузки статуса, generate или polling отображаются inline и не очищают последнюю успешную версию активного кода
- [ ] Пока generate-запрос в полёте, кнопка `Generate code` / `Generate new code` disabled и не создаёт повторных запросов
- [ ] Browser/E2E-тесты этой задачи выполняются на mocked auth/backend responses без реального Telegram bot и без live Supabase Edge Functions

---

## Definition of Done

- [ ] `apps/web` содержит settings route под существующим защищённым layout и Telegram linking UI
- [ ] Typed wrappers для linking contracts добавлены и экспортируются из `src/shared/supabase/edge-functions/index.ts`
- [ ] Unit/browser tests покрывают основные состояния UI, interactions, auth redirects и polling cleanup
- [ ] Автоматизированный browser/E2E test покрывает flow `generate code -> status refresh -> linked state` на mock auth/mock backend responses без ручного Telegram шага
- [ ] В задаче нет manual steps и ручных проверок

---

## Тест-план

### Unit / Browser Tests

- `use-telegram-linking.ts`:
  - загрузка статуса
  - генерация кода
  - обработка `already_linked`
  - обработка transient ошибок
  - redirect на `/auth/sign-in` при `Missing authorization header` / `Unauthorized`
- `telegram-linking-card.vue`: состояния `loading`, `not linked`, `active code`, `expired`, `linked`, `error`
- Copy action:
  - успешный `navigator.clipboard.writeText`
  - ошибка Clipboard API
- Polling:
  - стартует только при наличии `activeCode`
  - останавливается после `linked = true`
  - останавливается после истечения кода
  - очищается на unmount
- Router / page integration:
  - unauthenticated user -> redirect на `/auth/sign-in`
  - authenticated onboarded user -> доступ к `/settings`
  - authenticated user without onboarding -> redirect на `/onboarding`
  - router guard onboarding lookup стабилизирован через явный mock `supabase.from('user_settings')` или network intercept
- Generate CTA:
  - disabled в pending-state
  - повторный клик в pending-state не создаёт второй запрос

### Integration / E2E Tests

- Playwright или эквивалентный browser test использует mocked auth state и mocked backend responses; live Supabase/Telegram не требуются
- Playwright или эквивалентный browser test дополнительно мокает onboarding lookup, который router делает в `user_settings`
- Авторизованный onboarded пользователь открывает `/settings` и видит `Not linked`
- После mock-успеха генерации UI показывает `/link <code>`
- После mock-обновления статуса до `linked = true` UI переключается в linked-state без reload страницы
- После mock-expired response UI показывает `Code expired`
- При mock-auth failure во время polling пользователь уходит на `/auth/sign-in`

---

## Edge Cases

- Пользователь открывает `/settings` в двух вкладках и генерирует код в обеих
- Backend возвращает `linked = true` и `activeCode != null` одновременно; UI доверяет `linked` как приоритетному состоянию
- `generateTelegramLinkCode()` возвращает `already_linked` из-за race с Telegram-side linking или другой вкладкой; UI refetch-ит status и показывает `Linked`
- Страница перезагружается, пока код ещё активен
- `telegram_username` отсутствует; UI всё равно показывает `Linked`
- Clipboard API недоступен в текущем окружении браузера
- Transient polling error происходит после успешной генерации; UI сохраняет видимый код и позволяет retry без потери состояния
- Пользователь быстро нажимает `Generate code` несколько раз; UI отправляет не больше одного запроса, пока предыдущий не завершился
- Auth session истекла до завершения polling; UI перенаправляет пользователя на `/auth/sign-in`
