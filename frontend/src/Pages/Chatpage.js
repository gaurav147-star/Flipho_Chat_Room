import { Box } from "@chakra-ui/layout";
import { useState, useEffect } from "react";
import Chatbox from "../components/Chatbox";
import MyChats from "../components/MyChats";
import SideDrawer from "../components/miscellaneous/SideDrawer";
import { ChatState } from "../Context/ChatProvider";
import { notificationSoundUrl } from "../config/notificationSound";
import io from "socket.io-client";
import { motion } from "framer-motion";

const ENDPOINT = "";
var socket;

const Chatpage = () => {
  const [fetchAgain, setFetchAgain] = useState(false);
  const { user, selectedChat, notification, setNotification } = ChatState();

  useEffect(() => {
    if (user) {
      socket = io(ENDPOINT);
      socket.emit("setup", user);

      socket.on("message recieved", (newMessageRecieved) => {
        if (
          !selectedChat || // if chat is not selected or doesn't match current chat
          selectedChat._id !== newMessageRecieved.chat._id
        ) {
          if (!notification.includes(newMessageRecieved)) {
            setNotification([newMessageRecieved, ...notification]);
            setFetchAgain(!fetchAgain);

            // Play Sound
            const audio = new Audio(notificationSoundUrl);
            audio.play().catch(e => console.log("Audio play failed", e));

            // Browser Notification
            if (Notification.permission === "granted") {
              new Notification(`New Message from ${newMessageRecieved.sender.name}`, {
                body: newMessageRecieved.content,
                icon: "/logo192.png"
              });
            }
          }
        }
      });
    }
    // eslint-disable-next-line
  }, [user, selectedChat, notification, fetchAgain]); // dependencies updated to handle state changes

  return (
    <Box w="100%">
      {user && <SideDrawer fetchAgain={fetchAgain} setFetchAgain={setFetchAgain} />}
      <Box
        d="flex"
        justifyContent="space-between"
        w="100%"
        h="91.5vh"
        p="10px"
        as={motion.div}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
      >
        {user && <MyChats fetchAgain={fetchAgain} />}
        {user && (
          <Chatbox fetchAgain={fetchAgain} setFetchAgain={setFetchAgain} />
        )}
      </Box>
    </Box>
  );
};

export default Chatpage;
