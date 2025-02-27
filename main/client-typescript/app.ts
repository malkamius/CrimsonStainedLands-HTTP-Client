import { WebSocketManager } from './websocket';
import { Terminal } from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';
import { AppSettingsUI } from './AppSettingsUI';
import { AppSettings } from './AppSettings';

export class App {
    private terminal: Terminal;
    private fitAddon: FitAddon;
    public terminalElement: HTMLElement | null;
    private inputField: HTMLInputElement;
    private wsManager: WebSocketManager;
    private commandHistory: string[] = [];
    private currentHistoryIndex: number = -1;
    private readonly maxHistoryLength: number = 20;
    public settings: AppSettings;
    private settingsProfiles: { name: string, settings: AppSettings }[] = [];
    private currentProfileName: string = "Default";
    private settingsUI: AppSettingsUI;
    private inTriggers: boolean = false;
    
    constructor(terminalId: string, port: number) {
        this.terminalElement = document.getElementById(terminalId);
        this.inputField = document.getElementById('input') as HTMLInputElement;

        if (!this.terminalElement) {
            throw new Error(`Terminal element with ID '${terminalId}' not found`);
        }
        if (!this.inputField) {
            throw new Error('Input field element not found');
        }
        
        // Load settings before initializing terminal
        this.settings = this.loadSettings();
        
        // Initialize terminal
        this.terminal = new Terminal({
            convertEol: true,
            fontSize: this.settings.fontSize,
            fontFamily: 'monospace',
            theme: {
                background: this.settings.backgroundColor,
                foreground: this.settings.foregroundColor,
                cursor: this.settings.foregroundColor
            },
            cursorBlink: true
        });
        
        this.fitAddon = new FitAddon();
        this.terminal.loadAddon(this.fitAddon);
        this.terminal.open(this.terminalElement);
        this.fitAddon.fit();

        // Initialize WebSocket manager
        this.wsManager = new WebSocketManager(
            this.appendToOutput.bind(this),
            (message: string) => {},
            () => this.appendToOutput('Connected successfully\n'),
            port
        );
        
        // Initialize settings UI
        this.settingsUI = new AppSettingsUI(this);
        this.fitAddon.fit();
        // Initialize event listeners
        this.initializeEventListeners();
        
        // Make the app available globally
        (window as any).mudApp = this;
        
        // Display welcome message
        this.appendToOutput('Welcome to the Web MUD Client\n');
        this.appendToOutput('Type /connect to connect to the MUD server\n');
        this.appendToOutput('Use numpad keys for quick movement:\n');
        this.appendToOutput('8: north, 6: east, 2: south, 4: west, 9: up, 3: down\n');
        
        // Add /connect to history and connect
        this.addToHistory("/connect");
        this.wsManager.connect();
    }

    public resize()
    {
        this.fitAddon.fit();
    }

    // Load settings from localStorage
    private loadSettings(): AppSettings {
        // First load the profiles list
        const savedProfiles = localStorage.getItem('mudClientProfiles');
        
        if (savedProfiles) {
            try {
                this.settingsProfiles = JSON.parse(savedProfiles);
            } catch (e) {
                console.error('Failed to parse saved profiles:', e);
                this.settingsProfiles = [];
            }
        }
        
        // If no profiles exist, create a default one
        if (this.settingsProfiles.length === 0) {
            const defaultSettings = new AppSettings();
            this.settingsProfiles.push({
                name: "Default",
                settings: defaultSettings
            });
            this.saveProfiles();
        }
        
        // Get the last used profile name
        const lastUsedProfile = localStorage.getItem('mudClientCurrentProfile') || "Default";
        this.currentProfileName = lastUsedProfile;
        
        // Find the current profile
        const currentProfile = this.settingsProfiles.find(p => p.name === this.currentProfileName);
        
        if (currentProfile) {
            return Object.assign(new AppSettings(), currentProfile.settings);
        } else {
            // If current profile not found, use the first one
            this.currentProfileName = this.settingsProfiles[0].name;
            return Object.assign(new AppSettings(), this.settingsProfiles[0].settings);
        }
    }

    // Save the profile list to localStorage
    private saveProfiles(): void {
        localStorage.setItem('mudClientProfiles', JSON.stringify(this.settingsProfiles));
        localStorage.setItem('mudClientCurrentProfile', this.currentProfileName);
    }

    // Save the current settings to the active profile
    public saveSettings(): void {
        // Find the current profile index
        const profileIndex = this.settingsProfiles.findIndex(p => p.name === this.currentProfileName);
        
        if (profileIndex >= 0) {
            // Update the profile with current settings
            this.settingsProfiles[profileIndex].settings = this.settings;
        } else {
            // If profile not found, create a new one
            this.settingsProfiles.push({
                name: this.currentProfileName,
                settings: this.settings
            });
        }
        
        // Save profiles to localStorage
        this.saveProfiles();
    }

    // Apply settings to terminal
    public applySettings(newSettings?: AppSettings): void {
        if (newSettings) {
            // Update the settings with the new values
            this.settings = {...this.settings, ...newSettings};
            
            // Save the updated settings
            this.saveSettings();
        }
        
        console.log("Applying settings:", this.settings);
        
        // Store current terminal content
        const terminalContent = this.captureTerminalContent();
        
        // Dispose of old terminal
        this.terminal.dispose();
        
        // Create new terminal with updated options
        this.terminal = new Terminal({
            convertEol: true,
            fontSize: this.settings.fontSize,
            fontFamily: 'monospace',
            theme: {
                background: this.settings.backgroundColor,
                foreground: this.settings.foregroundColor,
                cursor: this.settings.foregroundColor
            },
            cursorBlink: true,
            scrollback: 5000 // Add larger scrollback buffer
        });
        
        // Reload addons
        this.fitAddon = new FitAddon();
        this.terminal.loadAddon(this.fitAddon);
        
        // Reopen terminal in the same container
        this.terminal.open(this.terminalElement!);
        
        // Restore the previously captured content
        this.restoreTerminalContent(terminalContent);
        
        // Resize the terminal to fit its container
        this.fitAddon.fit();
        
        // Reattach event listeners
        this.attachTerminalEventListeners();
        
        // Update UI elements
        this.settingsUI.updateUI();
    }

    /**
     * Captures the current terminal content with color codes
     * @returns Array of terminal lines with formatting preserved
     */
    private captureTerminalContent(): string[] {
        const buffer = this.terminal.buffer.active;
        const terminalContent: string[] = [];
        
        // Get total number of lines in buffer (including scrollback)
        const totalLines = buffer.length;
        
        // Capture each line of content with formatting
        for (let i = 0; i < totalLines; i++) {
            const line = buffer.getLine(i);
            if (line) {
                let formattedLine = '';
                let currentFg: number | undefined = undefined;
                let currentBg: number | undefined = undefined;
                let currentAttrs = 0;
                
                // Process each cell in the line to preserve attributes
                for (let j = 0; j < line.length; j++) {
                    const cell = line.getCell(j);
                    if (!cell) continue;
                    
                    const char = cell.getChars() || ' ';
                    
                    // Access attributes in a version-compatible way
                    const fg = cell.getFgColor();
                    const bg = cell.getBgColor();
                    
                    // Check for cell attributes based on available properties
                    const isBold = cell.isBold?.() != 0 || false;
                    const isItalic = cell.isItalic?.() != 0 || false;
                    const isUnderline = cell.isUnderline?.() != 0 || false;
                    const isDim = cell.isDim?.() != 0 || false;
                    const isBlink = cell.isBlink?.() != 0 || false;
                    const isInverse = cell.isInverse?.() != 0 || false;
                    const isInvisible = cell.isInvisible?.() != 0 || false;
                    
                    // Construct a numeric representation of attributes for comparison
                    const currentCellAttrs = (isBold ? 1 : 0) |
                                            (isDim ? 2 : 0) |
                                            (isItalic ? 4 : 0) |
                                            (isUnderline ? 8 : 0) |
                                            (isBlink ? 16 : 0) |
                                            (isInverse ? 32 : 0) |
                                            (isInvisible ? 64 : 0);
                    
                    // Check if formatting has changed
                    if (fg !== currentFg || bg !== currentBg || currentCellAttrs !== currentAttrs) {
                        // Add ANSI escape sequences to set the new formatting
                        formattedLine += this.constructAnsiSequence(fg, bg, isBold, isItalic, isUnderline, isDim, isBlink, isInverse, isInvisible);
                        currentFg = fg;
                        currentBg = bg;
                        currentAttrs = currentCellAttrs;
                    }
                    
                    formattedLine += char;
                }
                
                // Reset attributes at the end of each line
                formattedLine += '\u001b[0m';
                terminalContent.push(formattedLine);
            }
        }
        
        return terminalContent;
    }

    /**
     * Constructs an ANSI escape sequence for the given attributes
     */
    private constructAnsiSequence(
        fg: number,
        bg: number,
        isBold: boolean,
        isItalic: boolean,
        isUnderline: boolean,
        isDim: boolean,
        isBlink: boolean,
        isInverse: boolean,
        isInvisible: boolean
    ): string {
        const codes: number[] = [];
        
        // Add formatting based on attributes
        if (isBold) codes.push(1);      // Bold
        if (isDim) codes.push(2);       // Dim
        if (isItalic) codes.push(3);    // Italic
        if (isUnderline) codes.push(4); // Underline
        if (isBlink) codes.push(5);     // Blink
        if (isInverse) codes.push(7);   // Inverse
        if (isInvisible) codes.push(8); // Hidden
        
        // Add foreground color (if specified)
        if (fg !== undefined && fg !== null && fg != -1) {
            if (fg < 16) {
                // Standard colors (0-15)
                if (fg < 8) {
                    codes.push(30 + fg);
                } else {
                    codes.push(90 + (fg - 8));
                }
            } else {
                // 256 color palette
                codes.push(38, 5, fg);
            }
        }
        
        // Add background color (if specified)
        if (bg !== undefined && bg !== null && bg != -1) {
            if (bg < 16) {
                // Standard colors (0-15)
                if (bg < 8) {
                    codes.push(40 + bg);
                } else {
                    codes.push(100 + (bg - 8));
                }
            } else {
                // 256 color palette
                codes.push(48, 5, bg);
            }
        }
        
        return `\u001b[${codes.join(';')}m`;
    }

    /**
     * Restores content to the terminal preserving formatting
     * @param content Array of terminal content lines with ANSI codes
     */
    private restoreTerminalContent(content: string[]): void {
        if (!content || content.length === 0) {
            return;
        }
        
        // Clear terminal first to avoid mixing content
        this.terminal.clear();
        
        // Write content with preserved formatting
        this.terminal.write(content.join('\r\n'));
    }

    // Helper function to escape special regex characters
    private escapeRegExp(string: string): string {
        return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); // $& means the whole matched string
    }

    // Show a notification message
    public showNotification(message: string, isSuccess: boolean = true): void {
        const feedback = document.createElement('div');
        feedback.textContent = message;
        feedback.style.cssText = `
            position: fixed;
            left: 50%;
            top: 20px;
            transform: translateX(-50%);
            background: ${isSuccess ? 'rgba(0, 128, 0, 0.8)' : 'rgba(220, 53, 69, 0.8)'};
            color: white;
            padding: 10px 20px;
            border-radius: 4px;
            z-index: 2000;
            animation: fadeOut 3s ease-in-out forwards;
        `;
        document.body.appendChild(feedback);
        setTimeout(() => feedback.remove(), 3000);
    }

    // Add a command to the history
    private addToHistory(command: string): void {
        if (command.trim() !== '' && (this.commandHistory.length === 0 || this.commandHistory[0] !== command)) {
            this.commandHistory.unshift(command);
            if (this.commandHistory.length > this.maxHistoryLength) {
                this.commandHistory.pop();
            }
            this.currentHistoryIndex = -1;
        }
    }

    // Navigate through command history
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
        this.inputField.select();
    }

    // Process aliases in a command
    public performAliases(command: string): string {
        // Split the command by newlines to process each line
        const lines = command.split('\n');
        const processedLines: string[] = [];
        
        // Process each line individually
        for (let line of lines) {
            let processedLine = line.trim();
            
            // Skip empty lines
            if (processedLine === '') {
                processedLines.push('');
                continue;
            }
            
            // Check if the line starts with any of our aliases
            let aliasFound = false;
            
            for (const aliasObj of this.settings.Aliases) {
                // Create a regex to match the alias at the beginning of the line
                // The alias can be followed by whitespace and additional text
                const aliasRegex = new RegExp(`^${this.escapeRegExp(aliasObj.alias)}(\\s+?.+?)?$`);
                const match = processedLine.match(aliasRegex);
                
                if (match) {
                    aliasFound = true;
                    
                    // Extract any additional text following the alias
                    const additionalText = match[1] ? match[1].trim() : '';
                    
                    // Replace the alias with its command
                    // If there's additional text, append it to the command
                    processedLine = additionalText ? 
                        `${aliasObj.command} ${additionalText}` : 
                        aliasObj.command;
                    
                    // Once we find a matching alias, stop checking others
                    break;
                }
            }
            
            // Add the processed line to our results
            processedLines.push(processedLine);
        }
        
        // Join the processed lines back together and return
        return processedLines.join('\n');
    }

    // Process variables in a command
    private processVariables(command: string): string {
        if (!this.settings.Variables || this.settings.Variables.length === 0 || !command.includes('$')) {
            return command; // No variables to process or no $ in command
        }
        
        // Create variable map for quick lookup
        const variableMap = new Map<string, string>();
        for (const variable of this.settings.Variables) {
            variableMap.set(variable.name.toUpperCase(), variable.value);
        }
        
        // Replace variables in command
        let processedCommand = command;
        
        // Find all $VARNAME occurrences
        // This regex matches $VARNAME patterns where VARNAME must start with a letter or underscore
        // and can contain only letters, numbers, and underscores
        const variableRegex = /\$([A-Za-z_]\w*)/g;
        let match;
        
        while ((match = variableRegex.exec(command)) !== null) {
            const variableName = match[1].toUpperCase();
            const value = variableMap.get(variableName);
            
            if (value !== undefined) {
                // Replace $VARNAME with its value
                processedCommand = processedCommand.replace(new RegExp('\\$' + variableName, 'g'), value);
            }
        }
        
        return processedCommand;
    }

    // Send a command to the MUD
    public sendCommand(command: string): void {
        if (command === "/") {
            this.appendToOutput("/connect or /disconnect\n");
        }
        else if (command.length > 1 && '/connect'.startsWith(command.toLowerCase())) {
            this.wsManager.connect();
        }
        else if (command.length > 1 && '/disconnect'.startsWith(command.toLowerCase())) {
            this.wsManager.disconnect();
        } else if (command.toLowerCase() === '/selectinput') {
            this.inputField.select();
        } else if (this.wsManager.isConnected()) {
            // Process aliases and variables
            command = this.performAliases(command);
            command = this.processVariables(command);
            
            this.wsManager.sendMessage(command);
            this.appendToOutput(`${command}\n`);
        } else {
            command = this.performAliases(command);
            command = this.processVariables(command);
            
            this.appendToOutput(`${command}\n`);
            this.appendToOutput('Not connected. Type /connect to connect to the MUD server.\n');
        }
        
        // Add command to history
        this.addToHistory(command);
    }

    // Append text to the terminal output
    public appendToOutput(message: string): void {
        this.terminal.write(message);
        this.processTriggers(message);
    }

    // Strip control codes
    private stripAllTerminalCodes(text: string): string {
        // Main ANSI escape sequences (colors, formatting)
        let cleaned = text.replace(/\u001b\[\d*(?:;\d+)*[A-Za-z]/g, '');
        
        // Other terminal control sequences
        cleaned = cleaned.replace(/\u001b\](?:.|[\n\r])*?(?:\u0007|\u001b\\)/g, ''); // OSC sequences
        cleaned = cleaned.replace(/\u001b[PX_^].*?(?:\u001b\\|\u0007)/g, ''); // DCS, SOS, PM, APC sequences
        cleaned = cleaned.replace(/\u001b[@-Z\\-_]/g, ''); // Single-character escape sequences
        
        // Handle legacy color codes used by some MUDs
        cleaned = cleaned.replace(/\x03\d{1,2}(?:,\d{1,2})?/g, ''); // IRC-style color codes
        
        return cleaned;
    }

    /**
     * Process triggers for a message
     * @param text text from the mud
     * @returns void
     */
    private processTriggers(text: string): void {
        if (!this.settings.Triggers || this.settings.Triggers.length === 0) {
            return; // No triggers to process
        }
        if (this.inTriggers) {
            return; // Prevent recursive trigger processing
        }
        this.inTriggers = true;
        
        // Strip ANSI codes for trigger matching
        const cleanText = this.stripAllTerminalCodes(text);
        
        // Check each trigger against the cleaned text
        for (const trigger of this.settings.Triggers) {
            let isMatch = false;
            
            try {
                // Use cleaned text for matching
                isMatch = this.matchTrigger(cleanText, trigger.type, trigger.match);
                
                // If we have a match, execute the trigger actions
                if (isMatch) {
                    this.executeTriggerActions(trigger.actions, trigger.actionType || 'text');
                }
            } catch (error: any) {
                console.error(`Error processing trigger "${trigger.match}": ${error.message}`, error);
            }
        }
        this.inTriggers = false;
    }

    // Test if a trigger matches text
    public matchTrigger(text: string, type: string, pattern: string): boolean {
        try {
            if (type === 'regex' || !type) {
                // Default to regex if type is not specified
                try {
                    // First try to match against the entire text (multi-line)
                    const multiLineRegex = new RegExp(pattern, 'm');
                    return multiLineRegex.test(text);
                } catch (regexError: any) {
                    console.error(`Invalid regex in trigger "${pattern}": ${regexError.message}`);
                    return false;
                }
            } else if (type === 'substring') {
                // Substring match can match against the entire text
                return text.includes(pattern);
            } else if (type === 'exact') {
                const lines = text.split('\n');
                // Exact match should check each line
                for (const line of lines) {
                    if (line === pattern) {
                        return true;
                    }
                }
                return false;
            }
            return false;
        } catch (error: any) {
            console.error(`Error processing trigger "${pattern}": ${error.message}`, error);
            return false;
        }
    }

    // Execute trigger actions
    private executeTriggerActions(actionsText: string, actionType: string = 'text'): void {
        if (!actionsText) {
            return;
        }
        
        // Check action type and handle accordingly
        if (actionType === 'javascript') {
            try {
                // Execute JavaScript code
                const executeFunction = new Function('mud', 'app', actionsText);
                executeFunction(this, this); // Pass 'this' twice for flexibility
            } catch (error: any) {
                console.error('Error executing JavaScript trigger:', error.message);
                this.appendToOutput(`Error executing JavaScript trigger: ${error.message}\n`);
            }
        } else {
            // Default to 'text' action type - send commands to MUD
            setTimeout(() => {
                this.sendCommand(actionsText);
            }, 1);
        }
    }

    // Initialize event listeners
    private initializeEventListeners(): void {
        // Window resize handler
        window.addEventListener('resize', () => {
            this.fitAddon.fit();
        });
        
        // Input field event listener
        this.inputField.addEventListener('keydown', (e: KeyboardEvent) => {
            if (this.handleKeyEvent(e.key, e.code, 'keypress', e)) {
                e.preventDefault();
            }
        });
        
        // Terminal event listeners
        this.attachTerminalEventListeners();
    }

    // Attach event listeners to the terminal
    private attachTerminalEventListeners(): void {
        // Terminal selection handler
        this.terminal.onSelectionChange(() => {
            const selection = this.terminal.getSelection();
            if (selection && selection.trim().length > 0) {
                this.copyToClipboard(selection);
            }
        });
        
        // Terminal key handler
        this.terminal.onKey(({ key, domEvent }) => {
            domEvent.preventDefault();
            this.handleKeyEvent(domEvent.key, domEvent.code, 'terminal', domEvent);
        });
    }

    // Handle key events
    private handleKeyEvent(key: string, code: string, keyType: 'keydown' | 'keypress' | 'terminal', event?: KeyboardEvent): boolean {
        // Create the key combination string based on modifiers
        let keyCombo = '';
        
        // If we have the full event object, we can check modifiers
        if (event) {
            if (event.ctrlKey) {
                keyCombo += 'Ctrl+';
            }
            
            if (event.altKey) {
                keyCombo += 'Alt+';
            }
            
            if (event.shiftKey) {
                keyCombo += 'Shift+';
            }
            
            // Add the key code
            keyCombo += event.code;
        } else {
            // Fallback to just the code if we don't have the event
            keyCombo = code;
        }
        
        // First check for exact key combination matches
        for (let i = 0; i < this.settings.Keybindings.length; i++) {
            const keybind = this.settings.Keybindings[i];
            if (keybind.key === keyCombo) {
                this.sendCommand(keybind.commands);
                return true; // Indicating that the key was handled
            }
        }
        
        // If no key combination matched, fall back to checking just the code
        // This maintains backward compatibility with old keybindings
        if (keyCombo !== code) {
            for (let i = 0; i < this.settings.Keybindings.length; i++) {
                const keybind = this.settings.Keybindings[i];
                if (keybind.key === code) {
                    this.sendCommand(keybind.commands);
                    return true;
                }
            }
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
                this.navigateHistory(key === 'ArrowUp' ? 'up' : 'down');
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

        return false;
    }

    // Copy text to clipboard
    private async copyToClipboard(text: string): Promise<void> {
        try {
            await navigator.clipboard.writeText(text);
            this.showNotification('Copied!', true);
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
                this.showNotification('Copied!', true);
            } catch (err) {
                console.error('Fallback clipboard copy failed:', err);
            }
            
            document.body.removeChild(textArea);
        }
    }

    // Export settings to a JSON file for download
    public exportSettings(): string {
        // Get current settings
        const settings = this.settings;
        
        // Convert to JSON string with pretty formatting
        return JSON.stringify(settings, null, 2);
    }

    // Import settings from a JSON string
    public importSettings(settingsJson: string): boolean {
        try {
            // Parse the JSON string
            const importedSettings = JSON.parse(settingsJson);
            
            // Validate the imported settings
            if (!importedSettings ||
                typeof importedSettings !== 'object' ||
                !('fontSize' in importedSettings) ||
                !('backgroundColor' in importedSettings) ||
                !('foregroundColor' in importedSettings) ||
                !Array.isArray(importedSettings.Aliases) ||
                !Array.isArray(importedSettings.Keybindings) ||
                !Array.isArray(importedSettings.Variables) ||
                !Array.isArray(importedSettings.Triggers)) {
                
                throw new Error('Invalid settings format');
            }
            
            // Apply the imported settings
            this.settings = importedSettings;
            this.saveSettings();
            this.applySettings();
            
            return true;
        } catch (error) {
            console.error('Error importing settings:', error);
            return false;
        }
    }

    // Create a new profile with the current settings
    public createProfile(profileName: string): boolean {
        if (!profileName || profileName.trim() === '') {
            return false;
        }
        
        // Normalize the name
        profileName = profileName.trim();
        
        // Check if profile already exists
        const existingProfile = this.settingsProfiles.find(p => p.name === profileName);
        if (existingProfile) {
            return false;
        }
        
        // Create new profile with current settings
        this.settingsProfiles.push({
            name: profileName,
            settings: JSON.parse(JSON.stringify(this.settings)) // Deep copy
        });
        
        // Set as current profile
        this.currentProfileName = profileName;
        
        // Save to localStorage
        this.saveProfiles();
        
        // Update UI elements
        this.settingsUI.updateUI();
        
        // Dispatch a custom event that the UI can listen for
        const event = new CustomEvent('profileCreated', { 
            detail: { profileName: profileName } 
        });
        window.dispatchEvent(event);
        
        return true;
    }

    // Delete a profile
    public deleteProfile(profileName: string): boolean {
        if (profileName === "Default") {
            return false; // Cannot delete Default profile
        }
        
        const profileIndex = this.settingsProfiles.findIndex(p => p.name === profileName);
        if (profileIndex < 0) {
            return false;
        }
        
        // Store current terminal content if we're deleting the active profile
        const wasActiveProfile = this.currentProfileName === profileName;
        const terminalContent = wasActiveProfile ? this.captureTerminalContent() : null;
        
        // Remove the profile
        this.settingsProfiles.splice(profileIndex, 1);
        
        // If we deleted the current profile, switch to Default
        if (wasActiveProfile) {
            this.currentProfileName = "Default";
            const defaultProfile = this.settingsProfiles.find(p => p.name === "Default");
            if (defaultProfile) {
                this.settings = Object.assign(new AppSettings(), defaultProfile.settings);
            }
        }
        
        // Save changes
        this.saveProfiles();
        
        // Apply settings change only if we switched profiles
        if (wasActiveProfile) {
            this.applySettings();
        }
        
        // Update UI elements
        this.settingsUI.updateUI();
        
        // Dispatch a custom event that the UI can listen for
        const event = new CustomEvent('profileDeleted', { 
            detail: { profileName: profileName } 
        });
        window.dispatchEvent(event);
        
        return true;
    }

    // Switch to a different profile
    public switchProfile(profileName: string): boolean {
        const profile = this.settingsProfiles.find(p => p.name === profileName);
        if (!profile) {
            return false;
        }
        
        // Update current profile name
        this.currentProfileName = profileName;
        
        // Load settings from the profile
        this.settings = Object.assign(new AppSettings(), profile.settings);
        
        // Save current profile selection
        localStorage.setItem('mudClientCurrentProfile', this.currentProfileName);
        
        // Apply the settings
        this.applySettings();
        
        return true;
    }

    // Get the list of profile names
    public getProfileNames(): string[] {
        return this.settingsProfiles.map(p => p.name);
    }

    // Get the current profile name
    public getCurrentProfileName(): string {
        return this.currentProfileName;
    }

    // Public APIs for UI interaction
    /**
     * Writes text to the terminal output without sending to the MUD
     * @param text The text to display
     */
    public echo(text: string): void {
        this.appendToOutput(text);
    }
    
    // Set a variable
    public setVariable(name: string, value: any, type: string = 'string'): void {
        if (!name) {
            console.error('Variable name cannot be empty');
            return;
        }
        
        const varName = name.toUpperCase();
        let varValue = String(value);
        
        // Find existing variable or create a new one
        const existingVarIndex = this.settings.Variables.findIndex(v => v.name === varName);
        
        if (existingVarIndex >= 0) {
            // Update existing variable
            this.settings.Variables[existingVarIndex].value = varValue;
            this.settings.Variables[existingVarIndex].type = type;
        } else {
            // Create new variable
            this.settings.Variables.push({
                name: varName,
                value: varValue,
                type: type
            });
        }
        
        // Save settings
        this.saveSettings();
    }

    // Get a variable value
    public getVariable(name: string): string | null {
        const varName = name.toUpperCase();
        const variable = this.settings.Variables.find(v => v.name === varName);
        return variable ? variable.value : null;
    }

    // Create a timer
    public createTimer(callback: () => void, delay: number): number {
        return window.setTimeout(callback, delay);
    }

    // Create an interval
    public createInterval(callback: () => void, interval: number): number {
        return window.setInterval(callback, interval);
    }

    // Cancel a timer
    public cancelTimer(id: number): void {
        window.clearTimeout(id);
    }

    // Cancel an interval
    public cancelInterval(id: number): void {
        window.clearInterval(id);
    }

    // Create a trigger
    public createTrigger(pattern: string, actions: string, type: string = 'regex', actionType: string = 'text'): void {
        if (!pattern || !actions) {
            console.error('Pattern and actions are required');
            return;
        }
        
        this.settings.Triggers.push({
            match: pattern,
            actions: actions,
            type: type,
            actionType: actionType
        });
        
        this.saveSettings();
    }

    // UI state tracking
    private modalOpen: boolean = false;
    private interactingWithDropdown: boolean = false;

    // UI State methods
    public isModalOpen(): boolean {
        return this.modalOpen;
    }

    public setModalOpen(isOpen: boolean): void {
        this.modalOpen = isOpen;
    }

    public isInteractingWithDropdown(): boolean {
        return this.interactingWithDropdown;
    }

    public setInteractingWithDropdown(isInteracting: boolean): void {
        this.interactingWithDropdown = isInteracting;
    }

    public sendMudCommand(command: string): void {
        this.sendCommand(command);
    }

    
}