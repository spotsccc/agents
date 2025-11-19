export interface EmotionalMetrics {
  stress: number;
  anxiety: number; 
  happiness: number;
  energy: number;
  sleepHours?: number;
}

export interface Event {
  text: string;
  type: string;
  date: string;
}

export interface Analysis {
  id: string;
  entryId: string;
  transcript?: string;
  summary: string;
  metrics: EmotionalMetrics;
  events: Event[];
  insights: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface AnalysisCreateInput {
  entryId: string;
  transcript?: string;
  summary: string;
  metrics: EmotionalMetrics;
  events: Event[];
  insights: string[];
}