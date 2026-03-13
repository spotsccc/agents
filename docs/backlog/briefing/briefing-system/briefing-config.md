# Briefing Configuration

> Database schema for briefing configs + web UI for managing morning/evening briefings.

---

## Database Schema

```sql
create table briefing_configs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  type text not null check (type in ('morning', 'evening')),
  enabled boolean default true,
  send_time time not null,              -- e.g., '08:00'
  timezone text not null default 'UTC',
  include_tasks boolean default true,
  include_calendar boolean default true,
  diary_template_id uuid references diary_templates(id) on delete set null,
  custom_message text,                  -- optional custom intro
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(user_id, type)
);
```

### RLS Policies

- `briefing_configs`: users can CRUD their own configs. Edge Function service role can read all configs (for cron dispatch).

---

## Briefing Configuration (Web UI)

**Page:** `src/pages/settings/` (section) or `src/pages/briefing/` (dedicated page)

### Features

- **Morning briefing config:**
  - Enable/disable toggle
  - Set time (time picker) + timezone (dropdown, default from `user_settings`)
  - Toggle: include today's tasks
  - Toggle: include today's calendar events
  - Select diary template for morning questions (dropdown of active templates)
  - Optional custom intro message
- **Evening briefing config** (same structure)
- **Preview**: show example briefing message based on current config

### Graceful Degradation

- If `include_calendar = true` but user has no Google Calendar connected: show a warning in config UI, and in the actual briefing skip the calendar section with a note ("Connect Google Calendar in settings to see your events here").
- If `diary_template_id` references a deleted/deactivated template: skip diary section in briefing.
