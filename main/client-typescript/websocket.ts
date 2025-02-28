// websocket.ts

import { TelnetNegotiator, NegotiateResponse } from './telnet_negotiation';

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
    private negotiator: TelnetNegotiator = new TelnetNegotiator();

    // The WebSocket instance
    private socket: WebSocket | null = null;
    
    // Handler for outputting messages (e.g., to the UI)
    private outputHandler: MessageHandler;
    
    // Handler for processing input messages
    private inputHandler: MessageHandler;
    
    // Handler called when a connection is established
    private onConnectHandler: ConnectionHandler;

    public port: number;
    /**
     * Constructor for WebSocketManager
     * @param outputHandler Function to handle output messages
     * @param inputHandler Function to handle input messages
     * @param onConnectHandler Function to call when connection is established
     */
    constructor(
        outputHandler: MessageHandler,
        inputHandler: MessageHandler,
        onConnectHandler: ConnectionHandler,
        port: number
    ) {
        this.outputHandler = outputHandler;
        this.inputHandler = inputHandler;
        this.onConnectHandler = onConnectHandler;
        this.port = port;
    }

    private handleMessage(event: MessageEvent) {
        if (event.data instanceof ArrayBuffer) {
            // Handle binary data
            const uint8Array = new Uint8Array(event.data);
            //console.log("Received binary data:", uint8Array);
            
            // Process the binary data
            this.processBinaryData(uint8Array);
        } else if (typeof event.data === "string") {
            // Handle text data
            //console.log("Received text data:", event.data);
            this.processTextData(event.data);
        } else {
            console.warn("Received unknown data type:", typeof event.data);
        }
    }

    private processBinaryData(data: Uint8Array) {
        if (this.negotiator.IsNegotiationRequired(data)) {
            const response: NegotiateResponse = this.negotiator.Negotiate(data);
            if (response.Response.length > 0) {
                this.sendResponse(response.Response);
            }
            if (response.NewInput.length > 0) {
                this.outputHandler(new TextDecoder().decode(response.NewInput));
            }
        } else {
            this.outputHandler(new TextDecoder().decode(data));
        }
    }

    private processTextData(data: string) {
        this.outputHandler(data);
    }

    private sendResponse(response: Uint8Array) {
        if (this.socket && this.socket.readyState === WebSocket.OPEN) {
            this.socket.send(response);
        }
    }

    disconnect(): void {
        if(this.socket != null) {
            this.socket.close();
            this.socket = null;
        }
    }
    /**
     * Establishes a WebSocket connection to the server
     */
    connect(): void {
        this.disconnect();
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const host = window.location.hostname;
        const port = this.port;

        this.socket = new WebSocket(`${protocol}//${host}:${port}`);

        this.socket.binaryType = "arraybuffer";
        this.socket.onmessage = this.handleMessage.bind(this);

        this.socket.onopen = (e: Event) => {
            this.outputHandler('Connected to MUD server\n');
            this.onConnectHandler();
        };

        this.socket.onclose = (event: CloseEvent) => {
            const message = event.wasClean
                ? `Connection closed cleanly, code=${event.code} reason=${event.reason}\n`
                : '\nConnection died\n';
            this.outputHandler(message);
        };

        this.socket.onerror = (error: Event) => {
            this.outputHandler(`\nError: ${(error as ErrorEvent).message}\n`);
        };
    }

    /**
     * Sends a message through the WebSocket connection
     * @param message The message to send as a string
     */
    sendMessage(message: string): void {
        if (this.socket && this.socket.readyState === WebSocket.OPEN) {
            // Only append a newline if the message doesn't already end with one
            const messageToSend = message.endsWith('\n') ? message : message + '\n';
            const uint8Array = new TextEncoder().encode(messageToSend);
            this.socket.send(uint8Array);
            this.inputHandler(message);
        } else {
            this.outputHandler('Not connected. Type /connect to connect to the MUD server.\n');
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