export interface ChatViewObject{
	type: string; 
	message?: string; 
	prompt?: string; 
	originalCode?: string; 
	modifiedCode?: string; 
	code?: string;
	language?: string;
}
export type MessageListUpdateCallback = (m: MessageList) => void;
export class MessageList {
	private length: number;
	private includeCommandMessages: boolean;
	public messages: Message[];
	public systemMessage?: SystemMessage;
	public _messageListUpdateCallback?: MessageListUpdateCallback;
	constructor(length: number, includeCommandMessages: boolean, config?: string) {
		this.messages = [];
		this.includeCommandMessages = includeCommandMessages;
		this.length = length;
		if (config) {
			this.systemMessage = new SystemMessage(config);
		}
	}
	public addMessage(message: Message) {
		this.messages.push(message);
		if (this._messageListUpdateCallback) this._messageListUpdateCallback(this);
	}
	public getMessage(index: number): Message {
		return this.messages[index];
	}
	public getMessages(): Message[] {
		return this.messages;
	}
	public removeMessage(index: number) {
		this.messages.splice(index, 1);
		if (this._messageListUpdateCallback) this._messageListUpdateCallback(this);
	}
	public removeMessages() {
		this.messages = [];
		if (this._messageListUpdateCallback) this._messageListUpdateCallback(this);
	}
	public generateOpenAIOneShotObject(msg: Message): any {
		let conversation =  [
			{
			"role": msg.getRole(),
			"content": msg.getMessage()
		}];
		if(this.systemMessage)conversation.unshift({"role": "user", "content": this.systemMessage.getMessage()});
		console.log(conversation);
		return conversation;
	}
	public generateOpenAIConversationObject(msg: Message): any {
		let conversation = [];
		for (let i = 0; i < this.messages.length; i++) {
			const message = this.messages[i];
			const role = message.getRole();
			if (!this.includeCommandMessages && role != "user") continue;
			const text = message.getMessage();
			conversation.push({
				"role": role,
				"content": text
			});
			if (message.status == Status.Complete) {
				conversation.push({
					"role": "assistant",
					"content": message.response
				});
			}
			else {
				conversation.push({
					"role": "assistant",
					"content": "Error."
				});
			}
			if(conversation.length > this.length) conversation.shift();
		}
		conversation.push({
			"role": msg.getRole(),
			"content": msg.getMessage()
		});
		if(conversation.length > this.length) conversation.shift();
		if(this.systemMessage) conversation.unshift({"role": "user", "content": this.systemMessage.getMessage()});
		console.log(conversation);
		return conversation;
	}
	public generateChatViewObject():ChatViewObject[]  {
		let conversation:ChatViewObject[] = [];
		for (let i = 0; i < this.messages.length; i++) {
			const message = this.messages[i];
			const role = message.getRole();
			const text = message.getMessage();
			const type = message.getType();
			if (message.status != Status.Complete) continue;
			switch (type) {
				case "user":
					conversation.push({
						"type": type,
						"message": text,
					});
					conversation.push({
						"type": "response",
						"message": message.response
					});
					break;
				case "modification":
					conversation.push({
						"type": type,
						"prompt": (message as ModificationMessage).prompt,
						"originalCode": (message as ModificationMessage).code,
						"modifiedCode": (message as ModificationMessage).response,
						"language": (message as ModificationMessage).language
					});
					break;
				case "generation":
					conversation.push({
						"type": type,
						"prompt": (message as GenerationMessage).prompt,
						"code": (message as GenerationMessage).response,
						"language": (message as ModificationMessage).language
					});
					break;
			}
		}
		return conversation;
	}
	public setFinalMessageStatus(status: Status) {
		this.messages[this.messages.length - 1].status = status;
	}
}
export abstract class Message {
	public abstract response: string;
	public abstract status: Status;
	public abstract getType(): string;
	public abstract getMessage(): string;
	public abstract getResponse(): string;
	public abstract getRole(): string;
}
export class UserMessage extends Message {
	public status: Status;
	public message: string;
	public response: string;
	constructor(message: string) {
		super();
		this.message = message;
		this.response = "";
		this.status = Status.Processing;
	}
	public getMessage(): string {
		return this.message;
	}
	public getRole(): string {
		return "user";
	}
	public getResponse(): string {
		return this.response;
	}
	public getType(): string {
		return "user";
	}
}
export class SystemMessage extends Message {
	public status: Status;
	public message: string;
	public response: string;
	constructor(message: string) {
		super();
		this.message = message;
		this.response = "";
		this.status = Status.System;
	}
	public getMessage(): string {
		return this.message;
	}
	public getRole(): string {
		return "user"; //Apparently this gives better results
	}
	public getResponse(): string {
		return this.response;
	}
	public getType(): string {
		return "system";
	}
}
export class ModificationMessage extends Message {
	public response: string;
	public status: Status;
	public prompt: string;
	public language: string;
	public code: string;
	constructor(message: string, language: string, code: string) {
		super();
		this.prompt = message;
		this.language = language;
		this.code = code;
		this.response = "";
		this.status = Status.Processing;
	}
	generateModificationText = (language: string, prompt: string, code: string) => {
		return `
		!|modification|!
		${language}
		${prompt}
		${code}
		`;
	}
	public getMessage(): string {
		return this.generateModificationText(this.language, this.prompt, this.code);
	}
	public getRole(): string {
		return "user";
	}
	public getResponse(): string {
		return this.response;
	}
	public getType(): string {
		return "modification";
	}
}
export class GenerationMessage extends Message {
	public response: string;
	public status: Status;
	public prompt: string;
	public language: string;
	constructor(message: string, language: string) {
		super();
		this.prompt = message;
		this.language = language;
		this.response = "";
		this.status = Status.Processing;
	}
	generateModificationText = (language: string, prompt: string) => {
		return `
		!|generation|!
		${language}
		${prompt}
		`;
	}
	public getMessage(): string {
		return this.generateModificationText(this.language, this.prompt);
	}
	public getRole(): string {
		return "user";
	}
	public getResponse(): string {
		return this.response;
	}
	public getType(): string {
		return "generation";
	}
}
export enum Status {
	Complete,
	Processing,
	Failed,
	System
}