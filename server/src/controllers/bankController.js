const Transaction = require("../models/Transaction");

const startOfDay = (date) => {
  const copy = new Date(date);
  copy.setHours(0, 0, 0, 0);
  return copy;
};

exports.getOverview = async (req, res) => {
  const userId = req.user.id;
  const now = new Date();
  const month = req.query.month || now.toISOString().slice(0, 7);

  const monthStart = new Date(`${month}-01T00:00:00.000Z`);
  const monthEnd = new Date(monthStart);
  monthEnd.setMonth(monthEnd.getMonth() + 1);

  const all = await Transaction.find({ userId });

  const paidIncome = all
    .filter((t) => t.type === "income" && t.paid)
    .reduce((acc, t) => acc + t.amount, 0);
  const paidExpense = all
    .filter((t) => t.type === "expense" && t.paid)
    .reduce((acc, t) => acc + t.amount, 0);
  const balance = paidIncome - paidExpense;

  const inMonth = all.filter((t) => {
    const ref = t.dueDate || t.date;
    return ref >= monthStart && ref < monthEnd;
  });

  const monthReceivable = inMonth.filter((t) => t.type === "income");
  const monthPayable = inMonth.filter((t) => t.type === "expense");

  const monthReceived = monthReceivable.filter((t) => t.paid).reduce((acc, t) => acc + t.amount, 0);
  const monthToReceive = monthReceivable.filter((t) => !t.paid).reduce((acc, t) => acc + t.amount, 0);
  const monthPaid = monthPayable.filter((t) => t.paid).reduce((acc, t) => acc + t.amount, 0);
  const monthToPay = monthPayable.filter((t) => !t.paid).reduce((acc, t) => acc + t.amount, 0);

  const today = startOfDay(now);
  const overdue = all.filter(
    (t) => t.type === "expense" && !t.paid && t.dueDate && startOfDay(t.dueDate).getTime() < today.getTime()
  );
  const overdueAmount = overdue.reduce((acc, t) => acc + t.amount, 0);

  const in30Days = new Date(today);
  in30Days.setDate(in30Days.getDate() + 30);
  const upcoming = all
    .filter(
      (t) =>
        t.type === "expense" &&
        !t.paid &&
        t.dueDate &&
        t.dueDate >= today &&
        t.dueDate <= in30Days
    )
    .sort((a, b) => a.dueDate - b.dueDate)
    .slice(0, 10);

  const byCategory = monthPayable.reduce((acc, t) => {
    acc[t.category] = (acc[t.category] || 0) + t.amount;
    return acc;
  }, {});
  const categories = Object.entries(byCategory).map(([name, value]) => ({ name, value }));

  const byMonth = {};
  for (const t of all) {
    const key = (t.dueDate || t.date).toISOString().slice(0, 7);
    const bucket = byMonth[key] || { mes: key, entradas: 0, saidas: 0 };
    if (t.type === "income") bucket.entradas += t.amount;
    else bucket.saidas += t.amount;
    byMonth[key] = bucket;
  }
  const flow = Object.values(byMonth)
    .sort((a, b) => (a.mes < b.mes ? -1 : 1))
    .slice(-6)
    .map((item) => ({
      ...item,
      mes: new Date(`${item.mes}-01`).toLocaleDateString("pt-BR", {
        month: "short",
        year: "2-digit",
      }),
    }));

  return res.json({
    balance,
    totalIncome: paidIncome,
    totalExpense: paidExpense,
    month,
    monthReceived,
    monthToReceive,
    monthPaid,
    monthToPay,
    monthBalance: monthReceived - monthPaid,
    overdueCount: overdue.length,
    overdueAmount,
    upcoming,
    categories,
    flow,
  });
};
