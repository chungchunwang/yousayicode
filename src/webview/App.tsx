import React = require("react");
import { VSCodeButton,VSCodeDivider, VSCodeTextField } from '@vscode/webview-ui-toolkit/react';
import { VscSettingsGear } from 'react-icons/vsc';
import classes from './app.modules.css';
import { getVSCodeAPI } from "./vscode";
import ResponseMessageItem from "./MessageItem/ResponseMessageItem/ResponseMessageItem";
import UserMessageItem from "./MessageItem/UserMessageItem/UserMessageItem";
import ModificationMessageItem from "./MessageItem/ModificationMessageItem/ModificationMessageItem";
import GenerationMessageItem from "./MessageItem/GenerationMessageItem/GenerationMessageItem";
import { useEffect, useState } from "react";
import { ChatViewObject, MessageList } from "../Message";
export default function App() {
  const [messageList, setMessageList] = useState<ChatViewObject[]>([]);
  const [chatFieldText, setChatFieldText] = useState<string>("");

  useEffect(() => {
    const onMessage = (event:any) => {
      const message = event.data;
      switch (message.command) {
          case 'messageList':
              setMessageList(message.payload as ChatViewObject[]);
              break;
      }
    };
    vscode.postMessage({
      command: "VSCChatGetMessageList"
    });
    window.addEventListener('message', onMessage);
    return () => {
      window.removeEventListener('message', onMessage);
    }
  }, []);
  const vscode = getVSCodeAPI.get();
  const onSettingsClick = () => {
    vscode.postMessage({
      command: "VSCOpenSettings"
    });
  }
  const onSend = () =>{
    setChatFieldText("");
    vscode.postMessage({
      command: "VSCChatSendMessage",
      text: chatFieldText
    });
  } 
  return (
    <div>
      <div className={classes.menuBar}>
        <div className={classes.menuTitle}>Chat</div>
        <div className={classes.settingsButton} onClick={onSettingsClick}><VscSettingsGear /></div>
      </div>
      <div className={classes.chatMessages}>
        {
          messageList.map((item)=>{
            switch(item.type){
              case "user":
                if(!item.message) return;
                return <div><UserMessageItem message={item.message} /><VSCodeDivider className={classes.divider}></VSCodeDivider> </div>;
              case "response":
                if(!item.message) return;
                return <div><ResponseMessageItem message={item.message} /><VSCodeDivider className={classes.divider}></VSCodeDivider> </div>;
              case "modification":
                if(!item.prompt ||!item.originalCode || !item.modifiedCode|| !item.language) return;
                return <div><ModificationMessageItem language = {item.language} prompt={item.prompt} originalCode ={item.originalCode} modifiedCode = {item.modifiedCode} /><VSCodeDivider className={classes.divider}></VSCodeDivider> </div>;
              case "generation":
                if(!item.prompt ||!item.code|| !item.language) return;
                return <div><GenerationMessageItem language = {item.language} prompt={item.prompt} generatedCode = {item.code} /><VSCodeDivider className={classes.divider}></VSCodeDivider> </div>;
            }
          })
        }
      </div>
      <div className={classes.chatBox}>
        <VSCodeTextField autoFocus className={classes.textArea} value = {chatFieldText} onInput = {(e:any)=>setChatFieldText(e.target.value)}></VSCodeTextField>
        <VSCodeButton className={classes.sendButton} onClick = {onSend}>
          Send
        </VSCodeButton>
      </div>
    </div>
  )
}
