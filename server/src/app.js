const express = require("express");
const cors = require("cors");

const authRoutes = require("./routes/authRoutes");
const habitRoutes = require("./routes/habitRoutes");
const transactionRoutes = require("./routes/transactionRoutes");
const installmentRoutes = require("./routes/installmentRoutes");
const dashboardRoutes = require("./routes/dashboardRoutes");
const goalRoutes = require("./routes/goalRoutes");
const gamificationRoutes = require("./routes/gamificationRoutes");
const receivableRoutes = require("./routes/receivableRoutes");
const payableRoutes = require("./routes/payableRoutes");
const bankRoutes = require("./routes/bankRoutes");
const friendRoutes = require("./routes/friendRoutes");
const groupRoutes = require("./routes/groupRoutes");

const app = express();

app.use(cors());
app.use(express.json());

app.get("/api/health", (_, res) => res.json({ status: "ok", app: "GymPE API" }));
app.use("/api/auth", authRoutes);
app.use("/api/habits", habitRoutes);
app.use("/api/transactions", transactionRoutes);
app.use("/api/installments", installmentRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/goals", goalRoutes);
app.use("/api/gamification", gamificationRoutes);
app.use("/api/receivables", receivableRoutes);
app.use("/api/payables", payableRoutes);
app.use("/api/bank", bankRoutes);
app.use("/api/friends", friendRoutes);
app.use("/api/groups", groupRoutes);

module.exports = app;
