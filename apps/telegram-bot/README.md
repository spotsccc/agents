# Telegram Bot – AI Lifestyle Assistant

This is the official Telegram bot for the AI Lifestyle Assistant project. The bot allows users to submit journal entries via text, audio, or video messages. These entries are processed by an AI agent to extract meaningful insights, emotional metrics, and summaries. The bot acts as the primary input interface for collecting user data.

## ✨ Features

- **Multi-format Input**: Accepts text, voice, and video messages
- **AI Analysis**: Uses OpenAI to transcribe, summarize and analyze emotional content
- **Smart Q&A**: Answer questions about past entries using context
- **Emotional Metrics**: Tracks stress, anxiety, happiness, and energy levels
- **Event Extraction**: Identifies important activities and experiences
- **Personal Insights**: Discovers patterns and behavioral observations
- **Multi-user Support**: Isolated data per Telegram user ID

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ and pnpm
- Telegram Bot Token (from @BotFather)
- OpenAI API Key
- Firebase/Firestore project

### Installation

1. **Clone and install dependencies:**
   ```bash
   pnpm install
   ```

2. **Setup environment variables:**
   ```bash
   cp .env.example .env
   # Edit .env with your credentials
   ```

3. **Build and run:**
   ```bash
   pnpm build
   pnpm start
   
   # Or for development:
   pnpm dev
   ```

## 🛠️ Development

### Project Structure

```
src/
├── todos.ts              # Main bot entry point
├── config/
│   ├── environment.ts    # Environment configuration
│   └── firebase.ts       # Firebase setup
├── types/                # TypeScript definitions
├── handlers/
│   ├── middleware.ts     # Authentication middleware
│   ├── commands.ts       # Bot commands (/start, /help, /stats)
│   └── message.ts        # Message processing logic
├── services/
│   ├── openai.ts        # OpenAI integration
│   ├── firestore.ts     # Database operations
│   └── media.ts         # File download/processing
└── utils/
    ├── logger.ts        # Logging utility
    └── errors.ts        # Error handling
```

### Available Commands

- `pnpm dev` - Start development server with hot reload
- `pnpm build` - Build TypeScript to JavaScript
- `pnpm start` - Run production build
- `pnpm lint` - Run ESLint

### Bot Commands

- `/start` - Welcome message and bot introduction
- `/help` - Show available features and usage instructions
- `/stats` - Display recent emotional metrics and activity summary

## 📊 Data Flow

1. **User Input**: Text/voice/video message received
2. **Authentication**: User created/retrieved from Firestore
3. **Processing**: Media transcribed, text analyzed by OpenAI
4. **Storage**: Entry and analysis saved to Firestore
5. **Response**: Formatted analysis returned to user

## 🔧 Configuration

Required environment variables in `.env`:

```bash
TELEGRAM_BOT_TOKEN=your_telegram_bot_token
OPENAI_API_KEY=your_openai_api_key
FIREBASE_PROJECT_ID=your_firebase_project_id
FIREBASE_PRIVATE_KEY=your_firebase_private_key
FIREBASE_CLIENT_EMAIL=your_firebase_client_email
NODE_ENV=development
PORT=3000
```