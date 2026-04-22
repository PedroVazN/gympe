const crypto = require("crypto");
const Transaction = require("../models/Transaction");

const addToDate = (date, frequency, count) => {
  const next = new Date(date);
  if (frequency === "weekly") next.setDate(next.getDate() + 7 * count);
  else if (frequency === "monthly") next.setMonth(next.getMonth() + count);
  else if (frequency === "yearly") next.setFullYear(next.getFullYear() + count);
  return next;
};

const startOfDay = (date) => {
  const copy = new Date(date);
  copy.setHours(0, 0, 0, 0);
  return copy;
};

const decorateOverdue = (item) => {
  const payload = item.toObject ? item.toObject() : { ...item };
  const today = startOfDay(new Date());
  const due = payload.dueDate ? startOfDay(payload.dueDate) : null;
  payload.overdue = Boolean(due && !payload.paid && due.getTime() < today.getTime());
  return payload;
};

exports.list = async (req, res) => {
  const { month, status } = req.query;
  const filter = { userId: req.user.id, type: "expense" };

  if (month) {
    const start = new Date(`${month}-01T00:00:00.000Z`);
    const end = new Date(start);
    end.setMonth(end.getMonth() + 1);
    filter.$or = [
      { dueDate: { $gte: start, $lt: end } },
      { date: { $gte: start, $lt: end }, dueDate: null },
    ];
  }

  if (status === "paid") filter.paid = true;
  if (status === "pending") filter.paid = false;

  const raw = await Transaction.find(filter).sort({ dueDate: 1, date: 1 });
  const items = raw.map(decorateOverdue);

  if (status === "overdue") {
    return res.json(items.filter((i) => i.overdue));
  }
  return res.json(items);
};

exports.create = async (req, res) => {
  const {
    description,
    amount,
    category,
    dueDate,
    paid = false,
    mode = "single",
    installmentCount = 1,
    recurrenceFrequency = "monthly",
    recurrenceCount,
    recurrenceEndDate,
  } = req.body;

  if (!description || !amount || !dueDate) {
    return res
      .status(400)
      .json({ message: "Descrição, valor e data de vencimento são obrigatórios." });
  }

  const userId = req.user.id;
  const base = new Date(dueDate);

  if (mode === "installment" && Number(installmentCount) > 1) {
    const count = Number(installmentCount);
    const groupId = crypto.randomUUID();
    const installmentValue = Number((Number(amount) / count).toFixed(2));
    const docs = Array.from({ length: count }).map((_, index) => {
      const itemDueDate = addToDate(base, "monthly", index);
      return {
        userId,
        type: "expense",
        description: `${description} (${index + 1}/${count})`,
        amount: installmentValue,
        category: category || "Parcela",
        date: itemDueDate,
        dueDate: itemDueDate,
        paid: false,
        isInstallment: true,
        installmentGroupId: groupId,
        installmentNumber: index + 1,
        totalInstallments: count,
      };
    });
    const created = await Transaction.insertMany(docs);
    return res.status(201).json(created.map(decorateOverdue));
  }

  if (mode === "recurring") {
    const frequency = ["weekly", "monthly", "yearly"].includes(recurrenceFrequency)
      ? recurrenceFrequency
      : "monthly";

    let occurrences = Number(recurrenceCount) || 0;
    if (!occurrences && recurrenceEndDate) {
      const end = new Date(recurrenceEndDate);
      let cursor = new Date(base);
      occurrences = 0;
      while (cursor <= end) {
        occurrences += 1;
        cursor = addToDate(base, frequency, occurrences);
      }
    }
    occurrences = Math.max(1, Math.min(occurrences || 12, 120));

    const groupId = crypto.randomUUID();
    const docs = Array.from({ length: occurrences }).map((_, index) => {
      const itemDueDate = addToDate(base, frequency, index);
      return {
        userId,
        type: "expense",
        description: `${description} (${index + 1}/${occurrences})`,
        amount: Number(amount),
        category: category || "Fixa",
        date: itemDueDate,
        dueDate: itemDueDate,
        paid: false,
        isRecurring: true,
        recurrenceGroupId: groupId,
        recurrenceIndex: index + 1,
        totalOccurrences: occurrences,
        recurrenceFrequency: frequency,
      };
    });
    const created = await Transaction.insertMany(docs);
    return res.status(201).json(created.map(decorateOverdue));
  }

  const transaction = await Transaction.create({
    userId,
    type: "expense",
    description,
    amount: Number(amount),
    category: category || "Despesa",
    date: base,
    dueDate: base,
    paid: Boolean(paid),
    paidAt: paid ? new Date() : null,
  });

  return res.status(201).json(decorateOverdue(transaction));
};

exports.togglePaid = async (req, res) => {
  const transaction = await Transaction.findOne({
    _id: req.params.id,
    userId: req.user.id,
    type: "expense",
  });
  if (!transaction) return res.status(404).json({ message: "Conta a pagar não encontrada." });

  transaction.paid = !transaction.paid;
  transaction.paidAt = transaction.paid ? new Date() : null;
  await transaction.save();

  return res.json(decorateOverdue(transaction));
};

exports.updateDueDate = async (req, res) => {
  const { dueDate } = req.body;
  if (!dueDate) return res.status(400).json({ message: "Informe a nova data de vencimento." });

  const transaction = await Transaction.findOneAndUpdate(
    { _id: req.params.id, userId: req.user.id, type: "expense" },
    { dueDate: new Date(dueDate), date: new Date(dueDate) },
    { new: true }
  );
  if (!transaction) return res.status(404).json({ message: "Conta a pagar não encontrada." });

  return res.json(decorateOverdue(transaction));
};

exports.update = async (req, res) => {
  const transaction = await Transaction.findOneAndUpdate(
    { _id: req.params.id, userId: req.user.id, type: "expense" },
    req.body,
    { new: true }
  );
  if (!transaction) return res.status(404).json({ message: "Conta a pagar não encontrada." });
  return res.json(decorateOverdue(transaction));
};

exports.remove = async (req, res) => {
  const { scope } = req.query;
  const transaction = await Transaction.findOne({
    _id: req.params.id,
    userId: req.user.id,
    type: "expense",
  });
  if (!transaction) return res.status(404).json({ message: "Conta a pagar não encontrada." });

  if (scope === "group") {
    if (transaction.installmentGroupId) {
      await Transaction.deleteMany({
        userId: req.user.id,
        installmentGroupId: transaction.installmentGroupId,
      });
    } else if (transaction.recurrenceGroupId) {
      await Transaction.deleteMany({
        userId: req.user.id,
        recurrenceGroupId: transaction.recurrenceGroupId,
      });
    } else {
      await transaction.deleteOne();
    }
  } else {
    await transaction.deleteOne();
  }

  return res.status(204).end();
};
