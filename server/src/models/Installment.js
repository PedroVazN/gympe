const mongoose = require("mongoose");

const installmentSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    description: { type: String, required: true, trim: true },
    totalAmount: { type: Number, required: true, min: 0 },
    installmentCount: { type: Number, required: true, min: 1 },
    remainingInstallments: { type: Number, required: true, min: 0 },
    installmentValue: { type: Number, required: true, min: 0 },
    currentInstallment: { type: Number, default: 1 },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Installment", installmentSchema);
