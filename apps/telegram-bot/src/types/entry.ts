export type EntryType = 'text' | 'audio' | 'video';

export interface Entry {
  id: string;
  userId: string;
  type: EntryType;
  originalText?: string;
  mediaUrl?: string;
  mediaFileId?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface EntryCreateInput {
  userId: string;
  type: EntryType;
  originalText?: string;
  mediaUrl?: string;
  mediaFileId?: string;
}