const express = require("express");
const {
    getLists,
    createList,
    addItem,
    toggleItem,
} = require("../controllers/listControllers");
const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

router.route("/:chatId").get(protect, getLists);
router.route("/").post(protect, createList);
router.route("/add").put(protect, addItem);
router.route("/toggle").put(protect, toggleItem);

module.exports = router;
