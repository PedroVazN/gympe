import { Check, Minus, Plus, Trash2, Dumbbell, Sparkles, Wallet, Brain, Target } from "lucide-react";

const categoryMap = {
  fitness: { icon: Dumbbell, color: "from-emerald-500 to-teal-500", label: "Fitness" },
  spiritual: { icon: Sparkles, color: "from-amber-400 to-orange-500", label: "Espiritual" },
  finance: { icon: Wallet, color: "from-sky-500 to-indigo-500", label: "Finanças" },
  mental: { icon: Brain, color: "from-fuchsia-500 to-purple-500", label: "Mental" },
  custom: { icon: Target, color: "from-brand-500 to-accent-500", label: "Personalizado" },
};

const typeLabel = { daily: "Diária", weekly: "Semanal", monthly: "Mensal" };

export default function GoalCard({ goal, onIncrement, onDelete }) {
  const meta = categoryMap[goal.category] || categoryMap.custom;
  const Icon = meta.icon;
  const percent = Math.min(100, Math.round((goal.current / goal.target) * 100));

  return (
    <div className="card flex flex-col gap-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className={`flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br ${meta.color} text-white shadow`}>
            <Icon className="h-5 w-5" />
          </div>
          <div>
            <p className="font-semibold leading-tight">{goal.title}</p>
            <div className="mt-0.5 flex flex-wrap items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
              <span className="chip">{typeLabel[goal.type]}</span>
              <span className="chip">{meta.label}</span>
              <span className="chip">+{goal.reward} XP</span>
            </div>
          </div>
        </div>
        {onDelete ? (
          <button
            type="button"
            onClick={() => onDelete(goal)}
            className="rounded-lg p-1.5 text-slate-400 transition hover:bg-rose-500/10 hover:text-rose-500"
            aria-label="Excluir meta"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        ) : null}
      </div>

      <div>
        <div className="mb-1 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
          <span>
            {goal.current} / {goal.target} {goal.unit}
          </span>
          <span className="font-semibold text-brand-600 dark:text-brand-300">{percent}%</span>
        </div>
        <div className="progress-track">
          <div className="progress-bar" style={{ width: `${percent}%` }} />
        </div>
      </div>

      <div className="flex items-center justify-between gap-2">
        {goal.completed ? (
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-600 ring-1 ring-emerald-500/30">
            <Check className="h-3.5 w-3.5" /> Concluída
          </span>
        ) : (
          <span className="text-xs text-slate-500 dark:text-slate-400">
            {goal.description || "Siga avançando, você consegue!"}
          </span>
        )}
        {onIncrement ? (
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => onIncrement(goal, -1)}
              className="btn-ghost p-2"
              aria-label="Remover progresso"
            >
              <Minus className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => onIncrement(goal, 1)}
              className="btn-primary px-3 py-2"
              aria-label="Adicionar progresso"
            >
              <Plus className="h-4 w-4" /> Progresso
            </button>
          </div>
        ) : null}
      </div>
    </div>
  );
}
