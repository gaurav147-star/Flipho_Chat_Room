const mongoose = require('mongoose');

const whatsappSchema = mongoose.Schema({
  roomID: String,
  message: String,
  name: String,
  timestamp: String,
  received: Boolean,

});

//collection
module.exports = mongoose.model("messages", whatsappSchema);