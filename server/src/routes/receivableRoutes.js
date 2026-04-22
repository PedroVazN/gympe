const express = require("express");
const authMiddleware = require("../middleware/authMiddleware");
const {
  list,
  create,
  update,
  togglePaid,
  remove,
} = require("../controllers/receivableController");

const router = express.Router();
router.use(authMiddleware);

router.get("/", list);
router.post("/", create);
router.put("/:id", update);
router.patch("/:id/toggle-paid", togglePaid);
router.delete("/:id", remove);

module.exports = router;
