const mongoose = require("mongoose");

const completionSchema = new mongoose.Schema(
  {
    habitId: { type: String, required: true },
    done: { type: Boolean, default: false },
  },
  { _id: false }
);

const groupCheckinSchema = new mongoose.Schema(
  {
    groupId: { type: mongoose.Schema.Types.ObjectId, ref: "Group", required: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    date: { type: String, required: true }, // YYYY-MM-DD
    completions: [completionSchema],
    score: { type: Number, default: 0 },
  },
  { timestamps: true }
);

groupCheckinSchema.index({ groupId: 1, userId: 1, date: 1 }, { unique: true });

module.exports = mongoose.model("GroupCheckin", groupCheckinSchema);
