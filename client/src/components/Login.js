import React from 'react'
import { Button } from "@material-ui/core"
import { auth, provider } from "../Firebase"

import "./Login.css"
import { useStateValue } from '../StateProvider'
import { actionTypes } from '../Reducer'

const Login = () => {

    const [{}, dispatch] = useStateValue();

    const signIn = () => {
        auth.signInWithPopup(provider)
            .then(res => {
                dispatch({
                    type: actionTypes.SET_USER,
                    user: res.user,
                })
            })
            .catch((error) => {
                alert(error.message);
            })
    }

    return (
        <div className="login">
            <div className="login-container">
                <img src="https://cdn.discordapp.com/attachments/901765071796072559/923494184227340288/unnamed.png"
                    alt="" />
                <div className="login-text">
                    Sign in to Flipho_Chat_Room
                </div>
                <Button onClick={signIn}>
                    Sign in with Google
                </Button>
            </div>
        </div>
    )
}

export default Login
