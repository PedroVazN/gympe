const Installment = require("../models/Installment");

exports.createInstallment = async (req, res) => {
  const { totalAmount, installmentCount, startDate } = req.body;
  const installmentValue = Number((totalAmount / installmentCount).toFixed(2));
  const start = new Date(startDate);
  const end = new Date(start);
  end.setMonth(end.getMonth() + installmentCount - 1);

  const installment = await Installment.create({
    ...req.body,
    userId: req.user.id,
    installmentValue,
    remainingInstallments: installmentCount,
    currentInstallment: 1,
    endDate: end,
  });

  return res.status(201).json(installment);
};

exports.listInstallments = async (req, res) => {
  const installments = await Installment.find({ userId: req.user.id }).sort({ createdAt: -1 });
  return res.json(installments);
};

exports.upcomingInstallments = async (req, res) => {
  const now = new Date();
  const in30Days = new Date();
  in30Days.setDate(now.getDate() + 30);
  const installments = await Installment.find({
    userId: req.user.id,
    remainingInstallments: { $gt: 0 },
    endDate: { $gte: now, $lte: in30Days },
  });
  return res.json(installments);
};
