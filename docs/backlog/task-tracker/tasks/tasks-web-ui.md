# Tasks Web UI

> Tasks page with CRUD, filters, and sorting.

---

## Page Structure

```
src/pages/tasks/
├── page.vue              # Main page component
├── index.ts              # Public exports
├── components/           # Page-specific components
└── __tests__/            # Tests
```

---

## Features

### 1. Task List

- Displays tasks with status indicators and priority badges
- **Filters**: status (todo / in progress / done), priority (low / medium / high), due date range
- **Sort**: by due date, priority, or creation date
- Empty state for no tasks / no matching filters

### 2. Create Task

- Form (inline or modal)
- Fields: title (required), description, priority (default: medium), due date
- Validation: title is non-empty (Zod schema)
- On success: task appears in list, form resets

### 3. Edit Task

- Inline or modal (same fields as create)
- Optimistic updates via TanStack Vue Query

### 4. Status Change

- Quick toggle: click to cycle todo -> in_progress -> done
- Or checkbox to mark as done directly

### 5. Delete Task

- Confirmation dialog before deletion

---

## Data Fetching

- TanStack Vue Query for server state
- Query key: `['tasks', { status, priority, sort }]`
- Mutations for create/update/delete with optimistic updates
