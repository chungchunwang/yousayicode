import React = require("react");
import { BiUserCircle } from "react-icons/bi";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import MessageItem from "../MessageItem";


export default function UserMessageItem({message}:{message:string}) {
  return (
    <MessageItem profileIcon={<BiUserCircle />} profileColor="#cc6511"><ReactMarkdown children={message} remarkPlugins={[remarkGfm]} ></ReactMarkdown></MessageItem>
  )
}
