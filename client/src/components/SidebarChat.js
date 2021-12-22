import { Avatar } from '@mui/material';
import React from 'react'
import "./SidebarChat.css";

const SidebarChat = () => {
    return (
        <div className='sidebarChat'>
            <Avatar />
            <div className="sidebarChat_info">
                <h2>Room name</h2>
                <p>This is the last message.</p>
            </div>

        </div>
    )
}

export default SidebarChat
