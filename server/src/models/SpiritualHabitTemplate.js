const mongoose = require("mongoose");

const spiritualHabitTemplateSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    name: { type: String, required: true, trim: true },
    active: { type: Boolean, default: true },
  },
  { timestamps: true }
);

spiritualHabitTemplateSchema.index({ userId: 1, name: 1 }, { unique: true });

module.exports = mongoose.model("SpiritualHabitTemplate", spiritualHabitTemplateSchema);
