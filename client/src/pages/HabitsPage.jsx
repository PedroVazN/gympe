import { useEffect, useMemo, useState } from "react";
import { BookOpen, CheckCircle2, Dumbbell, Flame, HandHeart, Plus, Sparkles, Trash2 } from "lucide-react";
import api from "../services/api";
import PageHeader from "../components/PageHeader";
import ProgressRing from "../components/ProgressRing";

const tabButton = (active) =>
  `rounded-xl px-4 py-2 text-sm font-semibold transition ${
    active
      ? "bg-gradient-to-r from-brand-600 to-accent-500 text-white shadow"
      : "bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-white/5 dark:text-slate-300 dark:hover:bg-white/10"
  }`;

export default function HabitsPage() {
  const [tab, setTab] = useState("dashboard");
  const [dashboard, setDashboard] = useState(null);
  const [spiritual, setSpiritual] = useState(null);
  const [templates, setTemplates] = useState([]);
  const [workout, setWorkout] = useState(null);
  const [newTemplate, setNewTemplate] = useState("");
  const [workoutForm, setWorkoutForm] = useState({ type: "", duration: "", note: "" });

  const loadDashboard = async () => {
    const { data } = await api.get("/habits/automation/dashboard");
    setDashboard(data);
  };

  const loadSpiritual = async () => {
    const [today, templateRes] = await Promise.all([
      api.get("/habits/spiritual/today"),
      api.get("/habits/spiritual/templates"),
    ]);
    setSpiritual(today.data);
    setTemplates(templateRes.data);
  };

  const loadWorkout = async () => {
    const { data } = await api.get("/habits/workout/today");
    setWorkout(data);
  };

  const reloadAll = async () => {
    await Promise.all([loadDashboard(), loadSpiritual(), loadWorkout()]);
  };

  useEffect(() => {
    reloadAll();
  }, []);

  const spiritualCompletion = useMemo(() => {
    if (!spiritual) return 0;
    const fixedDone = (spiritual.spiritual.leituraBiblica.done ? 1 : 0) + (spiritual.spiritual.oracao ? 1 : 0);
    const custom = spiritual.spiritual.custom || [];
    const customDone = custom.filter((item) => item.done).length;
    const total = 2 + custom.length;
    return total ? Math.round(((fixedDone + customDone) / total) * 100) : 0;
  }, [spiritual]);

  const saveSpiritual = async (nextSpiritual) => {
    setSpiritual((prev) => ({ ...prev, spiritual: nextSpiritual }));
    await api.put("/habits/spiritual/today", { spiritual: nextSpiritual });
    loadDashboard();
  };

  const toggleLeitura = () => {
    const next = {
      ...spiritual.spiritual,
      leituraBiblica: {
        ...spiritual.spiritual.leituraBiblica,
        done: !spiritual.spiritual.leituraBiblica.done,
      },
    };
    saveSpiritual(next);
  };

  const toggleOracao = () => {
    const next = { ...spiritual.spiritual, oracao: !spiritual.spiritual.oracao };
    saveSpiritual(next);
  };

  const updateLeituraObs = (value) => {
    setSpiritual((prev) => ({
      ...prev,
      spiritual: {
        ...prev.spiritual,
        leituraBiblica: {
          ...prev.spiritual.leituraBiblica,
          observation: value,
        },
      },
    }));
  };

  const persistLeituraObs = async () => {
    await api.put("/habits/spiritual/today", { spiritual: spiritual.spiritual });
  };

  const toggleCustom = async (habitId, done) => {
    const next = {
      ...spiritual.spiritual,
      custom: spiritual.spiritual.custom.map((item) =>
        item.habitId === habitId ? { ...item, done } : item
      ),
    };
    saveSpiritual(next);
  };

  const updateCustomObs = (habitId, observation) => {
    setSpiritual((prev) => ({
      ...prev,
      spiritual: {
        ...prev.spiritual,
        custom: prev.spiritual.custom.map((item) =>
          item.habitId === habitId ? { ...item, observation } : item
        ),
      },
    }));
  };

  const persistCustomObs = async () => {
    await api.put("/habits/spiritual/today", { spiritual: spiritual.spiritual });
  };

  const addTemplate = async (event) => {
    event.preventDefault();
    if (!newTemplate.trim()) return;
    await api.post("/habits/spiritual/templates", { name: newTemplate.trim() });
    setNewTemplate("");
    loadSpiritual();
  };

  const removeTemplate = async (templateId) => {
    await api.delete(`/habits/spiritual/templates/${templateId}`);
    loadSpiritual();
    loadDashboard();
  };

  const checkinWorkout = async (event) => {
    event.preventDefault();
    await api.post("/habits/workout/checkin", {
      workout: {
        type: workoutForm.type,
        duration: Number(workoutForm.duration || 0),
        note: workoutForm.note,
      },
    });
    setWorkoutForm({ type: "", duration: "", note: "" });
    loadWorkout();
    loadDashboard();
  };

  const undoWorkout = async () => {
    await api.post("/habits/workout/undo");
    loadWorkout();
    loadDashboard();
  };

  if (!dashboard || !spiritual || !workout) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-brand-500 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Hábitos automatizados"
        subtitle="Registro simples nas abas e dashboard consolidado automaticamente."
      />

      <div className="card !p-2">
        <div className="flex flex-wrap gap-2">
          <button className={tabButton(tab === "dashboard")} onClick={() => setTab("dashboard")}>
            Dashboard de Hábitos
          </button>
          <button className={tabButton(tab === "spiritual")} onClick={() => setTab("spiritual")}>
            Vida com Deus
          </button>
          <button className={tabButton(tab === "workout")} onClick={() => setTab("workout")}>
            Treinos
          </button>
        </div>
      </div>

      {tab === "dashboard" ? (
        <section className="space-y-4">
          <div className="card-glow flex items-center justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-white/70">
                Progresso automático de hoje
              </p>
              <p className="mt-2 text-3xl font-bold">{dashboard.todayCompletion.percentage}%</p>
              <p className="text-sm text-white/70">
                {dashboard.todayCompletion.done}/{dashboard.todayCompletion.total} hábitos concluídos
              </p>
            </div>
            <ProgressRing
              value={dashboard.todayCompletion.percentage}
              size={120}
              stroke={12}
              gradientFrom="#ffffff"
              gradientTo="#22d3ee"
              trackColor="rgba(255,255,255,0.18)"
            >
              <div className="text-center">
                <Flame className="mx-auto h-6 w-6 text-white" />
                <p className="mt-1 text-xs text-white/80">Hoje</p>
              </div>
            </ProgressRing>
          </div>

          <div className="grid gap-4 md:grid-cols-4">
            <Stat title="Streak" value={`${dashboard.streak} dias`} />
            <Stat title="Leitura bíblica" value={`${dashboard.monthly.bibleReadDays} dias`} />
            <Stat title="Oração" value={`${dashboard.monthly.prayerDays} dias`} />
            <Stat title="Treinos" value={`${dashboard.monthly.workoutDays} dias`} />
          </div>

          <div className="card">
            <h3 className="mb-3 text-lg font-semibold">Últimos registros (somente leitura)</h3>
            <div className="space-y-2">
              {dashboard.lastDays.map((day) => (
                <div
                  key={day.date}
                  className="flex items-center justify-between rounded-xl border border-slate-200 bg-white p-3 dark:border-white/10 dark:bg-white/[0.03]"
                >
                  <span className="text-sm font-medium">
                    {new Date(day.date).toLocaleDateString("pt-BR", {
                      weekday: "short",
                      day: "2-digit",
                      month: "short",
                    })}
                  </span>
                  <div className="flex items-center gap-2">
                    <div className="h-1.5 w-28 overflow-hidden rounded-full bg-slate-100 dark:bg-white/10">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-brand-500 to-accent-400"
                        style={{ width: `${day.percentage}%` }}
                      />
                    </div>
                    <span className="w-12 text-right text-xs font-semibold text-brand-600 dark:text-brand-300">
                      {day.percentage}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      ) : null}

      {tab === "spiritual" ? (
        <section className="space-y-4">
          <div className="card-glow flex items-center justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-white/70">
                Vida com Deus hoje
              </p>
              <p className="mt-2 text-3xl font-bold">{spiritualCompletion}%</p>
              <p className="text-sm text-white/70">Preenchimento automático no dashboard</p>
            </div>
            <Sparkles className="h-10 w-10 text-white/80" />
          </div>

          <div className="grid gap-4 xl:grid-cols-[1.4fr_1fr]">
            <div className="card space-y-3">
              <h3 className="text-lg font-semibold">Hábitos principais fixos</h3>
              <div className="rounded-xl border border-slate-200 p-3 dark:border-white/10">
                <div className="mb-2 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <BookOpen className="h-4 w-4 text-brand-500" />
                    <p className="font-semibold">Leitura bíblica</p>
                  </div>
                  <button className="btn-ghost" onClick={toggleLeitura}>
                    {spiritual.spiritual.leituraBiblica.done ? (
                      <>
                        <CheckCircle2 className="h-4 w-4 text-emerald-500" /> Feito
                      </>
                    ) : (
                      "Marcar"
                    )}
                  </button>
                </div>
                <textarea
                  className="input min-h-[90px]"
                  placeholder="Observações da leitura..."
                  value={spiritual.spiritual.leituraBiblica.observation}
                  onChange={(e) => updateLeituraObs(e.target.value)}
                  onBlur={persistLeituraObs}
                />
              </div>

              <div className="rounded-xl border border-slate-200 p-3 dark:border-white/10">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <HandHeart className="h-4 w-4 text-amber-500" />
                    <p className="font-semibold">Oração</p>
                  </div>
                  <button className="btn-ghost" onClick={toggleOracao}>
                    {spiritual.spiritual.oracao ? (
                      <>
                        <CheckCircle2 className="h-4 w-4 text-emerald-500" /> Feito
                      </>
                    ) : (
                      "Marcar"
                    )}
                  </button>
                </div>
              </div>
            </div>

            <div className="card space-y-3">
              <h3 className="text-lg font-semibold">Hábitos espirituais personalizados</h3>
              <form onSubmit={addTemplate} className="flex gap-2">
                <input
                  className="input flex-1"
                  placeholder="Novo hábito"
                  value={newTemplate}
                  onChange={(e) => setNewTemplate(e.target.value)}
                />
                <button className="btn-primary">
                  <Plus className="h-4 w-4" />
                </button>
              </form>

              {(spiritual.spiritual.custom || []).length === 0 ? (
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Sem hábitos personalizados no momento.
                </p>
              ) : (
                <ul className="space-y-2">
                  {spiritual.spiritual.custom.map((item) => {
                    const template = templates.find((t) => String(t._id) === item.habitId);
                    return (
                      <li
                        key={item.habitId}
                        className="rounded-xl border border-slate-200 p-3 dark:border-white/10"
                      >
                        <div className="mb-2 flex items-center justify-between">
                          <p className="font-semibold">{item.name}</p>
                          <div className="flex items-center gap-2">
                            <button
                              className="btn-ghost px-2 py-1 text-xs"
                              onClick={() => toggleCustom(item.habitId, !item.done)}
                            >
                              {item.done ? "Concluído" : "Marcar"}
                            </button>
                            {template ? (
                              <button
                                className="rounded-lg p-1.5 text-slate-400 transition hover:bg-rose-500/10 hover:text-rose-500"
                                onClick={() => removeTemplate(template._id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            ) : null}
                          </div>
                        </div>
                        <textarea
                          className="input min-h-[70px]"
                          placeholder="Observação (opcional)"
                          value={item.observation || ""}
                          onChange={(e) => updateCustomObs(item.habitId, e.target.value)}
                          onBlur={persistCustomObs}
                        />
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          </div>
        </section>
      ) : null}

      {tab === "workout" ? (
        <section className="space-y-4">
          <div className="card-glow flex items-center justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-white/70">
                Check-in de treino
              </p>
              <p className="mt-2 text-3xl font-bold">
                {workout.workout.checkedIn ? "Concluído ✅" : "Pendente"}
              </p>
              <p className="text-sm text-white/70">Um registro rápido e pronto.</p>
            </div>
            <Dumbbell className="h-10 w-10 text-white/80" />
          </div>

          <div className="grid gap-4 xl:grid-cols-[1.2fr_1fr]">
            <form onSubmit={checkinWorkout} className="card space-y-3">
              <h3 className="text-lg font-semibold">Registrar treino de hoje</h3>
              <input
                className="input"
                placeholder="Tipo de treino (opcional)"
                value={workoutForm.type}
                onChange={(e) => setWorkoutForm((prev) => ({ ...prev, type: e.target.value }))}
              />
              <input
                className="input"
                type="number"
                min="0"
                placeholder="Duração em minutos (opcional)"
                value={workoutForm.duration}
                onChange={(e) =>
                  setWorkoutForm((prev) => ({ ...prev, duration: e.target.value }))
                }
              />
              <textarea
                className="input min-h-[90px]"
                placeholder="Observação rápida (opcional)"
                value={workoutForm.note}
                onChange={(e) => setWorkoutForm((prev) => ({ ...prev, note: e.target.value }))}
              />
              <div className="flex flex-wrap gap-2">
                <button className="btn-primary">Check-in de treino</button>
                {workout.workout.checkedIn ? (
                  <button type="button" className="btn-ghost" onClick={undoWorkout}>
                    Desfazer check-in
                  </button>
                ) : null}
              </div>
            </form>

            <div className="card space-y-2">
              <h3 className="text-lg font-semibold">Status de hoje</h3>
              <p className="text-sm">
                <strong>Marcado:</strong> {workout.workout.checkedIn ? "Sim" : "Não"}
              </p>
              <p className="text-sm">
                <strong>Tipo:</strong> {workout.workout.type || "—"}
              </p>
              <p className="text-sm">
                <strong>Duração:</strong>{" "}
                {workout.workout.duration ? `${workout.workout.duration} min` : "—"}
              </p>
              <p className="text-sm">
                <strong>Observação:</strong> {workout.workout.note || "—"}
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Esse registro alimenta automaticamente o Dashboard de Hábitos.
              </p>
            </div>
          </div>
        </section>
      ) : null}
    </div>
  );
}

function Stat({ title, value }) {
  return (
    <div className="card">
      <p className="text-xs uppercase tracking-wider text-slate-500 dark:text-slate-400">{title}</p>
      <p className="mt-1 text-2xl font-bold">{value}</p>
    </div>
  );
}
