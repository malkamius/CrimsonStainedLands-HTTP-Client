import { App } from './app';

export class ProfilesUI {
    private app: App;
    
    // Profile UI elements
    private profileSelect: HTMLSelectElement | null = null;
    private deleteProfileSelect: HTMLSelectElement | null = null;
    private quickProfileSelect: HTMLSelectElement | null = null;
    private newProfileNameInput: HTMLInputElement | null = null;
    private switchProfileBtn: HTMLElement | null = null;
    private createProfileBtn: HTMLElement | null = null;
    private deleteProfileBtn: HTMLElement | null = null;
    
    // Profile confirmation modal elements
    private profileConfirmModal: HTMLElement | null = null;
    private profileConfirmClose: HTMLElement | null = null;
    private confirmDeleteProfileBtn: HTMLElement | null = null;
    private cancelDeleteProfileBtn: HTMLElement | null = null;
    
    private profileToDelete: string = '';
    
    constructor(app: App) {
        this.app = app;
        this.initializeUIElements();
        this.initializeEventListeners();
    }
    
    private initializeUIElements(): void {
        // Get profile UI elements
        this.profileSelect = document.getElementById('profile-select') as HTMLSelectElement;
        this.deleteProfileSelect = document.getElementById('delete-profile-select') as HTMLSelectElement;
        this.quickProfileSelect = document.getElementById('quick-profile-select') as HTMLSelectElement;
        this.newProfileNameInput = document.getElementById('new-profile-name') as HTMLInputElement;
        this.switchProfileBtn = document.getElementById('switch-profile');
        this.createProfileBtn = document.getElementById('create-profile');
        this.deleteProfileBtn = document.getElementById('delete-profile');
        
        // Get profile confirmation modal elements
        this.profileConfirmModal = document.getElementById('profile-confirm-modal');
        this.profileConfirmClose = document.getElementById('profile-confirm-close');
        this.confirmDeleteProfileBtn = document.getElementById('confirm-delete-profile');
        this.cancelDeleteProfileBtn = document.getElementById('cancel-delete-profile');
    }
    
    private initializeEventListeners(): void {
        // Switch profile button
        if (this.switchProfileBtn && this.profileSelect) {
            this.switchProfileBtn.addEventListener('click', () => {
                const selectedProfile = this.profileSelect!.value;
                if (selectedProfile) {
                    if (this.app.switchProfile(selectedProfile)) {
                        // Show notification
                        this.app.showNotification(`Profile switched to "${selectedProfile}"`, true);
                        
                        // Refresh ALL profile UI elements
                        this.updateUI();
                    }
                }
            });
        }
        
        // Create profile button
        if (this.createProfileBtn && this.newProfileNameInput) {
            this.createProfileBtn.addEventListener('click', () => {
                const profileName = this.newProfileNameInput!.value.trim();
                if (profileName) {
                    if (this.app.createProfile(profileName)) {
                        // Show notification
                        this.app.showNotification(`Profile "${profileName}" created and activated`, true);
                        
                        // Clear input field
                        this.newProfileNameInput!.value = '';
                        
                        // Refresh ALL profile UI elements
                        this.updateUI();
                    } else {
                        this.app.showNotification(`A profile named "${profileName}" already exists`, false);
                    }
                } else {
                    this.app.showNotification('Please enter a profile name', false);
                }
            });
        }
        
        // Delete profile button
        if (this.deleteProfileBtn && this.deleteProfileSelect && this.profileConfirmModal) {
            this.deleteProfileBtn.addEventListener('click', () => {
                if (this.deleteProfileSelect!.value) {
                    this.profileToDelete = this.deleteProfileSelect!.value;
                    this.profileConfirmModal!.style.display = 'block';
                    this.app.setModalOpen(true);
                }
            });
        }
        
        // Confirmation modal close button
        if (this.profileConfirmClose && this.profileConfirmModal) {
            this.profileConfirmClose.addEventListener('click', () => {
                this.profileConfirmModal!.style.display = 'none';
                this.profileToDelete = '';
                this.app.setModalOpen(false);
            });
        }
        
        // Cancel delete button
        if (this.cancelDeleteProfileBtn && this.profileConfirmModal) {
            this.cancelDeleteProfileBtn.addEventListener('click', () => {
                this.profileConfirmModal!.style.display = 'none';
                this.profileToDelete = '';
                this.app.setModalOpen(false);
            });
        }
        
        // Confirm delete button
        if (this.confirmDeleteProfileBtn && this.profileConfirmModal) {
            this.confirmDeleteProfileBtn.addEventListener('click', () => {
                if (this.profileToDelete) {
                    if (this.app.deleteProfile(this.profileToDelete)) {
                        this.app.showNotification(`Profile "${this.profileToDelete}" deleted`, true);
                    } else {
                        this.app.showNotification(`Cannot delete the Default profile`, false);
                    }
                }
                
                // Close modal
                this.profileConfirmModal!.style.display = 'none';
                this.profileToDelete = '';
                this.app.setModalOpen(false);

                // Refresh UI
                this.updateUI();
            });
        }
        
        // Click outside to close modal
        if (this.profileConfirmModal) {
            this.profileConfirmModal.addEventListener('click', (e) => {
                if (e.target === this.profileConfirmModal) {
                    if(this.profileConfirmModal === null)
                        return;
                    this.profileConfirmModal.style.display = 'none';
                    this.profileToDelete = '';
                    this.app.setModalOpen(false);
                }
            });
        }
        
        // Quick profile selection
        if (this.quickProfileSelect) {
            this.quickProfileSelect.addEventListener('focus', () => {
                this.app.setInteractingWithDropdown(true);
            });
            
            this.quickProfileSelect.addEventListener('blur', () => {
                this.app.setInteractingWithDropdown(false);
            });
            
            this.quickProfileSelect.addEventListener('change', () => {
                const selectedProfile = this.quickProfileSelect!.value;
                if (selectedProfile) {
                    if (this.app.switchProfile(selectedProfile)) {
                        this.app.showNotification(`Profile switched to "${selectedProfile}"`, true);
                        this.updateUI();
                        
                        // Focus the input field
                        const inputField = document.getElementById('input') as HTMLInputElement;
                        if (inputField) {
                            inputField.select();
                        }
                    }
                }
                this.app.setInteractingWithDropdown(false);
            });
        }

        if (this.profileSelect) {
            this.profileSelect.addEventListener('focus', () => {
                this.app.setInteractingWithDropdown(true);
            });
            
            this.profileSelect.addEventListener('blur', () => {
                this.app.setInteractingWithDropdown(false);
            });
        }
        
        if (this.deleteProfileSelect) {
            this.deleteProfileSelect.addEventListener('focus', () => {
                this.app.setInteractingWithDropdown(true);
            });
            
            this.deleteProfileSelect.addEventListener('blur', () => {
                this.app.setInteractingWithDropdown(false);
            });
        }
    }
    
    // Update all profile dropdowns
    public updateUI(): void {
        this.populateProfileDropdowns();
        this.updateQuickProfileDropdown();
    }
    
    // Populate the main profile dropdowns
    private populateProfileDropdowns(): void {
        if (!this.profileSelect || !this.deleteProfileSelect) return;
        
        const profiles = this.app.getProfileNames();
        const currentProfile = this.app.getCurrentProfileName();
        
        // Clear existing options
        this.profileSelect.innerHTML = '';
        this.deleteProfileSelect.innerHTML = '';
        
        // Add options to main profile select
        profiles.forEach(profileName => {
            if(this.profileSelect === null)
                return;
            const option = document.createElement('option');
            option.value = profileName;
            option.textContent = profileName;
            if (profileName === currentProfile) {
                option.selected = true;
            }
            this.profileSelect.appendChild(option);
        });
        
        // Add options to delete profile select (excluding Default)
        profiles.forEach(profileName => {
            if (profileName !== 'Default') {
                const option = document.createElement('option');
                option.value = profileName;
                option.textContent = profileName;
                this.deleteProfileSelect!.appendChild(option);
            }
        });
        
        // Disable delete button if no non-default profiles exist
        if (profiles.length <= 1 && this.deleteProfileBtn && this.deleteProfileSelect) {
            (this.deleteProfileBtn as HTMLButtonElement).disabled = true;
            this.deleteProfileSelect.disabled = true;
        } else if (this.deleteProfileBtn && this.deleteProfileSelect) {
            (this.deleteProfileBtn as HTMLButtonElement).disabled = false;
            this.deleteProfileSelect.disabled = false;
        }
    }
    
    // Update the quick profile dropdown
    public updateQuickProfileDropdown(): void {
        if (!this.quickProfileSelect) return;
        
        // Clear existing options
        this.quickProfileSelect.innerHTML = '';
        
        // Get profiles and current profile
        const profiles = this.app.getProfileNames();
        const currentProfile = this.app.getCurrentProfileName();
        
        // Add options to dropdown
        profiles.forEach(profileName => {
            const option = document.createElement('option');
            option.value = profileName;
            option.textContent = profileName;
            if (profileName === currentProfile) {
                option.selected = true;
            }
            this.quickProfileSelect!.appendChild(option);
        });
    }
}