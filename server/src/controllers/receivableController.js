const Transaction = require("../models/Transaction");

exports.list = async (req, res) => {
  const { month } = req.query;
  const filter = { userId: req.user.id, type: "income" };

  if (month) {
    const start = new Date(`${month}-01T00:00:00.000Z`);
    const end = new Date(start);
    end.setMonth(end.getMonth() + 1);
    filter.$or = [
      { date: { $gte: start, $lt: end } },
      { dueDate: { $gte: start, $lt: end } },
    ];
  }

  const items = await Transaction.find(filter).sort({ dueDate: -1, date: -1 });
  return res.json(items);
};

exports.create = async (req, res) => {
  const { description, amount, category, date, dueDate, paid } = req.body;
  const reference = date || dueDate || new Date();

  const transaction = await Transaction.create({
    userId: req.user.id,
    type: "income",
    description,
    amount: Number(amount),
    category: category || "Renda",
    date: new Date(reference),
    dueDate: dueDate ? new Date(dueDate) : new Date(reference),
    paid: Boolean(paid),
    paidAt: paid ? new Date() : null,
  });

  return res.status(201).json(transaction);
};

exports.update = async (req, res) => {
  const transaction = await Transaction.findOneAndUpdate(
    { _id: req.params.id, userId: req.user.id, type: "income" },
    req.body,
    { new: true }
  );
  if (!transaction) return res.status(404).json({ message: "Conta a receber não encontrada." });
  return res.json(transaction);
};

exports.togglePaid = async (req, res) => {
  const transaction = await Transaction.findOne({
    _id: req.params.id,
    userId: req.user.id,
    type: "income",
  });
  if (!transaction) return res.status(404).json({ message: "Conta a receber não encontrada." });

  transaction.paid = !transaction.paid;
  transaction.paidAt = transaction.paid ? new Date() : null;
  await transaction.save();

  return res.json(transaction);
};

exports.remove = async (req, res) => {
  await Transaction.deleteOne({ _id: req.params.id, userId: req.user.id, type: "income" });
  return res.status(204).end();
};
