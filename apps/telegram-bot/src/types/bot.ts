import { Context } from 'telegraf';

export interface BotContext extends Context {
  user?: {
    id: string;
    telegramId: string;
    firstName?: string;
    lastName?: string;
    username?: string;
  };
}