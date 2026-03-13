# External Prerequisite: Bot Provider Bootstrap

> Human-operated prerequisite for the bot infrastructure epic. This document is not an AI-agent implementation task and is tracked separately because it requires provider UI access, credential issuance, and secret management outside the repository.

---

## Why This Exists

Задачи в `bot-infrastructure` intentionally описывают только то, что можно реализовать и проверить в репозитории автоматизированно. При этом end-to-end проверка bot runtime зависит от внешних провайдеров:

- Telegram BotFather
- Vercel project configuration
- secret management для preview/production environments

Без этих шагов AI-агент может написать код и локальные тесты, но не может самостоятельно довести production webhook до рабочего состояния.

---

## Required Outputs

Перед началом bot-epic должны существовать и быть переданы в безопасный secret store:

- `TELEGRAM_BOT_TOKEN`
- `TELEGRAM_WEBHOOK_SECRET`
- production webhook base URL для `apps/bot`
- Vercel project, связанный с репозиторием и `Root Directory = apps/bot`

До задач linking/LLM/voice также должны быть готовы:

- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `OPENAI_API_KEY`

---

## Human Checklist

- [x] Создать Telegram bot через BotFather и сохранить `TELEGRAM_BOT_TOKEN`
- [x] Сгенерировать случайный `TELEGRAM_WEBHOOK_SECRET` для production webhook verification
- [x] Связать Vercel project с текущим репозиторием и директорией `apps/bot`
- [x] Настроить preview/production env variables в Vercel для bot runtime
- [x] Зафиксировать production HTTPS URL вида `https://<host>/api/telegram`
- [x] Передать секреты в используемый командой secret store или локальный bootstrap process вне git

---

## Exit Criteria

- [x] Секреты существуют вне репозитория и доступны для CI/runtime
- [x] Production URL известен заранее и подходит для `setWebhook`
- [x] Внешний bootstrap больше не блокирует задачи `bot-telegram-skeleton.md` и `bot-webhook-hardening.md`
