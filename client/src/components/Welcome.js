// import { Button } from '@material-ui/core'
import React from 'react'
import "./Welcome.css"

const Welcome = () => {
    return (
        <div className="welcome">
            <div className="wc-container">
                <img src=""
                alt=""/>
                <h2>Welcome to Flipho_Chat_Room</h2>
                <p>Created with MERN Stack</p>
                <p> By Gaurav Gupta</p>
                <ul>
                    <li>Google Sign-in</li>
                    <li>Create room</li>
                    <li>Search rooms</li>
                    <li>Chat with people</li>
                </ul>

            </div>
        </div>
    )
}

export default Welcome
