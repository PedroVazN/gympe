const Habit = require("../models/Habit");

const getDateKey = (date = new Date()) => new Date(date).toISOString().slice(0, 10);

exports.getTodayHabits = async (req, res) => {
  const date = getDateKey(req.query.date || new Date());
  const habit = await Habit.findOne({ userId: req.user.id, date });
  if (!habit) {
    return res.json({
      date,
      habits: {
        treinou: false,
        dieta: false,
        orou: false,
        agradeceu: false,
        evitouPecar: false,
        custom: [],
      },
    });
  }
  return res.json(habit);
};

exports.updateTodayHabits = async (req, res) => {
  const date = getDateKey(req.body.date || new Date());
  const updated = await Habit.findOneAndUpdate(
    { userId: req.user.id, date },
    { habits: req.body.habits, userId: req.user.id, date },
    { upsert: true, new: true }
  );
  return res.json(updated);
};

exports.getHistory = async (req, res) => {
  const month = req.query.month || new Date().toISOString().slice(0, 7);
  const habits = await Habit.find({
    userId: req.user.id,
    date: { $regex: `^${month}` },
  }).sort({ date: -1 });
  return res.json(habits);
};

exports.getStreak = async (req, res) => {
  const habits = await Habit.find({ userId: req.user.id }).sort({ date: -1 }).limit(120);
  let streak = 0;
  for (const day of habits) {
    const values = Object.entries(day.habits || {})
      .filter(([key]) => key !== "custom")
      .map(([, value]) => value);
    const customOk = (day.habits.custom || []).every((item) => item.concluido);
    const completed = values.every(Boolean) && customOk;
    if (!completed) break;
    streak += 1;
  }
  return res.json({ streak });
};
