import React = require("react");
import { BiBot, BiClipboard } from "react-icons/bi";
import MessageItem from "../MessageItem";
import classes from './ResponseMessageItem.modules.css';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import remarkGfm from 'remark-gfm';
import { getVSCodeAPI } from "../../vscode";

export default function ResponseMessageItem({message}:{message:string}) {
    const vscode = getVSCodeAPI.get();
    return <MessageItem profileIcon={<BiBot />} profileColor="#2a8d5f">
        <ReactMarkdown children={message} remarkPlugins={[remarkGfm]} components={{
            code({ node, inline, className, children, ...props }) {
                const match = /language-(\w+)/.exec(className || '')
                const codeBlock = !inline && match ? (
                    <SyntaxHighlighter
                        {...props}
                        children={String(children).replace(/\n$/, '')}
                        style={vscDarkPlus}
                        language={match[1]}
                        PreTag="span"
                    />
                ) : (
                    <code {...props} className={className}>
                        {children}
                    </code>
                );
                const addToClipboard = () => {
                    vscode.postMessage({
                        command: "VSCCopyToClipboard",
                        text: String(children).replace(/\n$/, '')
                    });
                }
                return <div className={classes.codeBlock}>
                    <div className={classes.codeBlockClipboardButton} onClick={addToClipboard}><BiClipboard /></div>
                    {codeBlock}
                </div>;
            }
        }} />
    </MessageItem>;
}