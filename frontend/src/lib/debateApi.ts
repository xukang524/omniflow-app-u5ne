import type { DebateRequest, DebateStreamEvent } from '@shared/types/api';

export async function streamDebate(
  request: DebateRequest,
  onEvent: (event: DebateStreamEvent) => void,
  signal: AbortSignal,
): Promise<void> {
  const response = await fetch('/api/ai/debate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request),
    signal,
  });

  if (!response.ok) {
    let message = `请求失败 (${response.status})`;
    try {
      const body = await response.json();
      if (body?.error) message = String(body.error);
    } catch {
      // keep default message
    }
    throw new Error(message);
  }
  if (!response.body) throw new Error('服务器没有返回数据流');

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  const handleLine = (line: string): boolean => {
    if (!line.startsWith('data: ')) return false;
    const data = line.slice(6).trim();
    if (data === '[DONE]') return true;
    try {
      onEvent(JSON.parse(data) as DebateStreamEvent);
    } catch {
      console.warn('Failed to parse SSE data');
    }
    return false;
  };

  while (true) {
    const { done, value } = await reader.read();
    if (done) {
      buffer += decoder.decode();
      if (buffer) handleLine(buffer);
      return;
    }
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() || '';
    for (const line of lines) {
      if (handleLine(line)) return;
    }
  }
}
