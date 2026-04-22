const HabitDaily = require("../models/HabitDaily");
const SpiritualHabitTemplate = require("../models/SpiritualHabitTemplate");

const getDateKey = (date = new Date()) => new Date(date).toISOString().slice(0, 10);

const baseDaily = (date, templates = []) => ({
  date,
  spiritual: {
    leituraBiblica: { done: false, observation: "" },
    oracao: false,
    custom: templates.map((template) => ({
      habitId: String(template._id),
      name: template.name,
      done: false,
      observation: "",
    })),
  },
  workout: {
    checkedIn: false,
    type: "",
    duration: 0,
    note: "",
    checkedAt: null,
  },
});

const hydrateWithTemplates = (daily, templates) => {
  const existing = new Map((daily.spiritual.custom || []).map((item) => [item.habitId, item]));
  daily.spiritual.custom = templates.map((template) => {
    const found = existing.get(String(template._id));
    return (
      found || {
        habitId: String(template._id),
        name: template.name,
        done: false,
        observation: "",
      }
    );
  });
  return daily;
};

const loadOrCreateDaily = async (userId, date) => {
  const templates = await SpiritualHabitTemplate.find({ userId, active: true }).sort({
    createdAt: 1,
  });
  let daily = await HabitDaily.findOne({ userId, date });
  if (!daily) {
    daily = await HabitDaily.create({ userId, ...baseDaily(date, templates) });
  } else {
    daily = hydrateWithTemplates(daily, templates);
    await daily.save();
  }
  return { daily, templates };
};

const completionForDay = (day) => {
  const fixedTotal = 3; // leitura, oração, treino
  const fixedDone =
    (day.spiritual?.leituraBiblica?.done ? 1 : 0) +
    (day.spiritual?.oracao ? 1 : 0) +
    (day.workout?.checkedIn ? 1 : 0);
  const custom = day.spiritual?.custom || [];
  const customDone = custom.filter((item) => item.done).length;
  const total = fixedTotal + custom.length;
  const done = fixedDone + customDone;
  return {
    total,
    done,
    percentage: total ? Math.round((done / total) * 100) : 0,
  };
};

// Compatibilidade antiga (mantida)
exports.getTodayHabits = async (req, res) => {
  const date = getDateKey(req.query.date || new Date());
  const { daily } = await loadOrCreateDaily(req.user.id, date);
  return res.json(daily);
};

exports.updateTodayHabits = async (req, res) => {
  const date = getDateKey(req.body.date || new Date());
  const { daily } = await loadOrCreateDaily(req.user.id, date);
  if (req.body.spiritual) daily.spiritual = req.body.spiritual;
  if (req.body.workout) daily.workout = req.body.workout;
  await daily.save();
  return res.json(daily);
};

exports.getHistory = async (req, res) => {
  const month = req.query.month || new Date().toISOString().slice(0, 7);
  const list = await HabitDaily.find({
    userId: req.user.id,
    date: { $regex: `^${month}` },
  }).sort({ date: -1 });
  const history = list.map((day) => ({
    ...day.toObject(),
    completion: completionForDay(day),
  }));
  return res.json(history);
};

exports.getStreak = async (req, res) => {
  const list = await HabitDaily.find({ userId: req.user.id }).sort({ date: -1 }).limit(180);
  let streak = 0;
  for (const day of list) {
    const completion = completionForDay(day);
    if (completion.percentage >= 70) streak += 1;
    else break;
  }
  return res.json({ streak });
};

// Novo: dashboard automático (somente leitura)
exports.getAutomationDashboard = async (req, res) => {
  const userId = req.user.id;
  const month = req.query.month || new Date().toISOString().slice(0, 7);
  const list = await HabitDaily.find({
    userId,
    date: { $regex: `^${month}` },
  }).sort({ date: -1 });

  const today = getDateKey();
  const todayData = list.find((item) => item.date === today) || null;
  const todayCompletion = todayData ? completionForDay(todayData) : { total: 0, done: 0, percentage: 0 };

  const monthly = list.reduce(
    (acc, day) => {
      const completion = completionForDay(day);
      acc.days += 1;
      acc.done += completion.done;
      acc.total += completion.total;
      if (day.spiritual?.leituraBiblica?.done) acc.bibleReadDays += 1;
      if (day.spiritual?.oracao) acc.prayerDays += 1;
      if (day.workout?.checkedIn) acc.workoutDays += 1;
      return acc;
    },
    { days: 0, done: 0, total: 0, bibleReadDays: 0, prayerDays: 0, workoutDays: 0 }
  );

  const streakList = await HabitDaily.find({ userId }).sort({ date: -1 }).limit(180);
  let streak = 0;
  for (const day of streakList) {
    if (completionForDay(day).percentage >= 70) streak += 1;
    else break;
  }

  const chart = list
    .slice()
    .reverse()
    .map((day) => ({
      date: day.date.slice(8),
      percentage: completionForDay(day).percentage,
    }));

  return res.json({
    month,
    todayCompletion,
    streak,
    monthly: {
      ...monthly,
      percentage: monthly.total ? Math.round((monthly.done / monthly.total) * 100) : 0,
    },
    chart,
    lastDays: list.slice(0, 14).map((day) => ({
      date: day.date,
      ...completionForDay(day),
    })),
  });
};

// Novo: Vida com Deus
exports.getSpiritualToday = async (req, res) => {
  const date = getDateKey(req.query.date || new Date());
  const { daily } = await loadOrCreateDaily(req.user.id, date);
  return res.json({ date, spiritual: daily.spiritual });
};

exports.updateSpiritualToday = async (req, res) => {
  const date = getDateKey(req.body.date || new Date());
  const { daily } = await loadOrCreateDaily(req.user.id, date);

  const payload = req.body.spiritual || {};
  if (payload.leituraBiblica) {
    daily.spiritual.leituraBiblica.done = Boolean(payload.leituraBiblica.done);
    daily.spiritual.leituraBiblica.observation = payload.leituraBiblica.observation || "";
  }
  if (typeof payload.oracao === "boolean") {
    daily.spiritual.oracao = payload.oracao;
  }
  if (Array.isArray(payload.custom)) {
    const existing = new Map(daily.spiritual.custom.map((item) => [item.habitId, item]));
    daily.spiritual.custom = payload.custom.map((entry) => {
      const base = existing.get(entry.habitId) || {};
      return {
        habitId: entry.habitId,
        name: entry.name || base.name || "Hábito",
        done: Boolean(entry.done),
        observation: entry.observation || "",
      };
    });
  }

  await daily.save();
  return res.json({ date, spiritual: daily.spiritual });
};

exports.listSpiritualTemplates = async (req, res) => {
  const templates = await SpiritualHabitTemplate.find({ userId: req.user.id, active: true }).sort({
    createdAt: 1,
  });
  return res.json(templates);
};

exports.createSpiritualTemplate = async (req, res) => {
  const name = String(req.body.name || "").trim();
  if (!name) return res.status(400).json({ message: "Informe o nome do hábito." });

  const template = await SpiritualHabitTemplate.create({ userId: req.user.id, name, active: true });
  return res.status(201).json(template);
};

exports.removeSpiritualTemplate = async (req, res) => {
  const template = await SpiritualHabitTemplate.findOneAndUpdate(
    { _id: req.params.id, userId: req.user.id },
    { active: false },
    { new: true }
  );
  if (!template) return res.status(404).json({ message: "Hábito não encontrado." });
  return res.json({ message: "Hábito removido." });
};

// Novo: Treinos
exports.getWorkoutToday = async (req, res) => {
  const date = getDateKey(req.query.date || new Date());
  const { daily } = await loadOrCreateDaily(req.user.id, date);
  return res.json({ date, workout: daily.workout });
};

exports.checkinWorkoutToday = async (req, res) => {
  const date = getDateKey(req.body.date || new Date());
  const { daily } = await loadOrCreateDaily(req.user.id, date);
  const payload = req.body.workout || {};

  daily.workout.checkedIn = true;
  daily.workout.type = payload.type || daily.workout.type || "";
  daily.workout.duration = Number(payload.duration || daily.workout.duration || 0);
  daily.workout.note = payload.note || daily.workout.note || "";
  daily.workout.checkedAt = new Date();
  await daily.save();

  return res.json({ date, workout: daily.workout });
};

exports.undoWorkoutToday = async (req, res) => {
  const date = getDateKey(req.body.date || new Date());
  const { daily } = await loadOrCreateDaily(req.user.id, date);
  daily.workout.checkedIn = false;
  daily.workout.checkedAt = null;
  await daily.save();
  return res.json({ date, workout: daily.workout });
};
