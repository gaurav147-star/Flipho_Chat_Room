import { Box, Button, Checkbox, HStack, IconButton, Input, Text, useToast, VStack } from "@chakra-ui/react";
import axios from "axios";
import { useEffect, useState } from "react";
import { ChatState } from "../Context/ChatProvider";

const ShoppingList = () => {
    const { user, selectedChat } = ChatState();
    const [lists, setLists] = useState([]);
    const [newListTitle, setNewListTitle] = useState("");
    const [newItemText, setNewItemText] = useState("");
    const toast = useToast();

    const fetchLists = async () => {
        try {
            const config = {
                headers: { Authorization: `Bearer ${user.token}` },
            };
            const { data } = await axios.get(`/api/list/${selectedChat._id}`, config);
            setLists(data);
        } catch (error) {
            console.error(error);
        }
    };

    const createList = async () => {
        if (!newListTitle) return;
        try {
            const config = { headers: { Authorization: `Bearer ${user.token}` } };
            await axios.post("/api/list", { chatId: selectedChat._id, title: newListTitle }, config);
            setNewListTitle("");
            fetchLists();
        } catch (error) {
            toast({ title: "Failed to create list", status: "error" });
        }
    };

    const addItem = async (listId) => {
        if (!newItemText) return;
        try {
            const config = { headers: { Authorization: `Bearer ${user.token}` } };
            await axios.put("/api/list/add", { listId, text: newItemText }, config);
            setNewItemText("");
            fetchLists();
        } catch (error) {
            toast({ title: "Failed to add item", status: "error" });
        }
    };

    const toggleItem = async (listId, itemId) => {
        try {
            const config = { headers: { Authorization: `Bearer ${user.token}` } };
            await axios.put("/api/list/toggle", { listId, itemId }, config);
            fetchLists();
        } catch (error) {
            console.error(error);
        }
    };

    useEffect(() => {
        if (selectedChat) fetchLists();
        // eslint-disable-next-line
    }, [selectedChat]);

    return (
        <Box w="100%" p={4} variant="glass" mt={2} borderRadius="lg">
            <Text fontSize="xl" mb={4} fontWeight="bold" color="white">Shared Lists</Text>

            {/* Create New List */}
            <HStack mb={4}>
                <Input
                    placeholder="New List Title (e.g. Groceries)"
                    value={newListTitle}
                    onChange={(e) => setNewListTitle(e.target.value)}
                    bg="rgba(255,255,255,0.1)"
                    color="white"
                />
                <Button onClick={createList} colorScheme="blue">Create</Button>
            </HStack>

            <VStack spacing={4} align="stretch">
                {lists.map((list) => (
                    <Box key={list._id} p={3} bg="rgba(0,0,0,0.3)" borderRadius="md">
                        <Text fontWeight="bold" color="blue.200" mb={2}>{list.title}</Text>

                        <VStack align="stretch" spacing={1}>
                            {list.items.map((item) => (
                                <HStack key={item._id} justifyContent="space-between">
                                    <Checkbox
                                        isChecked={item.isCompleted}
                                        onChange={() => toggleItem(list._id, item._id)}
                                        colorScheme="green"
                                    >
                                        <Text as={item.isCompleted ? "s" : ""} color="white">{item.text}</Text>
                                    </Checkbox>
                                    <Text fontSize="xs" color="gray.400">by {item.addedBy?.name}</Text>
                                </HStack>
                            ))}
                        </VStack>

                        <HStack mt={3}>
                            <Input
                                placeholder="Add item..."
                                size="sm"
                                variant="flushed"
                                color="white"
                                value={newItemText} // Note: simplified for demo, ideally one state per list
                                onChange={(e) => setNewItemText(e.target.value)}
                            />
                            <IconButton
                                icon={<i className="fas fa-plus"></i>}
                                size="xs"
                                colorScheme="blue"
                                onClick={() => addItem(list._id)}
                            />
                        </HStack>
                    </Box>
                ))}
            </VStack>
        </Box>
    );
};

export default ShoppingList;
