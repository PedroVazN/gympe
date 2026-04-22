const Transaction = require("../models/Transaction");

exports.createTransaction = async (req, res) => {
  const transaction = await Transaction.create({ ...req.body, userId: req.user.id });
  return res.status(201).json(transaction);
};

exports.listTransactions = async (req, res) => {
  const transactions = await Transaction.find({ userId: req.user.id }).sort({ date: -1 });
  return res.json(transactions);
};

exports.getMonthlySummary = async (req, res) => {
  const month = req.query.month || new Date().toISOString().slice(0, 7);
  const transactions = await Transaction.find({
    userId: req.user.id,
    date: {
      $gte: new Date(`${month}-01T00:00:00.000Z`),
      $lte: new Date(`${month}-31T23:59:59.999Z`),
    },
  });

  const income = transactions
    .filter((item) => item.type === "income")
    .reduce((acc, item) => acc + item.amount, 0);
  const expense = transactions
    .filter((item) => item.type === "expense")
    .reduce((acc, item) => acc + item.amount, 0);

  return res.json({
    month,
    income,
    expense,
    balance: income - expense,
    count: transactions.length,
  });
};
