# Bot UX Polish

> Typing indicator, graceful error messages, help command, rate limiting.

---

## Typing Indicator

- Send `sendChatAction('typing')` while processing to show the bot is working
- Especially important during voice transcription and LLM calls (can take several seconds)

---

## Graceful Error Messages

- User-friendly responses for API failures, timeouts, and invalid input
- Never expose stack traces or raw error messages
- Examples:
  - Google Calendar API error: "Couldn't access your calendar right now. Please try again."
  - OpenAI timeout: "I'm having trouble processing your request. Please try again."
  - Unknown error: "Something went wrong. Please try again later."

---

## Help Command

`/help` lists available actions with examples:

```
Here's what I can do:

Calendar:
- "Schedule a meeting tomorrow at 12pm"
- "What's on my calendar today?"
- "Cancel the meeting with Ilya"

Tasks:
- "Add a task: buy groceries"
- "What are my tasks for today?"

Diary:
- "Start my check-in"

Settings:
- /link <code> -- link your Telegram to web account
- /help -- show this message
```

---

## Rate Limiting

| Limit | Value | Behavior |
|-------|-------|----------|
| Messages per minute | Max N per chat | Ignore excess messages, no response |
| Whisper transcriptions per day | Max M per user | Friendly message: "Voice message limit reached for today" |
| OpenAI completions per day | Max K per user | Friendly message: "Message limit reached for today. Try again tomorrow." |

Exact values TBD based on cost analysis. Start conservative, adjust based on usage data.

---

## Unknown Input Handling

If LLM can't determine intent, respond helpfully:

"I'm not sure what you mean. Try /help to see what I can do."
