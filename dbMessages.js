import mongoose from "mongoose";

const whatsappSchema = mongoose.Schema({
  roomID: String,
  message: String,
  name: String,
  timestamp: String,
  received: Boolean,
  // roomID: String,
  // message: String,
  // name: String,
  // timeStamp: String,
  // received: Boolean
});

//collection
export default mongoose.model("messages", whatsappSchema);