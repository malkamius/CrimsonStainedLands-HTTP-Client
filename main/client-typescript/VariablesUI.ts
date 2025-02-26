import { App } from './app';

export class VariablesUI {
    private app: App;
    private variablesList: HTMLElement | null = null;
    private editFormContainer: HTMLElement | null = null;
    private addVariableBtn: HTMLElement | null = null;
    
    constructor(app: App) {
        this.app = app;
        this.initializeUIElements();
        this.initializeEventListeners();
    }
    
    private initializeUIElements(): void {
        this.variablesList = document.getElementById('variables-list');
        this.editFormContainer = document.getElementById('variable-edit-form-container');
        this.addVariableBtn = document.getElementById('add-variable');
    }
    
    private initializeEventListeners(): void {
        if (this.addVariableBtn) {
            this.addVariableBtn.addEventListener('click', () => {
                this.showEditForm(null, -1);
            });
        }
    }
    
    // Load variables from app settings into the UI
    public loadVariables(): void {
        if (!this.variablesList || !this.app.settings.Variables) {
            return;
        }
        
        // Clear existing list
        this.variablesList.innerHTML = '';
        
        // Clear edit form container
        if (this.editFormContainer) {
            this.editFormContainer.innerHTML = '';
            this.editFormContainer.classList.remove('active');
        }
        
        // Add each variable to the list
        this.app.settings.Variables.forEach((variable, index) => {
            if(this.variablesList === null)
                return;
            const row = document.createElement('tr');
            row.dataset.index = index.toString();
            
            const nameCell = document.createElement('td');
            nameCell.textContent = variable.name;
            row.appendChild(nameCell);
            
            const typeCell = document.createElement('td');
            typeCell.textContent = variable.type || 'string';
            row.appendChild(typeCell);
            
            const valueCell = document.createElement('td');
            valueCell.textContent = variable.value;
            row.appendChild(valueCell);
            
            const actionCell = document.createElement('td');
            
            // Edit button
            const editBtn = document.createElement('button');
            editBtn.className = 'client-button';
            editBtn.textContent = 'Edit';
            editBtn.style.marginRight = '5px';
            editBtn.addEventListener('click', () => {
                this.showEditForm(variable, index);
            });
            
            // Delete button
            const deleteBtn = document.createElement('button');
            deleteBtn.className = 'client-button';
            deleteBtn.textContent = 'Delete';
            deleteBtn.addEventListener('click', () => {
                // Remove the variable
                this.app.settings.Variables.splice(index, 1);
                
                // Save settings and reload list
                this.app.saveSettings();
                this.loadVariables();
            });
            
            actionCell.appendChild(editBtn);
            actionCell.appendChild(deleteBtn);
            row.appendChild(actionCell);
            
            this.variablesList.appendChild(row);
        });
    }
    
    // Show edit form for adding or editing a variable
    private showEditForm(variable: { name: string, type: string, value: string } | null, index: number): void {
        if (!this.editFormContainer) return;
        
        // Clear previous form content
        this.editFormContainer.innerHTML = '';
        
        // Create the form content
        const formTitle = document.createElement('h4');
        formTitle.textContent = index === -1 ? 'Add New Variable' : 'Edit Variable';
        this.editFormContainer.appendChild(formTitle);
        
        // Create name input row
        const nameRow = document.createElement('div');
        nameRow.className = 'form-row';
        
        const nameLabel = document.createElement('label');
        nameLabel.textContent = 'Name:';
        nameLabel.setAttribute('for', 'edit-variable-name');
        
        const nameInput = document.createElement('input');
        nameInput.type = 'text';
        nameInput.id = 'edit-variable-name';
        nameInput.value = variable ? variable.name : '';
        nameInput.placeholder = 'e.g., HP, TARGET, LOCATION';
        
        nameRow.appendChild(nameLabel);
        nameRow.appendChild(nameInput);
        this.editFormContainer.appendChild(nameRow);
        
        // Create type select row
        const typeRow = document.createElement('div');
        typeRow.className = 'form-row';
        
        const typeLabel = document.createElement('label');
        typeLabel.textContent = 'Type:';
        typeLabel.setAttribute('for', 'edit-variable-type');
        
        const typeSelect = document.createElement('select');
        typeSelect.id = 'edit-variable-type';
        
        const typeOptions = ['string', 'number', 'boolean'];
        typeOptions.forEach(option => {
            const optEl = document.createElement('option');
            optEl.value = option;
            optEl.textContent = option.charAt(0).toUpperCase() + option.slice(1);
            if (variable && variable.type === option) {
                optEl.selected = true;
            } else if (!variable && option === 'string') {
                // Default to string for new variables
                optEl.selected = true;
            }
            typeSelect.appendChild(optEl);
        });
        
        typeRow.appendChild(typeLabel);
        typeRow.appendChild(typeSelect);
        this.editFormContainer.appendChild(typeRow);
        
        // Create value input row
        const valueRow = document.createElement('div');
        valueRow.className = 'form-row';
        
        const valueLabel = document.createElement('label');
        valueLabel.textContent = 'Value:';
        valueLabel.setAttribute('for', 'edit-variable-value');
        
        const valueInput = document.createElement('input');
        valueInput.type = 'text';
        valueInput.id = 'edit-variable-value';
        valueInput.value = variable ? variable.value : '';
        valueInput.placeholder = 'Enter variable value';
        
        valueRow.appendChild(valueLabel);
        valueRow.appendChild(valueInput);
        this.editFormContainer.appendChild(valueRow);
        
        // Add a hint about variables
        const hintText = document.createElement('div');
        hintText.innerHTML = '<small>Tip: Variables can be used in commands with the $VARNAME syntax. For example, "attack $TARGET" will be replaced with the value of the TARGET variable.</small>';
        hintText.style.marginTop = '5px';
        hintText.style.color = '#999';
        this.editFormContainer.appendChild(hintText);
        
        // Create button row
        const buttonRow = document.createElement('div');
        buttonRow.className = 'button-row';
        buttonRow.style.marginTop = '20px';
        
        // Save button
        const saveBtn = document.createElement('button');
        saveBtn.className = 'client-button';
        saveBtn.textContent = 'Save';
        saveBtn.addEventListener('click', () => {
            // Validate the variable name (cannot be empty and must be alphanumeric)
            const name = nameInput.value.trim().toUpperCase();
            if (!name) {
                this.app.showNotification('Variable name cannot be empty', false);
                return;
            }
            
            if (!/^[A-Z0-9_]+$/.test(name)) {
                this.app.showNotification('Variable name can only contain letters, numbers, and underscores', false);
                return;
            }
            
            // Check for duplicate names (except when editing the same variable)
            const duplicateIndex = this.app.settings.Variables.findIndex(v => 
                v.name.toUpperCase() === name && 
                (index === -1 || this.app.settings.Variables.indexOf(v) !== index)
            );
            
            if (duplicateIndex !== -1) {
                this.app.showNotification(`A variable with the name "${name}" already exists`, false);
                return;
            }
            
            // Format the value based on the type
            let value = valueInput.value;
            const type = typeSelect.value;
            
            if (type === 'number') {
                const num = parseFloat(value);
                if (isNaN(num)) {
                    this.app.showNotification('Please enter a valid number', false);
                    return;
                }
                value = num.toString();
            } else if (type === 'boolean') {
                // Convert various truthy/falsy values to boolean strings
                value = value.toLowerCase();
                if (['true', '1', 'yes', 'y', 'on'].includes(value)) {
                    value = 'true';
                } else {
                    value = 'false';
                }
            }
            
            if (index === -1) {
                // Adding new variable
                this.app.settings.Variables.push({
                    name: name,
                    type: type,
                    value: value
                });
            } else {
                // Updating existing variable
                if (variable) {
                    variable.name = name;
                    variable.type = type;
                    variable.value = value;
                }
            }
            
            // Save settings and reload
            this.app.saveSettings();
            this.loadVariables();
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
        
        // Add type-specific input handling
        typeSelect.addEventListener('change', () => {
            const selectedType = typeSelect.value;
            
            // Update the input type or appearance based on the selected type
            if (selectedType === 'boolean') {
                // For boolean, we could provide a simpler interface
                valueInput.placeholder = 'Enter true or false';
                
                // If the current value isn't already boolean-like, set a default
                const currentVal = valueInput.value.toLowerCase();
                if (!['true', 'false', '0', '1', 'yes', 'no', 'y', 'n', 'on', 'off'].includes(currentVal)) {
                    valueInput.value = 'false';
                }
            } else if (selectedType === 'number') {
                valueInput.placeholder = 'Enter a number';
                valueInput.type = 'number';
                
                // Try to convert current value to number
                const num = parseFloat(valueInput.value);
                if (isNaN(num)) {
                    valueInput.value = '0';
                }
            } else {
                // String type
                valueInput.placeholder = 'Enter variable value';
                valueInput.type = 'text';
            }
        });
        
        // Initialize the input based on current type
        if (variable && variable.type) {
            const event = new Event('change');
            typeSelect.dispatchEvent(event);
        }
    }
    
    // Update UI elements
    public updateUI(): void {
        this.loadVariables();
    }
}