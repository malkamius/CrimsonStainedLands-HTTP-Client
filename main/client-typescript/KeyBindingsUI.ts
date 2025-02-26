import { App } from './app';

export class KeyBindingsUI {
    private app: App;
    private keysList: HTMLElement | null = null;
    private editFormContainer: HTMLElement | null = null;
    private addKeyBtn: HTMLElement | null = null;
    
    constructor(app: App) {
        this.app = app;
        this.initializeUIElements();
        this.initializeEventListeners();
    }
    
    private initializeUIElements(): void {
        this.keysList = document.getElementById('keys-list');
        this.editFormContainer = document.getElementById('edit-form-container');
        this.addKeyBtn = document.getElementById('add-key');
    }
    
    private initializeEventListeners(): void {
        if (this.addKeyBtn) {
            this.addKeyBtn.addEventListener('click', () => {
                this.showEditForm(null, -1);
            });
        }
    }
    
    // Load key bindings from app settings into the UI
    public loadKeyBindings(): void {
        if (!this.keysList || !this.app.settings.Keybindings) {
            return;
        }
        
        // Clear existing list
        this.keysList.innerHTML = '';
        
        // Clear edit form container
        if (this.editFormContainer) {
            this.editFormContainer.innerHTML = '';
            this.editFormContainer.classList.remove('active');
        }
        
        // Add each key binding to the list
        this.app.settings.Keybindings.forEach((binding, index) => {
            if(this.keysList === null)
                return;
            const row = document.createElement('tr');
            row.dataset.index = index.toString();
            
            const keyCell = document.createElement('td');
            keyCell.textContent = binding.key;
            row.appendChild(keyCell);
            
            const commandCell = document.createElement('td');
            commandCell.textContent = binding.commands;
            row.appendChild(commandCell);
            
            const actionCell = document.createElement('td');
            
            // Edit button
            const editBtn = document.createElement('button');
            editBtn.className = 'client-button';
            editBtn.textContent = 'Edit';
            editBtn.style.marginRight = '5px';
            editBtn.addEventListener('click', () => {
                this.showEditForm(binding, index);
            });
            
            // Delete button
            const deleteBtn = document.createElement('button');
            deleteBtn.className = 'client-button';
            deleteBtn.textContent = 'Delete';
            deleteBtn.addEventListener('click', () => {
                // Remove the binding
                this.app.settings.Keybindings.splice(index, 1);
                
                // Save settings and reload list
                this.app.saveSettings();
                this.loadKeyBindings();
            });
            
            actionCell.appendChild(editBtn);
            actionCell.appendChild(deleteBtn);
            row.appendChild(actionCell);
            
            this.keysList.appendChild(row);
        });
    }
    
    // Show edit form for adding or editing a key binding
    private showEditForm(binding: { key: string, commands: string } | null, index: number): void {
        if (!this.editFormContainer) return;
        
        // Clear previous form content
        this.editFormContainer.innerHTML = '';
        
        // Create the form content
        const formTitle = document.createElement('h4');
        formTitle.textContent = index === -1 ? 'Add New Key Binding' : 'Edit Key Binding';
        this.editFormContainer.appendChild(formTitle);
        
        // Create key input row
        const keyRow = document.createElement('div');
        keyRow.className = 'form-row';
        
        const keyLabel = document.createElement('label');
        keyLabel.textContent = 'Key:';
        keyLabel.setAttribute('for', 'edit-key-input');
        
        const keyInput = document.createElement('input');
        keyInput.type = 'text';
        keyInput.id = 'edit-key-input';
        keyInput.value = binding ? binding.key : '';
        keyInput.placeholder = 'e.g., Numpad8, KeyA, ArrowUp';
        
        // Capture Key button
        const captureBtn = document.createElement('button');
        captureBtn.className = 'client-button';
        captureBtn.textContent = 'Capture Key';
        captureBtn.className = 'capture-key-btn';
        captureBtn.type = 'button';
        
        keyRow.appendChild(keyLabel);
        keyRow.appendChild(keyInput);
        keyRow.appendChild(captureBtn);
        this.editFormContainer.appendChild(keyRow);
        
        // Create command input row
        const cmdRow = document.createElement('div');
        cmdRow.className = 'form-row';
        
        const cmdLabel = document.createElement('label');
        cmdLabel.textContent = 'Command:';
        cmdLabel.setAttribute('for', 'edit-cmd-input');
        
        const cmdInput = document.createElement('input');
        cmdInput.type = 'text';
        cmdInput.id = 'edit-cmd-input';
        cmdInput.value = binding ? binding.commands : '';
        cmdInput.placeholder = 'e.g., north, look, /disconnect';
        
        cmdRow.appendChild(cmdLabel);
        cmdRow.appendChild(cmdInput);
        this.editFormContainer.appendChild(cmdRow);
        
        // Add a hint about key codes
        const hintText = document.createElement('div');
        hintText.innerHTML = '<small>Tip: Press "Capture Key" and press any key combination to automatically set the key.</small>';
        hintText.style.marginTop = '5px';
        hintText.style.color = '#999';
        this.editFormContainer.appendChild(hintText);
        
        // Create button row
        const buttonRow = document.createElement('div');
        buttonRow.className = 'button-row';
        
        // Save button
        const saveBtn = document.createElement('button');
        saveBtn.className = 'client-button';
        saveBtn.textContent = 'Save';
        saveBtn.addEventListener('click', () => {
            if (index === -1) {
                // Adding new binding
                this.app.settings.Keybindings.push({
                    key: keyInput.value,
                    commands: cmdInput.value
                });
            } else {
                // Updating existing binding
                if (binding) {
                    binding.key = keyInput.value;
                    binding.commands = cmdInput.value;
                }
            }
            
            // Save settings and reload
            this.app.saveSettings();
            this.loadKeyBindings();
        });
        
        // Cancel button
        const cancelBtn = document.createElement('button');
        cancelBtn.className = 'client-button';
        cancelBtn.textContent = 'Cancel';
        cancelBtn.style.backgroundColor = '#555';
        cancelBtn.addEventListener('click', () => {
            if (this.editFormContainer) {
                this.editFormContainer.innerHTML = '';
                this.editFormContainer.classList.remove('active');
            }
        });
        
        buttonRow.appendChild(saveBtn);
        buttonRow.appendChild(cancelBtn);
        this.editFormContainer.appendChild(buttonRow);
        
        // Show the form container
        this.editFormContainer.classList.add('active');
        
        // Add key capture functionality
        captureBtn.addEventListener('click', () => {
            // Create and show the key capture dialog
            this.showKeyCaptureDialog(keyInput);
        });
    }
    
    // Function to show the key capture dialog
    private showKeyCaptureDialog(targetInput: HTMLInputElement): void {
        // Create overlay for the dialog
        const dialogOverlay = document.createElement('div');
        dialogOverlay.className = 'key-capture-overlay';
        
        // Create dialog container
        const dialogContainer = document.createElement('div');
        dialogContainer.className = 'key-capture-dialog';
        
        // Create dialog content
        const dialogContent = document.createElement('div');
        dialogContent.className = 'key-capture-content';
        
        // Add heading
        const heading = document.createElement('h3');
        heading.textContent = 'Waiting for key...';
        
        // Add instructions
        const instructions = document.createElement('p');
        instructions.textContent = 'Press any key or key combination to capture it.';
        
        // Add key display area
        const keyDisplay = document.createElement('div');
        keyDisplay.className = 'key-display';
        keyDisplay.textContent = 'Press a key';
        
        // Add cancel button
        const cancelBtn = document.createElement('button');
        cancelBtn.className = 'client-button';
        cancelBtn.textContent = 'Cancel';
        cancelBtn.addEventListener('click', () => {
            document.body.removeChild(dialogOverlay);
            document.removeEventListener('keydown', keyHandler);
        });
        
        // Assemble dialog
        dialogContent.appendChild(heading);
        dialogContent.appendChild(instructions);
        dialogContent.appendChild(keyDisplay);
        dialogContent.appendChild(cancelBtn);
        dialogContainer.appendChild(dialogContent);
        dialogOverlay.appendChild(dialogContainer);
        
        // Add to document
        document.body.appendChild(dialogOverlay);
        
        // Focus the dialog to capture keypresses
        dialogContainer.focus();
        
        // Key handler function
        const keyHandler = (e: KeyboardEvent) => {
            e.preventDefault();
            e.stopPropagation();
            
            // Check if this is only a modifier key press
            if (e.key === 'Control' || e.key === 'Alt' || e.key === 'Shift' || 
                e.key === 'Meta' || e.code === 'ControlLeft' || e.code === 'ControlRight' || 
                e.code === 'AltLeft' || e.code === 'AltRight' || 
                e.code === 'ShiftLeft' || e.code === 'ShiftRight') {
                
                // Update display to show we're waiting for a non-modifier key
                keyDisplay.textContent = 'Waiting for a non-modifier key...';
                
                // Don't close the dialog, keep waiting for a non-modifier key
                return;
            }
            
            // Build key string with modifiers
            let keyString = '';
            
            if (e.ctrlKey) {
                keyString += 'Ctrl+';
            }
            
            if (e.altKey) {
                keyString += 'Alt+';
            }
            
            if (e.shiftKey) {
                keyString += 'Shift+';
            }
            
            // Add the main key code
            keyString += e.code;
            
            // Update display
            keyDisplay.textContent = keyString;
            
            // Set the value in the target input
            targetInput.value = keyString;
            
            // Close dialog after a short delay
            setTimeout(() => {
                document.body.removeChild(dialogOverlay);
                document.removeEventListener('keydown', keyHandler);
            }, 500);
        };
        
        // Add key event listener
        document.addEventListener('keydown', keyHandler);
    }
    
    // Update UI elements
    public updateUI(): void {
        this.loadKeyBindings();
    }
}