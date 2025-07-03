# Project: AI Lifestyle Assistant

## Overview

This project is an AI-powered assistant designed to help users improve their lifestyle by recording their reflections, analyzing emotional and physical states, and offering actionable insights and recommendations. Users interact with the system primarily through a Telegram bot by sending video, audio, or text messages. The assistant processes this input using AI, stores structured insights, and responds to user queries about past states, events, and trends. A web interface provides dashboards for visualizing this data.

---

## Core Features

### 1. Journaling and Analysis
- Users send video/audio/text entries via Telegram bot.
- AI agent performs the following:
    - Transcribes audio and video content.
    - Summarizes the entry (textual summary).
    - Extracts key metrics:
        - Stress level
        - Anxiety level
        - Happiness index
        - Sleep patterns
        - Energy level
    - Identifies and stores:
        - Important events (e.g., "rode 50km bike")
        - Emotional reactions
        - Personal insights and hypotheses (e.g., "I avoid sharing feelings due to my father’s behavior")

### 2. Contextual Q&A
- Users can query the assistant about previously recorded data, such as:
    - “How many kilometers did I cycle last Tuesday?”
    - “What were my main insights last week?”
    - “Why have I been feeling tired recently?”
- AI uses stored analysis to answer in a contextual, memory-aware way.

### 3. Personalized Recommendations
- Based on patterns and correlations (e.g., low sleep + poor mood), the agent can:
    - Recommend sleep improvements
    - Suggest routines or habits
    - Highlight possible causes of emotional states

### 4. Visual Dashboards
- Users can log into a Vue.js SPA to view:
    - Timeline of events and entries
    - Emotional and physical health metrics over time
    - Notable insights
    - Trends and summaries

---

## Technical Architecture

### User Interaction
- Telegram bot receives user messages (video, audio, text).
- Telegram user ID serves as the primary user identifier.
- Authentication is based on Telegram identity.

### Backend Logic (MCP)
- A custom backend layer (“MCP”) is responsible for:
    - Receiving parsed data from AI
    - Writing structured documents to Firestore
    - Responding to frontend and AI queries
    - Formatting user data for AI prompt injection

### AI Integration
- OpenAI models (via API) are used for:
    - Transcription (audio/video)
    - Summarization
    - Emotional/semantic analysis
    - Answering user questions using stored context

### Data Storage
- Firestore (Cloud Firestore NoSQL) is the primary database.
    - Each user has a set of entries (audio/video/text).
    - Each entry links to an analysis document:
        - `transcript`: full text
        - `summary`: natural language summary
        - `metrics`: structured fields (stress, happiness, etc.)
        - `events`: list of significant happenings
        - `insights`: personal reflections or hypotheses
    - Documents are organized by `userId` and timestamp.

### Frontend
- Vue.js SPA, authenticated via Telegram login.
- Dashboards access data via a secure API powered by the MCP layer.

---

## MVP Notes
- Only Firestore is used at this stage (no vector DB).
- Data is structured to support future embedding-based search or RAG workflows.
- System is designed to support multiple users from the beginning.

---

## Example Firestore Schema

```json
users/userId: {
  telegramId: "123456789",
  createdAt: "..."
}

entries/entryId: {
  userId: "...",
  type: "video" | "audio" | "text",
  createdAt: "...",
  mediaUrl: "...",
  originalText: "...",
}

analysis/entryId: {
  transcript: "...",
  summary: "...",
  metrics: {
    stress: 0.8,
    happiness: 0.4,
    sleepHours: 4
  },
  insights: ["I realized I avoid sharing feelings..."],
  events: [
    { text: "Rode 50km bike", type: "exercise", date: "..." }
  ]
}