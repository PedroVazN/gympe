const express = require("express");
const authMiddleware = require("../middleware/authMiddleware");
const {
  createInstallment,
  listInstallments,
  upcomingInstallments,
} = require("../controllers/installmentController");

const router = express.Router();
router.use(authMiddleware);

router.post("/", createInstallment);
router.get("/", listInstallments);
router.get("/upcoming", upcomingInstallments);

module.exports = router;
