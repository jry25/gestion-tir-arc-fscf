/**
 * Archers Page - Manage archer entries
 */

import db from '../db.js';
import { showToast, clearForm, formatDate, getCategoryName, getWeaponName } from '../utils.js';

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
                    <button id="add-archer-btn" class="btn btn-primary">➕ Ajouter des archers (1 à 4)</button>
                    <div>
                        <input type="text" id="search-archer" class="form-input" placeholder="Rechercher un archer..." style="width: 300px;">
                    </div>
                </div>

                <div id="archer-form-container" class="hidden">
                    <form id="archer-form" class="mb-3" style="background: var(--light-bg); padding: 1.5rem; border-radius: 4px;">
                        <h3 class="mb-2">Ajouter des Archers (1 à 4 par cible)</h3>
                        <p style="color: var(--light-text); margin-bottom: 1rem;">Remplissez au moins 1 archer. Les positions vides seront ignorées.</p>
                        
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
                        </div>

                        <div style="border: 2px solid var(--border-color); border-radius: 8px; padding: 1rem; margin-bottom: 1rem;">
                            <h4 style="margin-bottom: 1rem;">Position A</h4>
                            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem;">
                                <div class="form-group">
                                    <label class="form-label">Nom</label>
                                    <input type="text" name="name_A" class="form-input archer-field" data-position="A">
                                </div>
                                <div class="form-group">
                                    <label class="form-label">Prénom</label>
                                    <input type="text" name="firstName_A" class="form-input archer-field" data-position="A">
                                </div>
                                <div class="form-group">
                                    <label class="form-label">Licence</label>
                                    <input type="text" name="license_A" class="form-input archer-field" data-position="A">
                                </div>
                                <div class="form-group">
                                    <label class="form-label">Club</label>
                                    <input type="text" name="club_A" class="form-input archer-field" data-position="A">
                                </div>
                                <div class="form-group">
                                    <label class="form-label">Type d'arc</label>
                                    <select name="weapon_A" class="form-select archer-field" data-position="A">
                                        <option value="">Sélectionner...</option>
                                        <option value="CL">Arc Classique</option>
                                        <option value="CO">Arc à Poulies</option>
                                        <option value="BB">Bare Bow</option>
                                        <option value="AD">Arc Droit</option>
                                    </select>
                                </div>
                                <div class="form-group">
                                    <label class="form-label">Catégorie</label>
                                    <select name="category_A" class="form-select category-select archer-field" data-position="A">
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
                                    <label class="form-label">Nom</label>
                                    <input type="text" name="name_C" class="form-input archer-field" data-position="C">
                                </div>
                                <div class="form-group">
                                    <label class="form-label">Prénom</label>
                                    <input type="text" name="firstName_C" class="form-input archer-field" data-position="C">
                                </div>
                                <div class="form-group">
                                    <label class="form-label">Licence</label>
                                    <input type="text" name="license_C" class="form-input archer-field" data-position="C">
                                </div>
                                <div class="form-group">
                                    <label class="form-label">Club</label>
                                    <input type="text" name="club_C" class="form-input archer-field" data-position="C">
                                </div>
                                <div class="form-group">
                                    <label class="form-label">Type d'arc</label>
                                    <select name="weapon_C" class="form-select archer-field" data-position="C">
                                        <option value="">Sélectionner...</option>
                                        <option value="CL">Arc Classique</option>
                                        <option value="CO">Arc à Poulies</option>
                                        <option value="BB">Bare Bow</option>
                                        <option value="AD">Arc Droit</option>
                                    </select>
                                </div>
                                <div class="form-group">
                                    <label class="form-label">Catégorie</label>
                                    <select name="category_C" class="form-select category-select archer-field" data-position="C">
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
                                    <label class="form-label">Nom</label>
                                    <input type="text" name="name_B" class="form-input archer-field" data-position="B">
                                </div>
                                <div class="form-group">
                                    <label class="form-label">Prénom</label>
                                    <input type="text" name="firstName_B" class="form-input archer-field" data-position="B">
                                </div>
                                <div class="form-group">
                                    <label class="form-label">Licence</label>
                                    <input type="text" name="license_B" class="form-input archer-field" data-position="B">
                                </div>
                                <div class="form-group">
                                    <label class="form-label">Club</label>
                                    <input type="text" name="club_B" class="form-input archer-field" data-position="B">
                                </div>
                                <div class="form-group">
                                    <label class="form-label">Type d'arc</label>
                                    <select name="weapon_B" class="form-select archer-field" data-position="B">
                                        <option value="">Sélectionner...</option>
                                        <option value="CL">Arc Classique</option>
                                        <option value="CO">Arc à Poulies</option>
                                        <option value="BB">Bare Bow</option>
                                        <option value="AD">Arc Droit</option>
                                    </select>
                                </div>
                                <div class="form-group">
                                    <label class="form-label">Catégorie</label>
                                    <select name="category_B" class="form-select category-select archer-field" data-position="B">
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
                                    <label class="form-label">Nom</label>
                                    <input type="text" name="name_D" class="form-input archer-field" data-position="D">
                                </div>
                                <div class="form-group">
                                    <label class="form-label">Prénom</label>
                                    <input type="text" name="firstName_D" class="form-input archer-field" data-position="D">
                                </div>
                                <div class="form-group">
                                    <label class="form-label">Licence</label>
                                    <input type="text" name="license_D" class="form-input archer-field" data-position="D">
                                </div>
                                <div class="form-group">
                                    <label class="form-label">Club</label>
                                    <input type="text" name="club_D" class="form-input archer-field" data-position="D">
                                </div>
                                <div class="form-group">
                                    <label class="form-label">Type d'arc</label>
                                    <select name="weapon_D" class="form-select archer-field" data-position="D">
                                        <option value="">Sélectionner...</option>
                                        <option value="CL">Arc Classique</option>
                                        <option value="CO">Arc à Poulies</option>
                                        <option value="BB">Bare Bow</option>
                                        <option value="AD">Arc Droit</option>
                                    </select>
                                </div>
                                <div class="form-group">
                                    <label class="form-label">Catégorie</label>
                                    <select name="category_D" class="form-select category-select archer-field" data-position="D">
                                        <option value="">Sélectionner...</option>
                                        ${getCategoryOptions()}
                                    </select>
                                </div>
                            </div>
                        </div>

                        <div class="mt-2">
                            <button type="submit" class="btn btn-success">Enregistrer les archers</button>
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
 * Check if a field value is non-empty (after trimming whitespace)
 * @param {string|null} value - The field value to check
 * @returns {boolean} - True if the value is non-empty after trimming
 */
function isNonEmptyField(value) {
    return value && value.trim();
}

/**
 * Handle form submission - Add 1 to 4 archers
 */
async function handleSubmit(e) {
    e.preventDefault();
    
    const form = e.target;
    const formData = new FormData(form);
    const seriesNumber = parseInt(formData.get('seriesNumber'));
    const targetNumber = parseInt(formData.get('targetNumber'));

    // Validate series and target numbers
    if (isNaN(seriesNumber) || seriesNumber < 1 || isNaN(targetNumber) || targetNumber < 1) {
        showToast('Veuillez remplir le numéro de série et de cible', 'error');
        return;
    }

    // Check which positions have data
    const positions = ['A', 'C', 'B', 'D'];
    const archersToAdd = [];
    
    for (const position of positions) {
        const name = formData.get(`name_${position}`);
        const firstName = formData.get(`firstName_${position}`);
        const license = formData.get(`license_${position}`);
        const category = formData.get(`category_${position}`);
        const weapon = formData.get(`weapon_${position}`);

        const requiredFields = [name, firstName, license, category, weapon];
        
        // Check if any field for this position is filled (treating empty strings as no data)
        const hasData = requiredFields.some(isNonEmptyField);
        
        if (hasData) {
            // Validate that all required fields for this archer are filled
            const allRequiredFilled = requiredFields.every(isNonEmptyField);
            if (!allRequiredFilled) {
                showToast(`Position ${position} : Veuillez remplir tous les champs (nom, prénom, licence, catégorie, type d'arc) ou laisser tous vides`, 'error');
                return;
            }
            
            archersToAdd.push({
                name: name.trim(),
                firstName: firstName.trim(),
                license: license.trim(),
                category: category.trim(),
                weapon: weapon.trim(),
                club: formData.get(`club_${position}`) || '',
                position
            });
        }
    }

    // Validate that at least one archer is provided
    if (archersToAdd.length === 0) {
        showToast('Veuillez remplir au moins un archer', 'error');
        return;
    }

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

        // Create archers
        const addedArchers = [];
        
        for (const archerData of archersToAdd) {
            const archer = {
                ...archerData,
                seriesId: series.id,
                targetNumber: targetNumber
            };

            const archerId = await db.addArcher(archer);
            addedArchers.push({...archer, id: archerId});
        }

        const archerCount = addedArchers.length;
        const archerWord = archerCount === 1 ? 'archer ajouté' : 'archers ajoutés';
        showToast(`${archerCount} ${archerWord} avec succès à la série ${seriesNumber}, cible ${targetNumber}`, 'success');
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
