const mongoose = require("mongoose");

const customSpiritualSchema = new mongoose.Schema(
  {
    habitId: { type: String, required: true },
    name: { type: String, required: true },
    done: { type: Boolean, default: false },
    observation: { type: String, default: "" },
  },
  { _id: false }
);

const customFitnessSchema = new mongoose.Schema(
  {
    habitId: { type: String, required: true },
    name: { type: String, required: true },
    done: { type: Boolean, default: false },
  },
  { _id: false }
);

const habitDailySchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    date: { type: String, required: true }, // YYYY-MM-DD
    spiritual: {
      leituraBiblica: {
        done: { type: Boolean, default: false },
        observation: { type: String, default: "" },
      },
      oracao: { type: Boolean, default: false },
      custom: [customSpiritualSchema],
    },
    fitness: {
      workout: {
        done: { type: Boolean, default: false },
        type: { type: String, default: "" }, // musculacao, cardio, corrida...
        duration: { type: Number, default: 0 }, // minutos
        note: { type: String, default: "" },
      },
      ateCorretamente: { type: Boolean, default: false },
      semDoce: { type: Boolean, default: false },
      creatina: { type: Boolean, default: false },
      whey: { type: Boolean, default: false },
      custom: [customFitnessSchema],
      checkedAt: { type: Date, default: null },
    },
  },
  { timestamps: true }
);

habitDailySchema.index({ userId: 1, date: 1 }, { unique: true });

module.exports = mongoose.model("HabitDaily", habitDailySchema);
