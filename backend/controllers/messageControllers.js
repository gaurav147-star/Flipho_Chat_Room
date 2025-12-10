const asyncHandler = require("express-async-handler");
const Message = require("../models/messageModel");
const User = require("../models/userModel");
const Chat = require("../models/chatModel");
const CryptoJS = require("crypto-js");

//@description     Get all Messages
//@route           GET /api/Message/:chatId
//@access          Protected

// Generate a secret key

const allMessages = asyncHandler(async (req, res) => {
  try {
    const messages = await Message.find({ chat: req.params.chatId })
      .populate("sender", "name pic email")
      .populate("chat");

    // Decrypt the messages
    const decryptedMessages = messages.map((message) => {
      let decryptedContent = "";
      if (message.content) {
        decryptedContent = CryptoJS.AES.decrypt(
          message.content,
          process.env.SECRET_KEY
        ).toString(CryptoJS.enc.Utf8);
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

    message = await message.populate("sender", "name pic");
    message = await message.populate("chat");
    message = await User.populate(message, {
      path: "chat.users",
      select: "name pic email",
    });

    const decryptedContent = CryptoJS.AES.decrypt(
      message.content,
      process.env.SECRET_KEY
    ).toString(CryptoJS.enc.Utf8);

    message.content = decryptedContent;

    await Chat.findByIdAndUpdate(req.body.chatId, {
      latestMessage: message,
    });

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

module.exports = { allMessages, sendMessage, reactToMessage };
