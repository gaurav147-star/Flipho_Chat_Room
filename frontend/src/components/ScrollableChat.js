import { Avatar } from "@chakra-ui/avatar";
import { Tooltip } from "@chakra-ui/tooltip";
import ScrollableFeed from "react-scrollable-feed";
import { motion } from "framer-motion";
import axios from "axios";
import { useState } from "react";
import {
  isLastMessage,
  isSameSender,
  isSameSenderMargin,
  isSameUser,
} from "../config/ChatLogics";
import { ChatState } from "../Context/ChatProvider";

const ScrollableChat = ({ messages }) => {
  const { user, selectedChat } = ChatState();
  const [expandedMessages, setExpandedMessages] = useState(new Set());
  const MAX_MESSAGE_LENGTH = 300; // Characters before showing "read more"

  const handleReaction = async (messageId) => {
    try {
      const config = {
        headers: {
          "Content-type": "application/json",
          Authorization: `Bearer ${user.token}`,
        },
      };
      await axios.put(
        "/api/message/reaction",
        {
          messageId,
          emoji: "❤️", // Default to heart for now
        },
        config
      );
      // Optimistic UI update or fetchMessages triggered by parent could handle this, 
      // but for now we rely on socket or manual refresh. 
      // Ideally we emit a socket event here too.
    } catch (error) {
      console.log(error);
    }
  };

  const toggleMessageExpansion = (messageId) => {
    setExpandedMessages((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(messageId)) {
        newSet.delete(messageId);
      } else {
        newSet.add(messageId);
      }
      return newSet;
    });
  };

  const renderMessageContent = (message) => {
    const isExpanded = expandedMessages.has(message._id);
    const messageContent = message.content || '';
    const isLong = messageContent.length > MAX_MESSAGE_LENGTH;
    // Only show read more for other side's messages (not user's own messages)
    const senderId = message.sender?._id || message.sender;
    const userId = user?._id || user;
    const isOtherSide = senderId && userId && String(senderId) !== String(userId);

    // If message is not long or it's from the user, show full content
    if (!isLong || !isOtherSide) {
      return <span style={{ position: 'relative', zIndex: 1, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{messageContent}</span>;
    }

    const buttonStyle = {
      marginTop: '8px',
      padding: '4px 8px',
      background: 'transparent',
      border: 'none',
      color: '#00a884',
      cursor: 'pointer',
      fontSize: '12px',
      fontWeight: '500',
      textDecoration: 'underline',
      display: 'block',
      transition: 'opacity 0.2s ease',
    };

    if (isExpanded) {
      return (
        <>
          <span style={{ position: 'relative', zIndex: 1, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{messageContent}</span>
          <button
            onClick={() => toggleMessageExpansion(message._id)}
            onMouseEnter={(e) => e.target.style.opacity = '0.8'}
            onMouseLeave={(e) => e.target.style.opacity = '1'}
            style={buttonStyle}
          >
            Read less
          </button>
        </>
      );
    }

    const truncatedText = messageContent.substring(0, MAX_MESSAGE_LENGTH);
    return (
      <>
        <span style={{ position: 'relative', zIndex: 1, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
          {truncatedText}
          <span style={{ opacity: 0.7 }}>...</span>
        </span>
        <button
          onClick={() => toggleMessageExpansion(message._id)}
          onMouseEnter={(e) => e.target.style.opacity = '0.8'}
          onMouseLeave={(e) => e.target.style.opacity = '1'}
          style={buttonStyle}
        >
          Read more
        </button>
      </>
    );
  };

  return (
    <ScrollableFeed>
      {messages &&
        messages.map((m, i) => (
          <div style={{ display: "flex" }} key={m._id}>
            {(isSameSender(messages, m, i, user._id) ||
              isLastMessage(messages, i, user._id)) && (
                <Tooltip label={m.sender.name} placement="bottom-start" hasArrow>
                  <Avatar
                    mt="7px"
                    mr={1}
                    size="sm"
                    cursor="pointer"
                    name={m.sender.name}
                    src={m.sender.pic}
                  />
                </Tooltip>
              )}
            <motion.div
              initial={{ opacity: 0, scale: 0.5, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{
                type: "spring",
                stiffness: 300,
                damping: 20,
                mass: 0.8
              }}
              style={{
                backgroundColor: `${m.sender._id === user._id ? "#005c4b" : "#202c33"}`,
                color: "#e9edef",
                marginLeft: isSameSenderMargin(messages, m, i, user._id),
                marginTop: isSameUser(messages, m, i, user._id) ? 3 : 10,
                borderRadius: "8px",
                borderTopLeftRadius: m.sender._id !== user._id && !isSameUser(messages, m, i, user._id) ? "0px" : "8px",
                borderTopRightRadius: m.sender._id === user._id && !isSameUser(messages, m, i, user._id) ? "0px" : "8px",
                padding: "8px 12px",
                maxWidth: "75%",
                boxShadow: "0 1px 0.5px rgba(0,0,0,0.13)",
              }}
            >
              {m.image && <img src={m.image.startsWith("http") || m.image.startsWith("/") ? m.image : `/${m.image}`} alt="attachment" style={{ borderRadius: "14px", marginBottom: "8px", maxWidth: "240px", border: "1px solid rgba(255,255,255,0.1)" }} />}
              {renderMessageContent(m)}
              {m.reactions && m.reactions.length > 0 && (
                <div style={{ fontSize: "12px", marginTop: "4px", display: "flex", justifyContent: "flex-end", gap: "2px" }}>
                  {m.reactions.map((r, idx) => (
                    <motion.span
                      key={idx}
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: 0.1 * idx }}
                    >
                      {r.emoji}
                    </motion.span>
                  ))}
                </div>
              )}
            </motion.div>
            <span
              style={{ cursor: "pointer", marginLeft: "5px", alignSelf: "center", opacity: 0.5 }}
              onClick={() => handleReaction(m._id)}
            >
              <i className="far fa-heart"></i>
            </span>
          </div>
        ))}
    </ScrollableFeed>
  );
};

export default ScrollableChat;
