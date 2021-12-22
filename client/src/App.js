import './App.css';
import Chat from './components/Chat';
import Sidebar from './components/Sidebar';
import React, { useEffect, useState } from "react";
import Pusher from "pusher-js";
import axios from './components/axios';

function App() {
  const [messages, setMessages] = useState([]);

  useEffect(() => {
    axios.get("/messages/sync").then((response) => {
      setMessages(response.data);
    });
  }, []);

  useEffect(() => {

    const pusher = new Pusher('65a3b0c27b2aca9a9b6e', {
      cluster: 'ap2'
    });

    var channel = pusher.subscribe("messages");
    channel.bind('inserted', function (newMessage) {
      // console.log(JSON.stringify(newMessage));
      // alert(JSON.stringify(newMessage));
      setMessages([...messages, newMessage]);
    });
    return () => {
      channel.unbind_all();
      channel.unsubscribe();
    };
    // eslint-disable-next-line
  }, [messages])

  console.log(messages);
  return (
    <div className="App">
      <div className="app_body">

        <Sidebar />
        <Chat messages={messages} />
      </div>

    </div>
  );
}

export default App;
