const asyncHandler = require("express-async-handler");
const Chat = require("../models/chatModel");
const User = require("../models/userModel");
const CryptoJS = require("crypto-js");

//@description     Create or fetch One to One Chat
//@route           POST /api/chat/
//@access          Protected
const accessChat = asyncHandler(async (req, res) => {
  const { userId } = req.body;

  if (!userId) {
    console.log("UserId param not sent with request");
    return res.sendStatus(400);
  }

  var isChat = await Chat.find({
    isGroupChat: false,
    $and: [
      { users: { $elemMatch: { $eq: req.user._id } } },
      { users: { $elemMatch: { $eq: userId } } },
    ],
  })
    .populate("users", "-password")
    .populate("latestMessage");

  isChat = await User.populate(isChat, {
    path: "latestMessage.sender",
    select: "name pic email",
  });

  if (isChat.length > 0) {
    res.send(isChat[0]);
  } else {
    var chatData = {
      chatName: "sender",
      isGroupChat: false,
      users: [req.user._id, userId],
    };

    try {
      const createdChat = await Chat.create(chatData);
      const FullChat = await Chat.findOne({ _id: createdChat._id }).populate(
        "users",
        "-password"
      );
      res.status(200).json(FullChat);
    } catch (error) {
      res.status(400);
      throw new Error(error.message);
    }
  }
});

//@description     Fetch all chats for a user
//@route           GET /api/chat/
//@access          Protected
const fetchChats = asyncHandler(async (req, res) => {
  try {
    const results = await Chat.find({
      users: { $elemMatch: { $eq: req.user._id } },
    })
      .populate("users", "-password")
      .populate("groupOwner", "-password")
      .populate("groupAdmin", "-password")
      .populate("latestMessage")
      .sort({ updatedAt: -1 })
      .populate({
        path: "latestMessage.sender",
        select: "name pic email",
      });

    if (!results) {
      return res.status(404).json({ message: "Chats not found" });
    }
    const decryptedResults = results.map((result) => {
      if (result.latestMessage) {
        const decryptedContent = CryptoJS.AES.decrypt(
          result.latestMessage.content,
          process.env.SECRET_KEY
        ).toString(CryptoJS.enc.Utf8);
        result.latestMessage.content = decryptedContent;
      }
      return result;
    });
    res.status(200).json(decryptedResults);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

//@description     Create New Group Chat
//@route           POST /api/chat/group
//@access          Protected
const createGroupChat = asyncHandler(async (req, res) => {
  if (!req.body.users || !req.body.name) {
    return res.status(400).send({ message: "Please Fill all the feilds" });
  }

  var users = JSON.parse(req.body.users);

  if (users.length < 2) {
    return res
      .status(400)
      .send("More than 2 users are required to form a group chat");
  }

  users.push(req.user);

  try {
    const groupChat = await Chat.create({
      chatName: req.body.name,
      users: users,
      isGroupChat: true,
      groupOwner: req.user,
      groupAdmin: [req.user],
    });

    const fullGroupChat = await Chat.findOne({ _id: groupChat._id })
      .populate("users", "-password")
      .populate("groupOwner", "-password")
      .populate("groupAdmin", "-password");

    res.status(200).json(fullGroupChat);
  } catch (error) {
    res.status(400);
    throw new Error(error.message);
  }
});
const addToGroupAdmin = asyncHandler(async (req, res) => {
  const { chatId, userId } = req.body;

  try {
    // Check if the requester is the group owner
    const chat = await Chat.findById(chatId);
    if (!chat) {
      res.status(404);
      throw new Error("Chat not found");
    }

    if (!chat.groupAdmin.includes(req.user._id.toString())) {
      res.status(403);
      throw new Error("Only group admins can perform this action");
    }

    // Add the user to the group admins if not already present
    if (!chat.groupAdmin.includes(userId)) {
      chat.groupAdmin.push(userId);
      await chat.save();
    }

    // Populate the necessary fields before sending the response
    const updatedChat = await Chat.findOne({ _id: chat._id })
      .populate("users", "-password")
      .populate("groupOwner", "-password")
      .populate("groupAdmin", "-password");

    res.json(updatedChat);
  } catch (error) {
    res.status(400);
    throw new Error(error.message);
  }
});

const removeToGroupAdmin = asyncHandler(async (req, res) => {
  const { chatId, userId } = req.body;

  try {
    // Check if the requester is the group owner
    const chat = await Chat.findById(chatId);
    if (!chat) {
      res.status(404);
      throw new Error("Chat not found");
    }

    if (userId === req.user._id.toString()) {
      res.status(400);
      throw new Error("You cannot remove yourself as a group admin");
    }
    // Remove the user from the group admins if the user is a group admin and is not the group owner
    const index = chat.groupAdmin.findIndex(
      (adminId) => adminId.toString() === userId.toString()
    );
    if (
      index !== -1 &&
      chat.groupAdmin[index].toString() !== chat.groupOwner.toString()
    ) {
      chat.groupAdmin.splice(index, 1);
      await chat.save();
    }
    // Populate the necessary fields before sending the response
    const updatedChat = await Chat.findOne({ _id: chat._id })
      .populate("users", "-password")
      .populate("groupOwner", "-password")
      .populate("groupAdmin", "-password");

    res.json(updatedChat);
  } catch (error) {
    res.status(400);
    throw new Error(error.message);
  }
});

// @desc    Rename Group
// @route   PUT /api/chat/rename
// @access  Protected
const renameGroup = asyncHandler(async (req, res) => {
  const { chatId, chatName, pic } = req.body;

  const updatedChat = await Chat.findByIdAndUpdate(
    chatId,
    {
      chatName: chatName,
    },
    {
      new: true,
    }
  )
    .populate("users", "-password")
    .populate("groupOwner", "-password")
    .populate("groupAdmin", "-password");

  if (!updatedChat) {
    res.status(404);
    throw new Error("Chat Not Found");
  } else {
    res.json(updatedChat);
  }
});

// @desc    Remove user from Group
// @route   PUT /api/chat/groupremove
// @access  Protected
const removeFromGroup = asyncHandler(async (req, res) => {
  const { chatId, userId } = req.body;
  console.log(chatId, userId);
  try {
    // Check if the requester is a group admin or the group owner
    const chat = await Chat.findById(chatId);
    if (!chat) {
      res.status(404);
      throw new Error("Chat not found");
    }

    if (
      chat.groupAdmin.includes(req.user._id) ||
      chat.groupOwner.toString() === req.user._id
    ) {
      // Check if the user is trying to remove themselves
      if (userId === req.user._id) {
        res.status(400);
        throw new Error("You cannot remove yourself from the group");
      }

      // Check if the user being removed is the group owner
      if (userId === chat.groupOwner) {
        res.status(400);
        throw new Error("You cannot remove the group owner");
      }

      // Remove the user from the group
      const removed = await Chat.findByIdAndUpdate(
        chatId,
        {
          $pull: { users: userId },
        },
        {
          new: true,
        }
      )
        .populate("users", "-password")
        .populate("groupOwner", "-password")
        .populate("groupAdmin", "-password");

      if (!removed) {
        res.status(404);
        throw new Error("Chat Not Found");
      } else {
        res.json(removed);
      }
    } else {
      res.status(403);
      throw new Error("Only group admins and the group owner can remove users");
    }
  } catch (error) {
    res.status(400);
    throw new Error(error.message);
  }
});

// @desc    Add user to Group / Leave
// @route   PUT /api/chat/groupadd
// @access  Protected
const addToGroup = asyncHandler(async (req, res) => {
  const { chatId, userId } = req.body;

  try {
    // Check if the requester is a group admin or the group owner
    const chat = await Chat.findById(chatId);
    if (!chat) {
      res.status(404);
      throw new Error("Chat not found");
    }

    if (
      chat.groupAdmin.includes(req.user._id.toString()) ||
      chat.groupOwner.toString() === req.user._id.toString()
    ) {
      // Check if the user already exists in the group
      if (chat.users.includes(userId)) {
        res.status(400);
        throw new Error("User already exists in the group");
      }

      // Add the user to the group
      const added = await Chat.findByIdAndUpdate(
        chatId,
        {
          $push: { users: userId },
        },
        {
          new: true,
        }
      )
        .populate("users", "-password")
        .populate("groupOwner", "-password")
        .populate("groupAdmin", "-password");

      if (!added) {
        res.status(404);
        throw new Error("Chat Not Found");
      } else {
        res.json(added);
      }
    } else {
      res.status(403);
      throw new Error("Only group admins and the group owner can add users");
    }
  } catch (error) {
    res.status(400);
    throw new Error(error.message);
  }
});

module.exports = {
  accessChat,
  fetchChats,
  createGroupChat,
  renameGroup,
  addToGroup,
  removeFromGroup,
  addToGroupAdmin,
  removeToGroupAdmin,
};
