# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is an AI-powered lifestyle assistant with two main components:
- **Telegram Bot** (`apps/telegram-bot/`): Primary user interface for journal entries via video/audio/text
- **Web Dashboard** (`apps/web/`): Vue.js SPA for visualizing user data and insights

The system processes user entries through AI to extract emotional metrics, summaries, and insights, storing structured data in Firestore.

## Development Commands

This is a Turborepo monorepo managed with pnpm:

```bash
# Install dependencies
pnpm install

# Development (runs all apps in dev mode)
pnpm dev

# Build all packages
pnpm build

# Lint all packages
pnpm lint

# Format code
pnpm format
```

### Individual App Commands

**Web App** (`apps/web/`):
```bash
cd apps/web
pnpm dev          # Start Vite dev server
pnpm build        # Build for production (Vue + TypeScript)
pnpm preview      # Preview production build
```

**Telegram Bot** (`apps/telegram-bot/`):
- Currently only contains README.md - implementation appears to be pending

## Architecture

### Data Flow
1. Users send messages to Telegram bot (video/audio/text)
2. AI processes entries for transcription, summarization, and analysis
3. MCP backend layer writes structured data to Firestore
4. Web dashboard queries data via MCP API for visualization

### Key Components
- **MCP Backend**: Custom layer handling AI integration and Firestore operations
- **Firestore Schema**: Users, entries, and analysis documents organized by userId
- **AI Integration**: OpenAI API for transcription, analysis, and Q&A
- **Authentication**: Based on Telegram user ID

### Tech Stack
- **Frontend**: Vue 3 + TypeScript + Vite
- **Package Management**: pnpm + Turborepo
- **Database**: Cloud Firestore (NoSQL)
- **AI**: OpenAI API
- **Bot Framework**: Telegram Bot API

## Data Structure

The system stores three main document types in Firestore:
- **users/userId**: Basic user info with telegramId
- **entries/entryId**: Raw user submissions (video/audio/text)
- **analysis/entryId**: AI-processed insights including transcript, summary, metrics (stress, happiness, sleep), events, and personal insights