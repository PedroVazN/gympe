const Habit = require("../models/Habit");
const Goal = require("../models/Goal");
const Transaction = require("../models/Transaction");
const Achievement = require("../models/Achievement");
const {
  computeRank,
  computeXpFromActivity,
  computeDisciplineScore,
  ACHIEVEMENT_RULES,
} = require("../utils/gamification");

const computeStreaks = (habits) => {
  let streak = 0;
  let spiritualStreak = 0;
  const sorted = [...habits].sort((a, b) => (a.date < b.date ? 1 : -1));

  for (const day of sorted) {
    const fixed = ["treinou", "dieta", "orou", "agradeceu", "evitouPecar"];
    const fixedDone = fixed.every((key) => day.habits?.[key]);
    const customDone = (day.habits?.custom || []).every((item) => item.concluido);
    if (fixedDone && customDone) streak += 1;
    else break;
  }

  for (const day of sorted) {
    const ok = day.habits?.orou && day.habits?.agradeceu;
    if (ok) spiritualStreak += 1;
    else break;
  }

  return { streak, spiritualStreak };
};

exports.getProgress = async (req, res) => {
  const userId = req.user.id;
  const month = new Date().toISOString().slice(0, 7);

  const [habits, goals, transactions, unlocked] = await Promise.all([
    Habit.find({ userId }).sort({ date: -1 }),
    Goal.find({ userId }),
    Transaction.find({ userId }),
    Achievement.find({ userId }),
  ]);

  const xp = computeXpFromActivity({ habits, goals, transactions });
  const rank = computeRank(xp);
  const { streak, spiritualStreak } = computeStreaks(habits);

  const monthlyTx = transactions.filter(
    (t) => t.date.toISOString().slice(0, 7) === month
  );
  const monthlyIncome = monthlyTx
    .filter((t) => t.type === "income")
    .reduce((acc, t) => acc + t.amount, 0);
  const monthlyExpense = monthlyTx
    .filter((t) => t.type === "expense")
    .reduce((acc, t) => acc + t.amount, 0);

  const disciplineScore = computeDisciplineScore({
    habits,
    goals,
    financial: { monthlyIncome, monthlyExpense },
  });

  const completedGoals = goals.filter((g) => g.completed).length;
  const habitsCompletedDays = habits.filter((day) => {
    const fixed = ["treinou", "dieta", "orou", "agradeceu", "evitouPecar"];
    const fixedDone = fixed.some((key) => day.habits?.[key]);
    return fixedDone;
  }).length;

  const unlockedKeys = new Set(unlocked.map((a) => a.key));
  const context = {
    streak,
    spiritualStreak,
    completedGoals,
    habitsCompletedDays,
    monthlyIncome,
    monthlyExpense,
    level: rank.level,
  };

  const newly = [];
  for (const rule of ACHIEVEMENT_RULES) {
    if (!unlockedKeys.has(rule.key) && rule.check(context)) {
      const achievement = await Achievement.create({
        userId,
        key: rule.key,
        title: rule.title,
        description: rule.description,
        icon: rule.icon,
        rarity: rule.rarity,
      });
      newly.push(achievement);
    }
  }

  const allAchievements = [...unlocked, ...newly];
  const catalog = ACHIEVEMENT_RULES.map((rule) => {
    const unlockedItem = allAchievements.find((a) => a.key === rule.key);
    return {
      key: rule.key,
      title: rule.title,
      description: rule.description,
      icon: rule.icon,
      rarity: rule.rarity,
      unlocked: Boolean(unlockedItem),
      unlockedAt: unlockedItem?.unlockedAt || null,
    };
  });

  return res.json({
    xp,
    rank,
    streak,
    spiritualStreak,
    disciplineScore,
    completedGoals,
    totalGoals: goals.length,
    achievements: catalog,
    newlyUnlocked: newly,
  });
};

exports.listAchievements = async (req, res) => {
  const unlocked = await Achievement.find({ userId: req.user.id });
  const unlockedKeys = new Set(unlocked.map((a) => a.key));
  const catalog = ACHIEVEMENT_RULES.map((rule) => {
    const item = unlocked.find((a) => a.key === rule.key);
    return {
      key: rule.key,
      title: rule.title,
      description: rule.description,
      icon: rule.icon,
      rarity: rule.rarity,
      unlocked: unlockedKeys.has(rule.key),
      unlockedAt: item?.unlockedAt || null,
    };
  });
  return res.json(catalog);
};
