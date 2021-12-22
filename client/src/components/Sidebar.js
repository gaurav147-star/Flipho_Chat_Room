import React from 'react'
import "./Sidebar.css"
import DonutLargeIcon from '@mui/icons-material/DonutLarge';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import ChatIcon from '@mui/icons-material/Chat';
import { Avatar, IconButton } from '@mui/material';
import SearchOutlinedIcon from '@mui/icons-material/SearchOutlined';
import SidebarChat from './SidebarChat';
const Sidebar = () => {
    return (
        <div className='sidebar'>
            <div className="sidebar_header">
                <Avatar src='https://devdiscourse.blob.core.windows.net/devnews/08_04_2020_02_13_14_1320198.jpg' />
                <div className="sidebar_headerRight">
                    <IconButton>
                        <DonutLargeIcon />
                    </IconButton>
                    <IconButton>
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
                    <input type="text" placeholder='Search or start new chat' />
                </div>
            </div>
            <div className="sidebar_chats">
                <SidebarChat />
            </div>
        </div>
    )
}

export default Sidebar
