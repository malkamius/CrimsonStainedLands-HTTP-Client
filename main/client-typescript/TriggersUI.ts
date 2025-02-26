import { App } from './app';

export class TriggersUI {
    private app: App;
    private triggersList: HTMLElement | null = null;
    private editFormContainer: HTMLElement | null = null;
    private addTriggerBtn: HTMLElement | null = null;
    
    constructor(app: App) {
        this.app = app;
        this.initializeUIElements();
        this.initializeEventListeners();
    }
    
    private initializeUIElements(): void {
        this.triggersList = document.getElementById('triggers-list');
        this.editFormContainer = document.getElementById('trigger-edit-form-container');
        this.addTriggerBtn = document.getElementById('add-trigger');
    }
    
    private initializeEventListeners(): void {
        if (this.addTriggerBtn) {
            this.addTriggerBtn.addEventListener('click', () => {
                this.showEditForm(null, -1);
            });
        }
    }
    
    // Load triggers from app settings into the UI
    public loadTriggers(): void {
        if (!this.triggersList || !this.app.settings.Triggers) {
            return;
        }
        
        // Clear existing list
        this.triggersList.innerHTML = '';
        
        // Clear edit form container
        if (this.editFormContainer) {
            this.editFormContainer.innerHTML = '';
            this.editFormContainer.classList.remove('active');
        }
        
        // Add each trigger to the list
        this.app.settings.Triggers.forEach((trigger, index) => {
            if(this.triggersList === null)
                return;
            const row = document.createElement('tr');
            row.dataset.index = index.toString();
            
            const patternCell = document.createElement('td');
            patternCell.textContent = trigger.match;
            row.appendChild(patternCell);
            
            const typeCell = document.createElement('td');
            typeCell.textContent = trigger.type || 'regex';
            row.appendChild(typeCell);
            
            const actionTypeCell = document.createElement('td');
            actionTypeCell.textContent = trigger.actionType || 'text';
            row.appendChild(actionTypeCell);
            
            const actionCell = document.createElement('td');
            actionCell.textContent = trigger.actions;
            row.appendChild(actionCell);
            
            const controlsCell = document.createElement('td');
            
            // Edit button
            const editBtn = document.createElement('button');
            editBtn.textContent = 'Edit';
            editBtn.style.marginRight = '5px';
            editBtn.addEventListener('click', () => {
                this.showEditForm(trigger, index);
            });
            
            // Delete button
            const deleteBtn = document.createElement('button');
            deleteBtn.textContent = 'Delete';
            deleteBtn.addEventListener('click', () => {
                // Remove the trigger
                this.app.settings.Triggers.splice(index, 1);
                
                // Save settings and reload list
                this.app.saveSettings();
                this.loadTriggers();
            });
            
            controlsCell.appendChild(editBtn);
            controlsCell.appendChild(deleteBtn);
            row.appendChild(controlsCell);
            
            this.triggersList.appendChild(row);
        });
    }
    
    // Show edit form for adding or editing a trigger
    private showEditForm(trigger: { match: string, type: string, actions: string, actionType: string } | null, index: number): void {
        if (!this.editFormContainer) return;
        
        // Clear previous form content
        this.editFormContainer.innerHTML = '';
        
        // Create the form content
        const formTitle = document.createElement('h4');
        formTitle.textContent = index === -1 ? 'Add New Trigger' : 'Edit Trigger';
        this.editFormContainer.appendChild(formTitle);
        
        // Create pattern input row
        const patternRow = document.createElement('div');
        patternRow.className = 'form-row';
        
        const patternLabel = document.createElement('label');
        patternLabel.textContent = 'Pattern:';
        patternLabel.setAttribute('for', 'edit-trigger-pattern');
        
        const patternInput = document.createElement('input');
        patternInput.type = 'text';
        patternInput.id = 'edit-trigger-pattern';
        patternInput.value = trigger ? trigger.match : '';
        patternInput.placeholder = 'e.g., ^You are hungry\\.$';
        
        patternRow.appendChild(patternLabel);
        patternRow.appendChild(patternInput);
        this.editFormContainer.appendChild(patternRow);
        
        // Create match type select row
        const typeRow = document.createElement('div');
        typeRow.className = 'form-row';
        
        const typeLabel = document.createElement('label');
        typeLabel.textContent = 'Match Type:';
        typeLabel.setAttribute('for', 'edit-trigger-type');
        
        const typeSelect = document.createElement('select');
        typeSelect.id = 'edit-trigger-type';
        
        const typeOptions = ['regex', 'substring', 'exact'];
        typeOptions.forEach(option => {
            const optEl = document.createElement('option');
            optEl.value = option;
            optEl.textContent = option.charAt(0).toUpperCase() + option.slice(1);
            if (trigger && trigger.type === option) {
                optEl.selected = true;
            } else if (!trigger && option === 'regex') {
                // Default to regex for new triggers
                optEl.selected = true;
            }
            typeSelect.appendChild(optEl);
        });
        
        typeRow.appendChild(typeLabel);
        typeRow.appendChild(typeSelect);
        this.editFormContainer.appendChild(typeRow);
        
        // Create action type select row
        const actionTypeRow = document.createElement('div');
        actionTypeRow.className = 'form-row';
        
        const actionTypeLabel = document.createElement('label');
        actionTypeLabel.textContent = 'Action Type:';
        actionTypeLabel.setAttribute('for', 'edit-trigger-action-type');
        
        const actionTypeSelect = document.createElement('select');
        actionTypeSelect.id = 'edit-trigger-action-type';
        
        const actionTypeOptions = ['text', 'javascript'];
        actionTypeOptions.forEach(option => {
            const optEl = document.createElement('option');
            optEl.value = option;
            optEl.textContent = option.charAt(0).toUpperCase() + option.slice(1);
            if (trigger && trigger.actionType === option) {
                optEl.selected = true;
            } else if (!trigger && option === 'text') {
                // Default to text for new triggers
                optEl.selected = true;
            }
            actionTypeSelect.appendChild(optEl);
        });
        
        actionTypeRow.appendChild(actionTypeLabel);
        actionTypeRow.appendChild(actionTypeSelect);
        this.editFormContainer.appendChild(actionTypeRow);
        
        // Create actions textarea row
        const actionsRow = document.createElement('div');
        actionsRow.className = 'form-row';
        
        const actionsLabel = document.createElement('label');
        actionsLabel.textContent = 'Actions:';
        actionsLabel.setAttribute('for', 'edit-trigger-actions');
        
        const actionsInput = document.createElement('textarea');
        actionsInput.id = 'edit-trigger-actions';
        actionsInput.value = trigger ? trigger.actions : '';
        actionsInput.placeholder = 'Enter commands or JavaScript code';
        
        // Change the placeholder based on the selected action type
        actionTypeSelect.addEventListener('change', () => {
            if (actionTypeSelect.value === 'text') {
                actionsInput.placeholder = 'Enter commands to execute when triggered';
            } else {
                actionsInput.placeholder = 'Enter JavaScript code to execute when triggered';
            }
        });
        
        actionsRow.appendChild(actionsLabel);
        actionsRow.appendChild(actionsInput);
        this.editFormContainer.appendChild(actionsRow);
        
        // Add a hint about triggers and action types
        const hintText = document.createElement('div');
        hintText.innerHTML = '<small>Tip: Triggers automatically execute actions when matching text appears in the MUD output.<br>' + 
            'Text actions are sent to the MUD as commands.<br>' +
            'JavaScript actions are executed in the browser and can use <code>window.mudApp</code> to interact with the client.</small>';
        hintText.style.marginTop = '5px';
        hintText.style.color = '#999';
        this.editFormContainer.appendChild(hintText);
        
        // Add pattern test section
        const testContainer = document.createElement('div');
        testContainer.className = 'pattern-test-container';
        
        const testTitle = document.createElement('h4');
        testTitle.textContent = 'Test Pattern';
        testContainer.appendChild(testTitle);
        
        const testInputRow = document.createElement('div');
        testInputRow.className = 'form-row';
        
        const testInputLabel = document.createElement('label');
        testInputLabel.textContent = 'Test Text:';
        testInputLabel.setAttribute('for', 'pattern-test-input');
        
        const testInput = document.createElement('textarea');
        testInput.id = 'pattern-test-input';
        testInput.placeholder = 'Enter text to test against the pattern';
        testInput.rows = 4; // Set an initial height of 4 rows
        testInput.style.width = 'calc(100% - 110px)';
        testInput.style.maxWidth = '400px';
        
        testInputRow.appendChild(testInputLabel);
        testInputRow.appendChild(testInput);
        testContainer.appendChild(testInputRow);
        
        const testButton = document.createElement('button');
        testButton.textContent = 'Test Pattern';
        testButton.addEventListener('click', () => {
            // Get the current pattern and type
            const pattern = patternInput.value;
            const type = typeSelect.value;
            const testText = testInput.value;
            
            if (!pattern || !testText) {
                return;
            }
            
            let isMatch = false;
            
            try {
                isMatch = this.app.matchTrigger(testText, type, pattern);
                
                // Get or create result element
                let resultElement = document.getElementById('pattern-test-result');
                if (!resultElement) {
                    resultElement = document.createElement('div');
                    resultElement.id = 'pattern-test-result';
                    resultElement.className = 'pattern-test-result';
                    testContainer.appendChild(resultElement);
                }
                
                // Update result
                if (isMatch) {
                    resultElement.textContent = 'Match found! The trigger would activate.';
                    resultElement.className = 'pattern-test-result success';
                } else {
                    resultElement.textContent = 'No match. The trigger would not activate.';
                    resultElement.className = 'pattern-test-result failure';
                }
            } catch (error) {
                // Handle regex errors
                let resultElement = document.getElementById('pattern-test-result');
                if (!resultElement) {
                    resultElement = document.createElement('div');
                    resultElement.id = 'pattern-test-result';
                    resultElement.className = 'pattern-test-result';
                    testContainer.appendChild(resultElement);
                }
                resultElement.textContent = `Error: ${error instanceof Error ? error.message : 'Unknown error'}`;
                resultElement.className = 'pattern-test-result failure';
            }
        });
        
        testContainer.appendChild(testButton);
        this.editFormContainer.appendChild(testContainer);
        
        // Create button row
        const buttonRow = document.createElement('div');
        buttonRow.className = 'button-row';
        buttonRow.style.marginTop = '20px';
        
        // Save button
        const saveBtn = document.createElement('button');
        saveBtn.textContent = 'Save';
        saveBtn.addEventListener('click', () => {
            if (index === -1) {
                // Adding new trigger
                this.app.settings.Triggers.push({
                    match: patternInput.value,
                    type: typeSelect.value,
                    actions: actionsInput.value,
                    actionType: actionTypeSelect.value
                });
            } else {
                // Updating existing trigger
                if (trigger) {
                    trigger.match = patternInput.value;
                    trigger.type = typeSelect.value;
                    trigger.actions = actionsInput.value;
                    trigger.actionType = actionTypeSelect.value;
                }
            }
            
            // Save settings and reload
            this.app.saveSettings();
            this.loadTriggers();
        });
        
        // Cancel button
        const cancelBtn = document.createElement('button');
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
        
        // Set initial placeholder based on current action type
        if (trigger && trigger.actionType === 'javascript') {
            actionsInput.placeholder = 'Enter JavaScript code to execute when triggered';
        }
    }
    
    // Update UI elements
    public updateUI(): void {
        this.loadTriggers();
    }
}