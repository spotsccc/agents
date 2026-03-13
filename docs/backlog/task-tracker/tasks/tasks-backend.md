# Tasks Backend

> Database schema, RLS policies, API, and triggers.

---

## Database Schema

```sql
create table tasks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  title text not null,
  description text,
  status text not null default 'todo' check (status in ('todo', 'in_progress', 'done')),
  priority text default 'medium' check (priority in ('low', 'medium', 'high')),
  due_date date,
  completed_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
```

### RLS Policies

- Users can only CRUD their own tasks (`user_id = auth.uid()`)
- Bot service role can read/write tasks on behalf of users (for briefing composition and bot commands)

---

## API

Tasks are accessed via **direct Supabase client queries** with RLS -- no Edge Functions needed for basic CRUD.

### Operations

| Operation | Method | Details |
|-----------|--------|---------|
| List tasks | SELECT | Filter by `status`, `priority`, `due_date`. Sort by `due_date`, `priority`, `created_at` |
| Create task | INSERT | Required: `title`. Optional: `description`, `priority`, `due_date` |
| Update task | UPDATE | Any field. Setting `status = 'done'` auto-sets `completed_at = now()` |
| Delete task | DELETE | Soft delete not needed for MVP -- hard delete with confirmation |

---

## Auto-set `completed_at` Trigger

```sql
create or replace function set_completed_at()
returns trigger as $$
begin
  if NEW.status = 'done' and (OLD.status is null or OLD.status != 'done') then
    NEW.completed_at = now();
  elsif NEW.status != 'done' then
    NEW.completed_at = null;
  end if;
  return NEW;
end;
$$ language plpgsql;

create trigger tasks_set_completed_at
  before insert or update on tasks
  for each row execute function set_completed_at();
```

---

## Briefing Integration

Tasks with `due_date = today` or `due_date < today` (overdue, `status != 'done'`) are queried by the briefing Edge Function. This is a read-only dependency -- no additional API needed.
