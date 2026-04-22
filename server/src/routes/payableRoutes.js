const express = require("express");
const authMiddleware = require("../middleware/authMiddleware");
const {
  list,
  create,
  update,
  updateDueDate,
  togglePaid,
  remove,
} = require("../controllers/payableController");

const router = express.Router();
router.use(authMiddleware);

router.get("/", list);
router.post("/", create);
router.put("/:id", update);
router.patch("/:id/due-date", updateDueDate);
router.patch("/:id/toggle-paid", togglePaid);
router.delete("/:id", remove);

module.exports = router;
