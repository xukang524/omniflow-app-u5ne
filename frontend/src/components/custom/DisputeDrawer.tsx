import type { DebateAnalysis } from '@shared/types/api';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { getModel } from '@/config/models';
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';
import type { ModelAnswer } from '@/hooks/useDebate';

export type DrawerTarget = { kind: 'dispute' | 'model'; id: string } | null;

interface DisputeDrawerProps {
  target: DrawerTarget;
  onClose: () => void;
  analysis: DebateAnalysis | null;
  answers: Record<string, ModelAnswer>;
}

function ModelTag({ id, suffix }: { id: string; suffix?: string }) {
  const model = getModel(id);
  return (
    <div className="flex items-center gap-2">
      <div className={`h-3 w-3 rounded-full ${model.dot}`} />
      <span className="text-sm font-bold">
        {model.name}
        {suffix}
      </span>
    </div>
  );
}

export default function DisputeDrawer({ target, onClose, analysis, answers }: DisputeDrawerProps) {
  const isMobile = useIsMobile();
  const dispute = target?.kind === 'dispute' ? analysis?.disputes.find((d) => d.id === target.id) : undefined;
  const modelId = target?.kind === 'model' ? target.id : undefined;
  const involved = dispute ? dispute.positions.map((p) => p.modelId) : modelId ? [modelId] : [];
  const critiques = (analysis?.critiques ?? []).filter((c) =>
    dispute ? involved.includes(c.from) && involved.includes(c.to) : c.from === modelId || c.to === modelId,
  );

  const subtitle = dispute ? `分歧: ${dispute.title}` : modelId ? `${getModel(modelId).name} 的完整回答与互评` : '';

  return (
    <Sheet open={!!target} onOpenChange={(open) => !open && onClose()}>
      <SheetContent
        side={isMobile ? 'bottom' : 'right'}
        className={cn(
          'flex flex-col gap-0 border-border bg-card p-0 text-foreground',
          isMobile ? 'h-[85vh] w-full rounded-t-2xl' : 'w-full sm:max-w-[450px]',
        )}
      >
        {isMobile && <div className="mx-auto mt-3 h-1.5 w-12 shrink-0 rounded-full bg-border" />}
        <SheetHeader className="border-b border-border p-4 text-left sm:p-6">
          <SheetTitle asChild>
            <h3 className="text-lg font-bold">争议详情溯源</h3>
          </SheetTitle>
          <SheetDescription className="text-xs text-muted-foreground">{subtitle}</SheetDescription>
        </SheetHeader>

        <div className="no-scrollbar flex-1 space-y-8 overflow-y-auto p-4 pb-[max(1.5rem,env(safe-area-inset-bottom))] sm:p-6">
          {dispute && (
            <>
              <p className="rounded-xl border border-border bg-white/5 p-4 text-sm leading-relaxed">{dispute.summary}</p>
              {dispute.positions.map((p) => (
                <div key={p.modelId} className="space-y-3">
                  <ModelTag id={p.modelId} suffix=" 的原始论据" />
                  <div className="rounded-xl border border-border bg-white/5 p-4">
                    <p className="text-sm leading-relaxed">“{p.claim}”</p>
                  </div>
                </div>
              ))}
            </>
          )}

          {modelId && (
            <div className="space-y-3">
              <ModelTag id={modelId} suffix=" 的原始回答" />
              {analysis?.confidences[modelId] !== undefined && (
                <p className="text-xs text-muted-foreground">裁判评估置信度 {analysis.confidences[modelId]}%</p>
              )}
              <div className="rounded-xl border border-border bg-white/5 p-4">
                <p className="whitespace-pre-wrap break-words text-sm leading-relaxed">{answers[modelId]?.text}</p>
              </div>
            </div>
          )}

          <div className="space-y-4">
            <h4 className="text-sm font-semibold">相互纠错与评价</h4>
            {critiques.length === 0 ? (
              <p className="text-xs text-muted-foreground">暂无相关的互评内容。</p>
            ) : (
              critiques.map((c) => (
                <div key={`${c.from}-${c.to}-${c.comment.slice(0, 12)}`} className="space-y-2 rounded-xl border-l-4 border-yellow-500 bg-white/5 p-4">
                  <p className="text-xs text-muted-foreground">
                    {getModel(c.from).name} → {getModel(c.to).name}
                  </p>
                  <p className="text-sm leading-relaxed">{c.comment}</p>
                </div>
              ))
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
