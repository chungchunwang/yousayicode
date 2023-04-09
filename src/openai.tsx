import { Configuration, OpenAIApi } from "openai";
import * as vscode from 'vscode';

export class getOpenAIAPI{
    static openai: OpenAIApi;
    static get = () => {
        const config = vscode.workspace.getConfiguration('yousayicode');
        const OpenAIKey = config.get<string>("openAIKey");
        const configuration = new Configuration({
            apiKey: OpenAIKey,
        });
        this.openai = new OpenAIApi(configuration);
        return this.openai;
    }
}