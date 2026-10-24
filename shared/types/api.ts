// Shared API types — single source of truth for frontend ↔ backend contracts.
// Define ALL API request/response interfaces here and import them in both
// backend routes and frontend services.

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

export type DisputeSeverity = 'high' | 'medium' | 'low';

export interface DebateRequest {
  question: string;
  modelIds: string[];
}

export interface DisputePosition {
  modelId: string;
  claim: string;
}

export interface Dispute {
  id: string;
  title: string;
  severity: DisputeSeverity;
  summary: string;
  positions: DisputePosition[];
}

export interface Critique {
  from: string;
  to: string;
  comment: string;
}

export interface DebateAnalysis {
  disputes: Dispute[];
  critiques: Critique[];
  confidences: Record<string, number>;
  consensus: string;
}

export type DebateStage = 'answering' | 'analyzing' | 'synthesizing' | 'done';

export type DebateStreamEvent =
  | { type: 'stage'; stage: DebateStage }
  | { type: 'chunk'; modelId: string; content: string }
  | { type: 'model_done'; modelId: string }
  | { type: 'model_error'; modelId: string; message: string }
  | { type: 'analysis'; analysis: DebateAnalysis }
  | { type: 'final_chunk'; content: string }
  | { type: 'final'; confidence: number }
  | { type: 'error'; message: string };
