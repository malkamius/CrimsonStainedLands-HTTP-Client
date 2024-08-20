// app.ts

// Import necessary classes from other modules
import { WebSocketManager } from './websocket';
import { ANSITextColorizer } from './color';

// Get references to DOM elements
const outputDiv = document.getElementById('output') as HTMLDivElement;
const inputField = document.getElementById('input') as HTMLInputElement;

// Initialize WebSocketManager with appropriate handlers
const wsManager = new WebSocketManager(
    appendToOutput,  // Handler for output messages
    (message: string) => appendToOutput(`> ${message}\n`),  // Handler for input messages (prefixed with ">")
    () => appendToOutput('Connected successfully\n')  // Handler for successful connection
);

// Initialize ANSITextColorizer for processing colored text
const textColorizer = new ANSITextColorizer();

/**
 * Appends a message to the output div, processing it for HTML display
 * @param message The message to append
 */
function appendToOutput(message: string): void {
    // Process the message:
    // 1. Replace newlines with <br> tags
    // 2. Replace spaces with non-breaking spaces
    // 3. Replace tabs with four non-breaking spaces
    const processedMessage = message
        .replace(/\n/g, '<br>')
        .replace(/ /g, '&nbsp;')
        .replace(/\t/g, '&nbsp;&nbsp;&nbsp;&nbsp;');
    
    // Colorize the processed message
    const colorizedMessage = textColorizer.ColorText(processedMessage);

    // Append the colorized message to the output div
    outputDiv.innerHTML += colorizedMessage;
    
    // Scroll to the bottom of the output div
    outputDiv.scrollTop = outputDiv.scrollHeight;
}

// Add event listener for keypress events on the input field
inputField.addEventListener('keypress', function(e: KeyboardEvent) {
    if (e.key === 'Enter') {
        const command = inputField.value;
        
        // Handle different commands
        if (command === '/connect') {
            wsManager.connect();
        } else if (wsManager.isConnected()) {
            wsManager.sendMessage(command);
        } else {
            appendToOutput('Not connected. Type /connect to connect to the MUD server.\n');
        }
        
        // Select all text in the input field
        inputField.select();
        
    }
});

// Display initial messages
appendToOutput('Welcome to the Web MUD Client\n');
appendToOutput('Type /connect to connect to the MUD server\n');