import OpenAI from 'openai';
import { environment } from '../config/environment.js';
import { logger } from '../utils/logger.js';
import { ExternalServiceError } from '../utils/errors.js';
import type { EmotionalMetrics, Event } from '../types/analysis.js';

const openai = new OpenAI({
  apiKey: environment.OPENAI_API_KEY,
});

export class OpenAIService {
  async transcribeAudio(audioBuffer: Buffer): Promise<string> {
    try {
      logger.debug('Starting audio transcription');
      
      const file = new File([audioBuffer], 'audio.ogg', { type: 'audio/ogg' });
      
      const transcription = await openai.audio.transcriptions.create({
        file: file,
        model: 'whisper-1',
        language: 'en',
      });

      logger.info('Audio transcription completed', { length: transcription.text.length });
      return transcription.text;
    } catch (error) {
      logger.error('Audio transcription failed', { error: error instanceof Error ? error.message : error });
      throw new ExternalServiceError('Failed to transcribe audio', 'OpenAI');
    }
  }

  async analyzeText(text: string): Promise<{
    summary: string;
    metrics: EmotionalMetrics;
    events: Event[];
    insights: string[];
  }> {
    try {
      logger.debug('Starting text analysis', { textLength: text.length });

      const prompt = `Analyze the following journal entry and provide:
1. A concise summary (2-3 sentences)
2. Emotional metrics (0-1 scale):
   - stress: stress level
   - anxiety: anxiety level  
   - happiness: happiness level
   - energy: energy level
   - sleepHours: hours of sleep mentioned (if any)
3. Important events mentioned (exercise, work, relationships, etc.)
4. Personal insights or patterns the person might be discovering

Journal entry: "${text}"

Please respond with a JSON object in this exact format:
{
  "summary": "Brief summary of the entry",
  "metrics": {
    "stress": 0.5,
    "anxiety": 0.3,
    "happiness": 0.7,
    "energy": 0.6,
    "sleepHours": 8
  },
  "events": [
    {
      "text": "Went for a 5km run",
      "type": "exercise",
      "date": "today"
    }
  ],
  "insights": [
    "Person seems to find exercise helps with mood"
  ]
}`;

      const response = await openai.chat.completions.create({
        model: 'gpt-4',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.3,
      });

      const content = response.choices[0]?.message?.content;
      if (!content) {
        throw new Error('No response content from OpenAI');
      }

      const analysis = JSON.parse(content);
      logger.info('Text analysis completed');
      
      return analysis;
    } catch (error) {
      logger.error('Text analysis failed', { error: error instanceof Error ? error.message : error });
      throw new ExternalServiceError('Failed to analyze text', 'OpenAI');
    }
  }

  async answerQuestion(question: string, context: string): Promise<string> {
    try {
      logger.debug('Answering question with context', { questionLength: question.length, contextLength: context.length });

      const prompt = `You are an AI assistant helping someone understand their personal journal entries and lifestyle patterns. 

Context from their previous entries:
${context}

User question: ${question}

Please provide a helpful, personalized response based on their journal data. Be supportive and focus on insights that could help them improve their wellbeing.`;

      const response = await openai.chat.completions.create({
        model: 'gpt-4',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.7,
        max_tokens: 500,
      });

      const answer = response.choices[0]?.message?.content;
      if (!answer) {
        throw new Error('No response content from OpenAI');
      }

      logger.info('Question answered successfully');
      return answer;
    } catch (error) {
      logger.error('Question answering failed', { error: error instanceof Error ? error.message : error });
      throw new ExternalServiceError('Failed to answer question', 'OpenAI');
    }
  }
}

export const openaiService = new OpenAIService();