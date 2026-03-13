# Briefing Execution

> Cron job setup + briefing message composition.

---

## Cron Job Setup

### Architecture

```
pg_cron (every 1 minute) --> net.http_post --> Edge Function (briefing-dispatch)
```

### Cron Strategy

- pg_cron runs every **1 minute** for precise delivery
- Edge Function queries `briefing_configs` where:
  - `enabled = true`
  - `send_time` matches current time in user's timezone (with 1-minute window)
- For each matching user, compose and send briefing

**Why 1-minute granularity:** Users expect briefings at the configured time. A 15-minute window would mean up to 14 minutes of delay, which feels broken for a morning routine.

### Idempotency

Track sent briefings in a `briefing_log` table to avoid duplicate sends:

```sql
create table briefing_log (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  briefing_type text not null,
  sent_at timestamptz default now(),
  unique(user_id, briefing_type, (sent_at::date))  -- one per type per day
);
```

---

## Briefing Message Composition

### Data Sources

1. **Tasks** (if `include_tasks`): query `tasks` where `user_id = X` and (`due_date = today` or `due_date < today` and `status != 'done'`)
2. **Calendar** (if `include_calendar`): call Google Calendar API `listEvents` for today, using user's encrypted tokens
3. **Diary questions** (if `diary_template_id` set): fetch template questions

### Message Format (Telegram markdown)

```
Good morning!

Your meetings today:
- 10:00-11:00 Standup
- 14:00-15:30 Call with Ilya

Tasks for today:
- [ ] Fix login bug (high priority)
- [ ] Review PR #42
- [overdue] Submit report (was due yesterday)

Daily check-in:
1. How did you sleep? (1-10)
2. Anxiety level? (1-10)
3. What's your main goal for today?
```

### Error Handling

- If Google Calendar API fails: send briefing without calendar section, log error
- If tasks query fails: send briefing without tasks section, log error
- If entire briefing fails: log error, do not retry (will send next day)
