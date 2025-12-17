# AI Integration Documentation

This document explains all the changes made to integrate AI functionality into the Flipho Chat Room application.

## Table of Contents
1. [Overview](#overview)
2. [File-by-File Changes](#file-by-file-changes)
3. [Architecture Flow](#architecture-flow)
4. [Key Features](#key-features)

---

## Overview

The AI integration allows users to chat with an AI assistant directly within the chat application. The AI:
- Appears as a regular user in the chat list
- Responds to user messages automatically
- Maintains conversation context
- Uses OpenAI's API for generating responses
- Tracks token usage for monitoring

---

## File-by-File Changes

### 1. **backend/models/userModel.js**
**Purpose**: Add support for AI users in the database

**Changes Made**:
- Added `isAI` field to user schema:
  ```javascript
  isAI: {
    type: Boolean,
    required: true,
    default: false,
  }
  ```
- Modified password hashing pre-save hook to skip hashing for AI users:
  ```javascript
  userSchema.pre("save", async function (next) {
    // Skip password hashing for AI users
    if (this.isAI) {
      return next();
    }
    // ... rest of password hashing logic
  });
  ```

**Why**: AI users don't need password authentication, so we skip the hashing process for them.

---

### 2. **backend/config/aiUser.js** (NEW FILE)
**Purpose**: Manage the AI user entity in the database

**What It Does**:
- `getOrCreateAIUser()` function:
  - Checks if an AI user already exists in the database
  - If not, creates one with:
    - Name: "AI Assistant"
    - Email: "ai@fliphochat.com"
    - Avatar: AI robot icon
    - `isAI: true` flag
  - Returns the AI user object

**Why**: Ensures there's always exactly one AI user that all users can chat with. This is called on server startup and when fetching chats.

---

### 3. **backend/models/aiUsageModel.js** (NEW FILE)
**Purpose**: Track AI token usage for monitoring and analytics

**Schema Fields**:
- `userId`: Reference to the user who made the request
- `chatId`: Reference to the chat where AI was used
- `tokensUsed`: Total tokens consumed
- `promptTokens`: Tokens used in the prompt
- `completionTokens`: Tokens used in the response
- `timestamps`: Automatic createdAt/updatedAt

**Why**: Allows tracking of API costs and usage patterns per user/chat.

---

### 4. **backend/services/aiService.js** (NEW FILE)
**Purpose**: Core AI service that handles OpenAI API interactions

**Key Functions**:

#### `getOpenAIClient()`
- Lazy initialization of OpenAI client
- Only creates client when needed
- Validates API key exists

#### `generateAIResponse(messages, userId, chatId)`
**What It Does**:
1. **Builds conversation history**:
   - Filters out empty messages
   - Maps messages to OpenAI format (user/assistant roles)
   - Determines role based on `sender.isAI` flag

2. **Creates system prompt**:
   - Defines AI personality and behavior
   - Instructs AI to be helpful, conversational, and context-aware
   - Adapts response length based on question complexity

3. **Calls OpenAI API**:
   - Model: `gpt-4o-mini` (configurable via `OPENAI_MODEL` env var)
   - Max tokens: 1000 (allows detailed responses)
   - Temperature: 0.7 (natural, varied responses)
   - Additional parameters for quality (top_p, frequency_penalty, presence_penalty)

4. **Logs usage**:
   - Saves token usage to `AIUsage` model
   - Tracks for analytics

5. **Error handling**:
   - Handles rate limits, authentication errors, service errors
   - Returns user-friendly error messages

**Why**: Centralizes all AI logic, making it easy to modify AI behavior, switch models, or add features.

---

### 5. **backend/controllers/chatControllers.js**
**Purpose**: Handle chat-related operations, including AI chat creation

**Key Changes in `fetchChats()` function**:

#### Before (Problem):
- Used unreliable check to find AI chats
- Could create duplicate AI chats
- Messages were lost when new chats were created

#### After (Solution):
1. **Direct MongoDB Query** (Lines 74-83):
   ```javascript
   const existingAIChat = await Chat.findOne({
     isGroupChat: false,
     $and: [
       { users: { $elemMatch: { $eq: req.user._id } } },
       { users: { $elemMatch: { $eq: aiUser._id } } },
     ],
   })
   ```
   - Directly queries for existing AI chat using MongoDB
   - More reliable than checking populated objects

2. **Prevent Duplicates** (Lines 87-95):
   - Excludes existing AI chat from main query
   - Prevents duplicate AI chats from appearing

3. **Create Only If Needed** (Lines 109-126):
   - Only creates new AI chat if none exists
   - Logs creation for debugging

4. **Proper Ordering** (Lines 136-141):
   - Places AI chat at the beginning of chat list
   - Ensures it's always visible

**Why**: Ensures users always have exactly one AI chat, preventing message loss and confusion.

---

### 6. **backend/controllers/messageControllers.js**
**Purpose**: Handle message operations, including triggering AI responses

**Key Changes**:

#### A. `allMessages()` Function (Lines 14-61)
**Changes Made**:
1. **Added sorting** (Line 19):
   ```javascript
   .sort({ createdAt: 1 }) // Sort by createdAt ascending (oldest first)
   ```
   - Ensures messages display in chronological order

2. **Added chat access verification** (Lines 16-25):
   - Verifies chat exists
   - Verifies user has access to the chat
   - Returns appropriate error codes

3. **Improved decryption error handling** (Lines 28-48):
   - Try-catch for decryption failures
   - Fallback to original content if decryption fails
   - Better error logging

4. **Added logging** (Line 20):
   - Logs number of messages loaded for debugging

**Why**: Ensures messages are properly sorted, secure, and handle errors gracefully.

#### B. `sendMessage()` Function (Lines 135-150)
**Changes Made**:
1. **AI Chat Detection** (Lines 135-137):
   ```javascript
   const chat = await Chat.findById(chatId).populate("users", "name pic email isAI");
   const isAIChat = chat && chat.users.some((user) => user.isAI === true);
   ```
   - Checks if the chat includes an AI user

2. **Trigger AI Response** (Lines 139-149):
   ```javascript
   if (isAIChat && content && !image) {
     setImmediate(() => {
       const io = req.app.get("io");
       if (io) {
         handleAIResponse(chatId, message, io);
       }
     });
   }
   ```
   - Only triggers for text messages (not images)
   - Uses `setImmediate()` to avoid blocking user response
   - Passes Socket.io instance for real-time updates

**Why**: Automatically generates AI responses when users message the AI, without blocking the user's message from being sent.

#### C. `handleAIResponse()` Function (Lines 192-283)
**Purpose**: Process AI response generation and delivery

**What It Does**:
1. **Validates Chat** (Lines 198-212):
   - Finds the chat
   - Finds the AI user in the chat
   - Returns early if validation fails

2. **Gets Conversation History** (Lines 214-240):
   - Fetches last 15 messages for context
   - Sorts by createdAt descending, then reverses for chronological order
   - Decrypts messages for AI processing

3. **Generates AI Response** (Lines 242-247):
   - Calls `generateAIResponse()` from aiService
   - Passes conversation history, userId, and chatId

4. **Saves AI Message** (Lines 249-260):
   - Encrypts AI response (same encryption as user messages)
   - Creates message with AI user as sender
   - Populates sender and chat information

5. **Updates Chat** (Lines 270-272):
   - Updates chat's `latestMessage` field
   - Keeps chat list up to date

6. **Real-time Delivery** (Lines 274-281):
   - Emits message via Socket.io to all users in chat
   - Excludes AI user from receiving its own message
   - Provides real-time updates

**Why**: Handles the complete flow of generating and delivering AI responses in real-time.

---

### 7. **backend/controllers/aiControllers.js** (NEW FILE)
**Purpose**: Handle AI-related API endpoints

**Functions**:
- `getAIUsage()`: Returns AI token usage statistics for the authenticated user

**Routes**: `/api/ai/usage` - Get user's AI usage statistics

**Why**: Allows users to monitor their AI usage and costs.

---

### 8. **backend/routes/aiRoutes.js** (NEW FILE)
**Purpose**: Define AI-related API routes

**Routes**:
- `GET /api/ai/usage` - Protected route to get AI usage statistics

**Why**: Separates AI routes from other routes for better organization.

---

### 9. **backend/server.js**
**Purpose**: Server initialization and configuration

**Changes Made** (Lines 9, 14-21):
1. **Import AI User Config**:
   ```javascript
   const { getOrCreateAIUser } = require("./config/aiUser");
   ```

2. **Initialize AI User on Startup**:
   ```javascript
   getOrCreateAIUser()
     .then((aiUser) => {
       console.log("AI User ready:", aiUser.name);
     })
     .catch((error) => {
       console.error("Failed to initialize AI user:", error);
     });
   ```

3. **Register AI Routes** (Line 35):
   ```javascript
   app.use("/api/ai", require("./routes/aiRoutes"));
   ```

4. **Make Socket.io Available** (Line 76):
   ```javascript
   app.set("io", io);
   ```
   - Allows controllers to access Socket.io for real-time updates

**Why**: Ensures AI user exists when server starts and makes Socket.io available to controllers.

---

## Architecture Flow

### 1. **User Sends Message to AI**
```
User → Frontend → POST /api/message
                ↓
         messageControllers.sendMessage()
                ↓
         Check if chat has AI user
                ↓
         Save user message
                ↓
         Trigger handleAIResponse() (async)
                ↓
         Return user message immediately
```

### 2. **AI Response Generation**
```
handleAIResponse()
        ↓
Get chat history (last 15 messages)
        ↓
Decrypt messages
        ↓
aiService.generateAIResponse()
        ↓
Call OpenAI API
        ↓
Encrypt AI response
        ↓
Save AI message to database
        ↓
Update chat's latestMessage
        ↓
Emit via Socket.io to users
```

### 3. **Fetching Chats**
```
User → Frontend → GET /api/chat
                ↓
         chatControllers.fetchChats()
                ↓
         Query for existing AI chat
                ↓
         If exists: use it
         If not: create new one
                ↓
         Return all chats (AI chat first)
```

### 4. **Fetching Messages**
```
User → Frontend → GET /api/message/:chatId
                ↓
         messageControllers.allMessages()
                ↓
         Verify user has access
                ↓
         Fetch messages sorted by createdAt
                ↓
         Decrypt messages
                ↓
         Return messages array
```

---

## Key Features

### 1. **Automatic AI Chat Creation**
- Every user automatically gets an AI chat
- Created on first chat list fetch
- Only one AI chat per user (no duplicates)

### 2. **Real-time AI Responses**
- AI responds automatically when user sends text message
- Uses Socket.io for real-time delivery
- Non-blocking (user message sent immediately)

### 3. **Conversation Context**
- AI uses last 15 messages for context
- Maintains conversation history
- Understands previous messages

### 4. **Message Encryption**
- AI messages encrypted same as user messages
- Uses AES encryption with SECRET_KEY
- Secure end-to-end encryption

### 5. **Token Usage Tracking**
- Tracks tokens used per request
- Logs to AIUsage model
- Can be queried via `/api/ai/usage`

### 6. **Error Handling**
- Handles OpenAI API errors gracefully
- Rate limit handling
- Authentication error handling
- Service unavailable handling

### 7. **Quality Improvements**
- Uses gpt-4o-mini model (better quality)
- 1000 token limit (detailed responses)
- Optimized parameters for natural responses
- Context-aware system prompt

---

## Environment Variables Required

```env
OPENAI_API_KEY=your_openai_api_key_here
OPENAI_MODEL=gpt-4o-mini  # Optional, defaults to gpt-4o-mini
SECRET_KEY=your_encryption_key_here
```

---

## Database Schema Changes

### User Model
- Added `isAI: Boolean` field

### New Models
- `AIUsage`: Tracks token usage per request

### No Changes Required
- `Chat` model: Works as-is (users array can contain AI user)
- `Message` model: Works as-is (sender can be AI user)

---

## Testing Checklist

✅ AI user created on server startup  
✅ AI chat appears in user's chat list  
✅ User can send messages to AI  
✅ AI responds automatically  
✅ Previous messages persist after refresh  
✅ No duplicate AI chats created  
✅ Messages sorted chronologically  
✅ Real-time updates work via Socket.io  
✅ Token usage tracked  
✅ Error handling works correctly  

---

## Summary

The AI integration is seamlessly woven into the existing chat application architecture. The AI appears as a regular user, uses the same message encryption, and follows the same chat patterns. All changes maintain backward compatibility and don't break existing functionality.

