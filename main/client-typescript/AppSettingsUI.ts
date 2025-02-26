import { App } from './app';
import { AliasesUI } from './AliasesUI';
import { TriggersUI } from './TriggersUI';
import { KeyBindingsUI } from './KeyBindingsUI';
import { VariablesUI } from './VariablesUI';
import { ProfilesUI } from './ProfilesUI';

export class AppSettingsUI {
    private app: App;
    private aliasesUI: AliasesUI;
    private triggersUI: TriggersUI;
    private keyBindingsUI: KeyBindingsUI;
    private variablesUI: VariablesUI;
    private profilesUI: ProfilesUI;
    
    private settingsModal: HTMLElement | null = null;
    private modalTitle: HTMLElement | null = null;
    private closeBtn: HTMLElement | null = null;
    private cancelBtn: HTMLElement | null = null;
    private saveBtn: HTMLElement | null = null;
    
    private menuSettings: HTMLElement | null = null;
    private menuAliases: HTMLElement | null = null;
    private menuTriggers: HTMLElement | null = null;
    private menuKeys: HTMLElement | null = null;
    private menuVariables: HTMLElement | null = null;
    
    private sidebarItems: NodeListOf<Element> | null = null;
    private tabContents: NodeListOf<Element> | null = null;
    
    private fontSizeInput: HTMLInputElement | null = null;
    private bgColorInput: HTMLInputElement | null = null;
    private textColorInput: HTMLInputElement | null = null;
    private bgColorValue: HTMLElement | null = null;
    private textColorValue: HTMLElement | null = null;
    private resetBtn: HTMLElement | null = null;
    
    constructor(app: App) {
        this.app = app;
        
        // Create toolbar and modals
        this.createToolbar();
        this.createSettingsModal();
        this.createImportConfirmModal();
        this.createProfileConfirmModal();
        
        // Initialize sub-UI managers once the DOM elements are created
        this.aliasesUI = new AliasesUI(app);
        this.triggersUI = new TriggersUI(app);
        this.keyBindingsUI = new KeyBindingsUI(app);
        this.variablesUI = new VariablesUI(app);
        this.profilesUI = new ProfilesUI(app);
        
        // Initialize UI elements and event listeners
        this.initializeUIElements();
        this.initializeEventListeners();
        this.initializeStyles();
    }
    
    private createToolbar(): void {
        // Create the toolbar that sits above the terminal
        const toolbar = document.createElement('div');
        toolbar.className = 'menu-bar';
        toolbar.innerHTML = `
            <div class="menu-item" id="connect-button">Connect</div>
            <div class="menu-item" id="disconnect-button">Disconnect</div>
            <div class="menu-item" id="menu-settings">Settings</div>
            <div class="menu-item" id="menu-aliases">Aliases</div>
            <div class="menu-item" id="menu-triggers">Triggers</div>
            <div class="menu-item" id="menu-keys">Keys</div>
            <div class="menu-item" id="menu-variables">Variables</div>
            <div class="profile-dropdown-container">
                <select id="quick-profile-select" class="profile-dropdown">
                    <!-- Profiles will be populated here via JavaScript -->
                </select>
            </div>
        `;
        const resizeObserver = new ResizeObserver(entries => {
              this.app.resize();
        });
          
          // Start observing a flex container or item
        resizeObserver.observe(toolbar);
          
        // Insert toolbar before the terminal element
        if (this.app.terminalElement && this.app.terminalElement.parentNode) {
            this.app.terminalElement.parentNode.insertBefore(toolbar, this.app.terminalElement);
        }
        this.app.resize();
    }
    
    private createSettingsModal(): void {
        // Create the settings modal
        const modal = document.createElement('div');
        modal.className = 'modal-overlay';
        modal.id = 'settings-modal';
        modal.innerHTML = `
            <div class="modal-container">
                <div class="modal-sidebar">
                    <div class="sidebar-item active" data-tab="settings">Settings</div>
                    <div class="sidebar-item" data-tab="aliases">Aliases</div>
                    <div class="sidebar-item" data-tab="triggers">Triggers</div>
                    <div class="sidebar-item" data-tab="keys">Keys</div>
                    <div class="sidebar-item" data-tab="variables">Variables</div>
                </div>
                <div class="modal-content">
                    <div class="modal-header">
                        <h2 id="modal-title">Settings</h2>
                        <span class="modal-close">&times;</span>
                    </div>
                    
                    <!-- Settings Tab -->
                    <div class="tab-content active" id="settings-tab">
                        <div style="margin-top: 20px; display: flex; gap: 10px;">
                            <button id="export-settings">Export Settings</button>
                            <button id="import-settings">Import Settings</button>
                        </div>
                        <h3>Settings Profiles</h3>
                        <div class="profile-container" style="margin-bottom: 15px; background-color: #222; padding: 15px; border-radius: 4px; border: 1px solid #444;">
                            <div class="form-row" style="margin-bottom: 15px; display: flex; align-items: center;">
                                <label for="profile-select" style="min-width: 120px; color: white;">Current Profile:</label>
                                <select id="profile-select" style="flex-grow: 1; padding: 8px; background-color: #333; color: white; border: 1px solid #444; border-radius: 4px; margin-right: 10px;">
                                    <!-- Profile options will be populated here -->
                                </select>
                                <button id="switch-profile" style="background-color: #8c1f08;">Switch</button>
                            </div>
                            
                            <div class="form-row" style="margin-bottom: 15px; display: flex; align-items: center;">
                                <label for="new-profile-name" style="min-width: 120px; color: white;">New Profile:</label>
                                <input type="text" id="new-profile-name" style="flex-grow: 1; padding: 8px; background-color: #333; color: white; border: 1px solid #444; border-radius: 4px; margin-right: 10px;" placeholder="Enter profile name">
                                <button id="create-profile" style="background-color: #8c1f08;">Create</button>
                            </div>
                            
                            <div class="form-row" style="display: flex; align-items: center;">
                                <label for="delete-profile-select" style="min-width: 120px; color: white;">Delete Profile:</label>
                                <select id="delete-profile-select" style="flex-grow: 1; padding: 8px; background-color: #333; color: white; border: 1px solid #444; border-radius: 4px; margin-right: 10px;">
                                    <!-- Profile options will be populated here, excluding Default -->
                                </select>
                                <button id="delete-profile" style="background-color: #8c1f08;">Delete</button>
                            </div>
                        </div>
                        <h3>General Settings</h3>
                        <div style="margin-bottom: 15px;">
                            <label for="font-size">Font Size:</label>
                            <input type="number" id="font-size" min="8" max="24" value="14">
                        </div>
                        <div style="margin-bottom: 15px;">
                            <label for="bg-color">Background Color:</label>
                            <input type="color" id="bg-color" value="#000000">
                            <span id="bg-color-value">#000000</span>
                        </div>
                        <div style="margin-bottom: 15px;">
                            <label for="text-color">Text Color:</label>
                            <input type="color" id="text-color" value="#FFFFFF">
                            <span id="text-color-value">#FFFFFF</span>
                        </div>
                        <div style="margin-top: 20px;">
                            <button id="reset-settings">Reset to Default</button>
                        </div>
                    </div>
                    
                    <!-- Aliases Tab -->
                    <div class="tab-content" id="aliases-tab">
                        <h3>Aliases</h3>
                        <div>
                            <div class="table-container">
                                <table style="width: 100%;">
                                    <thead>
                                        <tr>
                                            <th>Alias</th>
                                            <th>Command(s)</th>
                                            <th>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody id="aliases-list">
                                        <!-- Aliases will be added here -->
                                    </tbody>
                                </table>
                            </div>
                            <div id="alias-edit-form-container" class="edit-form-container">
                                <!-- Edit form will be placed here -->
                            </div>
                            <button id="add-alias" class="add-btn">Add Alias</button>
                        </div>
                    </div>
                    
                    <!-- Triggers Tab -->
                    <div class="tab-content" id="triggers-tab">
                        <h3>Triggers</h3>
                        <div>
                            <div class="table-container">
                                <table style="width: 100%;">
                                    <thead>
                                        <tr>
                                            <th>Pattern</th>
                                            <th>Type</th>
                                            <th>Action Type</th>
                                            <th>Actions</th>
                                            <th>Controls</th>
                                        </tr>
                                    </thead>
                                    <tbody id="triggers-list">
                                        <!-- Triggers will be added here -->
                                    </tbody>
                                </table>
                            </div>
                            <div id="trigger-edit-form-container" class="edit-form-container">
                                <!-- Edit form will be placed here -->
                            </div>
                            <button id="add-trigger" class="add-btn">Add Trigger</button>
                        </div>
                    </div>

                    <!-- Keys Tab -->
                    <div class="tab-content" id="keys-tab">
                        <h3>Key Bindings</h3>
                        <div>
                            <div class="table-container">
                                <table style="width: 100%;">
                                    <thead>
                                        <tr>
                                            <th>Key</th>
                                            <th>Command</th>
                                            <th>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody id="keys-list">
                                        <!-- Key bindings will be added here -->
                                    </tbody>
                                </table>
                            </div>
                            <div id="edit-form-container" class="edit-form-container">
                                <!-- Edit form will be placed here -->
                            </div>
                            <button id="add-key" class="add-btn">Add Key Binding</button>
                        </div>
                    </div>

                    <!-- Variables Tab -->
                    <div class="tab-content" id="variables-tab">
                        <h3>Variables</h3>
                        <div>
                            <div class="table-container">
                                <table style="width: 100%;">
                                    <thead>
                                        <tr>
                                            <th>Name</th>
                                            <th>Type</th>
                                            <th>Value</th>
                                            <th>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody id="variables-list">
                                        <!-- Variables will be added here -->
                                    </tbody>
                                </table>
                            </div>
                            <div id="variable-edit-form-container" class="edit-form-container">
                                <!-- Edit form will be placed here -->
                            </div>
                            <button id="add-variable" class="add-btn">Add Variable</button>
                        </div>
                    </div>
                    
                    <div class="modal-footer button-row">
                        <button id="save-settings">Save</button>
                        <button id="cancel-settings">Cancel</button>
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
    }
    
    private createImportConfirmModal(): void {
        const modal = document.createElement('div');
        modal.className = 'modal-overlay';
        modal.id = 'import-confirm-modal';
        modal.style.display = 'none';
        modal.innerHTML = `
            <div class="modal-container" style="width: 50vw; height: auto;">
                <div class="modal-content">
                    <div class="modal-header">
                        <h2>Import Settings</h2>
                        <span class="modal-close" id="import-confirm-close">&times;</span>
                    </div>
                    <div style="padding: 20px; color: white;">
                        <p>Importing settings will replace your current configuration. This includes:</p>
                        <ul style="margin-left: 20px; margin-bottom: 20px;">
                            <li>Aliases</li>
                            <li>Key Bindings</li>
                            <li>Triggers</li>
                            <li>Variables</li>
                            <li>Visual Settings</li>
                        </ul>
                        <p>Are you sure you want to continue?</p>
                    </div>
                    <div class="modal-footer">
                        <button id="confirm-import">Yes, Import</button>
                        <button id="cancel-import" style="background-color: #555;">Cancel</button>
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // Create hidden file input for importing settings
        const fileInput = document.createElement('input');
        fileInput.type = 'file';
        fileInput.id = 'settings-file-input';
        fileInput.accept = '.json';
        fileInput.style.display = 'none';
        document.body.appendChild(fileInput);
    }
    
    private createProfileConfirmModal(): void {
        const modal = document.createElement('div');
        modal.className = 'modal-overlay';
        modal.id = 'profile-confirm-modal';
        modal.style.display = 'none';
        modal.innerHTML = `
            <div class="modal-container" style="width: 50vw; height: auto;">
                <div class="modal-content">
                    <div class="modal-header">
                        <h2>Delete Profile</h2>
                        <span class="modal-close" id="profile-confirm-close">&times;</span>
                    </div>
                    <div style="padding: 20px; color: white;">
                        <p>Are you sure you want to delete this profile?</p>
                        <p>This action cannot be undone.</p>
                    </div>
                    <div class="modal-footer">
                        <button id="confirm-delete-profile" style="background-color: #dc3545;">Delete</button>
                        <button id="cancel-delete-profile" style="background-color: #555;">Cancel</button>
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
    }
    
    private initializeUIElements(): void {
        // Get modal elements
        this.settingsModal = document.getElementById('settings-modal');
        this.modalTitle = document.getElementById('modal-title');
        this.closeBtn = document.querySelector('.modal-close');
        this.cancelBtn = document.getElementById('cancel-settings');
        this.saveBtn = document.getElementById('save-settings');
        
        // Get menu items
        this.menuSettings = document.getElementById('menu-settings');
        this.menuAliases = document.getElementById('menu-aliases');
        this.menuTriggers = document.getElementById('menu-triggers');
        this.menuKeys = document.getElementById('menu-keys');
        this.menuVariables = document.getElementById('menu-variables');
        
        // Get sidebar items and tab contents
        this.sidebarItems = document.querySelectorAll('.sidebar-item');
        this.tabContents = document.querySelectorAll('.tab-content');
        
        // Get settings form elements
        this.fontSizeInput = document.getElementById('font-size') as HTMLInputElement;
        this.bgColorInput = document.getElementById('bg-color') as HTMLInputElement;
        this.textColorInput = document.getElementById('text-color') as HTMLInputElement;
        this.bgColorValue = document.getElementById('bg-color-value');
        this.textColorValue = document.getElementById('text-color-value');
        this.resetBtn = document.getElementById('reset-settings');
        
        // Initialize form values
        this.updateSettingsUI();
    }
    
    private initializeEventListeners(): void {
        // Modal open/close events
        if (this.menuSettings) {
            this.menuSettings.addEventListener('click', () => this.openModal('settings'));
        }
        
        if (this.menuAliases) {
            this.menuAliases.addEventListener('click', () => this.openModal('aliases'));
        }
        
        if (this.menuTriggers) {
            this.menuTriggers.addEventListener('click', () => this.openModal('triggers'));
        }
        
        if (this.menuKeys) {
            this.menuKeys.addEventListener('click', () => this.openModal('keys'));
        }
        
        if (this.menuVariables) {
            this.menuVariables.addEventListener('click', () => this.openModal('variables'));
        }
        
        // Close modal events
        if (this.closeBtn) {
            this.closeBtn.addEventListener('click', () => this.closeModal());
        }
        
        if (this.cancelBtn) {
            this.cancelBtn.addEventListener('click', () => this.closeModal());
        }
        
        if (this.settingsModal) {
            this.settingsModal.addEventListener('click', (e) => {
                if (e.target === this.settingsModal) {
                    this.closeModal();
                }
            });
        }
        
        // Sidebar tab switching
        if (this.sidebarItems) {
            this.sidebarItems.forEach(item => {
                item.addEventListener('click', () => {
                    const tabName = item.getAttribute('data-tab');
                    if (tabName) {
                        this.switchTab(tabName);
                    }
                });
            });
        }
        
        // Settings form events
        if (this.bgColorInput && this.bgColorValue) {
            this.bgColorInput.addEventListener('input', () => {
                if (this.bgColorValue) {
                    this.bgColorValue.textContent = this.bgColorInput!.value;
                }
            });
        }
        
        if (this.textColorInput && this.textColorValue) {
            this.textColorInput.addEventListener('input', () => {
                if (this.textColorValue) {
                    this.textColorValue.textContent = this.textColorInput!.value;
                }
            });
        }
        
        // Reset button event
        if (this.resetBtn) {
            this.resetBtn.addEventListener('click', () => this.resetSettings());
        }
        
        // Save button event
        if (this.saveBtn) {
            this.saveBtn.addEventListener('click', () => this.saveSettings());
        }
        
        // Connect/Disconnect buttons
        const connectBtn = document.getElementById('connect-button');
        const disconnectBtn = document.getElementById('disconnect-button');
        
        if (connectBtn) {
            connectBtn.addEventListener('click', () => {
                this.app.sendCommand("/connect");
                this.focusInput();
            });
        }
        
        if (disconnectBtn) {
            disconnectBtn.addEventListener('click', () => {
                this.app.sendCommand("/disconnect");
                this.focusInput();
            });
        }
        
        // Export/Import settings
        const exportSettingsBtn = document.getElementById('export-settings');
        const importSettingsBtn = document.getElementById('import-settings');
        const settingsFileInput = document.getElementById('settings-file-input') as HTMLInputElement;
        const importConfirmModal = document.getElementById('import-confirm-modal');
        const importConfirmClose = document.getElementById('import-confirm-close');
        const confirmImportBtn = document.getElementById('confirm-import');
        const cancelImportBtn = document.getElementById('cancel-import');
        
        if (exportSettingsBtn) {
            exportSettingsBtn.addEventListener('click', () => this.exportSettings());
        }
        
        if (importSettingsBtn && settingsFileInput) {
            importSettingsBtn.addEventListener('click', () => {
                settingsFileInput.click();
            });
            
            settingsFileInput.addEventListener('change', (event) => {
                if (settingsFileInput.files && settingsFileInput.files.length > 0 && importConfirmModal) {
                    importConfirmModal.style.display = 'block';
                    this.app.setModalOpen(true);
                }
            });
        }
        
        if (importConfirmClose && importConfirmModal) {
            importConfirmClose.addEventListener('click', () => {
                importConfirmModal.style.display = 'none';
                if (settingsFileInput) settingsFileInput.value = '';
                this.app.setModalOpen(false);
            });
        }
        
        if (cancelImportBtn && importConfirmModal) {
            cancelImportBtn.addEventListener('click', () => {
                importConfirmModal.style.display = 'none';
                if (settingsFileInput) settingsFileInput.value = '';
                this.app.setModalOpen(false);
            });
        }
        
        if (confirmImportBtn && importConfirmModal && settingsFileInput) {
            confirmImportBtn.addEventListener('click', () => {
                this.importSettings(settingsFileInput.files?.[0]);
                importConfirmModal.style.display = 'none';
                this.app.setModalOpen(false);
            });
        }
        
        if (importConfirmModal) {
            importConfirmModal.addEventListener('click', (e) => {
                if (e.target === importConfirmModal) {
                    importConfirmModal.style.display = 'none';
                    if (settingsFileInput) settingsFileInput.value = '';
                    this.app.setModalOpen(false);
                }
            });
        }
    }
    
    private initializeStyles(): void {
        const style = document.createElement('style');
        style.textContent = `
            @keyframes fadeOut {
                from { opacity: 1; }
                to { opacity: 0; }
            }
            
            .key-capture-overlay {
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background-color: rgba(0, 0, 0, 0.7);
                display: flex;
                justify-content: center;
                align-items: center;
                z-index: 2000;
            }
            
            .key-capture-dialog {
                background-color: #222;
                border: 1px solid #444;
                border-radius: 4px;
                padding: 20px;
                width: 400px;
                max-width: 90%;
            }
            
            .key-capture-content {
                text-align: center;
            }
            
            .key-display {
                margin: 20px 0;
                padding: 10px;
                background-color: #333;
                border: 1px solid #555;
                border-radius: 4px;
                font-family: monospace;
                font-size: 18px;
                color: white;
            }
            
            .pattern-test-container {
                margin-top: 20px;
                padding: 15px;
                background-color: #222;
                border: 1px solid #444;
                border-radius: 4px;
            }
            
            .pattern-test-result {
                margin-top: 10px;
                padding: 10px;
                border-radius: 4px;
            }
            
            .pattern-test-result.success {
                background-color: rgba(40, 167, 69, 0.3);
                border: 1px solid #28a745;
            }
            
            .pattern-test-result.failure {
                background-color: rgba(220, 53, 69, 0.3);
                border: 1px solid #dc3545;
            }
        `;
        document.head.appendChild(style);
    }
    
    private openModal(tabName: string): void {
        this.app.setModalOpen(true);
        this.loadSavedSettings();
        
        if (this.settingsModal) {
            this.settingsModal.style.display = 'block';
        }
        
        this.switchTab(tabName);
        
        // Update modal title
        if (this.modalTitle) {
            this.modalTitle.textContent = tabName.charAt(0).toUpperCase() + tabName.slice(1);
        }
    }
    
    private closeModal(): void {
        if (this.settingsModal) {
            this.settingsModal.style.display = 'none';
        }
        this.app.setModalOpen(false);
        this.focusInput();
    }
    
    private switchTab(tabName: string): void {
        // Return if elements not found
        if (!this.sidebarItems || !this.tabContents) return;
        
        // Handle special cases for different tabs
        if (tabName === 'settings') {
            this.loadSavedSettings();
        }
        
        // Update active sidebar item
        this.sidebarItems.forEach(item => {
            item.classList.remove('active');
            if (item.getAttribute('data-tab') === tabName) {
                item.classList.add('active');
            }
        });
        
        // Update active content
        this.tabContents.forEach(content => {
            content.classList.remove('active');
            if (content.id === `${tabName}-tab`) {
                content.classList.add('active');
            }
        });
        
        // Update modal title
        if (this.modalTitle) {
            this.modalTitle.textContent = tabName.charAt(0).toUpperCase() + tabName.slice(1);
        }
        
        // Load specific tab content
        switch (tabName) {
            case 'aliases':
                this.aliasesUI.loadAliases();
                break;
            case 'triggers':
                this.triggersUI.loadTriggers();
                break;
            case 'keys':
                this.keyBindingsUI.loadKeyBindings();
                break;
            case 'variables':
                this.variablesUI.loadVariables();
                break;
        }
    }
    
    private loadSavedSettings(): void {
        // Make sure UI elements exist
        if (!this.fontSizeInput || !this.bgColorInput || !this.textColorInput || 
            !this.bgColorValue || !this.textColorValue) {
            return;
        }
        
        // Update form values from app settings
        this.fontSizeInput.value = this.app.settings.fontSize.toString();
        this.bgColorInput.value = this.app.settings.backgroundColor;
        this.bgColorValue.textContent = this.app.settings.backgroundColor;
        this.textColorInput.value = this.app.settings.foregroundColor;
        this.textColorValue.textContent = this.app.settings.foregroundColor;
        
        // Update profiles UI
        this.profilesUI.updateUI();
        
        // Update other settings tabs
        this.aliasesUI.updateUI();
        this.keyBindingsUI.updateUI();
        this.triggersUI.updateUI();
        this.variablesUI.updateUI();
    }
    
    private resetSettings(): void {
        // Reset form values to defaults
        if (this.fontSizeInput) this.fontSizeInput.value = '14';
        if (this.bgColorInput && this.bgColorValue) {
            this.bgColorInput.value = '#000000';
            this.bgColorValue.textContent = '#000000';
        }
        if (this.textColorInput && this.textColorValue) {
            this.textColorInput.value = '#FFFFFF';
            this.textColorValue.textContent = '#FFFFFF';
        }
    }
    
    private saveSettings(): void {
        // Update app settings with form values
        if (this.fontSizeInput) this.app.settings.fontSize = parseInt(this.fontSizeInput.value);
        if (this.bgColorInput) this.app.settings.backgroundColor = this.bgColorInput.value;
        if (this.textColorInput) this.app.settings.foregroundColor = this.textColorInput.value;
        
        // Save settings
        this.app.saveSettings();
        this.app.applySettings();
        
        // Close modal
        this.closeModal();
    }
    
    private exportSettings(): void {
        // Get settings JSON
        const settingsJson = this.app.exportSettings();
        
        // Create blob and download link
        const blob = new Blob([settingsJson], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        // Create filename with date
        const date = new Date();
        const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
        const filename = `mud-settings-${dateStr}.json`;
        
        // Create temporary anchor and trigger download
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        
        // Clean up
        setTimeout(() => {
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        }, 100);
    }
    
    private importSettings(file: File | undefined): void {
        if (!file) {
            this.app.showNotification('No file selected', false);
            return;
        }
        
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                if (typeof e.target?.result !== 'string') {
                    throw new Error('Invalid file format');
                }
                
                const success = this.app.importSettings(e.target.result);
                
                if (success) {
                    this.app.showNotification('Settings imported successfully!', true);
                    
                    // Update UI to reflect changes
                    this.loadSavedSettings();
                } else {
                    this.app.showNotification('Error importing settings', false);
                }
            } catch (error) {
                this.app.showNotification(`Error reading file: ${error}`, false);
            }
            
            // Reset file input
            const fileInput = document.getElementById('settings-file-input') as HTMLInputElement;
            if (fileInput) fileInput.value = '';
        };
        
        reader.onerror = () => {
            this.app.showNotification('Error reading file', false);
            
            // Reset file input
            const fileInput = document.getElementById('settings-file-input') as HTMLInputElement;
            if (fileInput) fileInput.value = '';
        };
        
        reader.readAsText(file);
    }
    
    // Helper method to focus the input field
    private focusInput(): void {
        const inputField = document.getElementById('input') as HTMLInputElement;
        if (inputField) {
            inputField.select();
        }
    }
    
    // Public method to update all UI elements
    public updateSettingsUI(): void {
        // Make sure UI elements exist
        if (!this.fontSizeInput || !this.bgColorInput || !this.textColorInput || 
            !this.bgColorValue || !this.textColorValue) {
            return;
        }
        
        // Update form values from app settings
        this.fontSizeInput.value = this.app.settings.fontSize.toString();
        this.bgColorInput.value = this.app.settings.backgroundColor;
        this.bgColorValue.textContent = this.app.settings.backgroundColor;
        this.textColorInput.value = this.app.settings.foregroundColor;
        this.textColorValue.textContent = this.app.settings.foregroundColor;
        
        // Update profiles UI
        this.profilesUI.updateUI();
    }
    
    // Public method for updating all UI components
    public updateUI(): void {
        this.updateSettingsUI();
        this.aliasesUI.updateUI();
        this.triggersUI.updateUI();
        this.keyBindingsUI.updateUI();
        this.variablesUI.updateUI();
        this.profilesUI.updateUI();
    }
}