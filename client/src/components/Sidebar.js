import React, { useState, useEffect } from 'react'
import "./Sidebar.css"
import DonutLargeIcon from '@mui/icons-material/DonutLarge';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import ChatIcon from '@mui/icons-material/Chat';
import { Avatar, IconButton } from '@mui/material';
import SearchOutlinedIcon from '@mui/icons-material/SearchOutlined';
import SidebarChat from './SidebarChat';

import Pusher from 'pusher-js';
import axios from '../Axios';
import { useStateValue } from '../StateProvider';

const Sidebar = (messages) => {

    const [rooms, setRooms] = useState([]);
    const [{ user }, dispatch] = useStateValue();
    const [search, setSearch] = React.useState("");

    const filterRooms = rooms.filter((room) => {
        return room.roomname.toLowerCase().includes(search.toLowerCase());
    });


    useEffect(() => {
        axios.get('/rooms/sync')
            .then(res => {
                setRooms(res.data);
            })
    }, [])

    useEffect(() => {

        const pusher2 = new Pusher('65a3b0c27b2aca9a9b6e', {
            cluster: 'ap2'
        });

        const channel2 = pusher2.subscribe('rooms');

        channel2.bind('inserted', (newRoom) => {
            setRooms([...rooms, newRoom])
        });

        return () => {
            channel2.unbind_all();
            channel2.unsubscribe();
        };
    }, [rooms]);
    // console.log(rooms);


    const createRoom = async (e) => {
        e.preventDefault();

        const roomName = prompt("Please enter room name : ");


        if (roomName) {
            await axios.post("/rooms/new", {
                roomname: roomName,
            });
        }
        // e.preventDefault();
        window.location.reload(true);
    }

    return (
        <div className='sidebar'>
            <div className="sidebar_header">
                <Avatar src={user?.photoURL} className="profilepic" />
                <div className="sidebar_headerRight">
                    <IconButton>
                        <DonutLargeIcon />
                    </IconButton>
                    <IconButton onClick={createRoom}>
                        <ChatIcon />
                    </IconButton>
                    <IconButton>
                        <MoreVertIcon />
                    </IconButton>
                </div>

            </div>
            <div className="sidebar_search">
                <div className="sidebar_searchContainer">
                    < SearchOutlinedIcon />
                    <input type="text" placeholder='Search or start new chat' onChange={e => setSearch(e.target.value)} />
                </div>
            </div>
            <div className="sidebar_chats">
                {filterRooms.map((room) => {
                    return <SidebarChat key={room._id} roomname={room.roomname} id={room._id} allMessages={messages} />
                })}
            </div>
        </div>
    )
}

export default Sidebar
