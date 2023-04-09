import { VSCodePanels, VSCodePanelTab, VSCodePanelView } from "@vscode/webview-ui-toolkit/react";
import React = require("react");
import { BiWrench } from "react-icons/bi";
import SyntaxHighlighter from "react-syntax-highlighter";
import { vscDarkPlus } from "react-syntax-highlighter/dist/esm/styles/prism";
import AddToClipboard from "../../AddToClipboard/AddToClipboard";
import MessageItem from "../MessageItem";
import classes from './ModificationMessageItem.modules.css';


export default function ModificationMessageItem({prompt, originalCode, modifiedCode, language}:{prompt: string, originalCode:string, modifiedCode:string, language: string}) {
    originalCode = String(originalCode).replace(/\n$/, '');
    modifiedCode = String(modifiedCode).replace(/\n$/, '');
    return (
        <MessageItem profileIcon={<BiWrench />} profileColor="#2a608d">
            <div>
                <div className={classes.chatMessageTypeTitle}>Modification:</div>
                <VSCodePanels>
                    <VSCodePanelTab id="tab-1">PROMPT</VSCodePanelTab>
                    <VSCodePanelTab id="tab-2">ORIGINAL</VSCodePanelTab>
                    <VSCodePanelTab id="tab-3">MODIFIED</VSCodePanelTab>
                    <VSCodePanelView id="view-1">{prompt}</VSCodePanelView>
                    <VSCodePanelView id="view-2">
                    <AddToClipboard text={originalCode}>
                        <SyntaxHighlighter
                                children={String(originalCode)}
                                style={vscDarkPlus}
                                language={language} //TODO: might not corrolate with vscode names
                                PreTag="div"
                            />
                        </AddToClipboard>
                        </VSCodePanelView>
                    <VSCodePanelView id="view-3">
                    <AddToClipboard text={modifiedCode}>
                        <SyntaxHighlighter
                                children={String(modifiedCode)}
                                style={vscDarkPlus}
                                language={language} //TODO: might not corrolate with vscode names
                                PreTag="div"
                            />
                        </AddToClipboard>
                        </VSCodePanelView>
                </VSCodePanels>
            </div>
        </MessageItem>
    )
}
