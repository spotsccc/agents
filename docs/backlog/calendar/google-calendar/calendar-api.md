# Google Calendar API Integration

> Calendar service module and concrete tool registry for the generic bot-side LLM runtime.

---

## Overview

A service module that wraps Google Calendar API calls and exposes concrete tools for the generic runtime from [bot-llm-integration.md](../bot-infrastructure/bot-llm-integration.md). This task does not build the LLM runtime itself; it plugs Google Calendar actions into it.

---

## Calendar Service Module

Direct API calls via `googleapis` package.

### Functions

| Function | Parameters | Description |
|----------|-----------|-------------|
| `createEvent` | `title`, `start`, `end`, `description?` | Create a new calendar event |
| `updateEvent` | `event_id`, `fields_to_update` | Update an existing event |
| `deleteEvent` | `event_id` | Delete an event |
| `listEvents` | `date_from`, `date_to` | List events in a date range |

### Token Refresh Logic

1. Read encrypted refresh token from `user_google_tokens`
2. Decrypt with `ENCRYPTION_KEY`
3. If access token expired: call Google to refresh
4. Re-encrypt new access token, update `user_google_tokens`
5. Execute calendar API call with valid access token

### Timezone Handling

- User's timezone is stored in `user_settings` (already exists in the project)
- All calendar API calls use the user's timezone
- LLM parses relative dates ("tomorrow", "next Monday") relative to user's current date/timezone
- Google Calendar API accepts timezone-aware datetimes -- always pass explicit timezone

---

## OpenAI Tool Schemas

Define function calling tool schemas matching the calendar service functions. These schemas tell the LLM what tools are available and how to call them.

Example schema for `createEvent`:

```json
{
  "type": "function",
  "function": {
    "name": "createEvent",
    "description": "Create a new Google Calendar event",
    "parameters": {
      "type": "object",
      "properties": {
        "title": { "type": "string", "description": "Event title" },
        "start": { "type": "string", "description": "Start datetime in ISO 8601 format" },
        "end": { "type": "string", "description": "End datetime in ISO 8601 format" },
        "description": { "type": "string", "description": "Optional event description" }
      },
      "required": ["title", "start", "end"]
    }
  }
}
```

Similar schemas for `updateEvent`, `deleteEvent`, `listEvents`.

---

## Wiring into Bot Pipeline

1. Generic bot runtime receives normalized text input
2. Runtime calls OpenAI with tool registry from this task
3. If OpenAI returns a tool call, runtime stores `pending_action` in `bot_conversations`
4. Runtime asks user for confirmation
5. On confirmation, runtime invokes the calendar executor from this task
6. Calendar service module performs Google Calendar API call
7. Runtime returns the executor result to the user
