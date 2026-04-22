const RANKS = [
  { level: 1, title: "Iniciante", minXp: 0, color: "#94a3b8" },
  { level: 2, title: "Aprendiz", minXp: 200, color: "#60a5fa" },
  { level: 3, title: "Disciplinado", minXp: 600, color: "#34d399" },
  { level: 4, title: "Guerreiro", minXp: 1200, color: "#fbbf24" },
  { level: 5, title: "Atleta", minXp: 2200, color: "#fb923c" },
  { level: 6, title: "Mentor", minXp: 3800, color: "#f472b6" },
  { level: 7, title: "Mestre", minXp: 6000, color: "#a855f7" },
  { level: 8, title: "Lenda", minXp: 9000, color: "#eab308" },
];

const computeRank = (xp) => {
  const current = [...RANKS].reverse().find((rank) => xp >= rank.minXp) || RANKS[0];
  const next = RANKS.find((rank) => rank.minXp > xp) || null;
  const progress = next
    ? Math.round(((xp - current.minXp) / (next.minXp - current.minXp)) * 100)
    : 100;
  return { ...current, xp, next, progress };
};

const computeXpFromActivity = ({ habits = [], goals = [], transactions = [] }) => {
  let xp = 0;

  for (const day of habits) {
    const fixed = ["treinou", "dieta", "orou", "agradeceu", "evitouPecar"];
    for (const key of fixed) {
      if (day.habits?.[key]) xp += 10;
    }
    for (const custom of day.habits?.custom || []) {
      if (custom.concluido) xp += 5;
    }
  }

  for (const goal of goals) {
    if (goal.completed) {
      xp += goal.reward || 50;
    } else if (goal.current > 0) {
      const ratio = Math.min(1, goal.current / goal.target);
      xp += Math.round((goal.reward || 50) * ratio * 0.4);
    }
  }

  const savings = transactions.reduce((acc, t) => acc + (t.type === "income" ? t.amount : -t.amount), 0);
  if (savings > 0) xp += Math.floor(savings / 100) * 5;

  return xp;
};

const computeDisciplineScore = ({ habits = [], goals = [], financial = {} }) => {
  const recent = habits.slice(0, 14);
  let habitRate = 0;
  if (recent.length) {
    const totals = recent.reduce(
      (acc, day) => {
        const fixed = ["treinou", "dieta", "orou", "agradeceu", "evitouPecar"];
        const fixedCount = fixed.filter((key) => day.habits?.[key]).length;
        const customList = day.habits?.custom || [];
        const customCount = customList.filter((item) => item.concluido).length;
        acc.done += fixedCount + customCount;
        acc.total += fixed.length + customList.length;
        return acc;
      },
      { done: 0, total: 0 }
    );
    habitRate = totals.total ? totals.done / totals.total : 0;
  }

  const completedGoals = goals.filter((goal) => goal.completed).length;
  const goalRate = goals.length ? completedGoals / goals.length : 0;

  const monthlyIncome = financial.monthlyIncome || 0;
  const monthlyExpense = financial.monthlyExpense || 0;
  const financeRate = monthlyIncome
    ? Math.max(0, Math.min(1, (monthlyIncome - monthlyExpense) / monthlyIncome))
    : 0.5;

  return Math.round((habitRate * 0.5 + goalRate * 0.25 + financeRate * 0.25) * 100);
};

const ACHIEVEMENT_RULES = [
  {
    key: "first_steps",
    title: "Primeiros passos",
    description: "Concluiu seu primeiro dia de hábitos.",
    icon: "Sparkles",
    rarity: "common",
    check: ({ habitsCompletedDays }) => habitsCompletedDays >= 1,
  },
  {
    key: "streak_3",
    title: "Constância em formação",
    description: "3 dias consecutivos de rotina completa.",
    icon: "Flame",
    rarity: "common",
    check: ({ streak }) => streak >= 3,
  },
  {
    key: "streak_7",
    title: "Semana perfeita",
    description: "7 dias consecutivos cumprindo tudo.",
    icon: "Flame",
    rarity: "rare",
    check: ({ streak }) => streak >= 7,
  },
  {
    key: "streak_30",
    title: "Disciplina de ferro",
    description: "30 dias seguidos - um novo padrão de vida.",
    icon: "Shield",
    rarity: "epic",
    check: ({ streak }) => streak >= 30,
  },
  {
    key: "first_goal",
    title: "Objetivo alcançado",
    description: "Concluiu sua primeira meta.",
    icon: "Target",
    rarity: "common",
    check: ({ completedGoals }) => completedGoals >= 1,
  },
  {
    key: "goals_10",
    title: "Colecionador de vitórias",
    description: "10 metas concluídas.",
    icon: "Trophy",
    rarity: "rare",
    check: ({ completedGoals }) => completedGoals >= 10,
  },
  {
    key: "saver",
    title: "Equilíbrio financeiro",
    description: "Gastou menos do que ganhou neste mês.",
    icon: "PiggyBank",
    rarity: "common",
    check: ({ monthlyIncome, monthlyExpense }) => monthlyIncome > 0 && monthlyIncome > monthlyExpense,
  },
  {
    key: "warrior",
    title: "Guerreiro",
    description: "Alcançou o nível 4 no GymPE.",
    icon: "Swords",
    rarity: "rare",
    check: ({ level }) => level >= 4,
  },
  {
    key: "legend",
    title: "Lenda do GymPE",
    description: "Alcançou o nível máximo.",
    icon: "Crown",
    rarity: "legendary",
    check: ({ level }) => level >= 8,
  },
  {
    key: "spiritual_week",
    title: "Semana de luz",
    description: "7 dias orando e agradecendo.",
    icon: "Star",
    rarity: "rare",
    check: ({ spiritualStreak }) => spiritualStreak >= 7,
  },
];

module.exports = {
  RANKS,
  computeRank,
  computeXpFromActivity,
  computeDisciplineScore,
  ACHIEVEMENT_RULES,
};
