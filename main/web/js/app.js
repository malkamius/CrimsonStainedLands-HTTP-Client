// app.ts
import { WebSocketManager } from './websocket';
const outputDiv = document.getElementById('output');
const inputField = document.getElementById('input');
function appendToOutput(message) {
    outputDiv.innerHTML += message.replace(/\n/g, '<br>') + '<br>';
    outputDiv.scrollTop = outputDiv.scrollHeight;
}
const wsManager = new WebSocketManager(appendToOutput, (message) => appendToOutput(`> ${message}`), () => appendToOutput('Connected successfully'));
inputField.addEventListener('keypress', function (e) {
    if (e.key === 'Enter') {
        const command = inputField.value;
        if (command === '/connect') {
            wsManager.connect();
        }
        else if (wsManager.isConnected()) {
            wsManager.sendMessage(command);
        }
        else {
            appendToOutput('Not connected. Type /connect to connect to the MUD server.');
        }
        inputField.value = '';
    }
});
appendToOutput('Welcome to the Web MUD Client');
appendToOutput('Type /connect to connect to the MUD server');
