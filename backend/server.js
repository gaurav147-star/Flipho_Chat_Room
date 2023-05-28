const express = require("express");
const dotenv = require("dotenv");
dotenv.config();
const chats = require("./data/data");
const app = express();

const PORT = process.env.PORT || 5000;
app.get("/", (req, res) => {
  res.send("API is running");
});

app.get(
  "/api/chats",
  (req, res) => {
    // This is the route for getting all chats from the databas
    res.send(chats);
  } // This is the response
);

app.get("/api/chats/:id", (req, res) => {
  const singleChats = chats.find((c) => c._id === req.params.id);
  res.json(singleChats);
});
app.listen(PORT, console.log(`Server started on PORT ${PORT}`));
