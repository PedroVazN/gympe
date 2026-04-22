const mongoose = require("mongoose");

const transactionSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    description: { type: String, required: true, trim: true },
    amount: { type: Number, required: true, min: 0 },
    type: { type: String, enum: ["income", "expense"], required: true },
    category: { type: String, required: true, trim: true },
    date: { type: Date, required: true },

    dueDate: { type: Date, default: null },
    paid: { type: Boolean, default: false },
    paidAt: { type: Date, default: null },

    isInstallment: { type: Boolean, default: false },
    installmentGroupId: { type: String, default: null, index: true },
    installmentNumber: { type: Number, default: null },
    totalInstallments: { type: Number, default: null },

    isRecurring: { type: Boolean, default: false },
    recurrenceGroupId: { type: String, default: null, index: true },
    recurrenceIndex: { type: Number, default: null },
    totalOccurrences: { type: Number, default: null },
    recurrenceFrequency: {
      type: String,
      enum: ["weekly", "monthly", "yearly", null],
      default: null,
    },
  },
  { timestamps: true }
);

transactionSchema.index({ userId: 1, type: 1, dueDate: 1 });

module.exports = mongoose.model("Transaction", transactionSchema);
