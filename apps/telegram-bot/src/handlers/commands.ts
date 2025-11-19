import { firestoreService } from '../services/firestore.js';
import { openaiService } from '../services/openai.js';
import { logger } from '../utils/logger.js';
import type { BotContext } from '../types/bot.js';

export async function startCommand(ctx: BotContext): Promise<void> {
  const welcomeMessage = `
🤖 Welcome to your AI Lifestyle Assistant!

I'm here to help you track and understand your daily experiences. You can:

📝 Send me text messages about your day
🎤 Send voice messages 
🎥 Send video messages

I'll analyze your entries and help you understand patterns in your mood, energy, and activities.

You can also ask me questions about your past entries like:
• "How have I been feeling this week?"
• "What activities make me happiest?"
• "How's my sleep been affecting my mood?"

Just start sharing your thoughts and I'll take care of the rest! ✨
  `.trim();

  await ctx.reply(welcomeMessage);
  logger.info('Start command executed', { userId: ctx.user?.id });
}

export async function helpCommand(ctx: BotContext): Promise<void> {
  const helpMessage = `
🆘 How to use your AI Lifestyle Assistant:

**What you can send:**
📝 Text messages - Share your thoughts, feelings, daily activities
🎤 Voice messages - Talk about your day naturally  
🎥 Video messages - Show and tell about your experiences

**What I do:**
🔍 Analyze your emotional state (stress, happiness, energy levels)
📊 Extract important events and activities
💡 Identify personal insights and patterns
📈 Track trends over time

**Ask me questions:**
❓ "How did I sleep last week?"
❓ "What makes me feel energetic?"
❓ "Show me my stress patterns"

**Commands:**
/start - Show welcome message
/help - Show this help message
/stats - Show your recent statistics

Just send me any message to get started! 🚀
  `.trim();

  await ctx.reply(helpMessage);
  logger.info('Help command executed', { userId: ctx.user?.id });
}

export async function statsCommand(ctx: BotContext): Promise<void> {
  if (!ctx.user) {
    await ctx.reply('Authentication required. Please restart with /start');
    return;
  }

  try {
    const recentAnalyses = await firestoreService.getRecentAnalysisForUser(ctx.user.id, 7);
    
    if (recentAnalyses.length === 0) {
      await ctx.reply('No entries found yet. Start by sending me a message about your day! 📝');
      return;
    }

    // Calculate average metrics
    const avgMetrics = recentAnalyses.reduce((acc, analysis) => {
      acc.stress += analysis.metrics.stress;
      acc.anxiety += analysis.metrics.anxiety;
      acc.happiness += analysis.metrics.happiness;
      acc.energy += analysis.metrics.energy;
      return acc;
    }, { stress: 0, anxiety: 0, happiness: 0, energy: 0 });

    const count = recentAnalyses.length;
    const stats = {
      stress: (avgMetrics.stress / count),
      anxiety: (avgMetrics.anxiety / count),
      happiness: (avgMetrics.happiness / count),
      energy: (avgMetrics.energy / count),
    };

    const totalEvents = recentAnalyses.reduce((acc, analysis) => acc + analysis.events.length, 0);
    const totalInsights = recentAnalyses.reduce((acc, analysis) => acc + analysis.insights.length, 0);

    const statsMessage = `
📊 Your Stats (Last ${count} entries):

**Average Levels:**
😰 Stress: ${(stats.stress * 100).toFixed(0)}%
😟 Anxiety: ${(stats.anxiety * 100).toFixed(0)}%
😊 Happiness: ${(stats.happiness * 100).toFixed(0)}%
⚡ Energy: ${(stats.energy * 100).toFixed(0)}%

**Activity:**
🎯 ${totalEvents} events recorded
💡 ${totalInsights} insights discovered

Keep sharing your experiences to build better insights! 🌟
    `.trim();

    await ctx.reply(statsMessage);
    logger.info('Stats command executed', { userId: ctx.user.id, entriesCounted: count });
  } catch (error) {
    logger.error('Stats command failed', { 
      userId: ctx.user.id, 
      error: error instanceof Error ? error.message : error 
    });
    await ctx.reply('Sorry, I couldn\'t retrieve your stats right now. Please try again later.');
  }
}