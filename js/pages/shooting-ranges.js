/**
 * Shooting Ranges Page - Manage shooting ranges (pas de tir)
 */

import db from '../db.js';
import { showToast, validateForm, clearForm } from '../utils.js';

/**
 * Render the shooting ranges page
 */
export async function render() {
    const container = document.getElementById('page-content');
    
    container.innerHTML = `
        <div class="card">
            <div class="card-header">
                <h2>Gestion des Pas de Tir</h2>
            </div>
            <div class="card-body">
                <button id="add-range-btn" class="btn btn-primary mb-2">➕ Ajouter un pas de tir</button>

                <div id="range-form-container" class="hidden">
                    <form id="range-form" class="mb-3" style="background: var(--light-bg); padding: 1.5rem; border-radius: 4px;">
                        <h3 class="mb-2">Nouveau Pas de Tir</h3>
                        
                        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 1rem;">
                            <div class="form-group">
                                <label class="form-label">Nom du pas de tir *</label>
                                <input type="text" name="name" class="form-input" required>
                            </div>

                            <div class="form-group">
                                <label class="form-label">Distance (mètres) *</label>
                                <select name="distance" class="form-select" required>
                                    <option value="">Sélectionner...</option>
                                    <option value="10">10m</option>
                                    <option value="18">18m</option>
                                    <option value="25">25m</option>
                                    <option value="30">30m</option>
                                    <option value="50">50m</option>
                                    <option value="70">70m</option>
                                </select>
                            </div>

                            <div class="form-group">
                                <label class="form-label">Type de cible *</label>
                                <select name="targetType" class="form-select" required>
                                    <option value="">Sélectionner...</option>
                                    <option value="40cm">40cm</option>
                                    <option value="60cm">60cm</option>
                                    <option value="80cm">80cm</option>
                                    <option value="122cm">122cm</option>
                                </select>
                            </div>

                            <div class="form-group">
                                <label class="form-label">Nombre de cibles *</label>
                                <input type="number" name="numberOfTargets" class="form-input" min="1" max="20" required>
                            </div>
                        </div>

                        <div class="mt-2">
                            <button type="submit" class="btn btn-success">Enregistrer</button>
                            <button type="button" id="cancel-range-btn" class="btn btn-secondary">Annuler</button>
                        </div>
                    </form>
                </div>

                <div id="ranges-list">
                    <p class="text-center">Chargement...</p>
                </div>
            </div>
        </div>
    `;

    // Load ranges
    await loadRanges();

    // Event listeners
    document.getElementById('add-range-btn').addEventListener('click', showRangeForm);
    document.getElementById('cancel-range-btn').addEventListener('click', hideRangeForm);
    document.getElementById('range-form').addEventListener('submit', handleSubmit);
}

/**
 * Show the range form
 */
function showRangeForm() {
    document.getElementById('range-form-container').classList.remove('hidden');
    document.getElementById('add-range-btn').disabled = true;
}

/**
 * Hide the range form
 */
function hideRangeForm() {
    document.getElementById('range-form-container').classList.add('hidden');
    document.getElementById('add-range-btn').disabled = false;
    clearForm(document.getElementById('range-form'));
}

/**
 * Handle form submission
 */
async function handleSubmit(e) {
    e.preventDefault();
    
    const form = e.target;
    if (!validateForm(form)) {
        showToast('Veuillez remplir tous les champs obligatoires', 'error');
        return;
    }

    const formData = new FormData(form);
    const range = {
        name: formData.get('name'),
        distance: parseInt(formData.get('distance')),
        targetType: formData.get('targetType'),
        numberOfTargets: parseInt(formData.get('numberOfTargets'))
    };

    try {
        await db.addShootingRange(range);
        showToast('Pas de tir ajouté avec succès', 'success');
        hideRangeForm();
        await loadRanges();
    } catch (error) {
        console.error('Error adding range:', error);
        showToast('Erreur lors de l\'ajout du pas de tir', 'error');
    }
}

/**
 * Load and display ranges
 */
async function loadRanges() {
    const container = document.getElementById('ranges-list');
    
    try {
        const ranges = await db.getAll('shootingRanges');
        
        if (ranges.length === 0) {
            container.innerHTML = '<p class="text-center">Aucun pas de tir configuré</p>';
            return;
        }

        container.innerHTML = `
            <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 1rem;">
                ${ranges.map(range => `
                    <div class="card">
                        <div class="card-header">
                            <h3>${range.name}</h3>
                        </div>
                        <div class="card-body">
                            <p><strong>Distance:</strong> ${range.distance}m</p>
                            <p><strong>Type de cible:</strong> ${range.targetType}</p>
                            <p><strong>Nombre de cibles:</strong> ${range.numberOfTargets}</p>
                            <button class="btn btn-danger mt-2" onclick="window.deleteRange(${range.id})">🗑️ Supprimer</button>
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
    } catch (error) {
        console.error('Error loading ranges:', error);
        container.innerHTML = '<p class="text-center">Erreur lors du chargement des pas de tir</p>';
    }
}

/**
 * Delete a range
 */
window.deleteRange = async function(id) {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce pas de tir ?')) {
        return;
    }

    try {
        await db.delete('shootingRanges', id);
        showToast('Pas de tir supprimé avec succès', 'success');
        await loadRanges();
    } catch (error) {
        console.error('Error deleting range:', error);
        showToast('Erreur lors de la suppression', 'error');
    }
};
