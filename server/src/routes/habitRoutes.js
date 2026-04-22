const express = require("express");
const authMiddleware = require("../middleware/authMiddleware");
const {
  getTodayHabits,
  updateTodayHabits,
  getHistory,
  getStreak,
} = require("../controllers/habitController");

const router = express.Router();

router.use(authMiddleware);
router.get("/today", getTodayHabits);
router.put("/today", updateTodayHabits);
router.get("/history", getHistory);
router.get("/streak", getStreak);

module.exports = router;
