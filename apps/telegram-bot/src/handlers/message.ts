import { firestoreService } from '../services/firestore.js';
import { openaiService } from '../services/openai.js';
import { mediaService } from '../services/media.js';
import { logger } from '../utils/logger.js';
import type { BotContext } from '../types/bot.js';
import type { EntryType } from '../types/entry.js';

export async function handleTextMessage(ctx: BotContext): Promise<void> {
  if (!ctx.user || !ctx.message || !('text' in ctx.message)) {
    return;
  }

  const text = ctx.message.text;
  
  // Check if this is a question (starts with question words or ends with ?)
  const questionWords = ['what', 'how', 'when', 'where', 'why', 'who', 'which', 'can', 'could', 'would', 'should', 'do', 'did', 'does', 'is', 'are', 'was', 'were'];
  const isQuestion = text.endsWith('?') || questionWords.some(word => 
    text.toLowerCase().startsWith(word + ' ')
  );

  if (isQuestion) {
    await handleQuestion(ctx, text);
  } else {
    await processJournalEntry(ctx, 'text', text);
  }
}

export async function handleVoiceMessage(ctx: BotContext): Promise<void> {
  if (!ctx.user || !ctx.message || !('voice' in ctx.message)) {
    return;
  }

  const voice = ctx.message.voice;
  await processMediaEntry(ctx, 'audio', voice.file_id);
}

export async function handleVideoMessage(ctx: BotContext): Promise<void> {
  if (!ctx.user || !ctx.message || !('video' in ctx.message)) {
    return;
  }

  const video = ctx.message.video;
  await processMediaEntry(ctx, 'video', video.file_id);
}

async function processJournalEntry(ctx: BotContext, type: EntryType, text: string, mediaFileId?: string): Promise<void> {
  if (!ctx.user) return;

  try {
    logger.info('Processing journal entry', { userId: ctx.user.id, type, textLength: text.length });
    
    // Send processing message
    const processingMsg = await ctx.reply('📝 Processing your entry...');

    // Create entry in database
    const entry = await firestoreService.createEntry({
      userId: ctx.user.id,
      type,
      originalText: text,
      mediaFileId,
    });

    // Analyze the text with AI
    const analysis = await openaiService.analyzeText(text);

    // Store analysis
    await firestoreService.createAnalysis({
      entryId: entry.id,
      transcript: type !== 'text' ? text : undefined,
      ...analysis,
    });

    // Delete processing message
    await ctx.deleteMessage(processingMsg.message_id);

    // Send analysis results
    const responseMessage = `
✨ **Entry Processed!**

📋 **Summary:** ${analysis.summary}

📊 **Your Levels:**
${getEmotionEmoji(analysis.metrics.stress)} Stress: ${Math.round(analysis.metrics.stress * 100)}%
${getEmotionEmoji(analysis.metrics.anxiety)} Anxiety: ${Math.round(analysis.metrics.anxiety * 100)}%  
${getEmotionEmoji(analysis.metrics.happiness)} Happiness: ${Math.round(analysis.metrics.happiness * 100)}%
${getEmotionEmoji(analysis.metrics.energy)} Energy: ${Math.round(analysis.metrics.energy * 100)}%

${analysis.events.length > 0 ? `🎯 **Events:** ${analysis.events.map(e => e.text).join(', ')}\n` : ''}
${analysis.insights.length > 0 ? `💡 **Insights:** ${analysis.insights.join(' • ')}\n` : ''}
Keep sharing your experiences! 🌟
    `.trim();

    await ctx.reply(responseMessage, { parse_mode: 'Markdown' });
    logger.info('Journal entry processed successfully', { userId: ctx.user.id, entryId: entry.id });

  } catch (error) {
    logger.error('Failed to process journal entry', { 
      userId: ctx.user.id, 
      type,
      error: error instanceof Error ? error.message : error 
    });
    
    await ctx.reply('Sorry, I had trouble processing your entry. Please try again later. 😅');
  }
}

async function processMediaEntry(ctx: BotContext, type: EntryType, fileId: string): Promise<void> {
  if (!ctx.user) return;

  try {
    logger.info('Processing media entry', { userId: ctx.user.id, type, fileId });
    
    const processingMsg = await ctx.reply('🎤 Downloading and transcribing...');

    // Download the media file
    const fileBuffer = await mediaService.downloadFile(fileId);

    // Transcribe audio/video
    const transcript = await openaiService.transcribeAudio(fileBuffer);

    // Update processing message
    await ctx.editMessageText('📝 Analyzing your message...', { message_id: processingMsg.message_id });

    // Process as journal entry with transcript
    await ctx.deleteMessage(processingMsg.message_id);
    await processJournalEntry(ctx, type, transcript, fileId);

  } catch (error) {
    logger.error('Failed to process media entry', { 
      userId: ctx.user.id, 
      type,
      fileId,
      error: error instanceof Error ? error.message : error 
    });
    
    await ctx.reply('Sorry, I had trouble processing your media. Please try again later. 😅');
  }
}

async function handleQuestion(ctx: BotContext, question: string): Promise<void> {
  if (!ctx.user) return;

  try {
    logger.info('Handling question', { userId: ctx.user.id, questionLength: question.length });
    
    const thinkingMsg = await ctx.reply('🤔 Let me think about that...');

    // Get recent analysis for context
    const recentAnalyses = await firestoreService.getRecentAnalysisForUser(ctx.user.id, 20);
    
    if (recentAnalyses.length === 0) {
      await ctx.deleteMessage(thinkingMsg.message_id);
      await ctx.reply('I don\'t have enough data about you yet. Start by sharing some journal entries, then ask me questions! 📝');
      return;
    }

    // Build context from recent analyses
    const context = recentAnalyses.map(analysis => {
      const date = analysis.createdAt.toDateString();
      return `Date: ${date}\nSummary: ${analysis.summary}\nEvents: ${analysis.events.map(e => e.text).join(', ')}\nInsights: ${analysis.insights.join(', ')}\n`;
    }).join('\n---\n');

    // Get AI answer
    const answer = await openaiService.answerQuestion(question, context);

    await ctx.deleteMessage(thinkingMsg.message_id);
    await ctx.reply(`🤖 ${answer}`);
    
    logger.info('Question answered successfully', { userId: ctx.user.id });

  } catch (error) {
    logger.error('Failed to handle question', { 
      userId: ctx.user.id, 
      error: error instanceof Error ? error.message : error 
    });
    
    await ctx.reply('Sorry, I couldn\'t answer your question right now. Please try again later. 🤔');
  }
}

function getEmotionEmoji(level: number): string {
  if (level < 0.3) return '🟢';
  if (level < 0.7) return '🟡';
  return '🔴';
}