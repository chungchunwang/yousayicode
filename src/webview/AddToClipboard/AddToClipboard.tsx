import React = require("react");
import { BiClipboard } from "react-icons/bi";
import { getVSCodeAPI } from "../vscode";
import classes from './AddToClipboard.modules.css';


    export default function AddToClipboard({text, children}:{text: string, children: JSX.Element}) {
        const vscode = getVSCodeAPI.get();
        const addToClipboard = () => {
            vscode.postMessage({
                command: "VSCCopyToClipboard",
                text: String(text).replace(/\n$/, '')
            });
        }
        return (
        <div className={classes.codeBlock}>
            <div className={classes.codeBlockClipboardButton} onClick={addToClipboard}><BiClipboard /></div>
            {children}
        </div>
    )
}
