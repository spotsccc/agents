# Monitoring & Logging

> Structured logging, error alerting, usage tracking.

---

## Structured Logging

Log every bot request as JSON to stdout (Vercel built-in logging):

```json
{
  "user_id": "uuid",
  "telegram_chat_id": 123456,
  "message_type": "voice",
  "intent": "create_event",
  "duration_ms": 2340,
  "success": true,
  "timestamp": "2026-03-05T08:00:00Z"
}
```

### Fields

| Field | Type | Description |
|-------|------|-------------|
| `user_id` | uuid | Supabase user ID |
| `telegram_chat_id` | bigint | Telegram chat ID |
| `message_type` | string | `text` / `voice` |
| `intent` | string | Detected intent (`create_event`, `list_events`, `diary`, etc.) |
| `duration_ms` | number | Total processing time |
| `success` | boolean | Whether the request completed successfully |
| `error` | string? | Error message (if `success = false`) |

---

## Error Alerting

Two options (choose based on scale):

**Option A: External monitoring**
- Vercel logs + Sentry or Datadog
- Real-time alerts for error spikes

**Option B: Lightweight (recommended for MVP)**
- Log errors to a `bot_errors` Supabase table
- Review manually via Supabase dashboard
- Set up simple pg_cron alert if error count exceeds threshold

At minimum, capture:
- Unhandled exceptions
- API failures (Google, OpenAI)
- Timeout errors
- Authentication failures

---

## Usage Tracking

Track per-user daily usage for cost monitoring and abuse detection.

### Schema

```sql
create table user_usage (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  date date not null default current_date,
  messages_count int default 0,
  voice_transcriptions_count int default 0,
  openai_tokens_used int default 0,
  calendar_operations_count int default 0,
  unique(user_id, date)
);
```

### Purpose

- Cost monitoring: track OpenAI and Whisper spending
- Abuse detection: identify unusual usage patterns
- Rate limiting: enforce daily limits based on this table
- Future: billing if multi-user
