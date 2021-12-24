import { Avatar, IconButton } from '@mui/material'
import MoreVertIcon from '@mui/icons-material/MoreVert';
import SearchOutlinedIcon from '@mui/icons-material/SearchOutlined';
import AttachFileIcon from '@mui/icons-material/AttachFile';
import InsertEmoticonIcon from '@mui/icons-material/InsertEmoticon';
import MicIcon from '@mui/icons-material/Mic';
import React, { useState, useEffect } from 'react'
import "./Chat.css"
// import SelectInput from '@mui/material/Select/SelectInput';
import axios from "../Axios";
import { useStateValue } from '../StateProvider'
import { useParams } from 'react-router-dom'

const Chat = ({ messages }) => {

    const [input, setInput] = useState("");
    const { ROOMID } = useParams();
    const [roomname, setRoomname] = useState("");
    const [{ user }, dispatch] = useStateValue();


    useEffect(() => {
        axios.get(`/rooms/${ROOMID}`)
            .then(res => {
                setRoomname(res.data);
            })

    }, [ROOMID])

    const sendMessage = async (e) => {
        e.preventDefault();
        if (input) {
            await axios.post("/messages/new", {
                roomID: ROOMID,
                message: input,
                name: user.displayName,
                timestamp: `${new Date().getHours()}:${new Date().getMinutes()}`,
                received: false
            });
        }

        setInput("");
    };

    return (
        <div className='chat'>
            <div className="chat_header">
                <Avatar />
                <div className="chat_headerInfo">
                    <h3>{roomname.roomname}</h3>
                    <p>{new Date().toString()}</p>
                </div>
                <div className="chat_headerRight">

                    <IconButton>
                        < SearchOutlinedIcon />
                    </IconButton>
                    <IconButton>
                        < AttachFileIcon />
                    </IconButton>
                    <IconButton>
                        <MoreVertIcon />
                    </IconButton>
                </div>
            </div>
            <div className="chat_body">
                {messages.map((message) => {
                    return (
                        <div>
                            {(message.roomID === ROOMID) ? (
                                <p className={`chat_message ${message.name === user.displayName && "chat_reciever"}`}>
                                    <span className="chat_name">{message.name}</span>
                                    {message.message}
                                    <span className="chat_timestamp">{message.timestamp}</span>
                                </p>
                            ) : <h1></h1>}
                        </div>
                    );
                })}
            </div>

            <div className="chat_footer">
                <InsertEmoticonIcon />
                <form action="">
                    <input value={input}
                        onChange={(e) => {
                            setInput(e.target.value);
                        }} placeholder='Type a message' type="text" />
                    <button onClick={sendMessage} type='submit'>Send a message</button>
                </form>
                <MicIcon />
            </div>
        </div>
    )
}

export default Chat
