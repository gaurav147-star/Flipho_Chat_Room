import axios from "axios";

const instance = axios.create({
  baseURL: "https://flipho-chat-room.herokuapp.com",
});

export default instance;