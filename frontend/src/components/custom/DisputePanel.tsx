import { AlertTriangle, Check, ChevronRight, Copy, Loader2, Sparkles } from 'lucide-react';
import type { DebateAnalysis, DebateStage, DisputeSeverity } from '@shared/types/api';
import { Progress } from '@/components/ui/progress';

interface DisputePanelProps {
  stage: DebateStage | 'idle';
  analysis: DebateAnalysis | null;
  finalText: string;
  confidence: number | null;
  copied?: boolean;
  onCopy?: () => void;
  onOpenDispute: (id: string) => void;
}

const SEVERITY: Record<DisputeSeverity, { label: string; border: string; badge: string }> = {
  high: { label: '高冲突', border: 'border-red-500', badge: 'bg-red-500/20 text-red-400' },
  medium: { label: '中冲突', border: 'border-yellow-500', badge: 'bg-yellow-500/20 text-yellow-400' },
  low: { label: '低冲突', border: 'border-blue-500', badge: 'bg-blue-500/20 text-blue-400' },
};

export default function DisputePanel({
  stage,
  analysis,
  finalText,
  confidence,
  copied,
  onCopy,
  onOpenDispute,
}: DisputePanelProps) {
  const analyzing = stage === 'answering' || stage === 'analyzing';
  const disputes = analysis?.disputes ?? [];

  return (
    <div className="flex flex-col gap-6">
      <div className="rounded-2xl border border-border bg-gradient-to-r from-card to-background p-4 sm:p-6">
        <div className="mb-6 flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-yellow-500/20 text-yellow-500">
            <AlertTriangle className="h-5 w-5" />
          </div>
          <div>
            <h3 className="font-bold">核心争议点分析</h3>
            <p className="text-xs text-muted-foreground">
              {!analysis
                ? analyzing
                  ? '等待各模型回答完成后自动互评…'
                  : '暂无争议分析结果'
                : disputes.length > 0
                  ? `系统已自动识别 ${disputes.length} 处关键分歧`
                  : '各模型观点基本一致,未发现明显分歧'}
            </p>
          </div>
          {stage === 'analyzing' && <Loader2 className="ml-auto h-4 w-4 animate-spin text-primary" />}
        </div>

        {analysis && disputes.length > 0 && (
          <div className="space-y-4">
            {disputes.map((d, index) => {
              const sev = SEVERITY[d.severity];
              return (
                <button
                  key={d.id}
                  type="button"
                  onClick={() => onOpenDispute(d.id)}
                  className={`group min-h-[64px] w-full cursor-pointer rounded-xl border-l-4 bg-white/5 p-4 text-left transition-all hover:bg-white/10 active:scale-[0.99] ${sev.border}`}
                >
                  <div className="mb-2 flex items-start justify-between gap-3">
                    <span className="text-sm font-semibold transition-colors group-hover:text-primary">
                      分歧 {index + 1}: {d.title}
                    </span>
                    <div className="flex shrink-0 items-center gap-2">
                      <span className={`rounded px-2 py-0.5 text-[10px] ${sev.badge}`}>{sev.label}</span>
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground">{d.summary}</p>
                </button>
              );
            })}
          </div>
        )}
        {analysis && disputes.length === 0 && analysis.consensus && (
          <p className="rounded-xl bg-white/5 p-4 text-xs leading-relaxed text-muted-foreground">{analysis.consensus}</p>
        )}
      </div>

      {(stage === 'synthesizing' || finalText) && (
        <div className="rounded-2xl border border-primary/40 bg-card p-4 sm:p-6">
          <div className="mb-4 flex flex-wrap items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400">
              <Sparkles className="h-5 w-5" />
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="font-bold">综合最优答案</h3>
              <p className="text-xs text-muted-foreground">
                {confidence === null ? '正在综合各方观点…' : `综合置信度 ${confidence}% · 主要争议 ${disputes.length} 处`}
              </p>
            </div>
            {confidence !== null && (
              <div className="order-last w-full sm:order-none sm:w-40">
                <Progress value={confidence} className="h-2" />
              </div>
            )}
            {finalText && confidence !== null && onCopy && (
              <button
                type="button"
                onClick={onCopy}
                aria-label="复制综合答案"
                className="inline-flex min-h-[44px] cursor-pointer items-center gap-1.5 rounded-full border border-border px-3 text-xs transition-all hover:bg-white/5"
              >
                {copied ? <Check className="h-4 w-4 text-emerald-400" /> : <Copy className="h-4 w-4" />}
                {copied ? '已复制' : '复制'}
              </button>
            )}
          </div>
          <p className="whitespace-pre-wrap break-words text-sm leading-relaxed">{finalText}</p>
        </div>
      )}
    </div>
  );
}
