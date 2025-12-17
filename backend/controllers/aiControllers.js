const asyncHandler = require("express-async-handler");
const AIUsage = require("../models/aiUsageModel");

//@description     Get AI usage statistics for a user
//@route           GET /api/ai/usage
//@access          Protected
const getAIUsage = asyncHandler(async (req, res) => {
  try {
    const usage = await AIUsage.find({ userId: req.user._id })
      .populate("chatId", "chatName")
      .sort({ createdAt: -1 })
      .limit(100); // Last 100 requests

    const totalTokens = usage.reduce((sum, record) => sum + record.tokensUsed, 0);
    const totalRequests = usage.length;

    res.json({
      totalTokens,
      totalRequests,
      usage: usage.map((record) => ({
        tokensUsed: record.tokensUsed,
        promptTokens: record.promptTokens,
        completionTokens: record.completionTokens,
        chatId: record.chatId,
        timestamp: record.createdAt,
      })),
    });
  } catch (error) {
    res.status(400);
    throw new Error(error.message);
  }
});

module.exports = { getAIUsage };

