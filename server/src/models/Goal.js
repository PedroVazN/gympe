const mongoose = require("mongoose");

const goalSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    title: { type: String, required: true, trim: true },
    description: { type: String, default: "" },
    type: { type: String, enum: ["daily", "weekly", "monthly"], required: true },
    category: {
      type: String,
      enum: ["fitness", "spiritual", "finance", "mental", "custom"],
      default: "custom",
    },
    target: { type: Number, required: true, min: 1 },
    current: { type: Number, default: 0, min: 0 },
    unit: { type: String, default: "x" },
    icon: { type: String, default: "Target" },
    color: { type: String, default: "indigo" },
    reward: { type: Number, default: 50 },
    periodStart: { type: Date, required: true },
    periodEnd: { type: Date, required: true },
    completed: { type: Boolean, default: false },
    completedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

goalSchema.index({ userId: 1, type: 1, periodEnd: 1 });

module.exports = mongoose.model("Goal", goalSchema);
