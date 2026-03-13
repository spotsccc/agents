# Diary Schema & Template Management

> Database schema for diary templates and entries + web UI for managing templates.

---

## Database Schema

```sql
-- Configurable diary templates
create table diary_templates (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  name text not null,                    -- e.g., "Anxiety & Sleep Diary"
  questions jsonb not null,              -- array of {id, question, type, options?}
  is_active boolean default true,
  created_at timestamptz default now()
);

-- Diary entries (responses)
create table diary_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  template_id uuid references diary_templates(id) on delete set null,
  answers jsonb not null,               -- array of {question_id, answer}
  entry_type text not null check (entry_type in ('morning', 'evening', 'custom')),
  raw_transcript text,                  -- original voice/text from user
  created_at timestamptz default now()
);
```

### Question Types

| Type | Description | Example |
|------|-------------|---------|
| `text` | Free-form text answer | "What's your main goal for today?" |
| `number` | Numeric scale (1-10) | "How did you sleep? (1-10)" |
| `select` | Choose from predefined options | "Mood: happy / neutral / sad / anxious" |
| `boolean` | Yes/No | "Did you exercise today?" |

### Questions JSONB Structure

```json
[
  { "id": "q1", "question": "How did you sleep?", "type": "number", "min": 1, "max": 10 },
  { "id": "q2", "question": "Anxiety level?", "type": "number", "min": 1, "max": 10 },
  { "id": "q3", "question": "Main goal for today?", "type": "text" },
  { "id": "q4", "question": "Mood", "type": "select", "options": ["happy", "neutral", "sad", "anxious"] }
]
```

### RLS Policies

- `diary_templates`: users can CRUD their own templates
- `diary_entries`: users can read their own entries. Bot service role can create entries on behalf of users.

---

## Template Management (Web UI)

**Page:** `src/pages/diary/`

### Features

1. **Template list** -- shows all user's templates with active/inactive status
2. **Create/edit template:**
   - Template name
   - Add/remove/reorder questions (drag & drop)
   - Question type selector (text, scale 1-10, yes/no, select)
   - For `select` type: add/remove options
   - Preview template as it would appear in Telegram
3. **View diary entries history:**
   - List entries grouped by date
   - Filter by template, date range, entry type (morning/evening)
   - Expand entry to see all Q&A pairs
