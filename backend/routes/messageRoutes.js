const express = require("express");
const {
  allMessages,
  sendMessage,
  reactToMessage,
} = require("../controllers/messageControllers");
const { protect } = require("../middleware/authMiddleware");

const router = express.Router();
const multer = require("multer");
const fs = require("fs");

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = "./uploads";
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir);
    }
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + "-" + file.originalname);
  },
});

const upload = multer({ storage: storage });

router.route("/:chatId").get(protect, allMessages);
router.route("/").post(protect, upload.single("image"), sendMessage);
router.route("/reaction").put(protect, reactToMessage);

module.exports = router;
