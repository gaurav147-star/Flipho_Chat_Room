const express = require("express");
const { getAIUsage } = require("../controllers/aiControllers");
const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

router.route("/usage").get(protect, getAIUsage);

module.exports = router;

