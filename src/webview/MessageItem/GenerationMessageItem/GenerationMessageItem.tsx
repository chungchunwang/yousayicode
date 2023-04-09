import { BiPencil } from "react-icons/bi";
import { VSCodePanels, VSCodePanelTab, VSCodePanelView } from "@vscode/webview-ui-toolkit/react";
import React = require("react");
import MessageItem from "../MessageItem";
import classes from './GenerationMessageItem.modules.css';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import AddToClipboard from "../../AddToClipboard/AddToClipboard";


export default function GenerationMessageItem({ prompt, generatedCode, language }: { prompt: string, generatedCode: string, language: string }) {
    generatedCode = String(generatedCode).replace(/\n$/, '');
    return (
        <MessageItem profileIcon={<BiPencil />} profileColor="#5f1f85">
            <div>
                <div className={classes.chatMessageTypeTitle}>Generation:</div>
                <VSCodePanels>
                    <VSCodePanelTab id="tab-1">PROMPT</VSCodePanelTab>
                    <VSCodePanelTab id="tab-2">GENERATED</VSCodePanelTab>
                    <VSCodePanelView id="view-1">{prompt}</VSCodePanelView>
                    <VSCodePanelView id="view-2">
                        <AddToClipboard text={generatedCode}>
                        <SyntaxHighlighter
                                children={String(generatedCode)}
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
