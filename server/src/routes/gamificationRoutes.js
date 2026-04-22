const express = require("express");
const authMiddleware = require("../middleware/authMiddleware");
const {
  getProgress,
  listAchievements,
} = require("../controllers/gamificationController");

const router = express.Router();
router.use(authMiddleware);

router.get("/progress", getProgress);
router.get("/achievements", listAchievements);

module.exports = router;
