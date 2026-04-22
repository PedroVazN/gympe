const mongoose = require("mongoose");

const groupHabitSchema = new mongoose.Schema(
  {
    id: { type: String, required: true },
    name: { type: String, required: true },
    points: { type: Number, default: 10, min: 1 },
  },
  { _id: false }
);

const groupSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    description: { type: String, default: "" },
    ownerId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    members: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    habits: [groupHabitSchema],
    active: { type: Boolean, default: true },
  },
  { timestamps: true }
);

groupSchema.index({ ownerId: 1 });
groupSchema.index({ members: 1 });

module.exports = mongoose.model("Group", groupSchema);
