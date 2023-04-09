// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import { Configuration, OpenAIApi } from 'openai';
import { ChatPanel } from './panels/Chat';
import { GenerationMessage, MessageList, ModificationMessage, Status } from './Message';
import { getOpenAIAPI } from './openai';

let configText = `
Some of the following messages sent by the user will be preceded a line with text of the format "!|type goes here|!". This is to indicate that these messages are of a particular format, and require you to respond in a specific way. There are many different formats, and the text inbetween the pipes indicates what type of format the message is in. The following are the different types of messages:
!|modification|! - This message is a request to modify a piece of code. The first line of the message include the language the code is written in. The second line of the message includes a prompt describing how the code should be changed. From the third line onwards, the message includes the code that should be modified. Your response should be the modified code, with no extraneous text before or after it. The code you write is important and may have a large impact on the user's code, so make sure it is valid and compiles. If you do not understand the prompt, or are unsure about what to do, leave the code intact.
!|generation|! - This message is a request to generate a piece of code. The first line of the message include the language the code is written in. The second line of the message includes a prompt describing what the code should do. Your response should be the generated code, with no extraneous text before or after it. The code you write is important and may have a large impact on the user's code, so make sure it is valid and compiles. If you do not understand the prompt, or are unsure about what to do, respond with nothing.
!|goto|! - This message is a request for the location of a specific line of code. The first line of the message includes the language the code is written in. The second line of the message includes a prompt describing the piece of code to look for. Your response should be the line number of the code, with no extraneous text before or after it. If there are multiple lines to the piece of code being described, return the location of the first line. If there are multiple different sections of code that are relevant to the prompt, choose the best one. If you do not understand the prompt, or are unsure about what to do, respond with nothing.

These messages are to indicate to you how to respond. You are not to use these messages of the format !|type goes here|!. You must respond to these messages in the given format. Do not write any extraneous text. If you are not allowed to fulfill a request, do not write any text to explain it. Do not write markdown formatting or any extraneous characters that would cause the text your return to not compile or run. TO REPEAT, DO NOT WRITE ANY EXTRANEOUS TEXT OTHER THAN CODE, INCLUDING FORMATTING SUCH AS MARKDOWN. DO NOT ADD TICKS AS TO INDICATE MARKDOWN CODE. Your response will be directly imported into an editor so any text other than the expected response will generate an error. THE CODE YOU GENERATE IS HIGHLY IMPORTANT, SO MAKE SURE TO OBEY THESE INSTRUCTIONS.
For example, if you receive the following message:
!|modification|!
python
Modify the code below to print "Hello World!".
print("sagasdgd!")

Your response should be:
print("Hello World!")

If you receive the following message:
!|generation|!
python
A function that takes in a number and returns the number squared.
Your response should be:
def square(x):
	return x*x

If a message is not written in the format described above, respond to it normally.
`;
let messageList: MessageList;

const getSelectedCode= () => {
	const editor = vscode.window.activeTextEditor;
	if (editor) {
		const selection = editor.selection;
		if (!selection.isEmpty) {
			return editor.document.getText(selection);
		}
	}
	return undefined;
}

const replaceSelectedCode = (newCode: string) => {
	const editor = vscode.window.activeTextEditor;
	if (editor) {
		editor.edit(builder => {
			builder.replace(editor.selection, newCode);
		});
	}
}

const insertCodeAtCursor = (newCode: string) => {
	const editor = vscode.window.activeTextEditor;
	if (editor) {
		const selection = editor.selection;
    	const position = selection.isEmpty ? selection.start : selection.active;
		editor.edit(builder => {
			builder.insert(position, newCode);
		});
	}
}

const checkForActiveEditor = () => {
	const editor = vscode.window.activeTextEditor;
	return editor != undefined;
}

const getLanguage = () => {
	const editor = vscode.window.activeTextEditor;
	if (editor) {
		const language = editor.document.languageId;
		return language;
	}
	return undefined;
}


export function activate(context: vscode.ExtensionContext) {
	//get settings
	const config = vscode.workspace.getConfiguration('yousayicode');
	const chatMemory = config.get<number>("chatMemory");
	const includeCommandMessagesInChat = config.get<boolean>("includeCommandMessagesInChat");
	if(chatMemory == undefined || includeCommandMessagesInChat == undefined) {
		console.log(chatMemory);
		console.log(includeCommandMessagesInChat);
		vscode.window.showErrorMessage("YouSayICode settings are not configured correctly. Please check your settings.");
		return;
	}
	messageList = new MessageList(chatMemory, includeCommandMessagesInChat, configText);
	let modifyCMD = vscode.commands.registerCommand('yousayicode.modify', async function () {
		let code = getSelectedCode();
		if (!code) {
			vscode.window.showErrorMessage("There is no code selected.");
			return;
		}
		let language = getLanguage();
		if(!language) {
			vscode.window.showErrorMessage("There is no detectable file language.");
			return;
		}
		let prompt = await vscode.window.showInputBox({
			prompt: 'What would you like to change?',
			placeHolder: 'Eg. Use .... here instead of ....'
		});
		if(!prompt){
			vscode.window.showErrorMessage("There is no prompt.");
			return;
		}
		const m = new ModificationMessage(prompt, language, code);
		let msgObj = messageList.generateOpenAIOneShotObject(m);
		getOpenAIAPI.get().createChatCompletion({
			model: "gpt-3.5-turbo",
			messages: msgObj,
		}).then((response) => {
			if(response.data.choices[0].finish_reason != 'stop' || !response.data.choices[0].message) {
				m.status = Status.Failed;
				vscode.window.showErrorMessage("OpenAI failed to generate a response.");
				return;
			}
			m.status = Status.Complete;
			m.response = response.data.choices[0].message?.content;
			messageList.addMessage(m);
			replaceSelectedCode(response.data.choices[0].message?.content);
		}).catch((error) => {
			m.status = Status.Failed;
			vscode.window.showErrorMessage("OpenAI failed to generate a response.");
		});
	});
	let generateCMD = vscode.commands.registerCommand('yousayicode.generate', async function () {
		if (!checkForActiveEditor()) {
			vscode.window.showErrorMessage("There is no active editor.");
			return;
		}
		let language = getLanguage();
		if(!language) {
			vscode.window.showErrorMessage("There is no detectable file language.");
			return;
		}
		let prompt = await vscode.window.showInputBox({
			prompt: 'What would you like to add?',
			placeHolder: 'Eg. Create a function that ...'
		});
		if(!prompt){
			vscode.window.showErrorMessage("There is no prompt.");
			return;
		}
		const m = new GenerationMessage(prompt, language);
		let msgObj = messageList.generateOpenAIOneShotObject(m);
		getOpenAIAPI.get().createChatCompletion({
			model: "gpt-3.5-turbo",
			messages: msgObj,
		}).then((response) => {
			if(response.data.choices[0].finish_reason != 'stop' || !response.data.choices[0].message) {
				m.status = Status.Failed;
				vscode.window.showErrorMessage("OpenAI failed to generate a response.");
				return;
			}
			m.status = Status.Complete;
			m.response = response.data.choices[0].message?.content;
			messageList.addMessage(m);
			replaceSelectedCode(response.data.choices[0].message?.content);
		}).catch((error) => {
			m.status = Status.Failed;
			vscode.window.showErrorMessage("OpenAI failed to generate a response.");
		});
	});
	let chatViewCMD = vscode.commands.registerCommand('yousayicode.openChatView', () => {
		ChatPanel.setMessageList(messageList);
		ChatPanel.render(context.extensionUri);
	  });
	context.subscriptions.push(modifyCMD, generateCMD, chatViewCMD);
}

// This method is called when your extension is deactivated
export function deactivate() { }


