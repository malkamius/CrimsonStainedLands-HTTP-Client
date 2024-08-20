// app.ts

import { WebSocketManager } from './websocket';

const outputDiv = document.getElementById('output') as HTMLDivElement;
const inputField = document.getElementById('input') as HTMLInputElement;

function appendToOutput(message: string): void {
    outputDiv.innerHTML += message.replace(/\n/g, '<br>') + '<br>';
    outputDiv.scrollTop = outputDiv.scrollHeight;
}

const wsManager = new WebSocketManager(
    appendToOutput,
    (message: string) => appendToOutput(`> ${message}`),
    () => appendToOutput('Connected successfully')
);

inputField.addEventListener('keypress', function(e: KeyboardEvent) {
    if (e.key === 'Enter') {
        const command = inputField.value;
        if (command === '/connect') {
            wsManager.connect();
        } else if (wsManager.isConnected()) {
            wsManager.sendMessage(command);
        } else {
            appendToOutput('Not connected. Type /connect to connect to the MUD server.');
        }
        inputField.value = '';
    }
});

appendToOutput('Welcome to the Web MUD Client');
appendToOutput('Type /connect to connect to the MUD server');