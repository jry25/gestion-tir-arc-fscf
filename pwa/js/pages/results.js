/**
 * Results Page - Manage and display competition results
 */

import db from '../db.js';
import { showToast, formatDate, validateForm, clearForm } from '../utils.js';

/**
 * Render the results page
 */
export async function render() {
    const container = document.getElementById('page-content');
    
    container.innerHTML = `
        <div class="card">
            <div class="card-header">
                <h2>Résultats de Compétition</h2>
            </div>
            <div class="card-body">
                <button id="add-result-btn" class="btn btn-primary mb-2">➕ Ajouter un résultat</button>

                <div id="result-form-container" class="hidden">
                    <form id="result-form" class="mb-3" style="background: var(--light-bg); padding: 1.5rem; border-radius: 4px;">
                        <h3 class="mb-2">Nouveau Résultat</h3>
                        
                        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 1rem;">
                            <div class="form-group">
                                <label class="form-label">Archer *</label>
                                <select name="archerId" id="archer-select" class="form-select" required>
                                    <option value="">Sélectionner...</option>
                                </select>
                            </div>

                            <div class="form-group">
                                <label class="form-label">Pas de tir *</label>
                                <select name="rangeId" id="range-select" class="form-select" required>
                                    <option value="">Sélectionner...</option>
                                </select>
                            </div>

                            <div class="form-group">
                                <label class="form-label">Score *</label>
                                <input type="number" name="score" class="form-input" min="0" max="600" required>
                            </div>

                            <div class="form-group">
                                <label class="form-label">Date *</label>
                                <input type="date" name="date" class="form-input" required>
                            </div>
                        </div>

                        <div class="form-group">
                            <label class="form-label">Notes</label>
                            <textarea name="notes" class="form-textarea" rows="3"></textarea>
                        </div>

                        <div class="mt-2">
                            <button type="submit" class="btn btn-success">Enregistrer</button>
                            <button type="button" id="cancel-result-btn" class="btn btn-secondary">Annuler</button>
                        </div>
                    </form>
                </div>

                <div id="results-list">
                    <p class="text-center">Chargement...</p>
                </div>
            </div>
        </div>
    `;

    // Load results
    await loadResults();

    // Event listeners
    document.getElementById('add-result-btn').addEventListener('click', showResultForm);
    document.getElementById('cancel-result-btn').addEventListener('click', hideResultForm);
    document.getElementById('result-form').addEventListener('submit', handleSubmit);
}

/**
 * Show the result form
 */
async function showResultForm() {
    // Load archers and ranges for dropdowns
    const archers = await db.getAll('archers');
    const ranges = await db.getAll('shootingRanges');
    
    const archerSelect = document.getElementById('archer-select');
    const rangeSelect = document.getElementById('range-select');
    
    archerSelect.innerHTML = '<option value="">Sélectionner...</option>' +
        archers.map(a => `<option value="${a.id}">${a.firstName} ${a.name} (${a.license})</option>`).join('');
    
    rangeSelect.innerHTML = '<option value="">Sélectionner...</option>' +
        ranges.map(r => `<option value="${r.id}">${r.name} - ${r.distance}m</option>`).join('');
    
    // Set default date to today
    document.querySelector('[name="date"]').valueAsDate = new Date();
    
    document.getElementById('result-form-container').classList.remove('hidden');
    document.getElementById('add-result-btn').disabled = true;
}

/**
 * Hide the result form
 */
function hideResultForm() {
    document.getElementById('result-form-container').classList.add('hidden');
    document.getElementById('add-result-btn').disabled = false;
    clearForm(document.getElementById('result-form'));
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
    const result = {
        archerId: parseInt(formData.get('archerId')),
        rangeId: parseInt(formData.get('rangeId')),
        score: parseInt(formData.get('score')),
        date: new Date(formData.get('date')).toISOString(),
        notes: formData.get('notes')
    };

    try {
        await db.addResult(result);
        showToast('Résultat ajouté avec succès', 'success');
        hideResultForm();
        await loadResults();
    } catch (error) {
        console.error('Error adding result:', error);
        showToast('Erreur lors de l\'ajout du résultat', 'error');
    }
}

/**
 * Load and display results
 */
async function loadResults() {
    const container = document.getElementById('results-list');
    
    try {
        const results = await db.getAll('results');
        
        if (results.length === 0) {
            container.innerHTML = '<p class="text-center">Aucun résultat enregistré</p>';
            return;
        }

        // Get archers and ranges for display
        const archers = await db.getAll('archers');
        const ranges = await db.getAll('shootingRanges');
        
        // Create lookup maps
        const archerMap = new Map(archers.map(a => [a.id, a]));
        const rangeMap = new Map(ranges.map(r => [r.id, r]));

        // Sort by date (most recent first)
        results.sort((a, b) => new Date(b.date) - new Date(a.date));

        container.innerHTML = `
            <table class="table">
                <thead>
                    <tr>
                        <th>Date</th>
                        <th>Archer</th>
                        <th>Pas de tir</th>
                        <th>Score</th>
                        <th>Notes</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    ${results.map(result => {
                        const archer = archerMap.get(result.archerId);
                        const range = rangeMap.get(result.rangeId);
                        return `
                            <tr>
                                <td>${formatDate(result.date)}</td>
                                <td>${archer ? `${archer.firstName} ${archer.name}` : 'N/A'}</td>
                                <td>${range ? `${range.name} (${range.distance}m)` : 'N/A'}</td>
                                <td><strong>${result.score}</strong></td>
                                <td>${result.notes || '-'}</td>
                                <td>
                                    <button class="btn btn-danger" style="padding: 0.5rem 1rem;" onclick="window.deleteResult(${result.id})">🗑️</button>
                                </td>
                            </tr>
                        `;
                    }).join('')}
                </tbody>
            </table>
        `;
    } catch (error) {
        console.error('Error loading results:', error);
        container.innerHTML = '<p class="text-center">Erreur lors du chargement des résultats</p>';
    }
}

/**
 * Delete a result
 */
window.deleteResult = async function(id) {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce résultat ?')) {
        return;
    }

    try {
        await db.delete('results', id);
        showToast('Résultat supprimé avec succès', 'success');
        await loadResults();
    } catch (error) {
        console.error('Error deleting result:', error);
        showToast('Erreur lors de la suppression', 'error');
    }
};
