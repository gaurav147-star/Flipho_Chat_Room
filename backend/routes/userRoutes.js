const express = require("express");
const {
  registerUser,
  authUser,
  allUsers,
  updatePic,
} = require("../controllers/userControllers");
const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

router.route("/").get(protect, allUsers);
router.route("/updatepic").put(protect, updatePic);
router.route("/").post(registerUser);
router.post("/login", authUser);

module.exports = router;
