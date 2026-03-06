# Diary Viewing

> Diary history page + analytics (stretch).

---

## Diary History Page

**Page:** `src/pages/diary/` (entries tab or sub-route)

### Features

- List diary entries grouped by date
- Each entry shows: date, template name, entry type (morning/evening), summary
- Expand to see all Q&A pairs
- Filter by: template, date range, entry type

### Data Fetching

- TanStack Vue Query with query key: `['diary-entries', { template, dateRange, entryType }]`
- Pagination or infinite scroll for long histories

---

## Diary Analytics (Stretch)

> Not required for MVP. Implement after core briefing flow is working.

### Features

- Charts for numeric questions over time (e.g., "Sleep quality last 30 days")
- Simple line/bar charts (consider `chart.js` or `echarts`)
- Statistics: averages, min/max, trends
- Filter by template and date range

### Technical Notes

- Query aggregated data server-side to avoid fetching all entries to the client
- Consider a Supabase view or Edge Function for aggregation
