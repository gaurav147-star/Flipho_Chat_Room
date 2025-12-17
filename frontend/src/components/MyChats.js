import { AddIcon } from "@chakra-ui/icons";
import { Box, Stack, Text } from "@chakra-ui/layout";
import { useToast } from "@chakra-ui/toast";
import axios from "axios";
import { useEffect, useState } from "react";
import { getSender, getSenderPic, isAIChat } from "../config/ChatLogics";
import ChatLoading from "./ChatLoading";
import GroupChatModal from "./miscellaneous/GroupChatModal";
import { Button, Avatar, AvatarGroup } from "@chakra-ui/react";
import { ChatState } from "../Context/ChatProvider";

const MyChats = ({ fetchAgain }) => {
  const [loggedUser, setLoggedUser] = useState();
  const [showUnreadOnly, setShowUnreadOnly] = useState(false);

  const { selectedChat, setSelectedChat, user, chats, setChats } = ChatState();

  const toast = useToast();

  const fetchChats = async () => {
    try {
      const config = {
        headers: {
          Authorization: `Bearer ${user.token}`,
        },
      };

      const { data } = await axios.get("/api/chat", config);

      setChats(data);
    } catch (error) {
      toast({
        title: "Error Occured!",
        description: "Failed to Load the chats",
        status: "error",
        duration: 5000,
        isClosable: true,
        position: "bottom-left",
      });
    }
  };

  useEffect(() => {
    setLoggedUser(JSON.parse(localStorage.getItem("userInfo")));
    fetchChats();
    // eslint-disable-next-line
  }, [fetchAgain, user]);

  const capitalizeFirstLetter = (str) => {
    return str.charAt(0).toUpperCase() + str.slice(1);
  };

  const getFilteredChats = () => {
    if (!chats) return [];
    
    // Separate AI chat and other chats
    const aiChat = chats.find((chat) => isAIChat(chat, loggedUser));
    const otherChats = chats.filter((chat) => !isAIChat(chat, loggedUser));
    
    // Apply unread filter if enabled
    let filteredChats = showUnreadOnly
      ? otherChats.filter(
          (chat) =>
            chat.latestMessage &&
            !chat.latestMessage.readBy.includes(loggedUser?._id) &&
            chat.latestMessage.sender._id !== loggedUser?._id
        )
      : otherChats;
    
    // Always include AI chat at the top if it exists
    if (aiChat) {
      filteredChats = [aiChat, ...filteredChats];
    }
    
    return filteredChats;
  };

  return (
    <Box
      d={{ base: selectedChat ? "none" : "flex", md: "flex" }}
      flexDir="column"
      alignItems="center"
      p={3}
      bg="dark.panel"
      w={{ base: "100%", md: "31%" }}
      borderRadius="none"
      borderRight="1px solid rgba(255,255,255,0.1)"
    >
      <Box
        pb={3}
        px={3}
        fontSize={{ base: "28px", md: "24px" }}
        fontFamily="Work sans"
        d="flex"
        w="100%"
        justifyContent="space-between"
        alignItems="center"
        color="white"
      >
        My Chats
        <Box d="flex" gap={2}>
          <Button
            onClick={() => setShowUnreadOnly(!showUnreadOnly)}
            size="sm"
            fontSize="12px"
            bg={showUnreadOnly ? "teal.500" : "whiteAlpha.200"}
            color="white"
            _hover={{ bg: showUnreadOnly ? "teal.600" : "whiteAlpha.300" }}
          >
            {showUnreadOnly ? "All Chats" : "Unread"}
          </Button>
          <GroupChatModal>
            <Button
              d="flex"
              size="sm"
              fontSize="12px"
              rightIcon={<AddIcon />}
              variant="solid"
            >
              New Group
            </Button>
          </GroupChatModal>
        </Box>
      </Box>
      <Box
        d="flex"
        flexDir="column"
        p={3}
        bg="rgba(0, 0, 0, 0.2)"
        w="100%"
        h="100%"
        borderRadius="xl"
        overflowY="hidden"
      >
        {chats ? (
          <Stack overflowY="scroll" spacing={3}>
            {getFilteredChats().map((chat) => (
              <Box
                onClick={() => setSelectedChat(chat)}
                cursor="pointer"
                bg={selectedChat === chat ? "#2a3942" : "transparent"}
                color={"#e9edef"}
                _hover={{
                  bg: "#202c33",
                }}
                px={3}
                py={3}
                borderRadius="lg"
                key={chat._id}
                d="flex"
                alignItems="center"
                transition="all 0.2s"
                borderBottom="1px solid rgba(134, 150, 160, 0.15)"
              >
                <Box d="flex" alignItems="center">
                  {!chat.isGroupChat ? (
                    <>
                      {getSenderPic(loggedUser, chat.users) ? (
                        <Avatar size="sm" src={getSenderPic(loggedUser, chat.users)} />
                      ) : (
                        <Avatar size="sm" src="https://bit.ly/broken-link" />
                      )}
                    </>
                  ) : (
                    <>
                      {chat.pic ? (
                        <AvatarGroup size="sm" max={2}>
                          <Avatar src={chat.pic} />
                          <Avatar src="https://bit.ly/broken-link" mx={-7} />
                        </AvatarGroup>
                      ) : (
                        <Avatar size="sm" src="https://bit.ly/broken-link" />
                      )}
                    </>
                  )}
                </Box>
                <Box ml={3} w="100%">
                  <Text fontSize="sm" fontWeight="bold">
                    {!chat.isGroupChat
                      ? getSender(loggedUser, chat.users) &&
                      capitalizeFirstLetter(getSender(loggedUser, chat.users))
                      : chat.chatName && capitalizeFirstLetter(chat.chatName)}
                  </Text>
                  {chat.latestMessage && (
                    <Text fontSize="xs" color={selectedChat === chat ? "whiteAlpha.900" : "gray.400"} noOfLines={1}>
                      <b style={{
                        color: !chat.latestMessage.readBy.includes(loggedUser._id) ? "#80cbc4" : "inherit",
                        fontWeight: !chat.latestMessage.readBy.includes(loggedUser._id) ? "bold" : "normal"
                      }}>
                        {chat.latestMessage.sender._id === loggedUser._id ? "You: " : chat.latestMessage.sender.name + ": "}
                        {chat.latestMessage.content}
                      </b>
                    </Text>
                  )}
                </Box>
              </Box>
            ))}
          </Stack>
        ) : (
          <ChatLoading />
        )}
      </Box>
    </Box>
  );
};

export default MyChats;
