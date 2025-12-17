const asyncHandler = require("express-async-handler");
const Message = require("../models/messageModel");
const User = require("../models/userModel");
const Chat = require("../models/chatModel");
const CryptoJS = require("crypto-js");
const { generateAIResponse } = require("../services/aiService");

//@description     Get all Messages
//@route           GET /api/Message/:chatId
//@access          Protected

// Generate a secret key

const allMessages = asyncHandler(async (req, res) => {
  try {
    // Verify chat exists and user has access
    const chat = await Chat.findById(req.params.chatId);
    if (!chat) {
      return res.status(404).json({ message: "Chat not found" });
    }

    // Check if user is part of this chat
    const isUserInChat = chat.users.some(
      (userId) => userId.toString() === req.user._id.toString()
    );
    if (!isUserInChat) {
      return res.status(403).json({ message: "Access denied to this chat" });
    }

    const messages = await Message.find({ chat: req.params.chatId })
      .populate("sender", "name pic email isAI")
      .populate("chat")
      .sort({ createdAt: 1 }); // Sort by createdAt ascending (oldest first)

    console.log(`Found ${messages.length} messages for chat ${req.params.chatId}`);

    // Populate chat users with isAI field
    const messagesWithUsers = await User.populate(messages, {
      path: "chat.users",
      select: "name pic email isAI",
    });

    // Decrypt the messages
    const decryptedMessages = messagesWithUsers.map((message) => {
      let decryptedContent = "";
      if (message.content) {
        try {
          decryptedContent = CryptoJS.AES.decrypt(
            message.content,
            process.env.SECRET_KEY
          ).toString(CryptoJS.enc.Utf8);
          // If decryption results in empty string, it might be invalid encryption
          if (!decryptedContent && message.content) {
            console.warn(`Failed to decrypt message ${message._id}, using original content`);
            decryptedContent = message.content;
          }
        } catch (error) {
          console.error(`Error decrypting message ${message._id}:`, error);
          // If decryption fails, try to use original content
          decryptedContent = message.content || "";
        }
      }

      return { ...message.toObject(), content: decryptedContent };
    });

    await Message.updateMany(
      { chat: req.params.chatId, readBy: { $ne: req.user._id } },
      { $addToSet: { readBy: req.user._id } }
    );

    res.json(decryptedMessages);
  } catch (error) {
    res.status(400);
    throw new Error(error.message);
  }
});

//@description     Create New Message
//@route           POST /api/Message/
//@access          Protected
const sendMessage = asyncHandler(async (req, res) => {
  const { content, chatId } = req.body;
  let image = req.body.image;

  if (req.file) {
    // Normalize path to use forward slashes for URL and prepend /
    image = "/" + req.file.path.replace(/\\/g, "/");
  }

  console.log("SendMessage Content:", content);
  console.log("SendMessage Image:", image);

  if ((!content && !image) || !chatId) {
    console.log("Invalid data passed into request");
    return res.sendStatus(400);
  }

  // Debug env vars
  console.log("Secret Key Present:", !!process.env.SECRET_KEY);

  const secretKey = CryptoJS.lib.WordArray.random(256 / 8);

  const encrypted = content ? CryptoJS.AES.encrypt(content, process.env.SECRET_KEY) : "";
  const ciphertext = encrypted ? encrypted.toString() : "";

  var newMessage = {
    sender: req.user._id,
    content: ciphertext,
    chat: chatId,
    image: image || "",
  };

  try {
    var message = await Message.create(newMessage);

    message = await message.populate("sender", "name pic email isAI");
    message = await message.populate("chat");
    message = await User.populate(message, {
      path: "chat.users",
      select: "name pic email isAI",
    });

    const decryptedContent = CryptoJS.AES.decrypt(
      message.content,
      process.env.SECRET_KEY
    ).toString(CryptoJS.enc.Utf8);

    message.content = decryptedContent;

    await Chat.findByIdAndUpdate(req.body.chatId, {
      latestMessage: message,
    });

    // Check if this is a chat with AI user
    const chat = await Chat.findById(chatId).populate("users", "name pic email isAI");
    const isAIChat = chat && chat.users.some((user) => user.isAI === true);

    // If it's an AI chat and user sent a text message (not just image), trigger AI response
    if (isAIChat && content && !image) {
      // Trigger AI response asynchronously (don't block the user's response)
      setImmediate(() => {
        const io = req.app.get("io");
        if (io) {
          handleAIResponse(chatId, message, io);
        } else {
          console.error("Socket.io instance not available for AI response");
        }
      });
    }

    res.json(message);
  } catch (error) {
    console.error("SendMessage Error:", error);
    res.status(400);
    throw new Error(error.message);
  }
});

const reactToMessage = asyncHandler(async (req, res) => {
  const { messageId, emoji } = req.body;

  const message = await Message.findById(messageId);

  if (!message) {
    res.status(404);
    throw new Error("Message not found");
  }

  // Check if user already reacted
  const existingReaction = message.reactions.find(
    (r) => r.user.toString() === req.user._id.toString()
  );

  if (existingReaction) {
    existingReaction.emoji = emoji;
  } else {
    message.reactions.push({ user: req.user._id, emoji });
  }

  await message.save();

  // Return the full message with sender populated
  const fullMessage = await Message.findById(messageId)
    .populate("sender", "name pic email")
    .populate("chat")
    .populate("reactions.user", "name pic");

  res.json(fullMessage);
});

/**
 * Handle AI response after user sends a message to AI
 * This function is called asynchronously after the user message is saved
 */
const handleAIResponse = async (chatId, userMessage, io) => {
  try {
    // Get the chat to find AI user
    const chat = await Chat.findById(chatId).populate("users", "isAI name pic email");
    
    if (!chat) {
      console.error("Chat not found for AI response");
      return;
    }

    // Find AI user in the chat
    const aiUser = chat.users.find((user) => user.isAI === true);
    
    if (!aiUser) {
      console.error("AI user not found in chat");
      return;
    }

    // Get recent chat history (last 15 messages for context)
    const messages = await Message.find({ chat: chatId })
      .populate("sender", "name pic email isAI")
      .sort({ createdAt: -1 })
      .limit(15);

    // Reverse to get chronological order
    messages.reverse();

    // Decrypt messages for AI processing
    const decryptedMessages = messages.map((message) => {
      let decryptedContent = "";
      if (message.content) {
        try {
          decryptedContent = CryptoJS.AES.decrypt(
            message.content,
            process.env.SECRET_KEY
          ).toString(CryptoJS.enc.Utf8);
        } catch (error) {
          decryptedContent = message.content; // If decryption fails, use original
        }
      }
      return {
        ...message.toObject(),
        content: decryptedContent,
      };
    });

    // Generate AI response
    const aiResult = await generateAIResponse(
      decryptedMessages,
      userMessage.sender._id,
      chatId
    );

    // Encrypt AI response
    const encryptedResponse = CryptoJS.AES.encrypt(
      aiResult.response,
      process.env.SECRET_KEY
    ).toString();

    // Create AI message
    const aiMessage = await Message.create({
      sender: aiUser._id,
      content: encryptedResponse,
      chat: chatId,
    });

    // Populate the message
    let populatedMessage = await aiMessage.populate("sender", "name pic email isAI");
    populatedMessage = await populatedMessage.populate("chat");
    populatedMessage = await User.populate(populatedMessage, {
      path: "chat.users",
      select: "name pic email isAI",
    });

    // Decrypt for response
    const decryptedAIContent = CryptoJS.AES.decrypt(
      populatedMessage.content,
      process.env.SECRET_KEY
    ).toString(CryptoJS.enc.Utf8);
    populatedMessage.content = decryptedAIContent;

    // Update chat's latest message
    await Chat.findByIdAndUpdate(chatId, {
      latestMessage: populatedMessage,
    });

    // Emit via Socket.io to all users in the chat
    if (io && populatedMessage.chat && populatedMessage.chat.users) {
      populatedMessage.chat.users.forEach((user) => {
        if (user._id.toString() !== aiUser._id.toString()) {
          io.in(user._id.toString()).emit("message recieved", populatedMessage);
        }
      });
    }

    console.log("AI response generated and sent successfully");
  } catch (error) {
    console.error("Error handling AI response:", error);
    // Don't throw - we don't want to break the user's message sending
  }
};

module.exports = { allMessages, sendMessage, reactToMessage, handleAIResponse };
