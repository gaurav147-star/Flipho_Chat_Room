const asyncHandler = require("express-async-handler");
const Chat = require("../models/chatModel");
const User = require("../models/userModel");
const CryptoJS = require("crypto-js");
const { getOrCreateAIUser } = require("../config/aiUser");

//@description     Create or fetch One to One Chat
//@route           POST /api/chat/
//@access          Protected
const accessChat = asyncHandler(async (req, res) => {
  const { userId } = req.body;

  if (!userId) {
    console.log("UserId param not sent with request");
    return res.sendStatus(400);
  }

  // Check if userId is AI user
  const targetUser = await User.findById(userId);
  if (targetUser && targetUser.isAI) {
    // Ensure AI user exists
    const aiUser = await getOrCreateAIUser();
    if (userId !== aiUser._id.toString()) {
      return res.status(400).json({ message: "Invalid AI user ID" });
    }
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
    select: "name pic email isAI",
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
    // Get or create AI user
    const aiUser = await getOrCreateAIUser();

    // First, directly query for existing AI chat using MongoDB query (more reliable)
    const existingAIChat = await Chat.findOne({
      isGroupChat: false,
      $and: [
        { users: { $elemMatch: { $eq: req.user._id } } },
        { users: { $elemMatch: { $eq: aiUser._id } } },
      ],
    })
      .populate("users", "-password")
      .populate("latestMessage");

    console.log(`User ${req.user._id}: Existing AI chat found: ${existingAIChat ? existingAIChat._id : 'none'}`);

    // Get all user chats (excluding the AI chat if it exists, to avoid duplicates)
    const otherChatsQuery = {
      users: { $elemMatch: { $eq: req.user._id } },
    };
    
    // If AI chat exists, exclude it from the query
    if (existingAIChat) {
      otherChatsQuery._id = { $ne: existingAIChat._id };
    }

    const results = await Chat.find(otherChatsQuery)
      .populate("users", "-password")
      .populate("groupOwner", "-password")
      .populate("groupAdmin", "-password")
      .populate("latestMessage")
      .sort({ updatedAt: -1 });

    const populatedResults = await User.populate(results, {
      path: "latestMessage.sender",
      select: "name pic email isAI",
    });

    // If no AI chat exists, create it
    let aiChat = existingAIChat;
    if (!aiChat) {
      try {
        console.log(`User ${req.user._id}: Creating new AI chat`);
        aiChat = await Chat.create({
          chatName: "sender",
          isGroupChat: false,
          users: [req.user._id, aiUser._id],
        });
        aiChat = await Chat.findOne({ _id: aiChat._id })
          .populate("users", "-password")
          .populate("latestMessage");
        console.log(`User ${req.user._id}: Created AI chat ${aiChat._id}`);
      } catch (error) {
        console.error("Error creating AI chat:", error);
      }
    }

    // Populate latestMessage sender for AI chat if it exists
    if (aiChat && aiChat.latestMessage) {
      aiChat = await User.populate(aiChat, {
        path: "latestMessage.sender",
        select: "name pic email isAI",
      });
    }

    // Combine results: AI chat first (if exists), then other chats
    let allChats = populatedResults || [];
    if (aiChat) {
      // Put AI chat at the beginning
      allChats = [aiChat, ...allChats];
    }

    // Decrypt messages
    const decryptedResults = allChats.map((result) => {
      if (result.latestMessage && result.latestMessage.content) {
        try {
          const decryptedContent = CryptoJS.AES.decrypt(
            result.latestMessage.content,
            process.env.SECRET_KEY
          ).toString(CryptoJS.enc.Utf8);
          result.latestMessage.content = decryptedContent;
        } catch (error) {
          // If decryption fails, keep original content
          console.error("Decryption error:", error);
        }
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
  let updatedChat;
  if (!pic) {
    updatedChat = await Chat.findByIdAndUpdate(
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
  } else if (!chatName) {
    updatedChat = await Chat.findByIdAndUpdate(
      chatId,
      {
        pic: pic,
      },
      {
        new: true,
      }
    )
      .populate("users", "-password")
      .populate("groupOwner", "-password")
      .populate("groupAdmin", "-password");
  }
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
