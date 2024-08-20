// websocket.ts

type MessageHandler = (message: string) => void;
type ConnectionHandler = () => void;

export class WebSocketManager {
    private socket: WebSocket | null = null;
    private outputHandler: MessageHandler;
    private inputHandler: MessageHandler;
    private onConnectHandler: ConnectionHandler;

    constructor(
        outputHandler: MessageHandler,
        inputHandler: MessageHandler,
        onConnectHandler: ConnectionHandler
    ) {
        this.outputHandler = outputHandler;
        this.inputHandler = inputHandler;
        this.onConnectHandler = onConnectHandler;
    }

    connect(): void {
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const host = window.location.host;
        this.socket = new WebSocket(`${protocol}//${host}`);

        this.socket.onopen = (e: Event) => {
            this.outputHandler('Connected to MUD server');
            this.onConnectHandler();
        };

        this.socket.onmessage = (event: MessageEvent) => {
            this.outputHandler(event.data);
        };

        this.socket.onclose = (event: CloseEvent) => {
            if (event.wasClean) {
                this.outputHandler(`Connection closed cleanly, code=${event.code} reason=${event.reason}`);
            } else {
                this.outputHandler('Connection died');
            }
        };

        this.socket.onerror = (error: Event) => {
            this.outputHandler(`Error: ${(error as ErrorEvent).message}`);
        };
    }

    sendMessage(message: string): void {
        if (this.socket && this.socket.readyState === WebSocket.OPEN) {
            this.socket.send(message);
            this.inputHandler(message);
        } else {
            this.outputHandler('Not connected. Type /connect to connect to the MUD server.');
        }
    }

    isConnected(): boolean {
        return this.socket !== null && this.socket.readyState === WebSocket.OPEN;
    }
}