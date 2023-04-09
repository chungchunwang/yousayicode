import * as vscode from "vscode";
import { MessageList, Status, UserMessage } from '../Message';
import { getUri } from "../utilities/getUri";
import { getNonce } from "../utilities/getNonce";
import { getOpenAIAPI } from "../openai";

export class ChatPanel {
    public static currentPanel: ChatPanel | undefined;
    private readonly _panel: vscode.WebviewPanel;
    private _disposables: vscode.Disposable[] = [];
    private static messageList?: MessageList;

    private constructor(panel: vscode.WebviewPanel, extensionUri: vscode.Uri) {
        this._panel = panel;
        this._panel.onDidDispose(() => this.dispose(), null, this._disposables);
        this._panel.webview.html = this._getWebviewContent(this._panel.webview, extensionUri);
        this._setWebviewMessageListener(this._panel.webview);

    }
    public static setMessageList(messageList: MessageList) {
        this.messageList = messageList;
        this.messageList._messageListUpdateCallback = this.sendMessageList;
    }
    public static sendMessageList() {
        if (ChatPanel.currentPanel && ChatPanel.messageList) {
            const chatViewObject = ChatPanel.messageList.generateChatViewObject();
            ChatPanel.currentPanel._panel.webview.postMessage({ command: 'messageList', payload: chatViewObject });
        }
    }
    // TODO: add to sidebar https://stackoverflow.com/questions/67150547/vs-code-extension-how-to-add-a-webviewpanel-to-the-sidebar
    public static render(extensionUri: vscode.Uri) {
        if (ChatPanel.currentPanel) {
            ChatPanel.currentPanel._panel.reveal(vscode.ViewColumn.One);
        } else {
            const panel = vscode.window.createWebviewPanel("yousayicode-chat", "Chat", vscode.ViewColumn.One, {
                // Enable javascript in the webview
                enableScripts: true,
                // Restrict the webview to only load resources from the `out` directory
                localResourceRoots: [extensionUri]
            });

            ChatPanel.currentPanel = new ChatPanel(panel, extensionUri);
        }
    }
    public dispose() {
        ChatPanel.currentPanel = undefined;

        this._panel.dispose();

        while (this._disposables.length) {
            const disposable = this._disposables.pop();
            if (disposable) {
                disposable.dispose();
            }
        }
    }
    private _setWebviewMessageListener(webview: vscode.Webview) {
        webview.onDidReceiveMessage(
            (message: any) => {
                const command = message.command;
                const text = message.text;

                switch (command) {
                    case "VSCInformationMessage":
                        vscode.window.showInformationMessage(text);
                        return;
                    case "VSCOpenSettings":
                        vscode.commands.executeCommand("workbench.action.openSettings", "yousayicode");
                        return;
                    case "VSCCopyToClipboard":
                        vscode.env.clipboard.writeText(text);
                        vscode.window.showInformationMessage("Copied to clipboard!");
                        return;
                    case "VSCChatSendMessage":
                        if (ChatPanel.messageList) {
                            const m = new UserMessage(text);
                            const msgObj = ChatPanel.messageList.generateOpenAIConversationObject(m);
                            getOpenAIAPI.get().createChatCompletion({
                                model: "gpt-3.5-turbo",
                                messages: msgObj,
                            }).then((response) => {
                                if(!ChatPanel.messageList) return;
                                if (response.data.choices[0].finish_reason != 'stop' || !response.data.choices[0].message) {
                                    m.status = Status.Failed;
                                    vscode.window.showErrorMessage("OpenAI failed to generate a response.");
                                    return;
                                }
                                m.status = Status.Complete;
                                m.response = response.data.choices[0].message?.content;
                                ChatPanel.messageList.addMessage(m);
                            }).catch((error) => {
                                m.status = Status.Failed;
                                vscode.window.showErrorMessage("OpenAI failed to generate a response.");
                            });
                        }
                        return;
                    case "VSCChatGetMessageList":
                        ChatPanel.sendMessageList();
                        return;
                }
            },
            undefined,
            this._disposables
        );
    }
    private _getWebviewContent(webview: vscode.Webview, extensionUri: vscode.Uri) {
        const nonce = getNonce();
        const webviewUri = getUri(webview, extensionUri, ["out", "webview.js"]);
        const styleUri = getUri(webview, extensionUri, ["out", "webview.css"]);
        const codiconsUri = getUri(webview, extensionUri, ["node_modules", '@vscode/codicons', 'dist', 'codicon.css']);
        return /*html*/`
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <meta http-equiv="Content-Security-Policy" content="default-src 'nonce-${nonce}'; script-src 'nonce-${nonce}';">
                <title>Chat!</title>
                <script type="module" nonce="${nonce}" src="${webviewUri}"></script>
                <link rel="stylesheet" nonce="${nonce}" href="${styleUri}">
                <link rel="stylesheet" nonce="${nonce}" href="${codiconsUri}" />
            </head>
            <body id = "react"></body>
            </html>`;
    }
}