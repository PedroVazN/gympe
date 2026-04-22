import { useEffect, useMemo, useState } from "react";
import {
  CheckCircle2,
  Crown,
  Flame,
  Medal,
  Plus,
  ShieldCheck,
  Sparkles,
  Target,
  Trophy,
  UserPlus,
  Users,
  X,
} from "lucide-react";
import PageHeader from "../components/PageHeader";
import api from "../services/api";

const tabStyle = (active) =>
  `rounded-xl px-4 py-2 text-sm font-semibold transition ${
    active
      ? "bg-gradient-to-r from-brand-600 to-accent-500 text-white shadow"
      : "bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-white/5 dark:text-slate-300 dark:hover:bg-white/10"
  }`;

const makeDefaultHabits = () => [
  { id: crypto.randomUUID(), name: "Treinei hoje", points: 10 },
  { id: crypto.randomUUID(), name: "Comi corretamente", points: 10 },
  { id: crypto.randomUUID(), name: "Orei", points: 10 },
];

const getInitials = (name = "") =>
  name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() || "")
    .join("") || "?";

const avatarGradients = [
  "from-pink-500 via-fuchsia-500 to-indigo-500",
  "from-amber-400 via-orange-500 to-rose-500",
  "from-emerald-400 via-teal-500 to-cyan-500",
  "from-sky-400 via-blue-500 to-indigo-600",
  "from-violet-500 via-purple-500 to-fuchsia-500",
  "from-lime-400 via-emerald-500 to-teal-600",
  "from-rose-500 via-red-500 to-orange-500",
  "from-indigo-400 via-blue-500 to-sky-500",
];

const avatarGradient = (seed = "") => {
  let hash = 0;
  for (let i = 0; i < seed.length; i += 1) hash = (hash * 31 + seed.charCodeAt(i)) % 997;
  return avatarGradients[hash % avatarGradients.length];
};

function Avatar({ name, size = 40, ring = false, online = false, active = false }) {
  const gradient = avatarGradient(name || "x");
  const dimension = { width: size, height: size, fontSize: Math.max(10, size * 0.38) };
  return (
    <div
      className={`relative inline-flex items-center justify-center ${
        ring ? "rounded-full p-[2px] bg-gradient-to-br from-fuchsia-500 via-orange-400 to-amber-300" : ""
      } ${active ? "ring-2 ring-brand-500 ring-offset-2 ring-offset-white dark:ring-offset-slate-900" : ""}`}
    >
      <div
        className={`flex items-center justify-center rounded-full bg-gradient-to-br ${gradient} font-bold text-white shadow-lg`}
        style={dimension}
      >
        {getInitials(name)}
      </div>
      {online ? (
        <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-white bg-emerald-500 dark:border-slate-900" />
      ) : null}
    </div>
  );
}

export default function SocialPage() {
  const [tab, setTab] = useState("groups");
  const [friends, setFriends] = useState([]);
  const [requests, setRequests] = useState({ incoming: [], outgoing: [] });
  const [friendEmail, setFriendEmail] = useState("");

  const [groups, setGroups] = useState([]);
  const [selectedGroupId, setSelectedGroupId] = useState("");
  const [selectedGroup, setSelectedGroup] = useState(null);

  const [groupForm, setGroupForm] = useState({
    name: "",
    description: "",
    habits: makeDefaultHabits(),
  });
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [inviteUserId, setInviteUserId] = useState("");
  const [myCheckins, setMyCheckins] = useState([]);

  const loadFriends = async () => {
    const [friendsRes, requestsRes] = await Promise.all([
      api.get("/friends"),
      api.get("/friends/requests"),
    ]);
    setFriends(friendsRes.data);
    setRequests(requestsRes.data);
  };

  const loadGroups = async () => {
    const { data } = await api.get("/groups");
    setGroups(data);
    if (!selectedGroupId && data.length) setSelectedGroupId(data[0]._id);
  };

  const loadGroupDetails = async (groupId = selectedGroupId) => {
    if (!groupId) return;
    const details = await api.get(`/groups/${groupId}`);
    setSelectedGroup(details.data);
    const mine = details.data.group.habits.map((habit) => ({
      habitId: habit.id,
      done: false,
    }));
    const saved = details.data.myCheckin?.completions || [];
    const merged = mine.map((h) => {
      const existing = saved.find((s) => s.habitId === h.habitId);
      return existing ? { habitId: h.habitId, done: Boolean(existing.done) } : h;
    });
    setMyCheckins(merged);
  };

  useEffect(() => {
    loadFriends();
    loadGroups();
  }, []);

  useEffect(() => {
    loadGroupDetails();
  }, [selectedGroupId]);

  const sendRequest = async (event) => {
    event.preventDefault();
    if (!friendEmail.trim()) return;
    await api.post("/friends/request", { email: friendEmail });
    setFriendEmail("");
    loadFriends();
  };

  const respond = async (id, action) => {
    await api.patch(`/friends/requests/${id}/respond`, { action });
    loadFriends();
    loadGroups();
  };

  const createGroup = async (event) => {
    event.preventDefault();
    await api.post("/groups", groupForm);
    setGroupForm({ name: "", description: "", habits: makeDefaultHabits() });
    setShowCreateGroup(false);
    loadGroups();
  };

  const addHabitField = () => {
    setGroupForm((prev) => ({
      ...prev,
      habits: [...prev.habits, { id: crypto.randomUUID(), name: "", points: 10 }],
    }));
  };

  const updateHabitField = (id, key, value) => {
    setGroupForm((prev) => ({
      ...prev,
      habits: prev.habits.map((habit) =>
        habit.id === id ? { ...habit, [key]: key === "points" ? Number(value) : value } : habit
      ),
    }));
  };

  const removeHabitField = (id) => {
    setGroupForm((prev) => ({
      ...prev,
      habits: prev.habits.filter((habit) => habit.id !== id),
    }));
  };

  const inviteFriend = async () => {
    if (!selectedGroupId || !inviteUserId) return;
    await api.patch(`/groups/${selectedGroupId}/members`, { userId: inviteUserId });
    setInviteUserId("");
    loadGroups();
    loadGroupDetails(selectedGroupId);
  };

  const toggleHabitDone = (habitId) => {
    setMyCheckins((prev) =>
      prev.map((item) => (item.habitId === habitId ? { ...item, done: !item.done } : item))
    );
  };

  const saveCheckin = async () => {
    if (!selectedGroupId) return;
    await api.put(`/groups/${selectedGroupId}/checkin-today`, {
      completions: myCheckins,
    });
    loadGroupDetails(selectedGroupId);
  };

  const groupData = selectedGroup?.group;
  const habitBoard = selectedGroup?.habitBoard || [];
  const memberStatus = selectedGroup?.memberStatus || [];
  const ranking = selectedGroup?.ranking || [];

  const myCheckedCount = useMemo(
    () => myCheckins.filter((c) => c.done).length,
    [myCheckins]
  );
  const totalGroupHabits = groupData?.habits?.length || 0;
  const myProgress = totalGroupHabits
    ? Math.round((myCheckedCount / totalGroupHabits) * 100)
    : 0;

  const groupTotalScoreToday = useMemo(
    () => ranking.reduce((acc, r) => acc + (r.score || 0), 0),
    [ranking]
  );
  const groupCheckedInCount = memberStatus.filter((m) => m.hasCheckedIn).length;

  const podium = ranking.slice(0, 3);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Arena Social"
        subtitle="Competição entre amigos: hábitos compartilhados, ranking em tempo real e dashboard de performance do seu grupo."
      />

      <div className="card !p-2">
        <div className="flex flex-wrap gap-2">
          <button className={tabStyle(tab === "friends")} onClick={() => setTab("friends")}>
            Amigos
          </button>
          <button className={tabStyle(tab === "groups")} onClick={() => setTab("groups")}>
            Meus grupos
          </button>
        </div>
      </div>

      {tab === "friends" ? (
        <section className="grid gap-4 xl:grid-cols-[1fr_1fr]">
          <form onSubmit={sendRequest} className="card space-y-3">
            <h3 className="text-lg font-semibold">Adicionar amigo</h3>
            <input
              className="input"
              placeholder="E-mail do amigo"
              value={friendEmail}
              onChange={(e) => setFriendEmail(e.target.value)}
            />
            <button className="btn-primary">
              <UserPlus className="h-4 w-4" /> Enviar solicitação
            </button>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Só amigos aceitos podem participar dos seus grupos.
            </p>
          </form>

          <div className="card">
            <h3 className="mb-3 text-lg font-semibold">Meus amigos ({friends.length})</h3>
            {friends.length === 0 ? (
              <p className="text-sm text-slate-500 dark:text-slate-400">Ainda sem amigos.</p>
            ) : (
              <ul className="space-y-2">
                {friends.map((friend) => (
                  <li
                    key={friend.id}
                    className="flex items-center justify-between rounded-xl bg-slate-100 p-3 dark:bg-white/5"
                  >
                    <div className="flex items-center gap-3">
                      <Avatar name={friend.name} size={36} />
                      <div>
                        <p className="font-semibold">{friend.name}</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">{friend.email}</p>
                      </div>
                    </div>
                    <Users className="h-4 w-4 text-slate-400" />
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="card">
            <h3 className="mb-3 text-lg font-semibold">Solicitações recebidas</h3>
            {requests.incoming.length === 0 ? (
              <p className="text-sm text-slate-500 dark:text-slate-400">Nenhuma solicitação.</p>
            ) : (
              <ul className="space-y-2">
                {requests.incoming.map((request) => (
                  <li
                    key={request.id}
                    className="flex items-center justify-between rounded-xl bg-slate-100 p-3 dark:bg-white/5"
                  >
                    <div className="flex items-center gap-3">
                      <Avatar name={request.from.name} size={36} />
                      <div>
                        <p className="font-semibold">{request.from.name}</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          {request.from.email}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        className="btn-primary px-3 py-1.5 text-xs"
                        onClick={() => respond(request.id, "accept")}
                      >
                        Aceitar
                      </button>
                      <button
                        className="btn-ghost px-3 py-1.5 text-xs"
                        onClick={() => respond(request.id, "reject")}
                      >
                        Recusar
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="card">
            <h3 className="mb-3 text-lg font-semibold">Solicitações enviadas</h3>
            {requests.outgoing.length === 0 ? (
              <p className="text-sm text-slate-500 dark:text-slate-400">Nada pendente.</p>
            ) : (
              <ul className="space-y-2">
                {requests.outgoing.map((request) => (
                  <li
                    key={request.id}
                    className="rounded-xl bg-slate-100 p-3 text-sm dark:bg-white/5"
                  >
                    Aguardando resposta de <strong>{request.to.name}</strong>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>
      ) : null}

      {tab === "groups" ? (
        <section className="space-y-5">
          {/* ---------- Stories-style group picker ---------- */}
          <div className="card overflow-hidden">
            <div className="mb-3 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold">Seus grupos</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Clique num grupo para abrir o dashboard de competição
                </p>
              </div>
              <button
                className="btn-ghost"
                onClick={() => setShowCreateGroup((prev) => !prev)}
              >
                {showCreateGroup ? (
                  <>
                    <X className="h-4 w-4" /> Fechar
                  </>
                ) : (
                  <>
                    <Plus className="h-4 w-4" /> Novo grupo
                  </>
                )}
              </button>
            </div>

            <div className="flex gap-4 overflow-x-auto pb-2">
              <button
                type="button"
                onClick={() => setShowCreateGroup(true)}
                className="flex min-w-[92px] flex-col items-center gap-2"
              >
                <div className="flex h-[72px] w-[72px] items-center justify-center rounded-full border-2 border-dashed border-slate-300 text-slate-500 transition hover:border-brand-500 hover:text-brand-600 dark:border-white/15 dark:text-slate-300">
                  <Plus className="h-6 w-6" />
                </div>
                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                  Criar grupo
                </span>
              </button>

              {groups.map((group) => {
                const active = selectedGroupId === group._id;
                return (
                  <button
                    key={group._id}
                    type="button"
                    onClick={() => setSelectedGroupId(group._id)}
                    className="flex min-w-[92px] flex-col items-center gap-2"
                  >
                    <Avatar name={group.name} size={72} ring active={active} />
                    <span
                      className={`line-clamp-1 max-w-[92px] text-center text-xs font-semibold ${
                        active
                          ? "text-brand-600 dark:text-brand-300"
                          : "text-slate-600 dark:text-slate-300"
                      }`}
                    >
                      {group.name}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* ---------- Create group form (toggle) ---------- */}
          {showCreateGroup ? (
            <form onSubmit={createGroup} className="card space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Criar grupo competitivo</h3>
                <button
                  type="button"
                  className="btn-ghost"
                  onClick={() => setShowCreateGroup(false)}
                >
                  <X className="h-4 w-4" /> Cancelar
                </button>
              </div>
              <input
                className="input"
                placeholder="Nome do grupo"
                value={groupForm.name}
                onChange={(e) => setGroupForm((prev) => ({ ...prev, name: e.target.value }))}
              />
              <input
                className="input"
                placeholder="Descrição"
                value={groupForm.description}
                onChange={(e) =>
                  setGroupForm((prev) => ({ ...prev, description: e.target.value }))
                }
              />
              <div className="space-y-2">
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Hábitos compartilhados (mesmos objetivos)
                </p>
                {groupForm.habits.map((habit) => (
                  <div key={habit.id} className="grid grid-cols-[1fr_100px_auto] gap-2">
                    <input
                      className="input"
                      placeholder="Nome do hábito"
                      value={habit.name}
                      onChange={(e) => updateHabitField(habit.id, "name", e.target.value)}
                    />
                    <input
                      className="input"
                      type="number"
                      min="1"
                      value={habit.points}
                      onChange={(e) => updateHabitField(habit.id, "points", e.target.value)}
                    />
                    <button
                      type="button"
                      className="btn-ghost"
                      onClick={() => removeHabitField(habit.id)}
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
              <div className="flex gap-2">
                <button type="button" className="btn-ghost" onClick={addHabitField}>
                  <Plus className="h-4 w-4" /> Hábito
                </button>
                <button className="btn-primary">
                  <Users className="h-4 w-4" /> Criar grupo
                </button>
              </div>
            </form>
          ) : null}

          {!groupData ? (
            <div className="card text-center">
              <Users className="mx-auto mb-3 h-10 w-10 text-slate-400" />
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Selecione ou crie um grupo para começar a competir.
              </p>
            </div>
          ) : (
            <>
              {/* ---------- Hero competitivo ---------- */}
              <div className="relative overflow-hidden rounded-3xl border border-white/10 p-6 text-white shadow-2xl">
                <div className="absolute inset-0 bg-gradient-to-br from-fuchsia-600 via-purple-700 to-indigo-800" />
                <div className="absolute -right-16 -top-16 h-64 w-64 rounded-full bg-pink-400/30 blur-3xl" />
                <div className="absolute -bottom-16 -left-10 h-56 w-56 rounded-full bg-cyan-400/20 blur-3xl" />

                <div className="relative z-10">
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <Avatar name={groupData.name} size={84} ring />
                      <div>
                        <div className="flex items-center gap-2">
                          <h2 className="text-2xl font-bold">{groupData.name}</h2>
                          <span className="inline-flex items-center gap-1 rounded-full bg-white/15 px-2 py-0.5 text-xs font-semibold backdrop-blur">
                            <Flame className="h-3 w-3 text-amber-300" /> Ao vivo
                          </span>
                        </div>
                        {groupData.description ? (
                          <p className="mt-1 max-w-lg text-sm text-white/80">
                            {groupData.description}
                          </p>
                        ) : null}
                        <p className="mt-2 text-xs text-white/70">
                          {new Date(selectedGroup.date).toLocaleDateString("pt-BR", {
                            weekday: "long",
                            day: "2-digit",
                            month: "long",
                          })}
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-3">
                      <div className="rounded-2xl bg-white/10 px-4 py-3 text-center backdrop-blur">
                        <p className="text-xs uppercase tracking-wider text-white/70">Membros</p>
                        <p className="text-2xl font-bold">{groupData.members.length}</p>
                      </div>
                      <div className="rounded-2xl bg-white/10 px-4 py-3 text-center backdrop-blur">
                        <p className="text-xs uppercase tracking-wider text-white/70">Check-ins hoje</p>
                        <p className="text-2xl font-bold">
                          {groupCheckedInCount}/{groupData.members.length}
                        </p>
                      </div>
                      <div className="rounded-2xl bg-white/10 px-4 py-3 text-center backdrop-blur">
                        <p className="text-xs uppercase tracking-wider text-white/70">Pontos hoje</p>
                        <p className="text-2xl font-bold">{groupTotalScoreToday}</p>
                      </div>
                    </div>
                  </div>

                  {/* Members strip */}
                  <div className="mt-6 flex flex-wrap items-center gap-3">
                    {memberStatus.map((m) => (
                      <div key={m.userId} className="flex flex-col items-center gap-1">
                        <Avatar
                          name={m.name}
                          size={48}
                          ring={m.hasCheckedIn}
                          online={m.hasCheckedIn}
                        />
                        <span className="max-w-[64px] truncate text-[11px] font-semibold text-white/90">
                          {m.name.split(" ")[0]}
                        </span>
                        <span className="text-[10px] text-white/70">
                          {m.completedHabits}/{m.totalHabits}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* ---------- Invite friend ---------- */}
              <div className="card">
                <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Convidar amigo
                </h3>
                <div className="flex flex-wrap items-center gap-2">
                  <select
                    className="input w-auto min-w-[260px]"
                    value={inviteUserId}
                    onChange={(e) => setInviteUserId(e.target.value)}
                  >
                    <option value="">Selecione um amigo</option>
                    {friends.map((friend) => (
                      <option key={friend.id} value={friend.id}>
                        {friend.name} ({friend.email})
                      </option>
                    ))}
                  </select>
                  <button className="btn-primary" onClick={inviteFriend}>
                    <UserPlus className="h-4 w-4" /> Convidar
                  </button>
                </div>
              </div>

              <div className="grid gap-5 xl:grid-cols-[2fr_1fr]">
                {/* ---------- Dashboard de Competição: checklist por hábito ---------- */}
                <div className="card">
                  <div className="mb-4 flex items-center justify-between">
                    <div>
                      <h3 className="flex items-center gap-2 text-lg font-semibold">
                        <Trophy className="h-5 w-5 text-amber-500" />
                        Dashboard de competição
                      </h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        Veja quem concluiu cada hábito hoje
                      </p>
                    </div>
                    <span className="chip">
                      <Sparkles className="h-3.5 w-3.5" /> {totalGroupHabits} hábitos
                    </span>
                  </div>

                  {habitBoard.length === 0 ? (
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                      Este grupo ainda não tem hábitos definidos.
                    </p>
                  ) : (
                    <ul className="space-y-3">
                      {habitBoard.map((habit) => (
                        <li
                          key={habit.id}
                          className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-white/10 dark:bg-white/[0.03]"
                        >
                          <div className="flex flex-wrap items-center justify-between gap-3">
                            <div className="flex items-center gap-3">
                              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-brand-500 to-accent-500 text-white shadow">
                                <Target className="h-5 w-5" />
                              </div>
                              <div>
                                <p className="font-semibold">{habit.name}</p>
                                <p className="text-xs text-slate-500 dark:text-slate-400">
                                  {habit.points} pontos ·{" "}
                                  <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                                    {habit.completedCount}/{habit.totalMembers} concluíram
                                  </span>
                                </p>
                              </div>
                            </div>
                            <span
                              className={`rounded-full px-3 py-1 text-xs font-bold ${
                                habit.progress === 100
                                  ? "bg-emerald-500/20 text-emerald-600 dark:text-emerald-300"
                                  : habit.progress >= 50
                                  ? "bg-amber-500/20 text-amber-600 dark:text-amber-300"
                                  : "bg-rose-500/20 text-rose-600 dark:text-rose-300"
                              }`}
                            >
                              {habit.progress}%
                            </span>
                          </div>

                          {/* Progress bar */}
                          <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-200 dark:bg-white/10">
                            <div
                              className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-emerald-600 transition-all"
                              style={{ width: `${habit.progress}%` }}
                            />
                          </div>

                          {/* Member chips: done / pending */}
                          <div className="mt-4 grid gap-3 sm:grid-cols-2">
                            <div>
                              <p className="mb-2 flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                                <CheckCircle2 className="h-3.5 w-3.5" />
                                Concluíram ({habit.completedBy.length})
                              </p>
                              {habit.completedBy.length === 0 ? (
                                <p className="text-xs text-slate-400">Ninguém ainda</p>
                              ) : (
                                <div className="flex flex-wrap gap-2">
                                  {habit.completedBy.map((m) => (
                                    <div
                                      key={m.userId}
                                      className="flex items-center gap-2 rounded-full border border-emerald-400/30 bg-emerald-500/10 px-2 py-1 text-xs font-semibold text-emerald-700 dark:text-emerald-300"
                                    >
                                      <Avatar name={m.name} size={22} />
                                      <span className="max-w-[100px] truncate">
                                        {m.name.split(" ")[0]}
                                      </span>
                                      <CheckCircle2 className="h-3.5 w-3.5" />
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                            <div>
                              <p className="mb-2 flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider text-rose-500 dark:text-rose-400">
                                <X className="h-3.5 w-3.5" />
                                Pendentes ({habit.pendingBy.length})
                              </p>
                              {habit.pendingBy.length === 0 ? (
                                <p className="text-xs text-slate-400">Todos concluíram 🎉</p>
                              ) : (
                                <div className="flex flex-wrap gap-2">
                                  {habit.pendingBy.map((m) => (
                                    <div
                                      key={m.userId}
                                      className="flex items-center gap-2 rounded-full border border-slate-300 bg-slate-200/60 px-2 py-1 text-xs font-semibold text-slate-600 opacity-80 dark:border-white/10 dark:bg-white/5 dark:text-slate-300"
                                    >
                                      <Avatar name={m.name} size={22} />
                                      <span className="max-w-[100px] truncate">
                                        {m.name.split(" ")[0]}
                                      </span>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                {/* ---------- Side column: My Checkin + Podium ---------- */}
                <div className="space-y-5">
                  <div className="card">
                    <h3 className="mb-1 flex items-center gap-2 text-lg font-semibold">
                      <ShieldCheck className="h-5 w-5 text-brand-500" />
                      Meu check-in
                    </h3>
                    <p className="mb-3 text-xs text-slate-500 dark:text-slate-400">
                      {myCheckedCount} de {totalGroupHabits} hábitos concluídos hoje
                    </p>

                    <div className="mb-4 h-2 overflow-hidden rounded-full bg-slate-200 dark:bg-white/10">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-brand-500 to-accent-500 transition-all"
                        style={{ width: `${myProgress}%` }}
                      />
                    </div>

                    <ul className="space-y-2">
                      {groupData.habits.map((habit) => {
                        const checked = myCheckins.find((c) => c.habitId === habit.id)?.done;
                        return (
                          <li
                            key={habit.id}
                            className={`flex items-center justify-between rounded-xl p-3 transition ${
                              checked
                                ? "bg-emerald-500/10 ring-1 ring-emerald-500/30"
                                : "bg-slate-100 dark:bg-white/5"
                            }`}
                          >
                            <div>
                              <p className="text-sm font-semibold">{habit.name}</p>
                              <p className="text-xs text-slate-500 dark:text-slate-400">
                                {habit.points} pontos
                              </p>
                            </div>
                            <button
                              className={checked ? "btn-primary" : "btn-ghost"}
                              onClick={() => toggleHabitDone(habit.id)}
                            >
                              {checked ? (
                                <>
                                  <CheckCircle2 className="h-4 w-4" /> Feito
                                </>
                              ) : (
                                <>
                                  <Target className="h-4 w-4" /> Marcar
                                </>
                              )}
                            </button>
                          </li>
                        );
                      })}
                    </ul>
                    <button className="btn-primary mt-4 w-full" onClick={saveCheckin}>
                      <ShieldCheck className="h-4 w-4" /> Salvar check-in
                    </button>
                  </div>

                  {/* Podium */}
                  <div className="card">
                    <h3 className="mb-4 flex items-center gap-2 text-lg font-semibold">
                      <Crown className="h-5 w-5 text-amber-500" />
                      Ranking de hoje
                    </h3>

                    {podium.length === 0 ? (
                      <p className="text-sm text-slate-500 dark:text-slate-400">
                        Sem dados ainda para hoje.
                      </p>
                    ) : (
                      <>
                        {/* Top 3 podium visual */}
                        <div className="mb-5 grid grid-cols-3 items-end gap-2">
                          {[podium[1], podium[0], podium[2]].map((p, idx) => {
                            if (!p) return <div key={idx} />;
                            const position = p === podium[0] ? 1 : p === podium[1] ? 2 : 3;
                            const heights = { 1: "h-24", 2: "h-20", 3: "h-16" };
                            const colors = {
                              1: "from-amber-300 to-amber-500",
                              2: "from-slate-200 to-slate-400",
                              3: "from-orange-300 to-orange-500",
                            };
                            return (
                              <div key={p.userId} className="flex flex-col items-center">
                                <Avatar name={p.name} size={position === 1 ? 56 : 44} ring={position === 1} />
                                <p className="mt-1 max-w-full truncate text-center text-xs font-bold">
                                  {p.name.split(" ")[0]}
                                </p>
                                <p className="text-[10px] text-slate-500 dark:text-slate-400">
                                  {p.score} pts
                                </p>
                                <div
                                  className={`mt-2 flex ${heights[position]} w-full items-center justify-center rounded-t-lg bg-gradient-to-b ${colors[position]} text-white shadow`}
                                >
                                  {position === 1 ? (
                                    <Crown className="h-5 w-5" />
                                  ) : (
                                    <span className="text-lg font-bold">{position}</span>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>

                        {/* Full list */}
                        <ol className="space-y-2">
                          {ranking.map((item, index) => {
                            const isMe = String(item.userId) === String(selectedGroup?.meId);
                            return (
                              <li
                                key={item.userId}
                                className={`flex items-center justify-between rounded-xl p-3 ${
                                  isMe
                                    ? "bg-brand-500/10 ring-1 ring-brand-500/30"
                                    : "bg-slate-100 dark:bg-white/5"
                                }`}
                              >
                                <div className="flex items-center gap-3">
                                  <div className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-200 text-[11px] font-bold dark:bg-white/10">
                                    {index === 0 ? (
                                      <Crown className="h-3.5 w-3.5 text-amber-500" />
                                    ) : index === 1 ? (
                                      <Medal className="h-3.5 w-3.5 text-slate-400" />
                                    ) : index === 2 ? (
                                      <Medal className="h-3.5 w-3.5 text-orange-500" />
                                    ) : (
                                      <span>#{index + 1}</span>
                                    )}
                                  </div>
                                  <Avatar name={item.name} size={32} />
                                  <div>
                                    <p className="text-sm font-semibold">
                                      {item.name} {isMe ? <span className="text-xs text-brand-500">(você)</span> : null}
                                    </p>
                                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                                      {item.completedHabits || 0}/{item.totalHabits || totalGroupHabits} hábitos
                                    </p>
                                  </div>
                                </div>
                                <p className="text-sm font-bold text-brand-600 dark:text-brand-300">
                                  {item.score || 0} pts
                                </p>
                              </li>
                            );
                          })}
                        </ol>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </>
          )}
        </section>
      ) : null}
    </div>
  );
}
