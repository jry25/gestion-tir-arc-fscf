/**
 * Settings Page - Application settings and data management
 */

import db from '../db.js';
import { showToast } from '../utils.js';

/**
 * Render the settings page
 */
export async function render() {
    const container = document.getElementById('page-content');
    
    container.innerHTML = `
        <div class="card">
            <div class="card-header">
                <h2>Paramètres</h2>
            </div>
            <div class="card-body">
                <h3 style="margin-bottom: 1rem; color: var(--dark-text);">Gestion des données</h3>
                <p style="margin-bottom: 1.5rem; color: var(--light-text);">
                    Gérez les données de l'application. Les actions effectuées ici sont irréversibles.
                </p>

                <div style="background: #fff3cd; border: 1px solid #ffc107; border-radius: 4px; padding: 1rem; margin-bottom: 1.5rem;">
                    <h4 style="color: #856404; margin-bottom: 0.5rem;">⚠️ Zone de danger</h4>
                    <p style="color: #856404; margin-bottom: 1rem;">
                        Cette action supprimera toutes les données de compétition : archers, résultats, séries et pas de tir.
                        Les catégories par défaut seront conservées.
                    </p>
                    <button id="reset-all-btn" class="btn btn-danger">
                        🗑️ Réinitialiser toutes les données
                    </button>
                </div>
            </div>
        </div>

        <!-- Custom Confirmation Modal -->
        <div id="reset-modal" class="modal hidden">
            <div class="modal-overlay"></div>
            <div class="modal-content">
                <div class="modal-header">
                    <h3>⚠️ Confirmation de réinitialisation</h3>
                </div>
                <div class="modal-body">
                    <p style="margin-bottom: 1rem; font-weight: 500; color: var(--danger-color);">
                        Cette action est irréversible !
                    </p>
                    <p style="margin-bottom: 1rem;">
                        Vous êtes sur le point de supprimer toutes les données suivantes :
                    </p>
                    <ul style="margin-bottom: 1.5rem; margin-left: 1.5rem;">
                        <li>Tous les archers</li>
                        <li>Tous les résultats</li>
                        <li>Toutes les séries</li>
                        <li>Tous les pas de tir</li>
                    </ul>
                    <p style="margin-bottom: 1rem;">
                        Pour confirmer cette action, veuillez taper <strong>reset</strong> dans le champ ci-dessous :
                    </p>
                    <input 
                        type="text" 
                        id="reset-confirmation-input" 
                        class="form-input" 
                        placeholder="Tapez 'reset' pour confirmer"
                        autocomplete="off"
                        style="margin-bottom: 1rem;"
                    />
                    <p id="reset-error-msg" class="hidden" style="color: var(--danger-color); font-size: 0.9rem; margin-bottom: 0.5rem;">
                        Veuillez taper exactement "reset" pour confirmer.
                    </p>
                </div>
                <div class="modal-footer">
                    <button id="cancel-reset-btn" class="btn btn-secondary">Annuler</button>
                    <button id="confirm-reset-btn" class="btn btn-danger">Confirmer la réinitialisation</button>
                </div>
            </div>
        </div>
    `;

    setupEventListeners();
}

/**
 * Setup event listeners for the settings page
 */
function setupEventListeners() {
    const resetBtn = document.getElementById('reset-all-btn');
    const modal = document.getElementById('reset-modal');
    const cancelBtn = document.getElementById('cancel-reset-btn');
    const confirmBtn = document.getElementById('confirm-reset-btn');
    const confirmInput = document.getElementById('reset-confirmation-input');
    const errorMsg = document.getElementById('reset-error-msg');

    // Open modal when reset button is clicked
    resetBtn.addEventListener('click', () => {
        modal.classList.remove('hidden');
        confirmInput.value = '';
        errorMsg.classList.add('hidden');
        confirmInput.focus();
    });

    // Close modal when cancel button is clicked
    cancelBtn.addEventListener('click', () => {
        modal.classList.add('hidden');
        confirmInput.value = '';
        errorMsg.classList.add('hidden');
    });

    // Close modal when clicking on overlay
    modal.querySelector('.modal-overlay').addEventListener('click', () => {
        modal.classList.add('hidden');
        confirmInput.value = '';
        errorMsg.classList.add('hidden');
    });

    // Handle confirmation
    confirmBtn.addEventListener('click', async () => {
        const inputValue = confirmInput.value.trim();
        
        if (inputValue === 'reset') {
            errorMsg.classList.add('hidden');
            
            try {
                // Close modal first
                modal.classList.add('hidden');
                
                // Show loading state
                confirmBtn.disabled = true;
                confirmBtn.textContent = 'Réinitialisation en cours...';
                
                // Clear all data
                await db.clearAllData();
                
                // Show success message
                showToast('Toutes les données ont été supprimées avec succès', 'success');
                
                // Reload the page to refresh all views
                setTimeout(() => {
                    window.location.hash = '#archers';
                    window.location.reload();
                }, 1500);
                
            } catch (error) {
                console.error('Error clearing data:', error);
                showToast('Erreur lors de la suppression des données', 'error');
                confirmBtn.disabled = false;
                confirmBtn.textContent = 'Confirmer la réinitialisation';
            }
        } else {
            errorMsg.classList.remove('hidden');
            confirmInput.focus();
            confirmInput.select();
        }
    });

    // Allow Enter key to confirm
    confirmInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            confirmBtn.click();
        }
    });

    // Clear error message when user starts typing
    confirmInput.addEventListener('input', () => {
        if (errorMsg.classList.contains('hidden') === false) {
            errorMsg.classList.add('hidden');
        }
    });
}
