import { WebviewApi } from "vscode-webview";

export class getVSCodeAPI{
    static vscode?: WebviewApi<unknown> = undefined;
    static get(){
        if(this.vscode === undefined){
            this.vscode = acquireVsCodeApi()
        }
        return this.vscode;
    }
}