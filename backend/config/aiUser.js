const User = require("../models/userModel");

/**
 * Get or create the AI user in the database
 * This ensures the AI user exists for all users to chat with
 */
const getOrCreateAIUser = async () => {
  try {
    // Try to find existing AI user
    let aiUser = await User.findOne({ isAI: true });

    if (!aiUser) {
      // Create AI user if it doesn't exist
      aiUser = await User.create({
        name: "AI Assistant",
        email: "ai@fliphochat.com",
        password: "ai_user_no_password_needed", // Won't be hashed due to isAI flag
        pic: "https://icon-library.com/images/ai-robot-icon/ai-robot-icon-0.jpg",
        isAdmin: false,
        isAI: true,
      });
      console.log("AI User created successfully");
    } else {
      console.log("AI User already exists");
    }

    return aiUser;
  } catch (error) {
    console.error("Error getting/creating AI user:", error);
    throw error;
  }
};

module.exports = { getOrCreateAIUser };

