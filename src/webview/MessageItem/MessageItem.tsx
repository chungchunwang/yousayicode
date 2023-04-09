import React = require("react");
import { BiUserCircle } from "react-icons/bi";
import classes from './MessageItem.modules.css';
export default function MessageItem({profileIcon, profileColor, children}: {profileIcon: JSX.Element, profileColor: string, children: JSX.Element}) {
    return <div className={classes.chatMessage}>
        <div className={classes.chatMessageProfileMargin}>
            <div className={classes.chatMessageProfile} style = {{backgroundColor:profileColor}}>
                {profileIcon}
            </div>
        </div>
        <div className={classes.chatMessageTextContents}>
            {children}
        </div>
    </div>;
}