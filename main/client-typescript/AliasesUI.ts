import { App } from './app';

export class AliasesUI {
    private app: App;
    private aliasesList: HTMLElement | null = null;
    private editFormContainer: HTMLElement | null = null;
    private addAliasBtn: HTMLElement | null = null;
    
    constructor(app: App) {
        this.app = app;
        this.initializeUIElements();
        this.initializeEventListeners();
    }
    
    private initializeUIElements(): void {
        this.aliasesList = document.getElementById('aliases-list');
        this.editFormContainer = document.getElementById('alias-edit-form-container');
        this.addAliasBtn = document.getElementById('add-alias');
    }
    
    private initializeEventListeners(): void {
        if (this.addAliasBtn) {
            this.addAliasBtn.addEventListener('click', () => {
                this.showEditForm(null, -1);
            });
        }
    }
    
    // Load aliases from app settings into the UI
    public loadAliases(): void {
        if (!this.aliasesList || !this.app.settings.Aliases) {
            return;
        }
        
        // Clear existing list
        this.aliasesList.innerHTML = '';
        
        // Clear edit form container
        if (this.editFormContainer) {
            this.editFormContainer.innerHTML = '';
            this.editFormContainer.classList.remove('active');
        }
        
        // Add each alias to the list
        this.app.settings.Aliases.forEach((alias, index) => {
            if(this.aliasesList === null)
                return;
            const row = document.createElement('tr');
            row.dataset.index = index.toString();
            
            const aliasCell = document.createElement('td');
            aliasCell.textContent = alias.alias;
            row.appendChild(aliasCell);
            
            const commandCell = document.createElement('td');
            commandCell.textContent = alias.command;
            row.appendChild(commandCell);
            
            const actionCell = document.createElement('td');
            
            // Edit button
            const editBtn = document.createElement('button');
            editBtn.textContent = 'Edit';
            editBtn.style.marginRight = '5px';
            editBtn.addEventListener('click', () => {
                this.showEditForm(alias, index);
            });
            
            // Delete button
            const deleteBtn = document.createElement('button');
            deleteBtn.textContent = 'Delete';
            deleteBtn.addEventListener('click', () => {
                // Remove the alias
                this.app.settings.Aliases.splice(index, 1);
                
                // Save settings and reload list
                this.app.saveSettings();
                this.loadAliases();
            });
            
            actionCell.appendChild(editBtn);
            actionCell.appendChild(deleteBtn);
            row.appendChild(actionCell);
            
            this.aliasesList.appendChild(row);
        });
    }
    
    // Show edit form for adding or editing an alias
    private showEditForm(alias: { alias: string, command: string } | null, index: number): void {
        if (!this.editFormContainer) return;
        
        // Clear previous form content
        this.editFormContainer.innerHTML = '';
        
        // Create the form content
        const formTitle = document.createElement('h4');
        formTitle.textContent = index === -1 ? 'Add New Alias' : 'Edit Alias';
        this.editFormContainer.appendChild(formTitle);
        
        // Create alias input row
        const aliasRow = document.createElement('div');
        aliasRow.className = 'form-row';
        
        const aliasLabel = document.createElement('label');
        aliasLabel.textContent = 'Alias:';
        aliasLabel.setAttribute('for', 'edit-alias-input');
        
        const aliasInput = document.createElement('input');
        aliasInput.type = 'text';
        aliasInput.id = 'edit-alias-input';
        aliasInput.value = alias ? alias.alias : '';
        aliasInput.placeholder = 'e.g., n, sw, l';
        
        aliasRow.appendChild(aliasLabel);
        aliasRow.appendChild(aliasInput);
        this.editFormContainer.appendChild(aliasRow);
        
        // Create command input row
        const cmdRow = document.createElement('div');
        cmdRow.className = 'form-row';
        
        const cmdLabel = document.createElement('label');
        cmdLabel.textContent = 'Command:';
        cmdLabel.setAttribute('for', 'edit-alias-cmd-input');
        
        const cmdInput = document.createElement('input');
        cmdInput.type = 'text';
        cmdInput.id = 'edit-alias-cmd-input';
        cmdInput.value = alias ? alias.command : '';
        cmdInput.placeholder = 'e.g., north, southwest, look';
        
        cmdRow.appendChild(cmdLabel);
        cmdRow.appendChild(cmdInput);
        this.editFormContainer.appendChild(cmdRow);
        
        // Add a hint about aliases
        const hintText = document.createElement('div');
        hintText.innerHTML = '<small>Tip: Aliases let you type a shorter command that expands to a longer one. For example, use "n" for "north".</small>';
        hintText.style.marginTop = '5px';
        hintText.style.color = '#999';
        this.editFormContainer.appendChild(hintText);
        
        // Create button row
        const buttonRow = document.createElement('div');
        buttonRow.className = 'button-row';
        
        // Save button
        const saveBtn = document.createElement('button');
        saveBtn.textContent = 'Save';
        saveBtn.addEventListener('click', () => {
            if (index === -1) {
                // Adding new alias
                this.app.settings.Aliases.push({
                    alias: aliasInput.value,
                    command: cmdInput.value
                });
            } else {
                // Updating existing alias
                if (alias) {
                    alias.alias = aliasInput.value;
                    alias.command = cmdInput.value;
                }
            }
            
            // Save settings and reload
            this.app.saveSettings();
            this.loadAliases();
        });
        
        // Cancel button
        const cancelBtn = document.createElement('button');
        cancelBtn.textContent = 'Cancel';
        cancelBtn.style.backgroundColor = '#555';
        cancelBtn.addEventListener('click', () => {
            this.editFormContainer!.innerHTML = '';
            this.editFormContainer!.classList.remove('active');
        });
        
        buttonRow.appendChild(saveBtn);
        buttonRow.appendChild(cancelBtn);
        this.editFormContainer.appendChild(buttonRow);
        
        // Show the form container
        this.editFormContainer.classList.add('active');
    }
    
    // Update UI elements
    public updateUI(): void {
        this.loadAliases();
    }
}