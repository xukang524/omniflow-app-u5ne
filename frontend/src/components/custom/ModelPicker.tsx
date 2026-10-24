import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { DEBATE_MODELS, MAX_MODELS, MIN_MODELS } from '@/config/models';

interface ModelPickerProps {
  selected: string[];
  onChange: (ids: string[]) => void;
  disabled?: boolean;
}

export default function ModelPicker({ selected, onChange, disabled }: ModelPickerProps) {
  const toggle = (id: string) => {
    if (disabled) return;
    if (selected.includes(id)) {
      if (selected.length <= MIN_MODELS) {
        toast.warning(`至少需要保留 ${MIN_MODELS} 个模型参与辩论`);
        return;
      }
      onChange(selected.filter((s) => s !== id));
    } else {
      if (selected.length >= MAX_MODELS) {
        toast.warning(`最多选择 ${MAX_MODELS} 个模型`);
        return;
      }
      onChange([...selected, id]);
    }
  };

  return (
    <section id="models" className="flex scroll-mt-32 flex-col gap-4">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-lg font-semibold">选择参与辩论的模型</h2>
        <span className="text-xs text-muted-foreground">
          已选择 {selected.length}/{MAX_MODELS} 个模型
        </span>
      </div>
      <div className="grid grid-cols-1 gap-3 min-[420px]:grid-cols-2 md:grid-cols-3 lg:grid-cols-5">
        {DEBATE_MODELS.map((model) => {
          const isOn = selected.includes(model.id);
          return (
            <button
              key={model.id}
              type="button"
              aria-pressed={isOn}
              disabled={disabled}
              onClick={() => toggle(model.id)}
              className={cn(
                'flex cursor-pointer items-center gap-3 rounded-xl border p-3 text-left transition-all disabled:cursor-not-allowed disabled:opacity-60',
                isOn
                  ? 'border-2 border-primary bg-card'
                  : 'border-border bg-card/50 hover:border-primary/50',
              )}
            >
              <div className={cn('flex h-8 w-8 shrink-0 items-center justify-center rounded text-sm font-semibold', model.badge)}>
                {model.letter}
              </div>
              <div className="flex min-w-0 flex-col">
                <span className="truncate text-sm font-medium">{model.name}</span>
                <span className="truncate text-[10px] text-muted-foreground">{model.provider}</span>
              </div>
            </button>
          );
        })}
      </div>
    </section>
  );
}
