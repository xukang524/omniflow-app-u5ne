import { useEffect, useRef, useState } from 'react';
import { ArrowRight, StopCircle, Plus, RotateCcw, Square } from 'lucide-react';
import { toast } from 'sonner';
import OmniflowBadge from '@/components/custom/OmniflowBadge';
import { Toaster } from '@/components/ui/sonner';
import AppNavbar from '@/components/custom/AppNavbar';
import ModelPicker from '@/components/custom/ModelPicker';
import ModelAnswerCard from '@/components/custom/ModelAnswerCard';
import DisputePanel from '@/components/custom/DisputePanel';
import DisputeDrawer, { type DrawerTarget } from '@/components/custom/DisputeDrawer';
import { DEFAULT_MODEL_IDS, SAMPLE_QUESTIONS } from '@/config/models';
import { useDebate } from '@/hooks/useDebate';
import { cn } from '@/lib/utils';
const MAX_QUESTION_LENGTH = 2000;
const STAGE_LABEL: Record<string, string> = {
  answering: 'AI 协作推理中 · 各模型独立作答',
  analyzing: 'AI 相互纠错中 · 识别争议点',
  synthesizing: 'AI 协作推理中 · 生成综合答案',
  done: '辩论完成'
};
const STEPS = [{
  key: 'answering',
  label: '独立作答'
}, {
  key: 'analyzing',
  label: '相互纠错'
}, {
  key: 'synthesizing',
  label: '综合答案'
}, {
  key: 'done',
  label: '完成'
}];
function StageStepper({
  stage
}: {
  stage: string;
}) {
  const current = STEPS.findIndex(s => s.key === stage);
  return <ol className="flex items-center gap-2" aria-label="辩论进度">
      {STEPS.map((step, i) => {
      const reached = i < current || stage === 'done';
      const active = i === current && stage !== 'done';
      return <li key={step.key} className="flex flex-1 flex-col gap-1.5" aria-current={active ? 'step' : undefined}>
            <div className={cn('h-1.5 rounded-full transition-all duration-500', reached ? 'bg-primary' : active ? 'animate-pulse bg-primary/60' : 'bg-border')} />
            <span className={cn('truncate text-[10px] sm:text-xs', reached || active ? 'font-medium text-foreground' : 'text-muted-foreground')}>
              {step.label}
            </span>
          </li>;
    })}
    </ol>;
}
const Index = () => {
  const {
    state,
    running,
    start,
    stop,
    reset
  } = useDebate();
  const [selected, setSelected] = useState<string[]>(DEFAULT_MODEL_IDS);
  const [input, setInput] = useState('');
  const [drawer, setDrawer] = useState<DrawerTarget>(null);
  const [copied, setCopied] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const endRef = useRef<HTMLDivElement>(null);
  const topRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (state.error) toast.error(state.error);
  }, [state.error]);
  useEffect(() => {
    if (state.stage === 'analyzing' || state.stage === 'synthesizing') {
      endRef.current?.scrollIntoView({
        behavior: 'smooth',
        block: 'end'
      });
    }
    if (state.stage === 'done' && state.finalText && !state.stopped) {
      toast.success('辩论完成', {
        description: '已生成综合最优答案'
      });
    }
  }, [state.stage, state.finalText, state.stopped]);
  const submit = (question: string) => {
    const q = question.trim();
    if (!q || running) return;
    if (selected.length < 2) {
      toast.warning('请至少选择 2 个模型');
      return;
    }
    setDrawer(null);
    setInput('');
    setCopied(false);
    if (textareaRef.current) textareaRef.current.style.height = 'auto';
    void start(q, selected);
    setTimeout(() => topRef.current?.scrollIntoView({
      behavior: 'smooth',
      block: 'start'
    }), 50);
  };
  const handleNew = () => {
    reset();
    setDrawer(null);
    setCopied(false);
    textareaRef.current?.focus();
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  };
  const handleCopy = async () => {
    if (!state.finalText) return;
    try {
      await navigator.clipboard.writeText(state.finalText);
      setCopied(true);
      toast.success('已复制综合答案');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('复制失败,请手动选择文本复制');
    }
  };
  const hasDebate = state.stage !== 'idle';
  const disputes = state.analysis?.disputes ?? [];
  const showRetry = state.stage === 'done' && (!!state.error || state.stopped);
  return <div className="zb-theme flex min-h-screen flex-col">
      <AppNavbar />

      <main className="mx-auto flex w-full max-w-screen-xl flex-1 flex-col gap-6 px-4 py-6 sm:gap-8 sm:px-6 sm:py-8 lg:px-8">
        <ModelPicker selected={selected} onChange={setSelected} disabled={running} />

        <section className="flex flex-1 flex-col gap-6">
          <div ref={topRef} className="scroll-mt-32" />
          {!hasDebate && <div className="flex flex-col items-center gap-6 rounded-2xl border border-dashed border-border px-4 py-10 text-center sm:py-12">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-secondary text-2xl font-bold text-white">
                辩
              </div>
              <div className="space-y-2">
                <p className="text-xl font-semibold">让多个AI为你的问题展开辩论</p>
                <p className="mx-auto max-w-xl text-sm text-muted-foreground">
                  各模型并行独立作答,随后相互纠错、标注分歧,最终生成带置信度的综合答案。
                </p>
              </div>
              <div className="flex w-full max-w-2xl flex-col gap-2 sm:flex-row sm:flex-wrap sm:justify-center">
                {SAMPLE_QUESTIONS.map(q => <button key={q} type="button" onClick={() => submit(q)} className="min-h-[44px] cursor-pointer rounded-2xl border border-border bg-card px-4 py-2 text-left text-xs leading-relaxed text-muted-foreground transition-all hover:border-primary/50 hover:text-foreground active:scale-[0.98] sm:rounded-full">
                    {q}
                  </button>)}
              </div>
            </div>}

          {hasDebate && <>
              <div className="flex items-start gap-3 sm:gap-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-border bg-card">
                  <span className="text-sm">👤</span>
                </div>
                <div className="min-w-0 max-w-2xl flex-1 rounded-2xl rounded-tl-none border border-border bg-card p-4 sm:flex-none">
                  <p className="break-words text-sm leading-relaxed">{state.question}</p>
                </div>
                {!running && <button type="button" onClick={handleNew} aria-label="开启新问题" className="ml-auto inline-flex min-h-[44px] shrink-0 cursor-pointer items-center gap-1.5 rounded-full border border-border px-3 text-xs transition-all hover:bg-card sm:px-4">
                    <Plus className="h-4 w-4" />
                    <span className="hidden sm:inline">新问题</span>
                  </button>}
              </div>

              <div className="space-y-6">
                <div className="space-y-3">
                  <StageStepper stage={state.stage} />
                  <p className="text-center text-xs font-medium uppercase tracking-widest text-muted-foreground" aria-live="polite">
                    {state.stopped ? '已停止' : STAGE_LABEL[state.stage]}
                  </p>
                </div>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {state.modelIds.map(id => <ModelAnswerCard key={id} modelId={id} answer={state.answers[id]} confidence={state.analysis?.confidences[id]} disputes={disputes} analyzed={!!state.analysis} onViewDetail={() => setDrawer({
                kind: 'model',
                id
              })} onViewCritique={() => setDrawer({
                kind: 'model',
                id
              })} />)}
                </div>

                <DisputePanel stage={state.stage} analysis={state.analysis} finalText={state.finalText} confidence={state.confidence} copied={copied} onCopy={handleCopy} onOpenDispute={id => setDrawer({
              kind: 'dispute',
              id
            })} />

                {showRetry && <div className="flex flex-col gap-3 rounded-xl border border-border bg-card p-4 sm:flex-row sm:items-center sm:justify-between">
                    <p className="flex items-center gap-2 text-sm text-muted-foreground">
                      <StopCircle className="h-4 w-4 shrink-0" />
                      {state.stopped ? '本次辩论已被停止,当前展示的是已生成的部分内容。' : state.error}
                    </p>
                    <button type="button" onClick={() => submit(state.question)} className="inline-flex min-h-[44px] cursor-pointer items-center justify-center gap-2 rounded-full bg-primary px-5 text-sm font-medium text-white transition-all hover:opacity-90">
                      <RotateCcw className="h-4 w-4" /> 重新发起
                    </button>
                  </div>}
              </div>
            </>}
          <div ref={endRef} />
        </section>

        <section className="sticky bottom-0 z-30 -mx-4 bg-gradient-to-t from-background via-background to-transparent px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-4 sm:mx-0 sm:px-0">
          <div className="relative mx-auto max-w-3xl">
            <div className="flex items-end gap-2 rounded-2xl border border-border bg-card p-2 shadow-2xl transition-all focus-within:border-primary">
              <textarea ref={textareaRef} id="chat-input" name="chat-input" rows={1} value={input} maxLength={MAX_QUESTION_LENGTH} disabled={running} enterKeyHint="send" placeholder={running ? 'AI 正在辩论中,可点击右侧按钮停止…' : '输入您的问题,让多个AI为您辩论...'} onChange={e => {
              setInput(e.target.value);
              e.target.style.height = 'auto';
              e.target.style.height = `${Math.min(e.target.scrollHeight, 128)}px`;
            }} onKeyDown={e => {
              if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
                e.preventDefault();
                submit(input);
              }
            }} className="max-h-32 min-h-[44px] flex-1 resize-none border-none bg-transparent px-3 py-3 text-base outline-none placeholder:text-muted-foreground disabled:opacity-60 sm:text-sm" />
              {running ? <button type="button" aria-label="停止辩论" onClick={stop} className="min-h-[44px] min-w-[44px] cursor-pointer rounded-xl bg-red-500 p-3 text-white transition-all hover:opacity-90 active:scale-95">
                  <Square className="mx-auto h-5 w-5" />
                </button> : <button type="button" aria-label="发起辩论" disabled={!input.trim()} onClick={() => submit(input)} className="min-h-[44px] min-w-[44px] cursor-pointer rounded-xl bg-primary p-3 text-white transition-all hover:opacity-90 active:scale-95 disabled:cursor-not-allowed disabled:opacity-40">
                  <ArrowRight className="mx-auto h-5 w-5" />
                </button>}
            </div>
            <div className="mt-1.5 flex items-center justify-between px-2 text-[10px] text-muted-foreground">
              <span className="hidden sm:inline">Enter 发送 · Shift+Enter 换行</span>
              <span className="sm:hidden">已选 {selected.length} 个模型</span>
              <span className={cn(input.length > MAX_QUESTION_LENGTH * 0.9 && 'text-yellow-400')}>
                {input.length}/{MAX_QUESTION_LENGTH}
              </span>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-border py-8">
        <div className="mx-auto max-w-screen-xl px-4 text-center">
          <p className="text-xs text-muted-foreground">© 2026 智辨AI汇 - 让AI在碰撞中产生真理</p>
        </div>
      </footer>

      <DisputeDrawer target={drawer} onClose={() => setDrawer(null)} analysis={state.analysis} answers={state.answers} />

      <OmniflowBadge />
      <Toaster />
    </div>;
};
export default Index;