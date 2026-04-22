const Habit = require("../models/Habit");
const Transaction = require("../models/Transaction");
const Installment = require("../models/Installment");
const Goal = require("../models/Goal");
const {
  computeRank,
  computeXpFromActivity,
  computeDisciplineScore,
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

const MOTIVATIONAL = [
  "A disciplina é a ponte entre as metas e as conquistas. 🏆",
  "Pequenos passos diários constroem grandes transformações.",
  "Você é mais forte do que sua vontade de desistir.",
  "Cada hábito cumprido hoje é um presente para o seu eu de amanhã.",
  "Gratidão transforma o suficiente em abundância.",
  "O corpo alcança o que a mente acredita.",
  "Não é sobre perfeição, é sobre consistência.",
];

exports.getDashboardSummary = async (req, res) => {
  const userId = req.user.id;
  const today = new Date().toISOString().slice(0, 10);
  const month = new Date().toISOString().slice(0, 7);

  const [todayHabits, allHabits, transactions, installments, goals] = await Promise.all([
    Habit.findOne({ userId, date: today }),
    Habit.find({ userId }).sort({ date: -1 }).limit(60),
    Transaction.find({ userId }),
    Installment.find({ userId, remainingInstallments: { $gt: 0 } }),
    Goal.find({ userId, periodEnd: { $gte: new Date() } }).sort({ createdAt: -1 }),
  ]);

  const income = transactions
    .filter((t) => t.type === "income")
    .reduce((acc, t) => acc + t.amount, 0);
  const expense = transactions
    .filter((t) => t.type === "expense")
    .reduce((acc, t) => acc + t.amount, 0);

  const monthly = transactions.filter(
    (t) => t.date.toISOString().slice(0, 7) === month
  );
  const monthlyIncome = monthly
    .filter((t) => t.type === "income")
    .reduce((acc, t) => acc + t.amount, 0);
  const monthlyExpense = monthly
    .filter((t) => t.type === "expense")
    .reduce((acc, t) => acc + t.amount, 0);

  const remainingDebt = installments.reduce(
    (acc, i) => acc + i.installmentValue * i.remainingInstallments,
    0
  );

  const { streak, spiritualStreak } = computeStreaks(allHabits);
  const xp = computeXpFromActivity({ habits: allHabits, goals, transactions });
  const rank = computeRank(xp);
  const disciplineScore = computeDisciplineScore({
    habits: allHabits,
    goals,
    financial: { monthlyIncome, monthlyExpense },
  });

  const insights = [];
  if (streak >= 3)
    insights.push(`Você está em uma sequência de ${streak} dias 🔥 mantenha o ritmo!`);
  if (monthlyExpense > monthlyIncome && monthlyIncome > 0)
    insights.push("Você gastou mais do que ganhou este mês ⚠️ considere revisar as despesas.");
  if (remainingDebt > 0)
    insights.push(`Dívida em parcelas pendente: R$ ${remainingDebt.toFixed(2)}.`);
  if (spiritualStreak >= 5)
    insights.push(`${spiritualStreak} dias consecutivos em oração e gratidão. ✨`);
  if (!goals.length)
    insights.push("Defina sua primeira meta para começar a ganhar XP e patentes.");
  if (!insights.length)
    insights.push("Seu controle está em dia. Continue firme! ✅");

  const daysOfWeek = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
  const last7 = Array.from({ length: 7 }).map((_, index) => {
    const date = new Date();
    date.setDate(date.getDate() - (6 - index));
    const key = date.toISOString().slice(0, 10);
    const day = allHabits.find((h) => h.date === key);
    const fixed = ["treinou", "dieta", "orou", "agradeceu", "evitouPecar"];
    const fixedDone = day ? fixed.filter((k) => day.habits?.[k]).length : 0;
    const customList = day?.habits?.custom || [];
    const customDone = customList.filter((item) => item.concluido).length;
    const total = fixed.length + customList.length;
    const done = fixedDone + customDone;
    return {
      day: daysOfWeek[date.getDay()],
      date: key,
      completion: total ? Math.round((done / total) * 100) : 0,
    };
  });

  const quote = MOTIVATIONAL[new Date().getDate() % MOTIVATIONAL.length];

  return res.json({
    greeting: `Olá, ${req.user.name} 👋`,
    quote,
    todayHabits,
    financial: {
      income,
      expense,
      balance: income - expense,
      monthlyIncome,
      monthlyExpense,
      remainingDebt,
    },
    installments,
    goals,
    streak,
    spiritualStreak,
    xp,
    rank,
    disciplineScore,
    insights,
    weeklyProgress: last7,
  });
};
