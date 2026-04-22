const crypto = require("crypto");
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
  fitness: {
    workout: {
      done: false,
      type: "",
      duration: 0,
      note: "",
    },
    ateCorretamente: false,
    semDoce: false,
    creatina: false,
    whey: false,
    custom: [],
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
  if (!daily.fitness) {
    daily.fitness = baseDaily(daily.date, templates).fitness;
  } else {
    daily.fitness.workout = daily.fitness.workout || { done: false, type: "", duration: 0, note: "" };
    daily.fitness.custom = daily.fitness.custom || [];
  }
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
  const fitness = day.fitness || {};
  const fitnessCustom = fitness.custom || [];
  const fixedTotal = 7; // leitura, oração, treino, dieta, sem doce, creatina, whey
  const fixedDone =
    (day.spiritual?.leituraBiblica?.done ? 1 : 0) +
    (day.spiritual?.oracao ? 1 : 0) +
    (fitness.workout?.done ? 1 : 0) +
    (fitness.ateCorretamente ? 1 : 0) +
    (fitness.semDoce ? 1 : 0) +
    (fitness.creatina ? 1 : 0) +
    (fitness.whey ? 1 : 0);
  const spiritualCustom = day.spiritual?.custom || [];
  const spiritualCustomDone = spiritualCustom.filter((item) => item.done).length;
  const fitnessCustomDone = fitnessCustom.filter((item) => item.done).length;
  const total = fixedTotal + spiritualCustom.length + fitnessCustom.length;
  const done = fixedDone + spiritualCustomDone + fitnessCustomDone;
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
  if (req.body.fitness) daily.fitness = req.body.fitness;
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
      if (day.fitness?.workout?.done) acc.workoutDays += 1;
      if (day.fitness?.ateCorretamente) acc.ateCorretamenteDays += 1;
      if (day.fitness?.semDoce) acc.semDoceDays += 1;
      if (day.fitness?.creatina) acc.creatinaDays += 1;
      if (day.fitness?.whey) acc.wheyDays += 1;
      return acc;
    },
    {
      days: 0,
      done: 0,
      total: 0,
      bibleReadDays: 0,
      prayerDays: 0,
      workoutDays: 0,
      ateCorretamenteDays: 0,
      semDoceDays: 0,
      creatinaDays: 0,
      wheyDays: 0,
    }
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

// Novo: Fitness (hábitos saudáveis)
exports.getFitnessToday = async (req, res) => {
  const date = getDateKey(req.query.date || new Date());
  const { daily } = await loadOrCreateDaily(req.user.id, date);
  return res.json({ date, fitness: daily.fitness });
};

exports.updateFitnessToday = async (req, res) => {
  const date = getDateKey(req.body.date || new Date());
  const { daily } = await loadOrCreateDaily(req.user.id, date);
  const payload = req.body.fitness || {};
  const current = daily.fitness || {};
  const customMap = new Map((current.custom || []).map((item) => [item.habitId, item]));

  daily.fitness.workout = {
    done: Boolean(payload.workout?.done),
    type: payload.workout?.type || "",
    duration: Number(payload.workout?.duration || 0),
    note: payload.workout?.note || "",
  };
  daily.fitness.ateCorretamente = Boolean(payload.ateCorretamente);
  daily.fitness.semDoce = Boolean(payload.semDoce);
  daily.fitness.creatina = Boolean(payload.creatina);
  daily.fitness.whey = Boolean(payload.whey);
  daily.fitness.custom = Array.isArray(payload.custom)
    ? payload.custom.map((entry) => ({
        habitId: entry.habitId,
        name: entry.name || customMap.get(entry.habitId)?.name || "Hábito",
        done: Boolean(entry.done),
      }))
    : current.custom || [];
  daily.fitness.checkedAt = new Date();
  await daily.save();

  return res.json({ date, fitness: daily.fitness });
};

exports.addFitnessCustomHabit = async (req, res) => {
  const date = getDateKey(req.body.date || new Date());
  const name = String(req.body.name || "").trim();
  if (!name) return res.status(400).json({ message: "Informe o nome do hábito." });
  const { daily } = await loadOrCreateDaily(req.user.id, date);
  daily.fitness.custom.push({
    habitId: crypto.randomUUID(),
    name,
    done: false,
  });
  await daily.save();
  return res.status(201).json({ date, fitness: daily.fitness });
};

exports.removeFitnessCustomHabit = async (req, res) => {
  const date = getDateKey(req.body.date || new Date());
  const { habitId } = req.body;
  const { daily } = await loadOrCreateDaily(req.user.id, date);
  daily.fitness.custom = (daily.fitness.custom || []).filter((item) => item.habitId !== habitId);
  await daily.save();
  return res.json({ date, fitness: daily.fitness });
};
