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
      const decryptedContent = CryptoJS.AES.decrypt(
        message.content,
        process.env.SECRET_KEY
      ).toString(CryptoJS.enc.Utf8);

      return { ...message.toObject(), content: decryptedContent };
    });

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
  if (!content || !chatId) {
    console.log("Invalid data passed into request");
    return res.sendStatus(400);
  }

  const secretKey = CryptoJS.lib.WordArray.random(256 / 8); // 256-bit key

  const encrypted = CryptoJS.AES.encrypt(content, process.env.SECRET_KEY);
  // Convert the encrypted message to a string for transmission
  const ciphertext = encrypted.toString();

  var newMessage = {
    sender: req.user._id,
    content: ciphertext,
    chat: chatId,
  };

  try {
    var message = await Message.create(newMessage);

    message = await message.populate("sender", "name pic");
    // console.log(message);
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
    res.status(400);
    throw new Error(error.message);
  }
});

module.exports = { allMessages, sendMessage };
