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
pnpm test:unit    # Run Vitest unit tests
pnpm test:e2e     # Run Playwright E2E tests
pnpm storybook    # Start Storybook component dev environment
pnpm type-check   # Run Vue TypeScript type checking
```

**Telegram Bot** (`apps/telegram-bot/`):
```bash
cd apps/telegram-bot
pnpm dev          # Start bot with hot reload (tsx watch)
pnpm build        # Compile TypeScript to dist/
pnpm start        # Run production build from dist/
pnpm lint         # Run ESLint on TypeScript files
```

## Architecture

### Data Flow
1. Users send messages to Telegram bot (video/audio/text)
2. AI processes entries for transcription, summarization, and analysis
3. Structured data written to Firestore (users, entries, analysis collections)
4. Web dashboard queries data via Supabase client for visualization

### Key Components
- **Telegram Bot**: Telegraf.js-based bot with service-oriented architecture
- **Web App**: Vue 3 + TypeScript with Feature-Sliced Design structure
- **Firestore Schema**: Users, entries, and analysis documents organized by userId
- **AI Integration**: OpenAI API for transcription, analysis, and Q&A
- **Authentication**: Telegram user ID for bot, Supabase Auth for web

### Tech Stack
- **Frontend**: Vue 3 + TypeScript + Vite + Storybook
- **Backend**: Node.js + Telegraf + Firebase Admin SDK
- **Package Management**: pnpm + Turborepo
- **Database**: Cloud Firestore (NoSQL)
- **AI**: OpenAI API (Whisper + GPT-4)
- **Testing**: Vitest (unit) + Playwright (E2E)

## Telegram Bot Architecture

### Service Layer Pattern
The bot uses clean separation with these services:
- **`FirestoreService`**: Database operations (users, entries, analysis)
- **`OpenAIService`**: AI operations (transcription, analysis, Q&A)
- **`MediaService`**: Telegram file downloads and processing

### Data Processing Pipeline
1. **Authentication Middleware** → Auto-creates/fetches user
2. **Message Type Detection** → Routes to text/media handlers
3. **AI Processing** → Transcription (if media) + structured analysis
4. **Database Storage** → Separate entry and analysis records
5. **User Response** → Formatted results with markdown

### Key TypeScript Types
- **`BotContext`**: Extended Telegraf context with user info
- **`User`, `Entry`, `Analysis`**: Core data models
- **`EmotionalMetrics`**: Structured AI analysis (0-1 scales)
- **`EntryType`**: Union type for 'text' | 'audio' | 'video'

## Web App Architecture

### Feature-Sliced Design Structure
```
src/
├── app/           # Application layer (router, global styles)
├── pages/         # Page-level components (feature-based)
├── shared/        # Shared utilities and UI components
  └── ui/          # Design system components
```

### Component System Patterns
- **BaseComponentProps**: Unified styling props interface (spacing, layout, typography)
- **CSS Modules**: Component-scoped styling with global design tokens
- **Composition API**: Modern Vue 3 with `<script setup>` pattern
- **Barrel Exports**: Each component has `ui.vue` + `todos.ts` + `ui.stories.ts`

### Core UI Components
- **VBox**: Base container with styling props
- **VStack**: Flexbox column layout
- **VButton, TextInput**: Form components with validation
- **VGroup**: Layout grouping

### Build & Testing Setup
- **Vite**: Build tool with Vue plugin and TypeScript
- **Storybook**: Component documentation and development
- **Vitest**: Unit testing framework
- **Playwright**: E2E testing
- **ESLint**: Linting with Vue and TypeScript rules

## Data Structure

The system stores three main document types in Firestore:
- **users/userId**: Basic user info with telegramId
- **entries/entryId**: Raw user submissions (video/audio/text)
- **analysis/entryId**: AI-processed insights including transcript, summary, metrics (stress, happiness, sleep), events, and personal insights

### Emotional Metrics Schema
All metrics use normalized 0-1 scales:
- `stress`, `anxiety`, `happiness`, `energy`: Floating point emotional indicators
- `sleepHours`: Actual hours mentioned by user
- `events`: Categorized activities with type/date metadata
- `insights`: Personal pattern recognition and behavioral observations

## Development Patterns

### Error Handling
- **Telegram Bot**: Custom error hierarchy (`BotError`, `ValidationError`, etc.)
- **Web App**: Zod schema validation with reactive error states
- **Logging**: Structured JSON logging with contextual metadata

### Environment Configuration
- **Required Variables**: Bot tokens, API keys, Firebase credentials
- **Validation**: Startup fails if critical configs missing
- **Multi-environment**: NODE_ENV aware behavior

### Code Style Conventions
- **File Naming**: kebab-case for files, PascalCase for components
- **TypeScript**: Strict typing with interface definitions
- **CSS**: Design token system via CSS custom properties
- **Services**: Singleton pattern with stateless operations