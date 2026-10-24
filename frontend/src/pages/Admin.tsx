import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Plus } from 'lucide-react';
import { toast } from 'sonner';
import {
  Area,
  AreaChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import OmniflowBadge from '@/components/custom/OmniflowBadge';
import AppNavbar from '@/components/custom/AppNavbar';
import { Toaster } from '@/components/ui/sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

interface ModelConfig {
  id: string;
  name: string;
  apiKey: string;
  weight: number;
  cost: number;
  enabled: boolean;
}

const INITIAL_MODELS: ModelConfig[] = [
  { id: 'reasoner', name: '严谨推理者', apiKey: '平台默认接入', weight: 1.0, cost: 520.4, enabled: true },
  { id: 'skeptic', name: '批判质疑者', apiKey: '平台默认接入', weight: 0.9, cost: 342.1, enabled: true },
  { id: 'data', name: '数据分析师', apiKey: 'sk-••••••••a3f9', weight: 0.85, cost: 218.0, enabled: true },
  { id: 'practitioner', name: '实务专家', apiKey: '平台默认接入', weight: 0.8, cost: 134.0, enabled: true },
  { id: 'futurist', name: '趋势观察者', apiKey: 'sk-••••••••7c21', weight: 0.7, cost: 70.0, enabled: false },
];

const PIE_COLORS = ['#3B82F6', '#8B5CF6', '#F59E0B', '#10B981', '#EC4899', '#22C55E', '#EF4444'];

const DAILY_CALLS = [
  { day: '周一', calls: 3200 },
  { day: '周二', calls: 4100 },
  { day: '周三', calls: 3800 },
  { day: '周四', calls: 5200 },
  { day: '周五', calls: 4900 },
  { day: '周六', calls: 2700 },
  { day: '周日', calls: 2400 },
];

interface FormState {
  name: string;
  apiKey: string;
  weight: string;
}

interface FormErrors {
  name?: string;
  weight?: string;
}

let customModelCounter = 0;

const Admin = () => {
  const [models, setModels] = useState<ModelConfig[]>(INITIAL_MODELS);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>({ name: '', apiKey: '', weight: '1' });
  const [errors, setErrors] = useState<FormErrors>({});

  const totalCost = useMemo(() => models.reduce((sum, m) => sum + m.cost, 0), [models]);
  const pieData = useMemo(() => models.filter((m) => m.cost > 0).map((m) => ({ name: m.name, value: m.cost })), [models]);

  const openAdd = () => {
    setEditingId(null);
    setErrors({});
    setForm({ name: '', apiKey: '', weight: '1' });
    setDialogOpen(true);
  };

  const openEdit = (model: ModelConfig) => {
    setEditingId(model.id);
    setErrors({});
    setForm({ name: model.name, apiKey: '', weight: String(model.weight) });
    setDialogOpen(true);
  };

  const save = () => {
    const name = form.name.trim();
    const weight = Number(form.weight);
    const nextErrors: FormErrors = {};
    if (!name) nextErrors.name = '请输入模型名称';
    else if (models.some((m) => m.name === name && m.id !== editingId)) nextErrors.name = '已存在同名模型';
    if (form.weight.trim() === '' || !Number.isFinite(weight) || weight < 0 || weight > 1) {
      nextErrors.weight = '综合权重需在 0 到 1 之间';
    }
    if (nextErrors.name || nextErrors.weight) {
      setErrors(nextErrors);
      return;
    }
    const key = form.apiKey.trim();
    const masked = key ? `${key.slice(0, 3)}-••••••••${key.slice(-4)}` : '';
    if (editingId) {
      setModels((prev) =>
        prev.map((m) => (m.id === editingId ? { ...m, name, weight, apiKey: masked || m.apiKey } : m)),
      );
      toast.success('模型配置已更新');
    } else {
      setModels((prev) => [
        ...prev,
        { id: `custom-${++customModelCounter}`, name, weight, apiKey: masked || '平台默认接入', cost: 0, enabled: true },
      ]);
      toast.success('已添加新模型');
    }
    setDialogOpen(false);
  };

  const toggleEnabled = (id: string, enabled: boolean) => {
    const target = models.find((m) => m.id === id);
    if (!enabled && models.filter((m) => m.enabled).length <= 2) {
      toast.warning('至少需要保持 2 个模型处于启用状态');
      return;
    }
    setModels((prev) => prev.map((m) => (m.id === id ? { ...m, enabled } : m)));
    if (target) toast.success(`${target.name} 已${enabled ? '启用' : '暂停'}`);
  };

  const stats = [
    { label: '本月总成本', value: `$${totalCost.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, hint: '较上月 +8.2%' },
    { label: '活跃模型', value: '8 / 12', hint: '4 个模型已暂停' },
    { label: '平均响应时间', value: '1.4s', hint: '首字延迟 P50' },
  ];

  return (
    <div className="zb-theme flex min-h-screen flex-col">
      <AppNavbar />
      <main className="mx-auto flex w-full max-w-screen-xl flex-1 flex-col gap-8 px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Link to="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-primary">
            <ArrowLeft className="h-4 w-4" />
            返回工作台
          </Link>
          <span className="rounded-full border border-yellow-500/30 bg-yellow-500/10 px-3 py-1 text-[11px] text-yellow-400">
            演示数据 · 配置仅在当前会话生效
          </span>
        </div>

        <section className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {stats.map((s) => (
            <div key={s.label} className="rounded-2xl border border-border bg-card p-5">
              <p className="text-xs text-muted-foreground">{s.label}</p>
              <h3 className="mt-2 text-3xl font-bold">{s.value}</h3>
              <p className="mt-1 text-xs text-muted-foreground">{s.hint}</p>
            </div>
          ))}
        </section>

        <section className="rounded-2xl border border-border bg-card p-4 sm:p-6">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-lg font-semibold">模型 API 与权重配置</h2>
            <Button onClick={openAdd} className="min-h-[44px] cursor-pointer rounded-full">
              <Plus className="h-4 w-4" />
              添加新模型
            </Button>
          </div>
          {models.length === 0 && (
            <p className="rounded-xl border border-dashed border-border py-10 text-center text-sm text-muted-foreground">
              暂无模型,点击右上角添加新模型
            </p>
          )}
          <div className="flex flex-col gap-3 md:hidden">
            {models.map((m) => (
              <div key={m.id} className="flex flex-col gap-3 rounded-xl border border-border bg-background/40 p-4">
                <div className="flex items-center justify-between gap-3">
                  <span className="min-w-0 truncate font-medium">{m.name}</span>
                  <div className="flex shrink-0 items-center gap-2">
                    <span className={m.enabled ? 'text-xs text-green-400' : 'text-xs text-muted-foreground'}>
                      {m.enabled ? '启用' : '暂停'}
                    </span>
                    <Switch
                      checked={m.enabled}
                      onCheckedChange={(v) => toggleEnabled(m.id, v)}
                      aria-label={`切换 ${m.name} 状态`}
                    />
                  </div>
                </div>
                <p className="truncate font-mono text-xs text-muted-foreground">{m.apiKey}</p>
                <div className="flex items-center justify-between gap-3 text-sm">
                  <span className="text-muted-foreground">
                    权重 <span className="text-foreground">{m.weight.toFixed(2)}</span>
                  </span>
                  <span className="text-muted-foreground">
                    本月 <span className="text-foreground">${m.cost.toFixed(2)}</span>
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    className="min-h-[44px] cursor-pointer"
                    onClick={() => openEdit(m)}
                  >
                    编辑
                  </Button>
                </div>
              </div>
            ))}
          </div>
          <Table className="hidden md:table">
            <TableHeader>
              <TableRow className="border-border hover:bg-transparent">
                <TableHead>模型名称</TableHead>
                <TableHead>API Key (加密)</TableHead>
                <TableHead>综合权重</TableHead>
                <TableHead>本月成本</TableHead>
                <TableHead>状态</TableHead>
                <TableHead>操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {models.map((m) => (
                <TableRow key={m.id} className="border-border">
                  <TableCell className="whitespace-nowrap font-medium">{m.name}</TableCell>
                  <TableCell className="whitespace-nowrap font-mono text-xs text-muted-foreground">{m.apiKey}</TableCell>
                  <TableCell>{m.weight.toFixed(2)}</TableCell>
                  <TableCell>${m.cost.toFixed(2)}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={m.enabled}
                        onCheckedChange={(v) => toggleEnabled(m.id, v)}
                        aria-label={`切换 ${m.name} 状态`}
                      />
                      <span className={m.enabled ? 'text-xs text-green-400' : 'text-xs text-muted-foreground'}>
                        {m.enabled ? '启用' : '暂停'}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Button variant="ghost" size="sm" className="cursor-pointer text-primary" onClick={() => openEdit(m)}>
                      编辑
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </section>

        <section className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <div className="rounded-2xl border border-border bg-card p-4 sm:p-6">
            <h3 className="mb-4 font-bold">模型调用成本占比</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={pieData} dataKey="value" nameKey="name" innerRadius={55} outerRadius={90} paddingAngle={2} stroke="none">
                    {pieData.map((entry, i) => (
                      <Cell key={entry.name} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ background: '#0F172A', border: '1px solid #334155', borderRadius: 8, color: '#F8FAFC' }}
                    formatter={(v: number) => `$${v.toFixed(2)}`}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1">
              {pieData.map((entry, i) => (
                <span key={entry.name} className="flex items-center gap-1 text-[11px] text-muted-foreground">
                  <span className="h-2 w-2 rounded-full" style={{ background: PIE_COLORS[i % PIE_COLORS.length] }} />
                  {entry.name}
                </span>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-border bg-card p-4 sm:p-6">
            <h3 className="mb-4 font-bold">每日调用量趋势</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={DAILY_CALLS} margin={{ left: -16, right: 8, top: 8 }}>
                  <defs>
                    <linearGradient id="callsFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#3B82F6" stopOpacity={0.4} />
                      <stop offset="100%" stopColor="#3B82F6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid stroke="#334155" strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="day" stroke="#94A3B8" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="#94A3B8" fontSize={12} tickLine={false} axisLine={false} />
                  <Tooltip contentStyle={{ background: '#0F172A', border: '1px solid #334155', borderRadius: 8, color: '#F8FAFC' }} />
                  <Area type="monotone" dataKey="calls" name="调用次数" stroke="#3B82F6" strokeWidth={2} fill="url(#callsFill)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </section>
      </main>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="border-border bg-card text-foreground">
          <DialogHeader>
            <DialogTitle>{editingId ? '编辑模型' : '添加新模型'}</DialogTitle>
            <DialogDescription>API Key 仅显示加密后的尾号;留空则使用平台默认接入。</DialogDescription>
          </DialogHeader>
          <form
            id="model-form"
            className="space-y-4"
            noValidate
            onSubmit={(e) => {
              e.preventDefault();
              save();
            }}
          >
            <div className="space-y-2">
              <Label htmlFor="model-name">模型名称</Label>
              <Input
                id="model-name"
                value={form.name}
                aria-invalid={!!errors.name}
                onChange={(e) => {
                  setForm({ ...form, name: e.target.value });
                  if (errors.name) setErrors({ ...errors, name: undefined });
                }}
              />
              {errors.name && <p className="text-xs text-red-400">{errors.name}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="model-key">API Key</Label>
              <Input
                id="model-key"
                type="password"
                autoComplete="off"
                placeholder="留空保持不变"
                value={form.apiKey}
                onChange={(e) => setForm({ ...form, apiKey: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="model-weight">综合权重 (0-1)</Label>
              <Input
                id="model-weight"
                type="number"
                step="0.05"
                min="0"
                max="1"
                value={form.weight}
                aria-invalid={!!errors.weight}
                onChange={(e) => {
                  setForm({ ...form, weight: e.target.value });
                  if (errors.weight) setErrors({ ...errors, weight: undefined });
                }}
              />
              {errors.weight && <p className="text-xs text-red-400">{errors.weight}</p>}
            </div>
          </form>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" className="min-h-[44px] cursor-pointer" onClick={() => setDialogOpen(false)}>
              取消
            </Button>
            <Button type="submit" form="model-form" className="min-h-[44px] cursor-pointer">
              保存
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <OmniflowBadge />
      <Toaster />
    </div>
  );
};

export default Admin;
