// app.ts

import { WebSocketManager } from './websocket';
import { Terminal } from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';

export class App {
    private terminal: Terminal;
    private fitAddon: FitAddon;
    private terminalElement: HTMLElement | null;
    private inputField: HTMLInputElement;
    private wsManager: WebSocketManager;
    private commandHistory: string[] = [];
    private currentHistoryIndex: number = -1;
    private readonly maxHistoryLength: number = 20;

    // Keymap for directional commands
    private readonly keyMap: { [key: string]: string } = {
        'Numpad8': 'north',
        'Numpad6': 'east',
        'Numpad2': 'south',
        'Numpad4': 'west',
        'Numpad9': 'up',
        'Numpad3': 'down',
        'Numpad5': 'look',
        'Escape': '/selectinput'
    };

    constructor() {
        this.terminalElement = document.getElementById('terminal');
        this.inputField = document.getElementById('input') as HTMLInputElement;

        if (!this.terminalElement) {
            throw new Error('Terminal element not found');
        }
        if (!this.inputField) {
            throw new Error('Input field element not found');
        }
        this.terminal = new Terminal({
            convertEol: true
        });

        this.fitAddon = new FitAddon();
        this.terminal.loadAddon(this.fitAddon);
        this.terminal.open(this.terminalElement);
        this.fitAddon.fit();

        this.wsManager = new WebSocketManager(
            this.appendToOutput.bind(this),
            (message: string) => {},
            () => this.appendToOutput('Connected successfully\n')
        );

        this.initializeEventListeners();
        this.initializeStyles();

        this.appendToOutput('Welcome to the Web MUD Client\n');
        this.appendToOutput('Type /connect to connect to the MUD server\n');
        this.appendToOutput('Use numpad keys for quick movement:\n');
        this.appendToOutput('8: north, 6: east, 2: south, 4: west, 9: up, 3: down\n');
        this.wsManager.connect();
    }

    private notifyText(text: string): void {
        if (this.terminalElement) {
            const feedback = document.createElement('div');
            feedback.textContent = text;
            feedback.style.cssText = `
                position: absolute;
                right: 10px;
                top: 10px;
                background: rgba(0, 0, 0, 0.8);
                color: white;
                padding: 5px 10px;
                border-radius: 3px;
                pointer-events: none;
                animation: fadeOut 1s ease-in-out forwards;
            `;
            this.terminalElement.appendChild(feedback);
            setTimeout(() => feedback.remove(), 1000);
        }
    }

    private notifyCopied(): void {
        this.notifyText('Copied!');
    }

    private async copyToClipboard(text: string): Promise<void> {
        try {
            await navigator.clipboard.writeText(text);
            this.notifyCopied();
        } catch (err) {
            console.error('Failed to copy text to clipboard:', err);
            
            // Fallback method
            const textArea = document.createElement('textarea');
            textArea.value = text;
            textArea.style.position = 'fixed';
            textArea.style.left = '-999999px';
            document.body.appendChild(textArea);
            textArea.select();
            
            try {
                document.execCommand('copy');
                this.notifyCopied();
            } catch (err) {
                console.error('Fallback clipboard copy failed:', err);
            }
            
            document.body.removeChild(textArea);
        }
    }

    private addToHistory(command: string): void {
        if (command.trim() !== '' && (this.commandHistory.length === 0 || this.commandHistory[0] !== command)) {
            this.commandHistory.unshift(command);
            if (this.commandHistory.length > this.maxHistoryLength) {
                this.commandHistory.pop();
            }
            this.currentHistoryIndex = -1;
        }
    }

    private navigateHistory(direction: 'up' | 'down'): void {
        if (direction === 'up' && this.currentHistoryIndex < this.commandHistory.length - 1) {
            this.currentHistoryIndex++;
        } else if (direction === 'down' && this.currentHistoryIndex > -1) {
            this.currentHistoryIndex--;
        }

        if (this.currentHistoryIndex === -1) {
            this.inputField.value = '';
        } else {
            this.inputField.value = this.commandHistory[this.currentHistoryIndex];
        }

        // Move cursor to the end of the input
        setTimeout(() => {
            this.inputField.selectionStart = this.inputField.selectionEnd = this.inputField.value.length;
        }, 0);
    }

    private sendCommand(command: string): void {
        if ( command == "/" ) {
            this.appendToOutput("/connect or /disconnect\n")
        }
        else if (command.length > 1 && '/connect'.startsWith(command.toLowerCase())) {
            this.wsManager.connect();
        }
        else if (command.length > 1 && '/disconnect'.startsWith(command.toLowerCase())) {
            this.wsManager.disconnect();
        } else if (command.toLowerCase() === '/selectinput') {
            this.inputField.select();
        } else if (this.wsManager.isConnected()) {
            this.wsManager.sendMessage(command);
            this.appendToOutput(`${command}\n`);
        } else {
            this.appendToOutput('Not connected. Type /connect to connect to the MUD server.\n');
        }
    }

    public appendToOutput(message: string): void {
        this.terminal.write(message);
    }
    private handleKeyEvent(key: string, code: string, keyType: 'keydown' | 'keypress' | 'terminal'): boolean {
        // Handle numpad/mapped keys (for keydown and terminal only)
        if ((code in this.keyMap)) {
            this.sendCommand(this.keyMap[code]);
            return true;
        }
    
        switch (key) {
            case 'Enter':
                // Handle Enter only on keypress or terminal
                if (keyType !== 'keydown') {
                    const command = this.inputField.value;
                    this.addToHistory(command);
                    this.sendCommand(command);
                    this.inputField.select();
                }
                return true;
    
            case 'Backspace':
                // Handle Backspace only in terminal
                if (keyType === 'terminal') {
                    const selStart = this.inputField.selectionStart ?? 0;
                    const selEnd = this.inputField.selectionEnd ?? 0;
                    
                    if (selStart === selEnd && selStart > 0) {
                        this.inputField.value = this.inputField.value.slice(0, selStart - 1) + 
                                              this.inputField.value.slice(selStart);
                        this.inputField.selectionStart = this.inputField.selectionEnd = selStart - 1;
                    } else {
                        this.inputField.value = this.inputField.value.slice(0, selStart) + 
                                              this.inputField.value.slice(selEnd);
                        this.inputField.selectionStart = this.inputField.selectionEnd = selStart;
                    }
                    return true;
                }
                break;
    
            case 'ArrowUp':
            case 'ArrowDown':
                // Handle arrows in keydown and terminal
                //if (keyType !== 'keypress') {
                    this.navigateHistory(key === 'ArrowUp' ? 'up' : 'down');
                //}
                return true;
    
            case 'ArrowLeft':
            case 'ArrowRight':
                // Handle left/right only in terminal
                if (keyType === 'terminal') {
                    if (key === 'ArrowLeft') {
                        this.inputField.selectionStart = this.inputField.selectionEnd = 
                            Math.max(0, (this.inputField.selectionStart ?? 0) - 1);
                    } else {
                        this.inputField.selectionStart = this.inputField.selectionEnd = 
                            Math.min(this.inputField.value.length, (this.inputField.selectionStart ?? 0) + 1);
                    }
                    return true;
                }
                break;
        }
    
        // Handle normal character input only in terminal
        if (keyType === 'terminal' && key.length === 1 && key.charCodeAt(0) >= 32 && key.charCodeAt(0) <= 126) {
            const selStart = this.inputField.selectionStart ?? 0;
            const selEnd = this.inputField.selectionEnd ?? 0;
            
            this.inputField.value = 
                this.inputField.value.slice(0, selStart) + 
                key + 
                this.inputField.value.slice(selEnd);
                
            this.inputField.selectionStart = this.inputField.selectionEnd = selStart + 1;
            
            // Trigger input event
            this.inputField.dispatchEvent(new Event('input', { bubbles: true }));
            return true;
        }
        // if (keyType == "keypress") {
        //     return false;
        // }

        return false;
        // Always focus input if not focused (for keydown only)
        // if (keyType === 'keydown' && document.activeElement !== this.inputField) {
        //     this.inputField.focus();
        // }
    }
    private initializeEventListeners(): void {
        // Window resize handler
        window.addEventListener('resize', () => {
            this.fitAddon.fit();
        });

        // Terminal selection handler
        this.terminal.onSelectionChange(() => {
            const selection = this.terminal.getSelection();
            if (selection && selection.trim().length > 0) {
                this.copyToClipboard(selection);
            }
        });

        // Copy event handler
        this.terminalElement?.addEventListener('copy', () => this.notifyCopied());

        // document.addEventListener('keydown', (e: KeyboardEvent) => {
        //     e.preventDefault();    
        //     this.handleKeyEvent(e.key, e.code, 'keydown');
        //     //if(this.handleKeyEvent(e.key, e.code, 'keydown'))
        //         //e.preventDefault();    
        // });
    
        this.inputField.addEventListener('keypress', (e: KeyboardEvent) => {
            if(this.handleKeyEvent(e.key, e.code, 'keypress'))
            {
                e.preventDefault();    
            }
        });
    
        this.terminal.onKey(({ key, domEvent }) => {
            domEvent.preventDefault();
            this.handleKeyEvent(domEvent.key, domEvent.code, 'terminal');
        });
    }

    private initializeStyles(): void {
        const style = document.createElement('style');
        style.textContent = `
            @keyframes fadeOut {
                from { opacity: 1; }
                to { opacity: 0; }
            }
        `;
        document.head.appendChild(style);
    }

 
}