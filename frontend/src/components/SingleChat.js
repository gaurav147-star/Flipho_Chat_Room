import { FormControl } from "@chakra-ui/form-control";
import { Input } from "@chakra-ui/input";
import { notificationSoundUrl } from "../config/notificationSound";
import { Box, Text } from "@chakra-ui/layout";
import "./styles.css";
import { IconButton, Spinner, useToast, Avatar, CloseButton, Image } from "@chakra-ui/react";
import {
  getSender,
  getSenderPic,
  getSenderFull,
  getSenderId,
} from "../config/ChatLogics";
import { useEffect, useState, useRef } from "react"; // Added useRef
import axios from "axios";
import { ArrowBackIcon } from "@chakra-ui/icons";
import ProfileModal from "./miscellaneous/ProfileModal";
import ScrollableChat from "./ScrollableChat";
import ShoppingList from "./ShoppingList";
import Lottie from "react-lottie";
import animationData from "../animations/typing.json";
import Picker from "emoji-picker-react"; // Import Emoji Picker

import io from "socket.io-client";
import UpdateGroupChatModal from "./miscellaneous/UpdateGroupChatModal";
import { ChatState } from "../Context/ChatProvider";
const ENDPOINT = ""; // Handled by proxy
// const ENDPOINT = "https://fliphochat.onrender.com/";
var socket, selectedChatCompare;


const SingleChat = ({ fetchAgain, setFetchAgain }) => {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [newMessage, setNewMessage] = useState("");
  const [socketConnected, setSocketConnected] = useState(false);
  const [typing, setTyping] = useState(false);
  const [istyping, setIsTyping] = useState(false);
  const [online, setOnline] = useState(false);
  const [showList, setShowList] = useState(false);
  const [showEmoji, setShowEmoji] = useState(false); // Emoji State
  const [selectedFile, setSelectedFile] = useState(null); // File State
  const [previewUrl, setPreviewUrl] = useState(null);

  const fileInputRef = useRef(null);
  const toast = useToast();

  const defaultOptions = {
    loop: true,
    autoplay: true,
    animationData: animationData,
    rendererSettings: {
      preserveAspectRatio: "xMidYMid slice",
    },
  };
  const { selectedChat, setSelectedChat, user, notification, setNotification } =
    ChatState();

  const fetchMessages = async () => {
    if (!selectedChat) return;

    try {
      const config = {
        headers: {
          Authorization: `Bearer ${user.token}`,
        },
      };

      setLoading(true);

      const { data } = await axios.get(
        `/api/message/${selectedChat._id}`,
        config
      );
      setMessages(data);
      setLoading(false);

      socket.emit("join chat", selectedChat._id);
    } catch (error) {
      toast({
        title: "Error Occured!",
        description: "Failed to Load the Messages",
        status: "error",
        duration: 5000,
        isClosable: true,
        position: "bottom",
      });
    }
  };

  const onEmojiClick = (event, emojiObject) => {
    setNewMessage((prev) => prev + emojiObject.emoji);
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
      // Reset value to allow re-selecting same file if needed
      // e.target.value = null; 
    }
  };

  const clearFile = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const sendMessage = async (event) => {
    if ((event.key === "Enter" || event.type === 'click') && (newMessage || selectedFile)) {
      socket.emit("stop typing", selectedChat._id);
      try {
        const formData = new FormData();
        formData.append("content", newMessage);
        formData.append("chatId", selectedChat._id);
        if (selectedFile) {
          formData.append("image", selectedFile);
        }

        const config = {
          headers: {
            Authorization: `Bearer ${user.token}`,
            // Content-Type for FormData is handled automatically by browser/axios
          },
        };

        setNewMessage("");
        clearFile();
        setShowEmoji(false);

        const { data } = await axios.post(
          "/api/message",
          formData,
          config
        );
        socket.emit("new message", data);
        setMessages([...messages, data]);
      } catch (error) {
        toast({
          title: "Error Occured!",
          description: "Failed to send the Message",
          status: "error",
          duration: 5000,
          isClosable: true,
          position: "bottom",
        });
      }
    }
  };
  const [onlineUsers, setOnlineUsers] = useState({});

  useEffect(() => {
    socket = io(ENDPOINT);
    socket.emit("setup", user);
    socket.on("connected", () => setSocketConnected(true));
    socket.on("typing", () => setIsTyping(true));
    socket.on("stop typing", () => setIsTyping(false));
    socket.on("onlineUsers", (users) => {
      setOnlineUsers(users);
    });
    socket.on("disconnect", () => {
      setSocketConnected(false);
    });

    return () => {
      socket.disconnect(); // Disconnect the socket when the component unmounts
    };
    // eslint-disable-next-line
  }, []);

  // Request Notification Permission on load
  useEffect(() => {
    if (Notification.permission !== "granted" && Notification.permission !== "denied") {
      Notification.requestPermission();
    }
  }, []);

  useEffect(() => {
    fetchMessages();

    selectedChatCompare = selectedChat;
    // eslint-disable-next-line
  }, [selectedChat]);

  useEffect(() => {
    socket.on("message recieved", (newMessageRecieved) => {
      if (
        selectedChatCompare &&
        selectedChatCompare._id === newMessageRecieved.chat._id
      ) {
        setMessages([...messages, newMessageRecieved]);
      }
    });
  });
  useEffect(() => {
    if (!selectedChat || selectedChat.isGroupChat) return;

    const isUserOnline = selectedChat.users.some(
      (userId) => userId === user._id
    );

    setOnline(isUserOnline && socketConnected);
  }, [selectedChat, socketConnected, user._id]);
  const typingHandler = (e) => {
    setNewMessage(e.target.value);

    if (!socketConnected) return;

    if (!typing) {
      setTyping(true);
      socket.emit("typing", selectedChat._id);
    }
    let lastTypingTime = new Date().getTime();
    var timerLength = 3000;
    setTimeout(() => {
      var timeNow = new Date().getTime();
      var timeDiff = timeNow - lastTypingTime;
      if (timeDiff >= timerLength && typing) {
        socket.emit("stop typing", selectedChat._id);
        setTyping(false);
      }
    }, timerLength);
  };

  const capitalizeFirstLetter = (str) => {
    return str.charAt(0).toUpperCase() + str.slice(1);
  };

  return (
    <>
      {selectedChat ? (
        <>
          <Box
            fontSize={{ base: "28px", md: "30px" }}
            pb={3}
            px={2}
            w="100%"
            fontFamily="'Inter', sans-serif"
            d="flex"
            flexDirection="row"
            justifyContent={{ base: "space-between" }}
            alignItems="center"
          >
            <IconButton
              d={{ md: "flex" }}
              icon={<ArrowBackIcon />}
              onClick={() => setSelectedChat("")}
            />
            <IconButton
              icon={<i className="fas fa-list-ul"></i>}
              onClick={() => setShowList(!showList)}
              aria-label="Toggle List"
              ml={2}
            />
            {messages &&
              (!selectedChat.isGroupChat ? (
                <>
                  <Box d="flex">
                    <Box>
                      <Avatar src={getSenderPic(user, selectedChat.users)} />
                    </Box>
                    <Box d="flex" flexDirection="column" pl={2}>
                      <Text as="b" fontSize="22px" color="white">
                        {getSender(user, selectedChat.users) &&
                          capitalizeFirstLetter(
                            getSender(user, selectedChat.users)
                          ).substring(0, 15)}
                      </Text>
                      <Text mt="-1.5" fontSize="14px" color="gray.300">
                        {getSenderId(user, selectedChat.users) in onlineUsers &&
                          "Online"}
                      </Text>
                    </Box>
                  </Box>
                  <ProfileModal
                    user={getSenderFull(user, selectedChat.users)}
                  />
                </>
              ) : (
                <>
                  <Box d="flex">
                    <Avatar src={selectedChat.pic} />
                    <Text pl={2} fontSize="2xl" as="b" color="white">
                      {selectedChat.chatName &&
                        capitalizeFirstLetter(selectedChat.chatName)}
                    </Text>
                  </Box>
                  <UpdateGroupChatModal
                    fetchMessages={fetchMessages}
                    fetchAgain={fetchAgain}
                    setFetchAgain={setFetchAgain}
                  />
                </>
              ))}
          </Box>
          <Box
            d="flex"
            flexDir="column"
            justifyContent="flex-end"
            p={3}
            bg="transparent"
            w="100%"
            h="100%"
            borderRadius="lg"
            overflowY="hidden"
            position="relative" // For emoji picker positioning
          >
            {showList && <ShoppingList />}

            <Box flex={1} overflowY="auto" className="messages">
              {loading ? (
                <Spinner size="xl" w={20} h={20} alignSelf="center" margin="auto" />
              ) : (
                <ScrollableChat messages={messages} />
              )}
            </Box>

            {/* Preview Image */}
            {previewUrl && (
              <Box p={2} position="relative" w="fit-content" mb={2}>
                <Image src={previewUrl} h="100px" borderRadius="md" />
                <CloseButton
                  size="sm"
                  position="absolute"
                  top={0}
                  right={0}
                  bg="red.500"
                  color="white"
                  borderRadius="full"
                  onClick={clearFile}
                />
              </Box>
            )}

            {/* Emoji Picker */}
            {showEmoji && (
              <Box position="absolute" bottom="80px" left="20px" zIndex={10}>
                <Picker onEmojiClick={onEmojiClick} theme="dark" />
              </Box>
            )}

            <FormControl
              onKeyDown={sendMessage}
              id="first-name"
              isRequired
              mt={3}
              d="flex"
              alignItems="center"
              gap={2}
            >
              {/* Emoji Toggle */}
              <IconButton
                icon={<i className="far fa-smile"></i>}
                aria-label="Emoji Picker"
                variant="ghost"
                color="yellow.400"
                _hover={{ bg: "whiteAlpha.200" }}
                onClick={() => setShowEmoji(!showEmoji)}
              />

              {/* File Attachment */}
              <input
                type="file"
                ref={fileInputRef}
                style={{ display: "none" }}
                onChange={handleFileChange}
                accept="image/*"
              />
              <IconButton
                icon={<i className="fas fa-paperclip"></i>}
                aria-label="Attach File"
                variant="ghost"
                color="white"
                _hover={{ bg: "whiteAlpha.200" }}
                onClick={() => fileInputRef.current.click()}
              />

              {istyping ? (
                <div>
                  <Lottie
                    options={defaultOptions}
                    // height={50}
                    width={70}
                    style={{ marginBottom: 15, marginLeft: 0 }}
                  />
                </div>
              ) : (
                <></>
              )}
              <Input
                variant="filled"
                bg="rgba(0, 0, 0, 0.2)"
                border="1px solid rgba(255, 255, 255, 0.08)"
                borderRadius="full"
                _hover={{ bg: "rgba(0, 0, 0, 0.3)" }}
                _focus={{ bg: "rgba(0, 0, 0, 0.4)", borderColor: "cyan.400" }}
                color="white"
                _placeholder={{ color: "whiteAlpha.500" }}
                placeholder="Enter a message.."
                value={newMessage}
                onChange={typingHandler}
              />
            </FormControl>
          </Box>
        </>
      ) : (
        // to get socket.io on same page
        <Box d="flex" alignItems="center" justifyContent="center" h="100%">
          <Text fontSize="3xl" pb={3} fontFamily="Work sans" color="whiteAlpha.800" fontWeight="medium">
            Click on a user to start chatting
          </Text>
        </Box>
      )}
    </>
  );
};

export default SingleChat;
