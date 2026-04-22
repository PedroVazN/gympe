const express = require("express");
const authMiddleware = require("../middleware/authMiddleware");
const {
  createGroup,
  listGroups,
  getGroup,
  addMember,
  updateHabits,
  checkinToday,
  getRanking,
} = require("../controllers/groupController");

const router = express.Router();
router.use(authMiddleware);

router.post("/", createGroup);
router.get("/", listGroups);
router.get("/:id", getGroup);
router.patch("/:id/members", addMember);
router.put("/:id/habits", updateHabits);
router.put("/:id/checkin-today", checkinToday);
router.get("/:id/ranking", getRanking);

module.exports = router;
