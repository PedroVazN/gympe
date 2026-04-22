import { useEffect, useState } from "react";
import { useOutletContext } from "react-router-dom";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  Activity,
  ArrowDownRight,
  ArrowUpRight,
  Flame,
  Gauge,
  Sparkles,
  Target,
  Trophy,
  Wallet,
  Zap,
} from "lucide-react";
import api from "../services/api";
import PageHeader from "../components/PageHeader";
import StatCard from "../components/StatCard";
import ProgressRing from "../components/ProgressRing";
import GoalCard from "../components/GoalCard";

const currency = (value) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value || 0);

export default function DashboardPage() {
  const ctx = useOutletContext() || {};
  const [data, setData] = useState(null);
  const [chart, setChart] = useState([]);

  const load = async () => {
    const [summary, transactions] = await Promise.all([
      api.get("/dashboard/summary"),
      api.get("/transactions"),
    ]);
    const summaryData = summary?.data && typeof summary.data === "object" ? summary.data : {};
    setData(summaryData);
    const transactionsList = Array.isArray(transactions?.data) ? transactions.data : [];
    const byMonth = transactionsList.reduce((acc, item) => {
      const key = new Date(item.date).toLocaleDateString("pt-BR", {
        month: "short",
        year: "2-digit",
      });
      const bucket = acc[key] || { mes: key, entradas: 0, saidas: 0 };
      if (item.type === "income") bucket.entradas += item.amount;
      else bucket.saidas += item.amount;
      acc[key] = bucket;
      return acc;
    }, {});
    setChart(Object.values(byMonth).slice(-6));
  };

  useEffect(() => {
    load();
  }, []);

  const handleIncrement = async (goal, amount) => {
    await api.patch(`/goals/${goal._id}/progress`, { amount });
    load();
    ctx.refreshProgress?.();
  };

  if (!data) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-brand-500 border-t-transparent" />
      </div>
    );
  }

  const {
    financial = {},
    goals = [],
    weeklyProgress = [],
    rank = {},
    xp = 0,
    disciplineScore = 0,
    streak = 0,
    spiritualStreak = 0,
    insights = [],
  } = data;
  const safeRank = {
    level: rank?.level || 1,
    title: rank?.title || "Iniciante",
    progress: Number.isFinite(rank?.progress) ? rank.progress : 0,
    next: rank?.next || null,
  };

  const dailyGoals = goals.filter((g) => g.type === "daily").slice(0, 3);
  const weeklyGoals = goals.filter((g) => g.type === "weekly").slice(0, 3);
  const monthlyGoals = goals.filter((g) => g.type === "monthly").slice(0, 3);

  return (
    <div className="space-y-6">
      <PageHeader
        title={data.greeting}
        subtitle={data.quote}
      />

      <section className="grid gap-4 lg:grid-cols-3">
        <div className="card-glow lg:col-span-2">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-xs font-semibold uppercase tracking-wider">
                <Zap className="h-3.5 w-3.5" /> Nível {safeRank.level} · {safeRank.title}
              </p>
              <h2 className="mt-3 text-3xl font-bold leading-tight">{xp} XP</h2>
              <p className="text-sm text-white/70">
                {safeRank.next
                  ? `Faltam ${safeRank.next.minXp - xp} XP para ${safeRank.next.title}`
                  : "Você atingiu o nível máximo! Continue inspirando."}
              </p>
              <div className="mt-4 h-2 w-full overflow-hidden rounded-full bg-white/15">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-white to-accent-400"
                  style={{ width: `${safeRank.progress}%` }}
                />
              </div>
            </div>
            <div className="flex items-center gap-4">
              <ProgressRing
                value={disciplineScore}
                size={120}
                stroke={12}
                gradientFrom="#ffffff"
                gradientTo="#22d3ee"
                trackColor="rgba(255,255,255,0.18)"
              >
                <div className="text-center">
                  <p className="text-xs font-medium text-white/70">Disciplina</p>
                  <p className="text-2xl font-bold">{disciplineScore}</p>
                </div>
              </ProgressRing>
            </div>
          </div>
        </div>

        <div className="card flex flex-col justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-orange-500 to-rose-500 text-white shadow">
              <Flame className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Streak atual
              </p>
              <p className="text-2xl font-bold">{streak} dias</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 text-white shadow">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Devoção
              </p>
              <p className="text-2xl font-bold">{spiritualStreak} dias</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 text-white shadow">
              <Trophy className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Metas concluídas
              </p>
              <p className="text-2xl font-bold">
                {goals.filter((g) => g.completed).length}/{goals.length || 0}
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard
          icon={Wallet}
          label="Saldo total"
          value={currency(financial.balance)}
          hint="Entradas - Saídas"
          accent="brand"
        />
        <StatCard
          icon={ArrowUpRight}
          label="Entradas do mês"
          value={currency(financial.monthlyIncome)}
          accent="success"
        />
        <StatCard
          icon={ArrowDownRight}
          label="Saídas do mês"
          value={currency(financial.monthlyExpense)}
          accent="danger"
        />
        <StatCard
          icon={Gauge}
          label="Dívida parcelada"
          value={currency(financial.remainingDebt)}
          hint="Saldo devedor restante"
          accent="warning"
        />
      </section>

      <section className="grid gap-4 xl:grid-cols-3">
        <div className="card xl:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold">Fluxo financeiro</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">Últimos meses</p>
            </div>
            <Activity className="h-4 w-4 text-slate-400" />
          </div>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chart}>
                <defs>
                  <linearGradient id="income" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#22c55e" stopOpacity={0.4} />
                    <stop offset="100%" stopColor="#22c55e" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="expense" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#ef4444" stopOpacity={0.4} />
                    <stop offset="100%" stopColor="#ef4444" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.2)" />
                <XAxis dataKey="mes" stroke="#94a3b8" fontSize={12} />
                <YAxis stroke="#94a3b8" fontSize={12} />
                <Tooltip
                  contentStyle={{
                    background: "rgba(15,23,42,0.92)",
                    border: "none",
                    borderRadius: 12,
                    color: "#f8fafc",
                  }}
                />
                <Area type="monotone" dataKey="entradas" stroke="#22c55e" fill="url(#income)" strokeWidth={2} />
                <Area type="monotone" dataKey="saidas" stroke="#ef4444" fill="url(#expense)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold">Semana em um olhar</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">% de hábitos cumpridos</p>
            </div>
          </div>
          <div className="flex items-end justify-between gap-2 pt-2">
            {Array.isArray(weeklyProgress) ? weeklyProgress.map((day) => (
              <div key={day.date} className="flex flex-1 flex-col items-center gap-2">
                <div className="flex h-40 w-full items-end justify-center rounded-xl bg-slate-100 dark:bg-white/5">
                  <div
                    className="w-full rounded-xl bg-gradient-to-t from-brand-600 to-accent-400 transition-all"
                    style={{ height: `${Math.max(6, day.completion)}%` }}
                    title={`${day.completion}%`}
                  />
                </div>
                <p className="text-xs font-medium text-slate-500 dark:text-slate-400">{day.day}</p>
              </div>
            )) : null}
          </div>
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-3">
        <GoalColumn title="Metas de hoje" goals={dailyGoals} onIncrement={handleIncrement} />
        <GoalColumn title="Metas da semana" goals={weeklyGoals} onIncrement={handleIncrement} />
        <GoalColumn title="Metas do mês" goals={monthlyGoals} onIncrement={handleIncrement} />
      </section>

      <section className="card">
        <div className="mb-3 flex items-center gap-2">
          <Target className="h-4 w-4 text-brand-500" />
          <h3 className="text-lg font-semibold">Insights inteligentes</h3>
        </div>
        <div className="grid gap-3 md:grid-cols-2">
          {(Array.isArray(insights) ? insights : []).map((insight) => (
            <div
              key={insight}
              className="flex items-start gap-3 rounded-xl border border-slate-200/70 bg-slate-50 p-3 text-sm text-slate-700 dark:border-white/5 dark:bg-white/[0.03] dark:text-slate-200"
            >
              <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-brand-500" />
              <span>{insight}</span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

function GoalColumn({ title, goals, onIncrement }) {
  return (
    <div className="card">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-lg font-semibold">{title}</h3>
        <span className="chip">{goals.length}</span>
      </div>
      {goals.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-200 p-6 text-center text-sm text-slate-500 dark:border-white/10 dark:text-slate-400">
          Nenhuma meta. Crie uma em <strong>Metas</strong>.
        </div>
      ) : (
        <div className="space-y-3">
          {goals.map((goal) => (
            <GoalCard key={goal._id} goal={goal} onIncrement={onIncrement} />
          ))}
        </div>
      )}
    </div>
  );
}
