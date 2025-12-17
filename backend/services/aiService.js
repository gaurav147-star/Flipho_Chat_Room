const OpenAI = require("openai");
const AIUsage = require("../models/aiUsageModel");

// Lazy initialization of OpenAI client (only create when needed)
let openai = null;

const getOpenAIClient = () => {
  if (!openai) {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error("OpenAI API key is not configured");
    }
    openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }
  return openai;
};

/**
 * Generate AI response based on chat history
 * @param {Array} messages - Array of message objects with sender and content
 * @param {String} userId - ID of the user making the request
 * @param {String} chatId - ID of the chat
 * @returns {Object} - { response: string, tokensUsed: number }
 */
const generateAIResponse = async (messages, userId, chatId) => {
  try {
    // Get OpenAI client (will throw if API key not configured)
    const client = getOpenAIClient();

    // Build conversation history for OpenAI
    // Format: [{ role: "user", content: "..." }, { role: "assistant", content: "..." }]
    const conversationHistory = messages
      .filter((msg) => msg.content && msg.content.trim().length > 0) // Filter out empty messages
      .map((msg) => {
        // Determine role based on sender
        // If sender is AI user (isAI: true), role is "assistant", otherwise "user"
        const role = msg.sender?.isAI ? "assistant" : "user";
        return {
          role: role,
          content: msg.content || "",
        };
      });
    
    // If no valid conversation history, return early
    if (conversationHistory.length === 0) {
      throw new Error("No valid messages in conversation history");
    }

    // Add system message at the beginning
    const systemMessage = {
      role: "system",
      content:
        "You are a helpful, intelligent, and friendly AI assistant in a chat application. Your role is to:\n" +
        "- Provide thoughtful, accurate, and helpful responses\n" +
        "- Answer questions thoroughly but naturally - adapt your response length to the complexity of the question\n" +
        "- Be conversational, friendly, and engaging\n" +
        "- Show empathy and understanding when appropriate\n" +
        "- If asked about something you don't know, acknowledge it honestly and offer to help with related topics\n" +
        "- For simple questions, provide concise answers. For complex questions, provide detailed explanations\n" +
        "- Maintain context from the conversation history\n" +
        "- Use natural language and avoid being overly formal unless the context requires it\n" +
        "- Be proactive in offering additional help when relevant\n" +
        "Remember: You're having a real conversation with a human. Be helpful, accurate, and personable.",
    };

    const messagesForAI = [systemMessage, ...conversationHistory];

    // Call OpenAI API
    // Use gpt-4 if available, otherwise fall back to gpt-3.5-turbo
    const model = process.env.OPENAI_MODEL || "gpt-4o-mini"; // Better model for quality responses
    const completion = await client.chat.completions.create({
      model: model,
      messages: messagesForAI,
      max_tokens: 1000, // Increased for more detailed responses when needed
      temperature: 0.7, // Slightly higher for more natural, varied responses
      top_p: 0.9, // Nucleus sampling for better quality
      frequency_penalty: 0.3, // Reduce repetition
      presence_penalty: 0.3, // Encourage new topics when relevant
    });

    const aiResponse = completion.choices[0].message.content;
    const usage = completion.usage;

    // Log token usage
    try {
      await AIUsage.create({
        userId: userId,
        chatId: chatId,
        tokensUsed: usage.total_tokens,
        promptTokens: usage.prompt_tokens,
        completionTokens: usage.completion_tokens,
      });
    } catch (logError) {
      // Don't fail the request if logging fails
      console.error("Error logging AI usage:", logError);
    }

    return {
      response: aiResponse,
      tokensUsed: usage.total_tokens,
      promptTokens: usage.prompt_tokens,
      completionTokens: usage.completion_tokens,
    };
  } catch (error) {
    console.error("Error generating AI response:", error);

    // Handle specific OpenAI errors
    if (error.status === 429) {
      throw new Error("Rate limit exceeded. Please try again later.");
    } else if (error.status === 401) {
      throw new Error("Invalid API key. Please check your OpenAI configuration.");
    } else if (error.status === 500) {
      throw new Error("OpenAI service is temporarily unavailable. Please try again later.");
    }

    throw new Error(
      error.message || "Failed to generate AI response. Please try again."
    );
  }
};

module.exports = { generateAIResponse };

