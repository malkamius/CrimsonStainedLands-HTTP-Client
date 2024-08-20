// websocket.ts
/**
 * WebSocketManager class
 * Manages WebSocket connections for a MUD client
 */
export class WebSocketManager {
    /**
     * Constructor for WebSocketManager
     * @param outputHandler Function to handle output messages
     * @param inputHandler Function to handle input messages
     * @param onConnectHandler Function to call when connection is established
     */
    constructor(outputHandler, inputHandler, onConnectHandler) {
        // The WebSocket instance
        this.socket = null;
        this.outputHandler = outputHandler;
        this.inputHandler = inputHandler;
        this.onConnectHandler = onConnectHandler;
    }
    /**
     * Establishes a WebSocket connection to the server
     */
    connect() {
        // Determine the appropriate WebSocket protocol based on the current page protocol
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const host = window.location.host;
        // Create a new WebSocket connection
        this.socket = new WebSocket(`${protocol}//${host}`);
        // Set up event handlers for the WebSocket
        // Handler for when the connection is opened
        this.socket.onopen = (e) => {
            this.outputHandler('Connected to MUD server');
            this.onConnectHandler();
        };
        // Handler for incoming messages
        this.socket.onmessage = (event) => {
            this.outputHandler(event.data);
        };
        // Handler for when the connection is closed
        this.socket.onclose = (event) => {
            if (event.wasClean) {
                this.outputHandler(`Connection closed cleanly, code=${event.code} reason=${event.reason}`);
            }
            else {
                this.outputHandler('Connection died');
            }
        };
        // Handler for connection errors
        this.socket.onerror = (error) => {
            this.outputHandler(`Error: ${error.message}`);
        };
    }
    /**
     * Sends a message through the WebSocket connection
     * @param message The message to send
     */
    sendMessage(message) {
        if (this.socket && this.socket.readyState === WebSocket.OPEN) {
            // If connected, send the message
            this.socket.send(message);
            this.inputHandler(message);
        }
        else {
            // If not connected, output an error message
            this.outputHandler('Not connected. Type /connect to connect to the MUD server.');
        }
    }
    /**
     * Checks if the WebSocket connection is currently open
     * @returns true if connected, false otherwise
     */
    isConnected() {
        return this.socket !== null && this.socket.readyState === WebSocket.OPEN;
    }
}
