# Diary Response Collection via Bot

> Collecting diary answers through Telegram after sending a briefing.

---

## Flow

1. After sending briefing with diary questions, bot enters "diary mode" for that user
2. Set `pending_action` in `bot_conversations` to:
   ```json
   {
     "type": "diary",
     "template_id": "...",
     "current_question": 0,
     "answers": []
   }
   ```
3. User responds to questions one by one (text or voice)
4. For each response:
   - Voice: transcribe via Whisper
   - LLM parses free-form response into structured answer matching question type:
     - `number`: extract number, validate range (1-10)
     - `select`: match to closest option from the list
     - `boolean`: interpret yes/no
     - `text`: store as-is
5. After all questions answered: save as `diary_entries` record
6. Confirm: "Got it, your check-in is saved!"

---

## Edge Cases

| Scenario | Behavior |
|----------|----------|
| User sends unrelated message during diary mode | LLM recognizes it's not an answer, responds appropriately, continues with current question |
| User wants to skip a question | Support "skip" keyword, move to next question, store null for skipped |
| User wants to cancel diary | Support "cancel" keyword, discard partial answers, exit diary mode |
| Timeout (no response within 2 hours) | Exit diary mode silently, discard partial answers |
| User sends a calendar command during diary | Pause diary, handle command, then resume with current question |
| Invalid answer (e.g., "fifteen" for a 1-10 scale) | LLM attempts to parse; if unclear, ask again with hint ("Please answer with a number from 1 to 10") |
