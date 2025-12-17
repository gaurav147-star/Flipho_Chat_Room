export const isSameSenderMargin = (messages, m, i, userId) => {
  if (
    i < messages.length - 1 &&
    messages[i + 1].sender._id === m.sender._id &&
    messages[i].sender._id !== userId
  )
    return 33;
  else if (
    (i < messages.length - 1 &&
      messages[i + 1].sender._id !== m.sender._id &&
      messages[i].sender._id !== userId) ||
    (i === messages.length - 1 && messages[i].sender._id !== userId)
  )
    return 0;
  else return "auto";
};

export const isSameSender = (messages, m, i, userId) => {
  return (
    i < messages.length - 1 &&
    (messages[i + 1].sender._id !== m.sender._id ||
      messages[i + 1].sender._id === undefined) &&
    messages[i].sender._id !== userId
  );
};

export const isLastMessage = (messages, i, userId) => {
  return (
    i === messages.length - 1 &&
    messages[messages.length - 1].sender._id !== userId &&
    messages[messages.length - 1].sender._id
  );
};

export const isSameUser = (messages, m, i) => {
  return i > 0 && messages[i - 1].sender._id === m.sender._id;
};

export const getSender = (loggedUser, users) => {
  return users[0]._id === loggedUser._id ? users[1].name : users[0].name;
};
export const getSenderPic = (loggedUser, users) => {
  return users[0]._id === loggedUser._id ? users[1].pic : users[0].pic;
};
export const getSenderId = (loggedUser, users) => {
  return users[0]._id === loggedUser._id ? users[1]._id : users[0]._id;
};
export const getSenderFull = (loggedUser, users) => {
  return users[0]._id === loggedUser._id ? users[1] : users[0];
};

/**
 * Check if a chat is with AI user
 * @param {Object} chat - Chat object
 * @param {Object} loggedUser - Currently logged in user
 * @returns {Boolean} - True if chat is with AI
 */
export const isAIChat = (chat, loggedUser) => {
  if (!chat || !loggedUser || chat.isGroupChat) return false;
  if (!chat.users || chat.users.length !== 2) return false;
  
  // Check if any user in the chat is AI
  return chat.users.some((user) => {
    // Check by isAI flag if available
    if (user.isAI !== undefined) return user.isAI;
    // Fallback: check by email (AI user has specific email)
    if (user.email === "ai@fliphochat.com") return true;
    // Fallback: check by name
    if (user.name === "AI Assistant") return true;
    return false;
  });
};

/**
 * Get AI user from chat users array
 * @param {Array} users - Array of users in chat
 * @returns {Object|null} - AI user object or null
 */
export const getAIUser = (users) => {
  if (!users || !Array.isArray(users)) return null;
  return users.find((user) => {
    if (user.isAI !== undefined && user.isAI) return true;
    if (user.email === "ai@fliphochat.com") return true;
    if (user.name === "AI Assistant") return true;
    return false;
  }) || null;
};