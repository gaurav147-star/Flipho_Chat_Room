const mongoose = require("mongoose");

const listSchema = mongoose.Schema(
    {
        chat: { type: mongoose.Schema.Types.ObjectId, ref: "Chat" },
        title: { type: String, required: true },
        items: [
            {
                text: { type: String, required: true },
                isCompleted: { type: Boolean, default: false },
                addedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
            },
        ],
        createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    },
    { timestamps: true }
);

const List = mongoose.model("List", listSchema);
module.exports = List;
