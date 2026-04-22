const express = require("express");
const authMiddleware = require("../middleware/authMiddleware");
const {
  createTransaction,
  listTransactions,
  getMonthlySummary,
} = require("../controllers/transactionController");

const router = express.Router();
router.use(authMiddleware);

router.post("/", createTransaction);
router.get("/", listTransactions);
router.get("/summary", getMonthlySummary);

module.exports = router;
