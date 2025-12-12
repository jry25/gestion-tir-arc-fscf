/**
 * Shooting Ranges Page - Manage series and print shooting range sheets
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
                <h2>Gestion des Séries (Pas de Tir)</h2>
            </div>
            <div class="card-body">
                <button id="add-series-btn" class="btn btn-primary mb-2">➕ Créer une série</button>

                <div id="series-form-container" class="hidden">
                    <form id="series-form" class="mb-3" style="background: var(--light-bg); padding: 1.5rem; border-radius: 4px;">
                        <h3 class="mb-2">Nouvelle Série</h3>
                        
                        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 1rem;">
                            <div class="form-group">
                                <label class="form-label">Numéro de série *</label>
                                <input type="number" name="number" class="form-input" min="1" required>
                            </div>

                            <div class="form-group">
                                <label class="form-label">Nombre de cibles *</label>
                                <input type="number" name="numberOfTargets" class="form-input" min="1" max="20" required>
                            </div>
                        </div>

                        <div class="mt-2">
                            <button type="submit" class="btn btn-success">Créer</button>
                            <button type="button" id="cancel-series-btn" class="btn btn-secondary">Annuler</button>
                        </div>
                    </form>
                </div>

                <div id="series-list">
                    <p class="text-center">Chargement...</p>
                </div>
            </div>
        </div>
    `;

    // Load series
    await loadSeries();

    // Event listeners
    document.getElementById('add-series-btn').addEventListener('click', showSeriesForm);
    document.getElementById('cancel-series-btn').addEventListener('click', hideSeriesForm);
    document.getElementById('series-form').addEventListener('submit', handleSubmit);
}

/**
 * Show the series form
 */
function showSeriesForm() {
    document.getElementById('series-form-container').classList.remove('hidden');
    document.getElementById('add-series-btn').disabled = true;
}

/**
 * Hide the series form
 */
function hideSeriesForm() {
    document.getElementById('series-form-container').classList.add('hidden');
    document.getElementById('add-series-btn').disabled = false;
    clearForm(document.getElementById('series-form'));
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
    const series = {
        number: parseInt(formData.get('number')),
        numberOfTargets: parseInt(formData.get('numberOfTargets'))
    };

    try {
        await db.addSeries(series);
        showToast('Série créée avec succès', 'success');
        hideSeriesForm();
        await loadSeries();
    } catch (error) {
        console.error('Error adding series:', error);
        showToast('Erreur lors de la création de la série', 'error');
    }
}

/**
 * Load and display series
 */
async function loadSeries() {
    const container = document.getElementById('series-list');
    
    try {
        const allSeries = await db.getAll('series');
        const archers = await db.getAll('archers');
        
        if (allSeries.length === 0) {
            container.innerHTML = '<p class="text-center">Aucune série configurée</p>';
            return;
        }

        // Sort series by number
        allSeries.sort((a, b) => a.number - b.number);

        container.innerHTML = `
            <div style="display: flex; flex-direction: column; gap: 1.5rem;">
                ${allSeries.map(series => renderSeriesCard(series, archers)).join('')}
            </div>
        `;

        // Add event listeners for print buttons
        allSeries.forEach(series => {
            const printBtn = document.getElementById(`print-series-${series.id}`);
            if (printBtn) {
                printBtn.addEventListener('click', () => printSeries(series, archers));
            }
        });

    } catch (error) {
        console.error('Error loading series:', error);
        container.innerHTML = '<p class="text-center">Erreur lors du chargement des séries</p>';
    }
}

/**
 * Render a series card
 */
function renderSeriesCard(series, allArchers) {
    // Filter archers for this series
    const seriesArchers = allArchers.filter(a => a.seriesId === series.id);
    
    // Group archers by target
    const targetGroups = {};
    for (let i = 1; i <= series.numberOfTargets; i++) {
        targetGroups[i] = {
            A: seriesArchers.find(a => a.targetNumber === i && a.position === 'A') || null,
            B: seriesArchers.find(a => a.targetNumber === i && a.position === 'B') || null,
            C: seriesArchers.find(a => a.targetNumber === i && a.position === 'C') || null,
            D: seriesArchers.find(a => a.targetNumber === i && a.position === 'D') || null,
        };
    }

    return `
        <div class="card">
            <div class="card-header" style="display: flex; justify-content: space-between; align-items: center;">
                <h3>Série ${series.number}</h3>
                <div>
                    <button id="print-series-${series.id}" class="btn btn-primary">🖨️ Imprimer</button>
                    <button class="btn btn-danger" onclick="window.deleteSeries(${series.id})">🗑️ Supprimer</button>
                </div>
            </div>
            <div class="card-body">
                <p><strong>Nombre de cibles:</strong> ${series.numberOfTargets}</p>
                <p><strong>Archers assignés:</strong> ${seriesArchers.length}</p>
                
                ${Object.keys(targetGroups).length > 0 ? `
                    <div class="table-responsive">
                        <table class="table">
                            <thead>
                                <tr>
                                    <th>Cible</th>
                                    <th colspan="2">Positions A/C</th>
                                    <th colspan="2">Positions B/D</th>
                                </tr>
                                <tr>
                                    <th></th>
                                    <th>Nom</th>
                                    <th>Prénom</th>
                                    <th>Nom</th>
                                    <th>Prénom</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${Object.entries(targetGroups).map(([targetNum, positions]) => `
                                    <tr>
                                        <td rowspan="2" style="vertical-align: middle;"><strong>${targetNum}</strong></td>
                                        <td>${positions.A ? positions.A.name : '-'}</td>
                                        <td>${positions.A ? positions.A.firstName : '-'}</td>
                                        <td>${positions.B ? positions.B.name : '-'}</td>
                                        <td>${positions.B ? positions.B.firstName : '-'}</td>
                                    </tr>
                                    <tr>
                                        <td>${positions.C ? positions.C.name : '-'}</td>
                                        <td>${positions.C ? positions.C.firstName : '-'}</td>
                                        <td>${positions.D ? positions.D.name : '-'}</td>
                                        <td>${positions.D ? positions.D.firstName : '-'}</td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    </div>
                ` : '<p>Aucun archer assigné à cette série</p>'}
            </div>
        </div>
    `;
}

/**
 * Print series sheet in A4 portrait format
 */
function printSeries(series, allArchers) {
    // Filter archers for this series
    const seriesArchers = allArchers.filter(a => a.seriesId === series.id);
    
    // Group archers by target
    const targetGroups = {};
    for (let i = 1; i <= series.numberOfTargets; i++) {
        targetGroups[i] = {
            A: seriesArchers.find(a => a.targetNumber === i && a.position === 'A') || null,
            B: seriesArchers.find(a => a.targetNumber === i && a.position === 'B') || null,
            C: seriesArchers.find(a => a.targetNumber === i && a.position === 'C') || null,
            D: seriesArchers.find(a => a.targetNumber === i && a.position === 'D') || null,
        };
    }

    // Create print window
    const printWindow = window.open('', '_blank');
    
    const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
            <title>Série ${series.number} - Pas de Tir</title>
            <style>
                @page {
                    size: A4 portrait;
                    margin: 1cm;
                }
                
                body {
                    font-family: Arial, sans-serif;
                    font-size: 12pt;
                    margin: 0;
                    padding: 20px;
                }
                
                h1 {
                    text-align: center;
                    margin-bottom: 20px;
                    font-size: 18pt;
                }
                
                table {
                    width: 100%;
                    border-collapse: collapse;
                    margin-top: 20px;
                }
                
                th, td {
                    border: 1px solid #000;
                    padding: 8px;
                    text-align: left;
                }
                
                th {
                    background-color: #f0f0f0;
                    font-weight: bold;
                }
                
                .target-cell {
                    text-align: center;
                    font-weight: bold;
                    font-size: 14pt;
                }
                
                .header-info {
                    margin-bottom: 20px;
                    text-align: center;
                }
                
                @media print {
                    body {
                        padding: 0;
                    }
                }
            </style>
        </head>
        <body>
            <div class="header-info">
                <h1>🏹 Série ${series.number} - Pas de Tir FSCF</h1>
                <p><strong>Nombre de cibles:</strong> ${series.numberOfTargets} | <strong>Date:</strong> ${new Date().toLocaleDateString('fr-FR')}</p>
            </div>
            
            <table>
                <thead>
                    <tr>
                        <th rowspan="2" style="width: 60px;">Cible</th>
                        <th rowspan="2" style="width: 40px;"></th>
                        <th colspan="5">Archer</th>
                    </tr>
                    <tr>
                        <th>Nom</th>
                        <th>Prénom</th>
                        <th>Club</th>
                        <th>Type d'arc</th>
                        <th>Catégorie</th>
                    </tr>
                </thead>
                <tbody>
                    ${Object.entries(targetGroups).map(([targetNum, positions]) => {
                        const rows = [];
                        ['A', 'C', 'B', 'D'].forEach((pos, index) => {
                            const archer = positions[pos];
                            const isFirstOfPair = index === 0 || index === 2;
                            rows.push(`
                                <tr>
                                    ${isFirstOfPair ? `<td rowspan="2" class="target-cell">${targetNum}</td>` : ''}
                                    <td style="text-align: center; font-weight: bold;">${pos}</td>
                                    <td>${archer ? archer.name : ''}</td>
                                    <td>${archer ? archer.firstName : ''}</td>
                                    <td>${archer ? archer.club || '' : ''}</td>
                                    <td>${archer ? getWeaponName(archer.weapon) : ''}</td>
                                    <td>${archer ? getCategoryName(archer.category) : ''}</td>
                                </tr>
                            `);
                        });
                        return rows.join('');
                    }).join('')}
                </tbody>
            </table>
            
            <script>
                window.onload = function() {
                    window.print();
                };
            </script>
        </body>
        </html>
    `;
    
    printWindow.document.write(htmlContent);
    printWindow.document.close();
}

/**
 * Delete a series
 */
window.deleteSeries = async function(id) {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette série ? Les archers assignés ne seront pas supprimés.')) {
        return;
    }

    try {
        // Unassign all archers from this series
        const archers = await db.getAll('archers');
        const updates = archers
            .filter(a => a.seriesId === id)
            .map(a => {
                return db.update('archers', { ...a, seriesId: null, targetNumber: null, position: null });
            });
        
        await Promise.all(updates);
        
        await db.delete('series', id);
        showToast('Série supprimée avec succès', 'success');
        await loadSeries();
    } catch (error) {
        console.error('Error deleting series:', error);
        showToast('Erreur lors de la suppression', 'error');
    }
};

/**
 * Helper functions for print
 */
function getCategoryName(code) {
    const categories = {
        'BF': 'Benjamine', 'BH': 'Benjamin', 'MF': 'Minime fille', 'MH': 'Minime garçon',
        'CF': 'Cadette', 'CH': 'Cadet', 'JFCL': 'Junior F CL', 'JFAP': 'Junior F AP',
        'JHCL': 'Junior H CL', 'JHAP': 'Junior H AP', 'SFCL': 'Senior F CL', 'SFAP': 'Senior F AP',
        'SHCL': 'Senior H CL', 'SHAP': 'Senior H AP', 'VFCL': 'Vétéran F CL', 'VFAP': 'Vétéran F AP',
        'VHCL': 'Vétéran H CL', 'VHAP': 'Vétéran H AP', 'SVFCL': 'Super vét. F CL',
        'SVFAP': 'Super vét. F AP', 'SVHCL': 'Super vét. H CL', 'SVHAP': 'Super vét. H AP'
    };
    return categories[code] || code;
}

function getWeaponName(code) {
    const weapons = { 'CL': 'Arc Classique', 'CO': 'Arc à Poulies', 'BB': 'Bare Bow', 'AD': 'Arc Droit' };
    return weapons[code] || code;
}
