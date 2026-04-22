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
  getFitnessToday,
  updateFitnessToday,
  addFitnessCustomHabit,
  removeFitnessCustomHabit,
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
router.get("/fitness/today", getFitnessToday);
router.put("/fitness/today", updateFitnessToday);
router.post("/fitness/custom", addFitnessCustomHabit);
router.delete("/fitness/custom", removeFitnessCustomHabit);

module.exports = router;
