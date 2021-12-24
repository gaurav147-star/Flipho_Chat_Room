import { Avatar } from '@mui/material';
import React from 'react'
import "./SidebarChat.css";
import { Link } from 'react-router-dom'

const SidebarChat = ({ id, roomname }) => {
    return (
        <Link style={{"textDecoration":"none","color":"black"}} to={`/rooms/${id}`}>
            <div className='sidebarChat'>
                <Avatar />
                <div className="sidebarChat_info">
                    <h2>{roomname}</h2>
                </div>

            </div>
        </Link>

    )
}

export default SidebarChat
