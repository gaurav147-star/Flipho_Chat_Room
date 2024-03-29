import { AddIcon } from "@chakra-ui/icons";
import { Box, Stack, Text } from "@chakra-ui/layout";
import { useToast } from "@chakra-ui/toast";
import axios from "axios";
import { useEffect, useState } from "react";
import { getSender, getSenderPic } from "../config/ChatLogics";
import ChatLoading from "./ChatLoading";
import GroupChatModal from "./miscellaneous/GroupChatModal";
import { Button, Avatar, AvatarGroup } from "@chakra-ui/react";
import { ChatState } from "../Context/ChatProvider";

const MyChats = ({ fetchAgain }) => {
  const [loggedUser, setLoggedUser] = useState();

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
    // setLoggedUser(user);
    setLoggedUser(JSON.parse(localStorage.getItem("userInfo")));
    fetchChats();
    // eslint-disable-next-line
  }, [fetchAgain, user]);

  const capitalizeFirstLetter = (str) => {
    return str.charAt(0).toUpperCase() + str.slice(1);
  };

  return (
    <Box
      d={{ base: selectedChat ? "none" : "flex", md: "flex" }}
      flexDir="column"
      alignItems="center"
      p={3}
      bg="white"
      w={{ base: "100%", md: "28%" }}
      borderRadius="lg"
      borderWidth="1px"
    >
      <Box
        pb={3}
        px={{ base: "1", md: "2" }}
        fontSize={{ base: "28px", md: "30px" }}
        fontFamily="Work sans"
        d="flex"
        w="100%"
        justifyContent="space-between"
        alignItems="center"
      >
        <Box fontSize={{ base: "22px", md: "15px", lg: "17px" }}>My Chats</Box>
        <Box>
          <GroupChatModal>
            <Button
              d="flex"
              fontSize={{ base: "17px", md: "10px", lg: "17px" }}
              rightIcon={<AddIcon />}
              w={{ base: "100%", md: "90%", lg: "100%" }}
            >
              New Group Chat
            </Button>
          </GroupChatModal>
        </Box>
      </Box>
      <Box
        d="flex"
        flexDir="column"
        p={3}
        bg="#F8F8F8"
        w="100%"
        h="100%"
        borderRadius="lg"
        overflowY="hidden"
      >
        {chats ? (
          <Stack overflowY="scroll">
            {chats.map((chat) => (
              <Box
                onClick={() => setSelectedChat(chat)}
                cursor="pointer"
                bg={selectedChat === chat ? "#38B2AC" : "#E8E8E8"}
                color={selectedChat === chat ? "white" : "black"}
                px={3}
                py={2}
                borderRadius="lg"
                key={chat._id}
                d="flex"
              >
                <Box d="flex" alignItems="center">
                  {!chat.isGroupChat ? (
                    <>
                      {getSenderPic(loggedUser, chat.users) ? (
                        <Avatar src={getSenderPic(loggedUser, chat.users)} />
                      ) : (
                        <Avatar src="https://bit.ly/broken-link" />
                      )}
                    </>
                  ) : (
                    <>
                      {chat.pic ? (
                        <AvatarGroup size="md" max={2}>
                          <Avatar src={chat.pic} />
                          <Avatar src="https://bit.ly/broken-link" mx={-7} />
                        </AvatarGroup>
                      ) : (
                        <Avatar src="https://bit.ly/broken-link" />
                      )}
                    </>
                  )}
                </Box>
                <Box ml={3}>
                  <Text fontSize="xl">
                    {!chat.isGroupChat
                      ? getSender(loggedUser, chat.users) &&
                        capitalizeFirstLetter(getSender(loggedUser, chat.users))
                      : chat.chatName && capitalizeFirstLetter(chat.chatName)}
                  </Text>
                  {chat.latestMessage && (
                    <Text fontSize="xs" color="#3a3a3a">
                      {chat.latestMessage.content.length > 50
                        ? chat.latestMessage.content.substring(0, 51) + "..."
                        : chat.latestMessage.content}
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
