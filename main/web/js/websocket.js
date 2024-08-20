// websocket.ts
export class WebSocketManager {
    constructor(outputHandler, inputHandler, onConnectHandler) {
        this.socket = null;
        this.outputHandler = outputHandler;
        this.inputHandler = inputHandler;
        this.onConnectHandler = onConnectHandler;
    }
    connect() {
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const host = window.location.host;
        this.socket = new WebSocket(`${protocol}//${host}`);
        this.socket.onopen = (e) => {
            this.outputHandler('Connected to MUD server');
            this.onConnectHandler();
        };
        this.socket.onmessage = (event) => {
            this.outputHandler(event.data);
        };
        this.socket.onclose = (event) => {
            if (event.wasClean) {
                this.outputHandler(`Connection closed cleanly, code=${event.code} reason=${event.reason}`);
            }
            else {
                this.outputHandler('Connection died');
            }
        };
        this.socket.onerror = (error) => {
            this.outputHandler(`Error: ${error.message}`);
        };
    }
    sendMessage(message) {
        if (this.socket && this.socket.readyState === WebSocket.OPEN) {
            this.socket.send(message);
            this.inputHandler(message);
        }
        else {
            this.outputHandler('Not connected. Type /connect to connect to the MUD server.');
        }
    }
    isConnected() {
        return this.socket !== null && this.socket.readyState === WebSocket.OPEN;
    }
}
