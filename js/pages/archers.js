/**
 * Archers Page - Manage archer entries
 */

import db from '../db.js';
import { showToast, validateForm, clearForm, formatDate } from '../utils.js';

/**
 * Render the archers page
 */
export async function render() {
    const container = document.getElementById('page-content');
    
    container.innerHTML = `
        <div class="card">
            <div class="card-header">
                <h2>Gestion des Archers</h2>
            </div>
            <div class="card-body">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem;">
                    <button id="add-archer-btn" class="btn btn-primary">➕ Ajouter un archer</button>
                    <div>
                        <input type="text" id="search-archer" class="form-input" placeholder="Rechercher un archer..." style="width: 300px;">
                    </div>
                </div>

                <div id="archer-form-container" class="hidden">
                    <form id="archer-form" class="mb-3" style="background: var(--light-bg); padding: 1.5rem; border-radius: 4px;">
                        <h3 class="mb-2">Nouvel Archer</h3>
                        
                        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 1rem;">
                            <div class="form-group">
                                <label class="form-label">Nom *</label>
                                <input type="text" name="name" class="form-input" required>
                            </div>

                            <div class="form-group">
                                <label class="form-label">Prénom *</label>
                                <input type="text" name="firstName" class="form-input" required>
                            </div>

                            <div class="form-group">
                                <label class="form-label">Licence *</label>
                                <input type="text" name="license" class="form-input" required>
                            </div>

                            <div class="form-group">
                                <label class="form-label">Catégorie *</label>
                                <select name="category" class="form-select" required>
                                    <option value="">Sélectionner...</option>
                                    <option value="POU">Poussins</option>
                                    <option value="BEN">Benjamins</option>
                                    <option value="MIN">Minimes</option>
                                    <option value="CAD">Cadets</option>
                                    <option value="JUN">Juniors</option>
                                    <option value="SEN">Seniors</option>
                                    <option value="VET">Vétérans</option>
                                </select>
                            </div>

                            <div class="form-group">
                                <label class="form-label">Type d'arc *</label>
                                <select name="weapon" class="form-select" required>
                                    <option value="">Sélectionner...</option>
                                    <option value="CL">Arc Classique</option>
                                    <option value="CO">Arc à Poulies</option>
                                    <option value="BB">Bare Bow</option>
                                    <option value="AD">Arc Droit</option>
                                </select>
                            </div>

                            <div class="form-group">
                                <label class="form-label">Club</label>
                                <input type="text" name="club" class="form-input">
                            </div>
                        </div>

                        <div class="mt-2">
                            <button type="submit" class="btn btn-success">Enregistrer</button>
                            <button type="button" id="cancel-archer-btn" class="btn btn-secondary">Annuler</button>
                        </div>
                    </form>
                </div>

                <div id="archers-list">
                    <p class="text-center">Chargement...</p>
                </div>
            </div>
        </div>
    `;

    // Load archers
    await loadArchers();

    // Event listeners
    document.getElementById('add-archer-btn').addEventListener('click', showArcherForm);
    document.getElementById('cancel-archer-btn').addEventListener('click', hideArcherForm);
    document.getElementById('archer-form').addEventListener('submit', handleSubmit);
    document.getElementById('search-archer').addEventListener('input', handleSearch);
}

/**
 * Show the archer form
 */
function showArcherForm() {
    document.getElementById('archer-form-container').classList.remove('hidden');
    document.getElementById('add-archer-btn').disabled = true;
}

/**
 * Hide the archer form
 */
function hideArcherForm() {
    document.getElementById('archer-form-container').classList.add('hidden');
    document.getElementById('add-archer-btn').disabled = false;
    clearForm(document.getElementById('archer-form'));
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
    const archer = {
        name: formData.get('name'),
        firstName: formData.get('firstName'),
        license: formData.get('license'),
        category: formData.get('category'),
        weapon: formData.get('weapon'),
        club: formData.get('club')
    };

    try {
        await db.addArcher(archer);
        showToast('Archer ajouté avec succès', 'success');
        hideArcherForm();
        await loadArchers();
    } catch (error) {
        console.error('Error adding archer:', error);
        showToast('Erreur lors de l\'ajout de l\'archer', 'error');
    }
}

/**
 * Load and display archers
 */
async function loadArchers() {
    const container = document.getElementById('archers-list');
    
    try {
        const archers = await db.getAll('archers');
        
        if (archers.length === 0) {
            container.innerHTML = '<p class="text-center">Aucun archer enregistré</p>';
            return;
        }

        container.innerHTML = `
            <table class="table">
                <thead>
                    <tr>
                        <th>Nom</th>
                        <th>Prénom</th>
                        <th>Licence</th>
                        <th>Catégorie</th>
                        <th>Arc</th>
                        <th>Club</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    ${archers.map(archer => `
                        <tr>
                            <td>${archer.name}</td>
                            <td>${archer.firstName}</td>
                            <td>${archer.license}</td>
                            <td>${getCategoryName(archer.category)}</td>
                            <td>${getWeaponName(archer.weapon)}</td>
                            <td>${archer.club || '-'}</td>
                            <td>
                                <button class="btn btn-danger" style="padding: 0.5rem 1rem;" onclick="window.deleteArcher(${archer.id})">🗑️</button>
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        `;
    } catch (error) {
        console.error('Error loading archers:', error);
        container.innerHTML = '<p class="text-center">Erreur lors du chargement des archers</p>';
    }
}

/**
 * Delete an archer
 */
window.deleteArcher = async function(id) {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cet archer ?')) {
        return;
    }

    try {
        await db.delete('archers', id);
        showToast('Archer supprimé avec succès', 'success');
        await loadArchers();
    } catch (error) {
        console.error('Error deleting archer:', error);
        showToast('Erreur lors de la suppression', 'error');
    }
};

/**
 * Handle search
 */
function handleSearch(e) {
    const searchTerm = e.target.value.toLowerCase();
    const rows = document.querySelectorAll('#archers-list tbody tr');
    
    rows.forEach(row => {
        const text = row.textContent.toLowerCase();
        row.style.display = text.includes(searchTerm) ? '' : 'none';
    });
}

/**
 * Helper functions
 */
function getCategoryName(code) {
    const categories = {
        'POU': 'Poussins',
        'BEN': 'Benjamins',
        'MIN': 'Minimes',
        'CAD': 'Cadets',
        'JUN': 'Juniors',
        'SEN': 'Seniors',
        'VET': 'Vétérans'
    };
    return categories[code] || code;
}

function getWeaponName(code) {
    const weapons = {
        'CL': 'Arc Classique',
        'CO': 'Arc à Poulies',
        'BB': 'Bare Bow',
        'AD': 'Arc Droit'
    };
    return weapons[code] || code;
}
