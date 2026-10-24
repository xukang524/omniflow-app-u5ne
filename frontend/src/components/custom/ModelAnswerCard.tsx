import { Loader2 } from 'lucide-react';
import type { Dispute } from '@shared/types/api';
import { getModel } from '@/config/models';
import type { ModelAnswer } from '@/hooks/useDebate';

interface ModelAnswerCardProps {
  modelId: string;
  answer: ModelAnswer;
  confidence?: number;
  disputes: Dispute[];
  analyzed: boolean;
  onViewDetail: () => void;
  onViewCritique: () => void;
}

export default function ModelAnswerCard({
  modelId,
  answer,
  confidence,
  disputes,
  analyzed,
  onViewDetail,
  onViewCritique,
}: ModelAnswerCardProps) {
  const model = getModel(modelId);
  const disputed = disputes.some((d) => d.severity !== 'low' && d.positions.some((p) => p.modelId === modelId));

  let badge: JSX.Element;
  if (answer.status === 'streaming') {
    badge = (
      <span className="inline-flex items-center gap-1 rounded border border-primary/20 bg-primary/10 px-2 py-0.5 text-[10px] text-blue-400">
        <Loader2 className="h-3 w-3 animate-spin" /> 生成中
      </span>
    );
  } else if (answer.status === 'error') {
    badge = (
      <span className="rounded border border-red-500/20 bg-red-500/10 px-2 py-0.5 text-[10px] text-red-400">回答失败</span>
    );
  } else if (!analyzed) {
    badge = (
      <span className="rounded border border-border bg-white/5 px-2 py-0.5 text-[10px] text-muted-foreground">等待互评</span>
    );
  } else if (disputed) {
    badge = (
      <span className="rounded border border-yellow-500/20 bg-yellow-500/10 px-2 py-0.5 text-[10px] text-yellow-400">存在争议</span>
    );
  } else {
    badge = (
      <span className="rounded border border-green-500/20 bg-green-500/10 px-2 py-0.5 text-[10px] text-green-400">
        置信度 {confidence ?? 75}%
      </span>
    );
  }

  const canOpen = answer.status !== 'streaming' && !!answer.text;

  return (
    <div className="flex min-w-0 flex-col gap-3">
      <div className="flex items-center gap-2 px-2">
        <div className={`h-2 w-2 rounded-full ${model.dot}`} />
        <span className="text-xs font-bold">{model.name}</span>
        <span className="text-[10px] text-muted-foreground">{model.provider}</span>
      </div>
      <div className="flex h-full flex-col gap-3 rounded-xl border border-border bg-card p-4">
        <p className="no-scrollbar max-h-64 min-h-24 overflow-y-auto whitespace-pre-wrap break-words text-xs leading-relaxed text-muted-foreground">
          {answer.text || (answer.status === 'error' ? answer.error : '等待模型响应…')}
        </p>
        <div className="mt-auto flex items-center justify-between border-t border-border pt-3">
          {badge}
          <button
            type="button"
            disabled={!canOpen}
            onClick={disputed ? onViewCritique : onViewDetail}
            className="min-h-[44px] cursor-pointer px-2 text-xs text-primary hover:underline disabled:cursor-not-allowed disabled:opacity-40"
          >
            {disputed ? '查看纠错' : '查看详情'}
          </button>
        </div>
      </div>
    </div>
  );
}
