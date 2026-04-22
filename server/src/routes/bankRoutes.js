const express = require("express");
const authMiddleware = require("../middleware/authMiddleware");
const { getOverview } = require("../controllers/bankController");

const router = express.Router();
router.use(authMiddleware);

router.get("/overview", getOverview);

module.exports = router;
