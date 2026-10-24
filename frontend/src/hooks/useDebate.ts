import { useCallback, useEffect, useRef, useState } from 'react';
import type { DebateAnalysis, DebateStage, DebateStreamEvent } from '@shared/types/api';
import { streamDebate } from '@/lib/debateApi';

export type ModelStatus = 'streaming' | 'done' | 'error';

export interface ModelAnswer {
  text: string;
  status: ModelStatus;
  error?: string;
}

export interface DebateState {
  question: string;
  modelIds: string[];
  answers: Record<string, ModelAnswer>;
  stage: DebateStage | 'idle';
  analysis: DebateAnalysis | null;
  finalText: string;
  confidence: number | null;
  error: string | null;
  stopped: boolean;
}

const IDLE: DebateState = {
  question: '',
  modelIds: [],
  answers: {},
  stage: 'idle',
  analysis: null,
  finalText: '',
  confidence: null,
  error: null,
  stopped: false,
};

function reduceEvent(state: DebateState, event: DebateStreamEvent): DebateState {
  switch (event.type) {
    case 'stage':
      return { ...state, stage: event.stage };
    case 'chunk': {
      const prev = state.answers[event.modelId] ?? { text: '', status: 'streaming' as const };
      return {
        ...state,
        answers: { ...state.answers, [event.modelId]: { ...prev, text: prev.text + event.content } },
      };
    }
    case 'model_done': {
      const prev = state.answers[event.modelId] ?? { text: '', status: 'streaming' as const };
      return { ...state, answers: { ...state.answers, [event.modelId]: { ...prev, status: 'done' } } };
    }
    case 'model_error': {
      const prev = state.answers[event.modelId] ?? { text: '', status: 'streaming' as const };
      return {
        ...state,
        answers: { ...state.answers, [event.modelId]: { ...prev, status: 'error', error: event.message } },
      };
    }
    case 'analysis':
      return { ...state, analysis: event.analysis };
    case 'final_chunk':
      return { ...state, finalText: state.finalText + event.content };
    case 'final':
      return { ...state, confidence: event.confidence };
    case 'error':
      return { ...state, error: event.message };
    default:
      return state;
  }
}

export function useDebate() {
  const [state, setState] = useState<DebateState>(IDLE);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => () => abortRef.current?.abort(), []);

  const start = useCallback(async (question: string, modelIds: string[]) => {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    const answers: Record<string, ModelAnswer> = {};
    modelIds.forEach((id) => {
      answers[id] = { text: '', status: 'streaming' };
    });
    setState({ ...IDLE, question, modelIds, answers, stage: 'answering' });

    try {
      await streamDebate({ question, modelIds }, (event) => setState((s) => reduceEvent(s, event)), controller.signal);
      setState((s) => (s.stage === 'done' || s.error ? s : { ...s, stage: 'done' }));
    } catch (error) {
      if (controller.signal.aborted) return;
      const message = error instanceof Error ? error.message : '辩论请求失败';
      setState((s) => ({ ...s, stage: 'done', error: message }));
    }
  }, []);

  const stop = useCallback(() => {
    abortRef.current?.abort();
    setState((s) => {
      if (s.stage === 'idle' || s.stage === 'done') return s;
      const answers: Record<string, ModelAnswer> = {};
      Object.entries(s.answers).forEach(([id, a]) => {
        answers[id] = a.status === 'streaming' ? { ...a, status: 'done' } : a;
      });
      return { ...s, answers, stage: 'done', stopped: true };
    });
  }, []);

  const reset = useCallback(() => {
    abortRef.current?.abort();
    setState(IDLE);
  }, []);

  const running = state.stage !== 'idle' && state.stage !== 'done';

  return { state, running, start, stop, reset };
}
