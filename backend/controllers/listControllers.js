const asyncHandler = require("express-async-handler");
const List = require("../models/listModel");

//@description     Get all Lists for a Chat
//@route           GET /api/list/:chatId
//@access          Protected
const getLists = asyncHandler(async (req, res) => {
    try {
        const lists = await List.find({ chat: req.params.chatId })
            .populate("createdBy", "name pic")
            .populate("items.addedBy", "name pic");
        res.json(lists);
    } catch (error) {
        res.status(400);
        throw new Error(error.message);
    }
});

//@description     Create a new List
//@route           POST /api/list
//@access          Protected
const createList = asyncHandler(async (req, res) => {
    const { chatId, title } = req.body;

    if (!chatId || !title) {
        res.status(400);
        throw new Error("Please provide all fields");
    }

    try {
        const newList = await List.create({
            chat: chatId,
            title,
            createdBy: req.user._id,
            items: [],
        });

        const fullList = await List.findById(newList._id).populate(
            "createdBy",
            "name pic"
        );

        res.status(201).json(fullList);
    } catch (error) {
        res.status(400);
        throw new Error(error.message);
    }
});

//@description     Add item to list
//@route           PUT /api/list/add
//@access          Protected
const addItem = asyncHandler(async (req, res) => {
    const { listId, text } = req.body;

    try {
        const updatedList = await List.findByIdAndUpdate(
            listId,
            {
                $push: { items: { text, isCompleted: false, addedBy: req.user._id } },
            },
            { new: true }
        )
            .populate("createdBy", "name pic")
            .populate("items.addedBy", "name pic");

        res.json(updatedList);
    } catch (error) {
        res.status(400);
        throw new Error(error.message);
    }
});

//@description     Toggle item completion
//@route           PUT /api/list/toggle
//@access          Protected
const toggleItem = asyncHandler(async (req, res) => {
    const { listId, itemId } = req.body;

    try {
        const list = await List.findById(listId);
        const item = list.items.id(itemId);

        if (item) {
            item.isCompleted = !item.isCompleted;
            await list.save();
        }

        // re-fetch to populate
        const updatedList = await List.findById(listId)
            .populate("createdBy", "name pic")
            .populate("items.addedBy", "name pic");

        res.json(updatedList);
    } catch (error) {
        res.status(400);
        throw new Error(error.message);
    }
});

module.exports = { getLists, createList, addItem, toggleItem };
