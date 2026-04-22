import { useEffect, useMemo, useState } from "react";
import { useOutletContext } from "react-router-dom";
import {
  Dumbbell,
  Apple,
  HandHeart,
  HeartHandshake,
  Shield,
  Plus,
  Sparkles,
  Flame,
  CheckCircle2,
} from "lucide-react";
import api from "../services/api";
import PageHeader from "../components/PageHeader";
import ProgressRing from "../components/ProgressRing";

const FIXED = [
  { key: "treinou", label: "Treinei hoje", icon: Dumbbell, color: "from-emerald-500 to-teal-500" },
  { key: "dieta", label: "Comi corretamente", icon: Apple, color: "from-lime-500 to-emerald-500" },
  { key: "orou", label: "Orei", icon: HandHeart, color: "from-amber-400 to-orange-500" },
  {
    key: "agradeceu",
    label: "Agradeci a Deus",
    icon: HeartHandshake,
    color: "from-rose-400 to-pink-500",
  },
  { key: "evitouPecar", label: "Evitei pecar", icon: Shield, color: "from-indigo-500 to-brand-600" },
];

export default function HabitsPage() {
  const ctx = useOutletContext() || {};
  const [habitData, setHabitData] = useState(null);
  const [history, setHistory] = useState([]);
  const [newHabit, setNewHabit] = useState("");

  const load = async () => {
    const [today, historyData] = await Promise.all([
      api.get("/habits/today"),
      api.get("/habits/history"),
    ]);
    setHabitData(today.data);
    setHistory(historyData.data);
  };

  useEffect(() => {
    load();
  }, []);

  const completion = useMemo(() => {
    if (!habitData) return 0;
    const fixedDone = FIXED.filter((h) => habitData.habits[h.key]).length;
    const customList = habitData.habits.custom || [];
    const customDone = customList.filter((item) => item.concluido).length;
    const total = FIXED.length + customList.length;
    const done = fixedDone + customDone;
    return total ? Math.round((done / total) * 100) : 0;
  }, [habitData]);

  const updateHabits = async (nextHabits) => {
    setHabitData({ ...habitData, habits: nextHabits });
    await api.put("/habits/today", { date: habitData.date, habits: nextHabits });
    ctx.refreshProgress?.();
  };

  const toggleFixed = (key, value) => {
    updateHabits({ ...habitData.habits, [key]: value });
  };

  const toggleCustom = (id, value) => {
    const custom = habitData.habits.custom.map((item) =>
      item.id === id ? { ...item, concluido: value } : item
    );
    updateHabits({ ...habitData.habits, custom });
  };

  const addCustomHabit = async (event) => {
    event?.preventDefault();
    if (!newHabit.trim()) return;
    const custom = [
      ...(habitData.habits.custom || []),
      { id: crypto.randomUUID(), nome: newHabit.trim(), concluido: false },
    ];
    await updateHabits({ ...habitData.habits, custom });
    setNewHabit("");
  };

  const removeCustomHabit = async (id) => {
    const custom = (habitData.habits.custom || []).filter((item) => item.id !== id);
    await updateHabits({ ...habitData.habits, custom });
  };

  if (!habitData) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-brand-500 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Ritual do dia"
        subtitle="Marque cada hábito conforme cumpre. Consistência é o maior multiplicador da sua vida."
      />

      <section className="grid gap-4 xl:grid-cols-[1fr_1.5fr]">
        <div className="card-glow flex items-center justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-white/70">Rotina de hoje</p>
            <p className="mt-2 text-3xl font-bold">{completion}%</p>
            <p className="text-sm text-white/70">
              {completion === 100
                ? "Dia perfeito! Continue assim 🔥"
                : "Continue, você está no caminho certo."}
            </p>
          </div>
          <ProgressRing
            value={completion}
            size={120}
            stroke={12}
            gradientFrom="#ffffff"
            gradientTo="#22d3ee"
            trackColor="rgba(255,255,255,0.18)"
          >
            <div className="text-center">
              <Flame className="mx-auto h-6 w-6 text-white" />
              <p className="mt-1 text-xs text-white/80">Foco</p>
            </div>
          </ProgressRing>
        </div>

        <div className="card">
          <h3 className="mb-4 text-lg font-semibold">Hábitos essenciais</h3>
          <div className="grid gap-3 sm:grid-cols-2">
            {FIXED.map((habit) => {
              const Icon = habit.icon;
              const active = habitData.habits[habit.key];
              return (
                <button
                  key={habit.key}
                  type="button"
                  onClick={() => toggleFixed(habit.key, !active)}
                  className={`group flex items-center justify-between gap-3 rounded-2xl border p-3 text-left transition ${
                    active
                      ? "border-transparent bg-gradient-to-br " + habit.color + " text-white shadow-lg"
                      : "border-slate-200 bg-white hover:bg-slate-50 dark:border-white/10 dark:bg-white/[0.03] dark:hover:bg-white/[0.07]"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`flex h-10 w-10 items-center justify-center rounded-xl ${
                        active
                          ? "bg-white/20 text-white"
                          : "bg-slate-100 text-slate-500 dark:bg-white/10 dark:text-slate-300"
                      }`}
                    >
                      <Icon className="h-5 w-5" />
                    </div>
                    <div>
                      <p className={`text-sm font-semibold ${active ? "text-white" : ""}`}>
                        {habit.label}
                      </p>
                      <p className={`text-xs ${active ? "text-white/80" : "text-slate-500 dark:text-slate-400"}`}>
                        {active ? "Concluído" : "Pendente"}
                      </p>
                    </div>
                  </div>
                  {active ? (
                    <CheckCircle2 className="h-5 w-5 text-white" />
                  ) : (
                    <div className="h-5 w-5 rounded-full border-2 border-slate-300 dark:border-white/20" />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.5fr_1fr]">
        <div className="card">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-lg font-semibold">Hábitos personalizados</h3>
            <span className="chip">{(habitData.habits.custom || []).length}</span>
          </div>

          <form onSubmit={addCustomHabit} className="mb-3 flex gap-2">
            <input
              className="input flex-1"
              placeholder="Ex.: Ler 15 minutos"
              value={newHabit}
              onChange={(e) => setNewHabit(e.target.value)}
            />
            <button className="btn-primary">
              <Plus className="h-4 w-4" /> Adicionar
            </button>
          </form>

          {(habitData.habits.custom || []).length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-200 p-6 text-center text-sm text-slate-500 dark:border-white/10 dark:text-slate-400">
              Adicione seus próprios rituais. Cada hábito cumprido vira XP.
            </div>
          ) : (
            <ul className="space-y-2">
              {habitData.habits.custom.map((item) => (
                <li
                  key={item.id}
                  className="flex items-center justify-between rounded-xl border border-slate-200 bg-white p-3 dark:border-white/10 dark:bg-white/[0.03]"
                >
                  <label className="flex flex-1 items-center gap-3">
                    <input
                      type="checkbox"
                      checked={item.concluido}
                      onChange={(e) => toggleCustom(item.id, e.target.checked)}
                      className="h-4 w-4 accent-brand-600"
                    />
                    <span
                      className={`${
                        item.concluido
                          ? "line-through text-slate-400"
                          : "text-slate-800 dark:text-slate-100"
                      }`}
                    >
                      {item.nome}
                    </span>
                  </label>
                  <button
                    type="button"
                    onClick={() => removeCustomHabit(item.id)}
                    className="text-xs text-rose-500 hover:underline"
                  >
                    Remover
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="card">
          <div className="mb-3 flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-brand-500" />
            <h3 className="text-lg font-semibold">Histórico recente</h3>
          </div>
          {history.length === 0 ? (
            <p className="text-sm text-slate-500 dark:text-slate-400">Nenhum dia registrado ainda.</p>
          ) : (
            <div className="space-y-2">
              {history.slice(0, 14).map((item) => {
                const fixedCount = FIXED.filter((k) => item.habits?.[k.key]).length;
                const customList = item.habits?.custom || [];
                const customCount = customList.filter((i) => i.concluido).length;
                const total = FIXED.length + customList.length;
                const pct = total ? Math.round(((fixedCount + customCount) / total) * 100) : 0;
                return (
                  <div
                    key={item._id}
                    className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white p-3 dark:border-white/10 dark:bg-white/[0.03]"
                  >
                    <span className="text-sm font-medium">
                      {new Date(item.date).toLocaleDateString("pt-BR", {
                        weekday: "short",
                        day: "2-digit",
                        month: "short",
                      })}
                    </span>
                    <div className="flex items-center gap-2">
                      <div className="h-1.5 w-24 overflow-hidden rounded-full bg-slate-100 dark:bg-white/10">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-brand-500 to-accent-400"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <span className="w-10 text-right text-xs font-semibold text-brand-600 dark:text-brand-300">
                        {pct}%
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
