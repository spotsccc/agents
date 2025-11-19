import { firestoreService } from '../services/firestore.js';
import { logger } from '../utils/logger.js';
import type { BotContext } from '../types/bot.js';

export async function authMiddleware(ctx: BotContext, next: () => Promise<void>): Promise<void> {
  try {
    const telegramUser = ctx.from;
    
    if (!telegramUser) {
      logger.warn('Message received without user information');
      return;
    }

    // Try to get existing user
    let user = await firestoreService.getUserByTelegramId(telegramUser.id.toString());
    
    // Create user if doesn't exist
    if (!user) {
      user = await firestoreService.createUser({
        telegramId: telegramUser.id.toString(),
        firstName: telegramUser.first_name,
        lastName: telegramUser.last_name,
        username: telegramUser.username,
      });
      
      logger.info('New user registered', { 
        userId: user.id, 
        telegramId: user.telegramId,
        username: user.username 
      });
    }

    // Attach user to context
    ctx.user = user;
    
    await next();
  } catch (error) {
    logger.error('Authentication middleware error', { 
      error: error instanceof Error ? error.message : error,
      userId: ctx.from?.id 
    });
    
    await ctx.reply('Sorry, there was an authentication error. Please try again.');
  }
}