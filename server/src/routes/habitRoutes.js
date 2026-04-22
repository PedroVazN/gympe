const express = require("express");
const authMiddleware = require("../middleware/authMiddleware");
const {
  getTodayHabits,
  updateTodayHabits,
  getHistory,
  getStreak,
  getAutomationDashboard,
  getSpiritualToday,
  updateSpiritualToday,
  listSpiritualTemplates,
  createSpiritualTemplate,
  removeSpiritualTemplate,
  getWorkoutToday,
  checkinWorkoutToday,
  undoWorkoutToday,
} = require("../controllers/habitController");

const router = express.Router();

router.use(authMiddleware);
router.get("/today", getTodayHabits);
router.put("/today", updateTodayHabits);
router.get("/history", getHistory);
router.get("/streak", getStreak);
router.get("/automation/dashboard", getAutomationDashboard);
router.get("/spiritual/today", getSpiritualToday);
router.put("/spiritual/today", updateSpiritualToday);
router.get("/spiritual/templates", listSpiritualTemplates);
router.post("/spiritual/templates", createSpiritualTemplate);
router.delete("/spiritual/templates/:id", removeSpiritualTemplate);
router.get("/workout/today", getWorkoutToday);
router.post("/workout/checkin", checkinWorkoutToday);
router.post("/workout/undo", undoWorkoutToday);

module.exports = router;
