import { db } from '../config/firebase.js';
import { logger } from '../utils/logger.js';
import { NotFoundError, ValidationError } from '../utils/errors.js';
import type { User, UserCreateInput } from '../types/user.js';
import type { Entry, EntryCreateInput } from '../types/entry.js';
import type { Analysis, AnalysisCreateInput } from '../types/analysis.js';

export class FirestoreService {
  // User operations
  async createUser(userData: UserCreateInput): Promise<User> {
    try {
      const userRef = db.collection('users').doc();
      const now = new Date();
      
      const user: User = {
        id: userRef.id,
        ...userData,
        createdAt: now,
        updatedAt: now,
      };

      await userRef.set({
        ...user,
        createdAt: now.toISOString(),
        updatedAt: now.toISOString(),
      });

      logger.info('User created', { userId: user.id, telegramId: userData.telegramId });
      return user;
    } catch (error) {
      logger.error('Failed to create user', { error: error instanceof Error ? error.message : error });
      throw error;
    }
  }

  async getUserByTelegramId(telegramId: string): Promise<User | null> {
    try {
      const snapshot = await db
        .collection('users')
        .where('telegramId', '==', telegramId)
        .limit(1)
        .get();

      if (snapshot.empty) {
        return null;
      }

      const doc = snapshot.docs[0];
      const data = doc.data();
      
      return {
        id: doc.id,
        telegramId: data.telegramId,
        firstName: data.firstName,
        lastName: data.lastName,
        username: data.username,
        createdAt: new Date(data.createdAt),
        updatedAt: new Date(data.updatedAt),
      };
    } catch (error) {
      logger.error('Failed to get user by telegram ID', { telegramId, error: error instanceof Error ? error.message : error });
      throw error;
    }
  }

  // Entry operations
  async createEntry(entryData: EntryCreateInput): Promise<Entry> {
    try {
      const entryRef = db.collection('entries').doc();
      const now = new Date();
      
      const entry: Entry = {
        id: entryRef.id,
        ...entryData,
        createdAt: now,
        updatedAt: now,
      };

      await entryRef.set({
        ...entry,
        createdAt: now.toISOString(),
        updatedAt: now.toISOString(),
      });

      logger.info('Entry created', { entryId: entry.id, userId: entryData.userId, type: entryData.type });
      return entry;
    } catch (error) {
      logger.error('Failed to create entry', { error: error instanceof Error ? error.message : error });
      throw error;
    }
  }

  async getEntriesByUserId(userId: string, limit: number = 50): Promise<Entry[]> {
    try {
      const snapshot = await db
        .collection('entries')
        .where('userId', '==', userId)
        .orderBy('createdAt', 'desc')
        .limit(limit)
        .get();

      const entries: Entry[] = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          userId: data.userId,
          type: data.type,
          originalText: data.originalText,
          mediaUrl: data.mediaUrl,
          mediaFileId: data.mediaFileId,
          createdAt: new Date(data.createdAt),
          updatedAt: new Date(data.updatedAt),
        };
      });

      logger.debug('Retrieved entries for user', { userId, count: entries.length });
      return entries;
    } catch (error) {
      logger.error('Failed to get entries by user ID', { userId, error: error instanceof Error ? error.message : error });
      throw error;
    }
  }

  // Analysis operations
  async createAnalysis(analysisData: AnalysisCreateInput): Promise<Analysis> {
    try {
      const analysisRef = db.collection('analysis').doc();
      const now = new Date();
      
      const analysis: Analysis = {
        id: analysisRef.id,
        ...analysisData,
        createdAt: now,
        updatedAt: now,
      };

      await analysisRef.set({
        ...analysis,
        createdAt: now.toISOString(),
        updatedAt: now.toISOString(),
      });

      logger.info('Analysis created', { analysisId: analysis.id, entryId: analysisData.entryId });
      return analysis;
    } catch (error) {
      logger.error('Failed to create analysis', { error: error instanceof Error ? error.message : error });
      throw error;
    }
  }

  async getAnalysisByEntryId(entryId: string): Promise<Analysis | null> {
    try {
      const snapshot = await db
        .collection('analysis')
        .where('entryId', '==', entryId)
        .limit(1)
        .get();

      if (snapshot.empty) {
        return null;
      }

      const doc = snapshot.docs[0];
      const data = doc.data();
      
      return {
        id: doc.id,
        entryId: data.entryId,
        transcript: data.transcript,
        summary: data.summary,
        metrics: data.metrics,
        events: data.events,
        insights: data.insights,
        createdAt: new Date(data.createdAt),
        updatedAt: new Date(data.updatedAt),
      };
    } catch (error) {
      logger.error('Failed to get analysis by entry ID', { entryId, error: error instanceof Error ? error.message : error });
      throw error;
    }
  }

  async getRecentAnalysisForUser(userId: string, limit: number = 10): Promise<Analysis[]> {
    try {
      // First get recent entries for the user
      const entriesSnapshot = await db
        .collection('entries')
        .where('userId', '==', userId)
        .orderBy('createdAt', 'desc')
        .limit(limit)
        .get();

      if (entriesSnapshot.empty) {
        return [];
      }

      const entryIds = entriesSnapshot.docs.map(doc => doc.id);
      
      // Get analysis for those entries
      const analysisPromises = entryIds.map(entryId => 
        this.getAnalysisByEntryId(entryId)
      );
      
      const analysisResults = await Promise.all(analysisPromises);
      const analyses = analysisResults.filter((analysis): analysis is Analysis => analysis !== null);

      logger.debug('Retrieved recent analysis for user', { userId, count: analyses.length });
      return analyses;
    } catch (error) {
      logger.error('Failed to get recent analysis for user', { userId, error: error instanceof Error ? error.message : error });
      throw error;
    }
  }
}

export const firestoreService = new FirestoreService();