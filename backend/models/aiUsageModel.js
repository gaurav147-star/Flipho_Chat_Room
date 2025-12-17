const mongoose = require("mongoose");

const aiUsageSchema = mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    chatId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Chat",
      required: true,
    },
    tokensUsed: {
      type: Number,
      required: true,
    },
    promptTokens: {
      type: Number,
      default: 0,
    },
    completionTokens: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

const AIUsage = mongoose.model("AIUsage", aiUsageSchema);

module.exports = AIUsage;

