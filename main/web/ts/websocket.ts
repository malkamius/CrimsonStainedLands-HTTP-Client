// websocket.ts

/**
 * Type definition for a function that handles messages
 */
type MessageHandler = (message: string) => void;

/**
 * Type definition for a function that handles connection events
 */
type ConnectionHandler = () => void;

/**
 * WebSocketManager class
 * Manages WebSocket connections for a MUD client
 */
export class WebSocketManager {
    // The WebSocket instance
    private socket: WebSocket | null = null;
    
    // Handler for outputting messages (e.g., to the UI)
    private outputHandler: MessageHandler;
    
    // Handler for processing input messages
    private inputHandler: MessageHandler;
    
    // Handler called when a connection is established
    private onConnectHandler: ConnectionHandler;

    /**
     * Constructor for WebSocketManager
     * @param outputHandler Function to handle output messages
     * @param inputHandler Function to handle input messages
     * @param onConnectHandler Function to call when connection is established
     */
    constructor(
        outputHandler: MessageHandler,
        inputHandler: MessageHandler,
        onConnectHandler: ConnectionHandler
    ) {
        this.outputHandler = outputHandler;
        this.inputHandler = inputHandler;
        this.onConnectHandler = onConnectHandler;
    }

    /**
     * Establishes a WebSocket connection to the server
     */
    connect(): void {
        // Determine the appropriate WebSocket protocol based on the current page protocol
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const host = window.location.host;
        
        // Create a new WebSocket connection
        this.socket = new WebSocket(`${protocol}//${host}`);

        // Set up event handlers for the WebSocket

        // Handler for when the connection is opened
        this.socket.onopen = (e: Event) => {
            this.outputHandler('Connected to MUD server');
            this.onConnectHandler();
        };

        // Handler for incoming messages
        this.socket.onmessage = (event: MessageEvent) => {
            this.outputHandler(event.data);
        };

        // Handler for when the connection is closed
        this.socket.onclose = (event: CloseEvent) => {
            if (event.wasClean) {
                this.outputHandler(`Connection closed cleanly, code=${event.code} reason=${event.reason}`);
            } else {
                this.outputHandler('Connection died');
            }
        };

        // Handler for connection errors
        this.socket.onerror = (error: Event) => {
            this.outputHandler(`Error: ${(error as ErrorEvent).message}`);
        };
    }

    /**
     * Sends a message through the WebSocket connection
     * @param message The message to send
     */
    sendMessage(message: string): void {
        if (this.socket && this.socket.readyState === WebSocket.OPEN) {
            // If connected, send the message
            this.socket.send(message);
            this.inputHandler(message);
        } else {
            // If not connected, output an error message
            this.outputHandler('Not connected. Type /connect to connect to the MUD server.');
        }
    }

    /**
     * Checks if the WebSocket connection is currently open
     * @returns true if connected, false otherwise
     */
    isConnected(): boolean {
        return this.socket !== null && this.socket.readyState === WebSocket.OPEN;
    }
}