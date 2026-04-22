const express = require("express");
const authMiddleware = require("../middleware/authMiddleware");
const {
  sendRequest,
  listRequests,
  respondRequest,
  listFriends,
} = require("../controllers/friendController");

const router = express.Router();
router.use(authMiddleware);

router.post("/request", sendRequest);
router.get("/requests", listRequests);
router.patch("/requests/:id/respond", respondRequest);
router.get("/", listFriends);

module.exports = router;
