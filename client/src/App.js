import './App.css';
import Chat from './components/Chat';
import Sidebar from './components/Sidebar';
import React, { useEffect, useState } from "react";
import Pusher from "pusher-js";
import axios from './Axios';

import {
  BrowserRouter as Router, Switch,
  Route
} from 'react-router-dom'
import { useStateValue } from './StateProvider';
import Welcome from './components/Welcome';
import Login from './components/Login';


function App() {

  const [{ user }, dispatch] = useStateValue();
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
    channel.bind('inserted', (newMessage) => {
      setMessages([...messages, newMessage]);
    });
    return () => {
      channel.unbind_all();
      channel.unsubscribe();
    };
    // eslint-disable-next-line
  }, [messages])

  // console.log(messages);

  // console.log(window.innerWidth);

  return (
    <div className="App">
      {!user ? (
        <Login />
      ) : (
        <div className="app_body">

          <Router>
            <Sidebar messages={messages} />
            <Switch>
              <Route path="/rooms/:ROOMID">
                <Chat messages={messages} />
              </Route>
              <Route path="/">
                <Welcome />
              </Route>
            </Switch>
          </Router>
        </div>


      )}
    </div>
  );

}

export default App;
