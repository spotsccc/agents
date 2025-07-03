# Telegram Bot – AI Lifestyle Assistant

This is the official Telegram bot for the AI Lifestyle Assistant project. The bot allows users to submit journal entries via text, audio, or video messages. These entries are processed by an AI agent to extract meaningful insights, emotional metrics, and summaries. The bot acts as the primary input interface for collecting user data.

---

## ✨ Features

- Accepts **video, audio, or text** messages from users
- Automatically sends messages for:
    - Transcription (if audio/video)
    - Summarization and emotional analysis via AI
- Stores results in Firestore (via MCP backend)
- Allows users to ask questions about their past entries
- Supports multi-user interaction based on **Telegram user ID**