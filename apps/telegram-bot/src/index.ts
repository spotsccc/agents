import { Telegraf } from 'telegraf';
import { environment, validateEnvironment } from './config/environment.js';
import { logger } from './utils/logger.js';
import { authMiddleware } from './handlers/middleware.js';
import { startCommand, helpCommand, statsCommand } from './handlers/commands.js';
import { handleTextMessage, handleVoiceMessage, handleVideoMessage } from './handlers/message.js';
import type { BotContext } from './types/bot.js';

async function createBot(): Promise<Telegraf<BotContext>> {
  // Validate environment variables
  validateEnvironment();
  
  // Initialize bot
  const bot = new Telegraf<BotContext>(environment.TELEGRAM_BOT_TOKEN);
  
  // Add authentication middleware
  bot.use(authMiddleware);
  
  // Command handlers
  bot.command('start', startCommand);
  bot.command('help', helpCommand);
  bot.command('stats', statsCommand);
  
  // Message handlers
  bot.on('text', handleTextMessage);
  bot.on('voice', handleVoiceMessage);
  bot.on('video', handleVideoMessage);
  
  // PageError handling
  bot.catch((err, ctx) => {
    logger.error('Bot error occurred', { 
      error: err instanceof Error ? err.message : err,
      userId: ctx.from?.id,
      updateType: ctx.updateType 
    });
  });

  return bot;
}

async function startBot(): Promise<void> {
  try {
    logger.info('Starting Telegram Bot...', { nodeEnv: environment.NODE_ENV });
    
    const bot = await createBot();
    
    // Launch bot
    await bot.launch();
    
    logger.info('Bot launched successfully! 🚀');
    
    // Graceful shutdown
    process.once('SIGINT', () => {
      logger.info('Received SIGINT, shutting down gracefully...');
      bot.stop('SIGINT');
    });
    
    process.once('SIGTERM', () => {
      logger.info('Received SIGTERM, shutting down gracefully...');
      bot.stop('SIGTERM');
    });
    
  } catch (error) {
    logger.error('Failed to start bot', { error: error instanceof Error ? error.message : error });
    process.exit(1);
  }
}

// Start the bot
startBot();