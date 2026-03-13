# Calendar Commands via Bot

> Creating, editing, deleting, and listing calendar events through natural language.

---

## Supported Operations

| Intent | Example input | LLM extracts |
|--------|--------------|---------------|
| Create | "Schedule a meeting tomorrow at 12pm for 2 hours, call with Ilya" | title, date, time, duration |
| Edit | "Move tomorrow's meeting to 3pm" | event identifier, new time |
| Delete | "Cancel the meeting with Ilya tomorrow" | event identifier |
| List | "What meetings do I have tomorrow?" | date range |

---

## Confirmation Flow

1. User sends message (text or voice)
2. Voice is transcribed via Whisper (if applicable)
3. LLM processes message with function calling tools
4. Bot shows confirmation: "Create event: Tomorrow 12:00-14:00, 'Call with Ilya'. Correct?"
5. User confirms (text "yes" / inline button) -> bot executes via Google Calendar API
6. Bot shows result: "Done! Event created."

For **list** operations, no confirmation is needed -- results are shown directly.

For **edit/delete**, bot first fetches matching events to show what will be changed/deleted.

---

## Edge Cases

### Ambiguous Input
- **Ambiguous dates**: LLM asks follow-up ("Which Tuesday do you mean -- this week or next?")
- **Missing info**: LLM asks for required fields ("How long should the meeting be?")
- **Ambiguous event reference**: for edit/delete, if multiple events match ("Move the meeting" but there are 3 meetings), LLM lists matches and asks user to choose

### Error States
- **No Google Calendar connected**: bot responds with a link to settings page ("You haven't connected Google Calendar yet. Set it up here: <link>")
- **Google token expired/revoked**: bot detects 401, notifies user to reconnect in settings
- **Calendar API error**: user-friendly message ("Couldn't create the event. Please try again.")
- **Confirmation timeout**: if user doesn't respond within TTL (10 min), pending action is discarded

### Voice-specific
- **Transcription ambiguity**: if Whisper produces unclear text, LLM should ask for clarification rather than guess
- **Multiple intents in one message**: handle the primary intent, acknowledge the rest ("I created the meeting. Did you also want me to do something else?")
