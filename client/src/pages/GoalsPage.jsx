import { useEffect, useState } from "react";
import { useOutletContext } from "react-router-dom";
import { Plus, Calendar, CalendarDays, CalendarRange, Target } from "lucide-react";
import api from "../services/api";
import PageHeader from "../components/PageHeader";
import GoalCard from "../components/GoalCard";

const TYPES = [
  { key: "daily", label: "Hoje", icon: Calendar },
  { key: "weekly", label: "Semana", icon: CalendarDays },
  { key: "monthly", label: "Mês", icon: CalendarRange },
];

const CATEGORIES = [
  { key: "fitness", label: "Fitness" },
  { key: "spiritual", label: "Espiritual" },
  { key: "finance", label: "Finanças" },
  { key: "mental", label: "Mental" },
  { key: "custom", label: "Personalizado" },
];

const REWARDS = { daily: 30, weekly: 100, monthly: 300 };

const TEMPLATES = [
  {
    title: "Treinar 5x na semana",
    type: "weekly",
    category: "fitness",
    target: 5,
    unit: "treinos",
  },
  {
    title: "Orar todos os dias",
    type: "daily",
    category: "spiritual",
    target: 1,
    unit: "oração",
  },
  {
    title: "Guardar R$ 500 no mês",
    type: "monthly",
    category: "finance",
    target: 500,
    unit: "reais",
  },
  {
    title: "Ler 30 min por dia",
    type: "daily",
    category: "mental",
    target: 30,
    unit: "min",
  },
];

export default function GoalsPage() {
  const ctx = useOutletContext() || {};
  const [goals, setGoals] = useState([]);
  const [filter, setFilter] = useState("all");
  const [form, setForm] = useState({
    title: "",
    description: "",
    type: "weekly",
    category: "fitness",
    target: 5,
    unit: "x",
  });

  const load = async () => {
    const { data } = await api.get("/goals/all");
    setGoals(data);
  };

  useEffect(() => {
    load();
  }, []);

  const handleCreate = async (event) => {
    event?.preventDefault();
    if (!form.title.trim() || !form.target) return;
    await api.post("/goals", {
      ...form,
      target: Number(form.target),
      reward: REWARDS[form.type] || 50,
    });
    setForm({ ...form, title: "", description: "" });
    await load();
    ctx.refreshProgress?.();
  };

  const handleTemplate = async (template) => {
    await api.post("/goals", {
      ...template,
      reward: REWARDS[template.type] || 50,
    });
    await load();
    ctx.refreshProgress?.();
  };

  const handleIncrement = async (goal, amount) => {
    await api.patch(`/goals/${goal._id}/progress`, { amount });
    await load();
    ctx.refreshProgress?.();
  };

  const handleDelete = async (goal) => {
    if (!confirm(`Excluir meta "${goal.title}"?`)) return;
    await api.delete(`/goals/${goal._id}`);
    await load();
  };

  const filtered = goals.filter((g) => (filter === "all" ? true : g.type === filter));
  const counts = TYPES.reduce((acc, t) => {
    acc[t.key] = goals.filter((g) => g.type === t.key).length;
    return acc;
  }, {});
  const completed = goals.filter((g) => g.completed).length;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Suas metas"
        subtitle="Defina objetivos diários, semanais e mensais. Cumpri-los gera XP e desbloqueia conquistas."
      />

      <section className="grid gap-4 md:grid-cols-4">
        {TYPES.map((t) => {
          const Icon = t.icon;
          return (
            <div key={t.key} className="card flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-brand-500 to-accent-500 text-white shadow">
                <Icon className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Metas {t.label.toLowerCase()}
                </p>
                <p className="text-xl font-bold">{counts[t.key] || 0}</p>
              </div>
            </div>
          );
        })}
        <div className="card flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 text-white shadow">
            <Target className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Concluídas
            </p>
            <p className="text-xl font-bold">{completed}</p>
          </div>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.3fr_1fr]">
        <div className="card">
          <div className="mb-4 flex flex-wrap items-center gap-2">
            <FilterButton active={filter === "all"} onClick={() => setFilter("all")}>
              Todas
            </FilterButton>
            {TYPES.map((t) => (
              <FilterButton
                key={t.key}
                active={filter === t.key}
                onClick={() => setFilter(t.key)}
              >
                {t.label}
              </FilterButton>
            ))}
          </div>
          {filtered.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-200 p-8 text-center dark:border-white/10">
              <Target className="mx-auto mb-2 h-8 w-8 text-slate-400" />
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Nenhuma meta criada neste período. Que tal começar pelos modelos ao lado?
              </p>
            </div>
          ) : (
            <div className="grid gap-3 md:grid-cols-2">
              {filtered.map((goal) => (
                <GoalCard
                  key={goal._id}
                  goal={goal}
                  onIncrement={handleIncrement}
                  onDelete={handleDelete}
                />
              ))}
            </div>
          )}
        </div>

        <div className="space-y-4">
          <form onSubmit={handleCreate} className="card space-y-3">
            <div className="flex items-center gap-2">
              <Plus className="h-4 w-4 text-brand-500" />
              <h3 className="text-lg font-semibold">Nova meta</h3>
            </div>
            <div>
              <label className="label">Título</label>
              <input
                className="input"
                placeholder="Ex.: Treinar 4x na semana"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                required
              />
            </div>
            <div>
              <label className="label">Descrição (opcional)</label>
              <input
                className="input"
                placeholder="Lembrete pessoal"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">Tipo</label>
                <select
                  className="input"
                  value={form.type}
                  onChange={(e) => setForm({ ...form, type: e.target.value })}
                >
                  <option value="daily">Diária</option>
                  <option value="weekly">Semanal</option>
                  <option value="monthly">Mensal</option>
                </select>
              </div>
              <div>
                <label className="label">Categoria</label>
                <select
                  className="input"
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value })}
                >
                  {CATEGORIES.map((c) => (
                    <option key={c.key} value={c.key}>
                      {c.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label">Alvo</label>
                <input
                  className="input"
                  type="number"
                  min="1"
                  value={form.target}
                  onChange={(e) => setForm({ ...form, target: e.target.value })}
                />
              </div>
              <div>
                <label className="label">Unidade</label>
                <input
                  className="input"
                  placeholder="x, min, R$"
                  value={form.unit}
                  onChange={(e) => setForm({ ...form, unit: e.target.value })}
                />
              </div>
            </div>
            <div className="flex items-center justify-between rounded-xl bg-brand-500/10 px-3 py-2 text-sm text-brand-700 ring-1 ring-brand-500/20 dark:text-brand-200">
              <span>Recompensa ao concluir</span>
              <span className="font-bold">+{REWARDS[form.type]} XP</span>
            </div>
            <button className="btn-primary w-full">Criar meta</button>
          </form>

          <div className="card">
            <h3 className="mb-2 text-sm font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Modelos prontos
            </h3>
            <div className="space-y-2">
              {TEMPLATES.map((template) => (
                <button
                  key={template.title}
                  type="button"
                  onClick={() => handleTemplate(template)}
                  className="flex w-full items-center justify-between gap-3 rounded-xl border border-slate-200 p-3 text-left text-sm transition hover:bg-slate-50 dark:border-white/10 dark:hover:bg-white/5"
                >
                  <div>
                    <p className="font-semibold">{template.title}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {template.target} {template.unit} · {template.type}
                    </p>
                  </div>
                  <Plus className="h-4 w-4 text-brand-500" />
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

function FilterButton({ active, children, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full px-3 py-1.5 text-sm font-medium transition ${
        active
          ? "bg-brand-600 text-white shadow"
          : "bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-white/5 dark:text-slate-300 dark:hover:bg-white/10"
      }`}
    >
      {children}
    </button>
  );
}
