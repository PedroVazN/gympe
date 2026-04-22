const express = require("express");
const authMiddleware = require("../middleware/authMiddleware");
const {
  listGoals,
  listAllGoals,
  createGoal,
  incrementGoal,
  updateGoal,
  deleteGoal,
} = require("../controllers/goalController");

const router = express.Router();
router.use(authMiddleware);

router.get("/", listGoals);
router.get("/all", listAllGoals);
router.post("/", createGoal);
router.patch("/:id/progress", incrementGoal);
router.put("/:id", updateGoal);
router.delete("/:id", deleteGoal);

module.exports = router;
