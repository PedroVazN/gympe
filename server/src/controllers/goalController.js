const Goal = require("../models/Goal");

const getPeriodDates = (type, reference = new Date()) => {
  const start = new Date(reference);
  const end = new Date(reference);

  if (type === "daily") {
    start.setHours(0, 0, 0, 0);
    end.setHours(23, 59, 59, 999);
  } else if (type === "weekly") {
    const day = start.getDay();
    const diff = day === 0 ? -6 : 1 - day;
    start.setDate(start.getDate() + diff);
    start.setHours(0, 0, 0, 0);
    end.setTime(start.getTime());
    end.setDate(end.getDate() + 6);
    end.setHours(23, 59, 59, 999);
  } else if (type === "monthly") {
    start.setDate(1);
    start.setHours(0, 0, 0, 0);
    end.setMonth(end.getMonth() + 1, 0);
    end.setHours(23, 59, 59, 999);
  }

  return { start, end };
};

exports.listGoals = async (req, res) => {
  const now = new Date();
  const goals = await Goal.find({
    userId: req.user.id,
    periodEnd: { $gte: now },
  }).sort({ type: 1, createdAt: -1 });

  return res.json(goals);
};

exports.listAllGoals = async (req, res) => {
  const goals = await Goal.find({ userId: req.user.id }).sort({ createdAt: -1 });
  return res.json(goals);
};

exports.createGoal = async (req, res) => {
  const { type } = req.body;
  const { start, end } = getPeriodDates(type);

  const goal = await Goal.create({
    ...req.body,
    userId: req.user.id,
    periodStart: start,
    periodEnd: end,
  });

  return res.status(201).json(goal);
};

exports.incrementGoal = async (req, res) => {
  const goal = await Goal.findOne({ _id: req.params.id, userId: req.user.id });
  if (!goal) return res.status(404).json({ message: "Meta não encontrada." });

  const amount = Number(req.body.amount || 1);
  goal.current = Math.max(0, goal.current + amount);
  if (goal.current >= goal.target && !goal.completed) {
    goal.completed = true;
    goal.completedAt = new Date();
  } else if (goal.current < goal.target && goal.completed) {
    goal.completed = false;
    goal.completedAt = null;
  }
  await goal.save();

  return res.json(goal);
};

exports.updateGoal = async (req, res) => {
  const goal = await Goal.findOneAndUpdate(
    { _id: req.params.id, userId: req.user.id },
    req.body,
    { new: true }
  );
  if (!goal) return res.status(404).json({ message: "Meta não encontrada." });
  return res.json(goal);
};

exports.deleteGoal = async (req, res) => {
  await Goal.deleteOne({ _id: req.params.id, userId: req.user.id });
  return res.status(204).end();
};
