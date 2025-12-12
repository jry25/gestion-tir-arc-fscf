/**
 * Archers Page - Manage archer entries
 */

import db from '../db.js';
import { showToast, validateForm, clearForm, formatDate, getCategoryName, getWeaponName } from '../utils.js';

/**
 * Render the archers page
 */
export async function render() {
    const container = document.getElementById('page-content');
    
    // Get series for dropdown
    const series = await db.getAll('series');
    
    container.innerHTML = `
        <div class="card">
            <div class="card-header">
                <h2>Gestion des Archers</h2>
            </div>
            <div class="card-body">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem;">
                    <button id="add-archer-btn" class="btn btn-primary">➕ Ajouter 4 archers (binôme)</button>
                    <div>
                        <input type="text" id="search-archer" class="form-input" placeholder="Rechercher un archer..." style="width: 300px;">
                    </div>
                </div>

                <div id="archer-form-container" class="hidden">
                    <form id="archer-form" class="mb-3" style="background: var(--light-bg); padding: 1.5rem; border-radius: 4px;">
                        <h3 class="mb-2">Ajouter 4 Archers (Binôme complet)</h3>
                        
                        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem; margin-bottom: 1.5rem;">
                            <div class="form-group">
                                <label class="form-label">Numéro de série *</label>
                                <input type="number" name="seriesNumber" id="series-number" class="form-input" min="1" required>
                                <small style="color: var(--light-text);">La série sera créée si elle n'existe pas</small>
                            </div>

                            <div class="form-group">
                                <label class="form-label">Numéro de cible *</label>
                                <input type="number" name="targetNumber" class="form-input" min="1" required>
                            </div>

                            <div class="form-group">
                                <label class="form-label">Club</label>
                                <input type="text" name="club" id="club-input" class="form-input">
                                <small style="color: var(--light-text);">Appliqué aux 4 archers</small>
                            </div>
                        </div>

                        <div style="border: 2px solid var(--border-color); border-radius: 8px; padding: 1rem; margin-bottom: 1rem;">
                            <h4 style="margin-bottom: 1rem;">Position A</h4>
                            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem;">
                                <div class="form-group">
                                    <label class="form-label">Nom *</label>
                                    <input type="text" name="name_A" class="form-input" required>
                                </div>
                                <div class="form-group">
                                    <label class="form-label">Prénom *</label>
                                    <input type="text" name="firstName_A" class="form-input" required>
                                </div>
                                <div class="form-group">
                                    <label class="form-label">Licence *</label>
                                    <input type="text" name="license_A" class="form-input" required>
                                </div>
                                <div class="form-group">
                                    <label class="form-label">Type d'arc *</label>
                                    <select name="weapon_A" class="form-select" required>
                                        <option value="">Sélectionner...</option>
                                        <option value="CL">Arc Classique</option>
                                        <option value="CO">Arc à Poulies</option>
                                        <option value="BB">Bare Bow</option>
                                        <option value="AD">Arc Droit</option>
                                    </select>
                                </div>
                                <div class="form-group">
                                    <label class="form-label">Catégorie *</label>
                                    <select name="category_A" class="form-select category-select" required>
                                        <option value="">Sélectionner...</option>
                                        ${getCategoryOptions()}
                                    </select>
                                </div>
                            </div>
                        </div>

                        <div style="border: 2px solid var(--border-color); border-radius: 8px; padding: 1rem; margin-bottom: 1rem;">
                            <h4 style="margin-bottom: 1rem;">Position C</h4>
                            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem;">
                                <div class="form-group">
                                    <label class="form-label">Nom *</label>
                                    <input type="text" name="name_C" class="form-input" required>
                                </div>
                                <div class="form-group">
                                    <label class="form-label">Prénom *</label>
                                    <input type="text" name="firstName_C" class="form-input" required>
                                </div>
                                <div class="form-group">
                                    <label class="form-label">Licence *</label>
                                    <input type="text" name="license_C" class="form-input" required>
                                </div>
                                <div class="form-group">
                                    <label class="form-label">Type d'arc *</label>
                                    <select name="weapon_C" class="form-select" required>
                                        <option value="">Sélectionner...</option>
                                        <option value="CL">Arc Classique</option>
                                        <option value="CO">Arc à Poulies</option>
                                        <option value="BB">Bare Bow</option>
                                        <option value="AD">Arc Droit</option>
                                    </select>
                                </div>
                                <div class="form-group">
                                    <label class="form-label">Catégorie *</label>
                                    <select name="category_C" class="form-select category-select" required>
                                        <option value="">Sélectionner...</option>
                                        ${getCategoryOptions()}
                                    </select>
                                </div>
                            </div>
                        </div>

                        <div style="border: 2px solid var(--border-color); border-radius: 8px; padding: 1rem; margin-bottom: 1rem;">
                            <h4 style="margin-bottom: 1rem;">Position B</h4>
                            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem;">
                                <div class="form-group">
                                    <label class="form-label">Nom *</label>
                                    <input type="text" name="name_B" class="form-input" required>
                                </div>
                                <div class="form-group">
                                    <label class="form-label">Prénom *</label>
                                    <input type="text" name="firstName_B" class="form-input" required>
                                </div>
                                <div class="form-group">
                                    <label class="form-label">Licence *</label>
                                    <input type="text" name="license_B" class="form-input" required>
                                </div>
                                <div class="form-group">
                                    <label class="form-label">Type d'arc *</label>
                                    <select name="weapon_B" class="form-select" required>
                                        <option value="">Sélectionner...</option>
                                        <option value="CL">Arc Classique</option>
                                        <option value="CO">Arc à Poulies</option>
                                        <option value="BB">Bare Bow</option>
                                        <option value="AD">Arc Droit</option>
                                    </select>
                                </div>
                                <div class="form-group">
                                    <label class="form-label">Catégorie *</label>
                                    <select name="category_B" class="form-select category-select" required>
                                        <option value="">Sélectionner...</option>
                                        ${getCategoryOptions()}
                                    </select>
                                </div>
                            </div>
                        </div>

                        <div style="border: 2px solid var(--border-color); border-radius: 8px; padding: 1rem; margin-bottom: 1rem;">
                            <h4 style="margin-bottom: 1rem;">Position D</h4>
                            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem;">
                                <div class="form-group">
                                    <label class="form-label">Nom *</label>
                                    <input type="text" name="name_D" class="form-input" required>
                                </div>
                                <div class="form-group">
                                    <label class="form-label">Prénom *</label>
                                    <input type="text" name="firstName_D" class="form-input" required>
                                </div>
                                <div class="form-group">
                                    <label class="form-label">Licence *</label>
                                    <input type="text" name="license_D" class="form-input" required>
                                </div>
                                <div class="form-group">
                                    <label class="form-label">Type d'arc *</label>
                                    <select name="weapon_D" class="form-select" required>
                                        <option value="">Sélectionner...</option>
                                        <option value="CL">Arc Classique</option>
                                        <option value="CO">Arc à Poulies</option>
                                        <option value="BB">Bare Bow</option>
                                        <option value="AD">Arc Droit</option>
                                    </select>
                                </div>
                                <div class="form-group">
                                    <label class="form-label">Catégorie *</label>
                                    <select name="category_D" class="form-select category-select" required>
                                        <option value="">Sélectionner...</option>
                                        ${getCategoryOptions()}
                                    </select>
                                </div>
                            </div>
                        </div>

                        <div class="mt-2">
                            <button type="submit" class="btn btn-success">Enregistrer les 4 archers</button>
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
 * Get category options HTML
 */
function getCategoryOptions() {
    return `
        <optgroup label="Championnat Jeune">
            <option value="BF">Benjamine</option>
            <option value="BH">Benjamin</option>
            <option value="MF">Minime fille</option>
            <option value="MH">Minime garçon</option>
            <option value="CF">Cadette</option>
            <option value="CH">Cadet</option>
        </optgroup>
        <optgroup label="Championnat Adulte - Junior">
            <option value="JFCL">Junior femme arc classique</option>
            <option value="JFAP">Junior femme arc à poulie</option>
            <option value="JHCL">Junior homme arc classique</option>
            <option value="JHAP">Junior homme arc à poulie</option>
        </optgroup>
        <optgroup label="Championnat Adulte - Senior">
            <option value="SFCL">Senior femme arc classique</option>
            <option value="SFAP">Senior femme arc à poulie</option>
            <option value="SHCL">Senior homme arc classique</option>
            <option value="SHAP">Senior homme arc à poulie</option>
        </optgroup>
        <optgroup label="Championnat Adulte - Vétéran">
            <option value="VFCL">Vétéran femme arc classique</option>
            <option value="VFAP">Vétéran femme arc à poulie</option>
            <option value="VHCL">Vétéran homme arc classique</option>
            <option value="VHAP">Vétéran homme arc à poulie</option>
        </optgroup>
        <optgroup label="Championnat Adulte - Super Vétéran">
            <option value="SVFCL">Super vétéran femme arc classique</option>
            <option value="SVFAP">Super vétéran femme arc à poulie</option>
            <option value="SVHCL">Super vétéran homme arc classique</option>
            <option value="SVHAP">Super vétéran homme arc à poulie</option>
        </optgroup>
    `;
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
 * Handle form submission - Add 4 archers (complete binôme)
 */
async function handleSubmit(e) {
    e.preventDefault();
    
    const form = e.target;
    if (!validateForm(form)) {
        showToast('Veuillez remplir tous les champs obligatoires', 'error');
        return;
    }

    const formData = new FormData(form);
    const seriesNumber = parseInt(formData.get('seriesNumber'));
    const targetNumber = parseInt(formData.get('targetNumber'));
    const club = formData.get('club') || '';

    try {
        // Find or create series
        let allSeries = await db.getAll('series');
        let series = allSeries.find(s => s.number === seriesNumber);
        
        if (!series) {
            // Create new series with default 10 targets if it doesn't exist
            const seriesId = await db.addSeries({
                number: seriesNumber,
                numberOfTargets: 10
            });
            console.log(`Created new series ${seriesNumber} with ID ${seriesId}`);
            
            // Fetch the newly created series
            series = await db.get('series', seriesId);
        }

        // Create 4 archers (A, C, B, D)
        const positions = ['A', 'C', 'B', 'D'];
        const addedArchers = [];
        
        for (const position of positions) {
            const archer = {
                name: formData.get(`name_${position}`),
                firstName: formData.get(`firstName_${position}`),
                license: formData.get(`license_${position}`),
                category: formData.get(`category_${position}`),
                weapon: formData.get(`weapon_${position}`),
                club: club,
                seriesId: series.id,
                targetNumber: targetNumber,
                position: position
            };

            const archerId = await db.addArcher(archer);
            addedArchers.push({...archer, id: archerId});
        }

        showToast(`4 archers ajoutés avec succès à la série ${seriesNumber}, cible ${targetNumber}`, 'success');
        hideArcherForm();
        await loadArchers();
    } catch (error) {
        console.error('Error adding archers:', error);
        if (error.message && error.message.includes('unique')) {
            showToast('Erreur : Un numéro de licence est déjà utilisé', 'error');
        } else {
            showToast('Erreur lors de l\'ajout des archers', 'error');
        }
    }
}

/**
 * Load and display archers
 */
async function loadArchers() {
    const container = document.getElementById('archers-list');
    
    try {
        const archers = await db.getAll('archers');
        const allSeries = await db.getAll('series');
        
        if (archers.length === 0) {
            container.innerHTML = '<p class="text-center">Aucun archer enregistré</p>';
            return;
        }

        // Create series map for lookup
        const seriesMap = new Map(allSeries.map(s => [s.id, s]));

        container.innerHTML = `
            <table class="table">
                <thead>
                    <tr>
                        <th>Série</th>
                        <th>Cible</th>
                        <th>Pos.</th>
                        <th>Nom</th>
                        <th>Prénom</th>
                        <th>Club</th>
                        <th>Arc</th>
                        <th>Catégorie</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    ${archers.map(archer => {
                        const series = archer.seriesId ? seriesMap.get(archer.seriesId) : null;
                        return `
                            <tr>
                                <td>${series ? `Série ${series.number}` : '-'}</td>
                                <td>${archer.targetNumber || '-'}</td>
                                <td>${archer.position || '-'}</td>
                                <td>${archer.name}</td>
                                <td>${archer.firstName}</td>
                                <td>${archer.club || '-'}</td>
                                <td>${getWeaponName(archer.weapon)}</td>
                                <td>${getCategoryName(archer.category)}</td>
                                <td>
                                    <button class="btn btn-danger" style="padding: 0.5rem 1rem;" onclick="window.deleteArcher(${archer.id})">🗑️</button>
                                </td>
                            </tr>
                        `;
                    }).join('')}
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
