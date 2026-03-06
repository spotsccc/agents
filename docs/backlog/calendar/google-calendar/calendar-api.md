# Google Calendar API Integration

> Calendar service module + OpenAI function calling tool schemas.

---

## Overview

A service module that wraps Google Calendar API calls and integrates with OpenAI function calling. The bot's LLM uses these tools to execute calendar operations on behalf of the user.

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

1. User message arrives at webhook handler
2. Text (or transcribed voice) is sent to OpenAI with tool schemas
3. If LLM returns a tool call: extract function name + arguments
4. Store as `pending_action` in `bot_conversations` (see [bot-infrastructure.md](./bot-infrastructure.md))
5. Show confirmation to user
6. On confirmation: execute via calendar service module
7. Return result to user
