const crypto = require("crypto");
const Group = require("../models/Group");
const GroupCheckin = require("../models/GroupCheckin");
const FriendRequest = require("../models/FriendRequest");

const todayKey = () => new Date().toISOString().slice(0, 10);

const isFriend = async (a, b) => {
  const rel = await FriendRequest.findOne({
    status: "accepted",
    $or: [
      { fromUserId: a, toUserId: b },
      { fromUserId: b, toUserId: a },
    ],
  });
  return Boolean(rel);
};

const ensureMember = (group, userId) =>
  group.members.some((m) => {
    const memberId = m?._id || m;
    return String(memberId) === String(userId);
  });

const computeScore = (habits, completions) => {
  const map = new Map((completions || []).map((c) => [c.habitId, Boolean(c.done)]));
  return (habits || []).reduce(
    (acc, habit) => acc + (map.get(habit.id) ? habit.points || 10 : 0),
    0
  );
};

exports.createGroup = async (req, res) => {
  const { name, description, habits = [] } = req.body;
  if (!name?.trim()) return res.status(400).json({ message: "Nome do grupo é obrigatório." });
  if (!Array.isArray(habits) || !habits.length) {
    return res.status(400).json({ message: "Defina ao menos 1 hábito para o grupo." });
  }

  const normalizedHabits = habits.map((habit) => ({
    id: habit.id || crypto.randomUUID(),
    name: habit.name,
    points: Number(habit.points || 10),
  }));

  const group = await Group.create({
    name,
    description: description || "",
    ownerId: req.user.id,
    members: [req.user.id],
    habits: normalizedHabits,
  });

  const populated = await Group.findById(group._id).populate("members", "name email");
  return res.status(201).json(populated);
};

exports.listGroups = async (req, res) => {
  const groups = await Group.find({ members: req.user.id, active: true })
    .populate("ownerId", "name email")
    .populate("members", "name email")
    .sort({ createdAt: -1 });
  return res.json(groups);
};

exports.getGroup = async (req, res) => {
  const group = await Group.findById(req.params.id)
    .populate("ownerId", "name email")
    .populate("members", "name email");
  if (!group) return res.status(404).json({ message: "Grupo não encontrado." });
  if (!ensureMember(group, req.user.id)) {
    return res.status(403).json({ message: "Você não participa deste grupo." });
  }

  const today = todayKey();
  const todayCheckins = await GroupCheckin.find({ groupId: group._id, date: today });
  const myCheckin = todayCheckins.find((c) => String(c.userId) === String(req.user.id));

  const memberStatus = group.members.map((member) => {
    const checkin = todayCheckins.find((c) => String(c.userId) === String(member._id));
    const completionsMap = {};
    (checkin?.completions || []).forEach((comp) => {
      completionsMap[comp.habitId] = Boolean(comp.done);
    });
    const completed = group.habits.filter((h) => completionsMap[h.id]).length;
    return {
      userId: String(member._id),
      name: member.name,
      email: member.email,
      score: checkin?.score || 0,
      hasCheckedIn: Boolean(checkin),
      completions: completionsMap,
      completedHabits: completed,
      totalHabits: group.habits.length,
      progress: group.habits.length
        ? Math.round((completed / group.habits.length) * 100)
        : 0,
    };
  });

  const habitBoard = group.habits.map((habit) => {
    const completedBy = memberStatus.filter((m) => m.completions[habit.id]);
    const pendingBy = memberStatus.filter((m) => !m.completions[habit.id]);
    return {
      id: habit.id,
      name: habit.name,
      points: habit.points || 10,
      completedBy: completedBy.map((m) => ({ userId: m.userId, name: m.name })),
      pendingBy: pendingBy.map((m) => ({ userId: m.userId, name: m.name })),
      completedCount: completedBy.length,
      totalMembers: group.members.length,
      progress: group.members.length
        ? Math.round((completedBy.length / group.members.length) * 100)
        : 0,
    };
  });

  const ranking = [...memberStatus].sort(
    (a, b) => b.score - a.score || b.completedHabits - a.completedHabits
  );

  return res.json({
    group,
    ranking,
    habitBoard,
    memberStatus,
    date: today,
    myCheckin,
    meId: req.user.id,
  });
};

exports.addMember = async (req, res) => {
  const { userId } = req.body;
  const group = await Group.findById(req.params.id);
  if (!group) return res.status(404).json({ message: "Grupo não encontrado." });
  if (String(group.ownerId) !== String(req.user.id)) {
    return res.status(403).json({ message: "Somente o dono do grupo pode convidar." });
  }
  if (ensureMember(group, userId)) {
    return res.status(400).json({ message: "Usuário já está no grupo." });
  }

  const friend = await isFriend(req.user.id, userId);
  if (!friend) {
    return res.status(400).json({ message: "Você só pode convidar amigos aceitos." });
  }

  group.members.push(userId);
  await group.save();
  const populated = await Group.findById(group._id).populate("members", "name email");
  return res.json(populated);
};

exports.updateHabits = async (req, res) => {
  const group = await Group.findById(req.params.id);
  if (!group) return res.status(404).json({ message: "Grupo não encontrado." });
  if (String(group.ownerId) !== String(req.user.id)) {
    return res.status(403).json({ message: "Somente o dono do grupo pode alterar hábitos." });
  }

  const { habits } = req.body;
  if (!Array.isArray(habits) || !habits.length) {
    return res.status(400).json({ message: "Informe hábitos válidos." });
  }
  group.habits = habits.map((habit) => ({
    id: habit.id || crypto.randomUUID(),
    name: habit.name,
    points: Number(habit.points || 10),
  }));
  await group.save();
  return res.json(group);
};

exports.checkinToday = async (req, res) => {
  const group = await Group.findById(req.params.id);
  if (!group) return res.status(404).json({ message: "Grupo não encontrado." });
  if (!ensureMember(group, req.user.id)) {
    return res.status(403).json({ message: "Você não participa deste grupo." });
  }

  const completions = Array.isArray(req.body.completions) ? req.body.completions : [];
  const sanitized = group.habits.map((habit) => {
    const entry = completions.find((c) => c.habitId === habit.id);
    return { habitId: habit.id, done: Boolean(entry?.done) };
  });

  const score = computeScore(group.habits, sanitized);
  const checkin = await GroupCheckin.findOneAndUpdate(
    { groupId: group._id, userId: req.user.id, date: todayKey() },
    { completions: sanitized, score, groupId: group._id, userId: req.user.id, date: todayKey() },
    { upsert: true, new: true }
  );

  return res.json(checkin);
};

exports.getRanking = async (req, res) => {
  const { range = "daily" } = req.query; // daily|weekly
  const group = await Group.findById(req.params.id).populate("members", "name email");
  if (!group) return res.status(404).json({ message: "Grupo não encontrado." });
  if (!ensureMember(group, req.user.id)) {
    return res.status(403).json({ message: "Você não participa deste grupo." });
  }

  const end = new Date();
  const start = new Date();
  if (range === "weekly") start.setDate(end.getDate() - 6);
  const startKey = start.toISOString().slice(0, 10);
  const endKey = end.toISOString().slice(0, 10);

  const checkins = await GroupCheckin.find({
    groupId: group._id,
    date: { $gte: startKey, $lte: endKey },
  });

  const board = group.members.map((member) => {
    const mine = checkins.filter((c) => String(c.userId) === String(member._id));
    const totalScore = mine.reduce((acc, c) => acc + c.score, 0);
    const doneHabits = mine.reduce(
      (acc, c) => acc + c.completions.filter((item) => item.done).length,
      0
    );
    const totalPossible = mine.length * group.habits.length;
    return {
      userId: member._id,
      name: member.name,
      totalScore,
      consistency: totalPossible ? Math.round((doneHabits / totalPossible) * 100) : 0,
      checkinDays: mine.length,
    };
  });

  board.sort((a, b) => b.totalScore - a.totalScore || b.consistency - a.consistency);
  return res.json({ range, ranking: board });
};
