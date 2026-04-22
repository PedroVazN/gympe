import { useEffect, useState } from "react";
import {
  CheckCircle2,
  Crown,
  Plus,
  ShieldCheck,
  Target,
  UserPlus,
  Users,
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
    setMyCheckins(details.data.myCheckin?.completions || mine);
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

  return (
    <div className="space-y-6">
      <PageHeader
        title="Competição Social"
        subtitle="Crie grupos com amigos, compartilhe os mesmos hábitos e dispute o ranking diário."
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
                    <div>
                      <p className="font-semibold">{friend.name}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">{friend.email}</p>
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
                    <div>
                      <p className="font-semibold">{request.from.name}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        {request.from.email}
                      </p>
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
        <section className="grid gap-4 xl:grid-cols-[1fr_1fr]">
          <form onSubmit={createGroup} className="card space-y-3">
            <h3 className="text-lg font-semibold">Criar grupo competitivo</h3>
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
                <div key={habit.id} className="grid grid-cols-[1fr_100px] gap-2">
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

          <div className="card">
            <h3 className="mb-3 text-lg font-semibold">Meus grupos ({groups.length})</h3>
            {groups.length === 0 ? (
              <p className="text-sm text-slate-500 dark:text-slate-400">Sem grupos ainda.</p>
            ) : (
              <ul className="space-y-2">
                {groups.map((group) => (
                  <li
                    key={group._id}
                    className={`cursor-pointer rounded-xl border p-3 transition ${
                      selectedGroupId === group._id
                        ? "border-brand-500 bg-brand-500/10"
                        : "border-slate-200 dark:border-white/10"
                    }`}
                    onClick={() => setSelectedGroupId(group._id)}
                  >
                    <p className="font-semibold">{group.name}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {group.members.length} participantes
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="card xl:col-span-2">
            <h3 className="mb-3 text-lg font-semibold">Convidar amigo para o grupo selecionado</h3>
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
          <div className="card xl:col-span-2">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold">Grupo em foco: {selectedGroup?.group?.name || "—"}</h3>
              <span className="chip">
                {selectedGroup?.group?.members?.length || 0} participantes
              </span>
            </div>

            {!selectedGroup?.group ? (
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Selecione um grupo para visualizar hábitos e fazer check-in de hoje.
              </p>
            ) : (
              <div className="space-y-4">
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-white/10 dark:bg-white/[0.03]">
                  <p className="mb-3 text-sm font-semibold">Detalhes do grupo</p>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                        Participantes
                      </p>
                      <ul className="space-y-1">
                        {selectedGroup.group.members.map((member) => (
                          <li
                            key={member._id}
                            className="rounded-lg bg-white px-2 py-1 text-sm dark:bg-white/5"
                          >
                            {member.name}
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                        Hábitos definidos
                      </p>
                      <ul className="space-y-1">
                        {selectedGroup.group.habits.map((habit) => (
                          <li
                            key={habit.id}
                            className="flex items-center justify-between rounded-lg bg-white px-2 py-1 text-sm dark:bg-white/5"
                          >
                            <span>{habit.name}</span>
                            <span className="text-xs font-semibold text-brand-600 dark:text-brand-300">
                              {habit.points} pts
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>

                <div className="grid gap-4 xl:grid-cols-[1fr_1fr]">
                  <div className="space-y-3">
                  <p className="text-sm font-semibold text-slate-600 dark:text-slate-300">
                    Hábitos do grupo (check-in de hoje)
                  </p>
                  <ul className="space-y-2">
                    {selectedGroup.group.habits.map((habit) => {
                      const checked = myCheckins.find((c) => c.habitId === habit.id)?.done;
                      return (
                        <li
                          key={habit.id}
                          className="flex items-center justify-between rounded-xl bg-slate-100 p-3 dark:bg-white/5"
                        >
                          <div>
                            <p className="font-semibold">{habit.name}</p>
                            <p className="text-xs text-slate-500 dark:text-slate-400">
                              {habit.points} pontos
                            </p>
                          </div>
                          <button className="btn-ghost" onClick={() => toggleHabitDone(habit.id)}>
                            {checked ? (
                              <>
                                <CheckCircle2 className="h-4 w-4 text-emerald-500" /> Feito
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
                  <button className="btn-primary w-full" onClick={saveCheckin}>
                    <ShieldCheck className="h-4 w-4" /> Salvar check-in de hoje
                  </button>
                  </div>

                  <div className="space-y-3">
                  <p className="text-sm font-semibold text-slate-600 dark:text-slate-300">
                    Ranking de hoje (pontuação total + hábitos concluídos)
                  </p>
                  {(selectedGroup.ranking || []).length === 0 ? (
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                      Sem dados ainda para hoje.
                    </p>
                  ) : (
                    <ol className="space-y-2">
                      {selectedGroup.ranking.map((item, index) => (
                        <li
                          key={item.userId}
                          className="flex items-center justify-between rounded-xl bg-slate-100 p-3 dark:bg-white/5"
                        >
                          <div className="flex items-center gap-2">
                            {index === 0 ? (
                              <Crown className="h-4 w-4 text-amber-500" />
                            ) : (
                              <span className="text-xs font-bold text-slate-500">#{index + 1}</span>
                            )}
                            <div>
                              <p className="font-semibold">{item.name}</p>
                              <p className="text-xs text-slate-500 dark:text-slate-400">
                                Hábitos concluídos hoje: {item.completedHabits || 0}
                              </p>
                            </div>
                          </div>
                          <p className="text-sm font-bold text-brand-600 dark:text-brand-300">
                            {item.score || 0} pts
                          </p>
                        </li>
                      ))}
                    </ol>
                  )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </section>
      ) : null}
    </div>
  );
}
