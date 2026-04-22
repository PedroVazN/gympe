const mongoose = require("mongoose");

const habitSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    date: { type: String, required: true },
    habits: {
      treinou: { type: Boolean, default: false },
      dieta: { type: Boolean, default: false },
      orou: { type: Boolean, default: false },
      agradeceu: { type: Boolean, default: false },
      evitouPecar: { type: Boolean, default: false },
      custom: [{ id: String, nome: String, concluido: Boolean }],
    },
  },
  { timestamps: true }
);

habitSchema.index({ userId: 1, date: 1 }, { unique: true });

module.exports = mongoose.model("Habit", habitSchema);
