export interface DebateModel {
  id: string;
  name: string;
  provider: string;
  perspective: string;
  letter: string;
  dot: string;
  badge: string;
}

export const MIN_MODELS = 2;
export const MAX_MODELS = 5;

export const DEBATE_MODELS: DebateModel[] = [
  { id: 'reasoner', name: '严谨推理者', provider: '逻辑推演视角', perspective: '分步推理,结论明确', letter: '推', dot: 'bg-blue-500', badge: 'bg-blue-500/20 text-blue-400' },
  { id: 'skeptic', name: '批判质疑者', provider: '反面证据视角', perspective: '指出误区与不确定性', letter: '疑', dot: 'bg-purple-500', badge: 'bg-purple-500/20 text-purple-400' },
  { id: 'data', name: '数据分析师', provider: '数据口径视角', perspective: '引用数字与来源', letter: '数', dot: 'bg-orange-500', badge: 'bg-orange-500/20 text-orange-400' },
  { id: 'practitioner', name: '实务专家', provider: '落地场景视角', perspective: '从真实约束出发', letter: '实', dot: 'bg-emerald-500', badge: 'bg-emerald-500/20 text-emerald-400' },
  { id: 'futurist', name: '趋势观察者', provider: '未来情景视角', perspective: '对比情景与变量', letter: '势', dot: 'bg-pink-500', badge: 'bg-pink-500/20 text-pink-400' },
];

export const DEFAULT_MODEL_IDS = ['reasoner', 'skeptic', 'data'];

export function getModel(id: string): DebateModel {
  return (
    DEBATE_MODELS.find((m) => m.id === id) ?? {
      id,
      name: id,
      provider: '',
      perspective: '',
      letter: '?',
      dot: 'bg-slate-500',
      badge: 'bg-slate-500/20 text-slate-400',
    }
  );
}

export const SAMPLE_QUESTIONS = [
  '请分析2024年全球半导体行业的增长趋势,并指出不同机构预测的主要分歧点。',
  '大模型会在五年内取代初级程序员吗?',
  '每天喝咖啡对健康是利大于弊吗?',
];
