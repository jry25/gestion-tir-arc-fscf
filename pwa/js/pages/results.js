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
                <h2>Saisie des Résultats</h2>
            </div>
            <div class="card-body">
                <div id="results-entry">
                    <p class="text-center">Chargement...</p>
                </div>
            </div>
        </div>
    `;

    // Load results entry interface
    await loadResultsEntry();
}

/**
 * Load and display the results entry interface
 */
async function loadResultsEntry() {
    const container = document.getElementById('results-entry');
    
    try {
        const allSeries = await db.getAll('series');
        const archers = await db.getAll('archers');
        const results = await db.getAll('results');
        
        if (allSeries.length === 0) {
            container.innerHTML = '<p class="text-center">Aucune série configurée. Veuillez d\'abord créer une série dans "Pas de tir".</p>';
            return;
        }
        
        if (archers.length === 0) {
            container.innerHTML = '<p class="text-center">Aucun archer enregistré. Veuillez d\'abord ajouter des archers.</p>';
            return;
        }

        // Sort series by number
        allSeries.sort((a, b) => a.number - b.number);

        // Create results lookup maps
        const individualResultsMap = new Map();
        const pairResultsMap = new Map();
        
        results.forEach(result => {
            if (result.archerId && result.individualScore !== null && result.individualScore !== undefined) {
                individualResultsMap.set(result.archerId, result);
            }
            if (result.pairType && result.pairScore !== null && result.pairScore !== undefined) {
                const key = `${result.seriesId}-${result.targetNumber}-${result.pairType}`;
                pairResultsMap.set(key, result);
            }
        });

        container.innerHTML = `
            <div style="margin-bottom: 1.5rem;">
                <p><strong>Instructions :</strong></p>
                <ul style="margin-left: 1.5rem; color: var(--light-text);">
                    <li>Scores individuels : 0 à 300 points maximum</li>
                    <li>Scores binômes (AC et BD) : 0 à 310 points maximum</li>
                    <li>Les résultats sont sauvegardés automatiquement lors de la saisie</li>
                </ul>
            </div>
            
            <div style="display: flex; flex-direction: column; gap: 2rem;">
                ${allSeries.map(series => renderSeriesResults(series, archers, individualResultsMap, pairResultsMap)).join('')}
            </div>
        `;

        // Add event listeners for all score inputs
        addScoreEventListeners();
        
    } catch (error) {
        console.error('Error loading results entry:', error);
        container.innerHTML = '<p class="text-center">Erreur lors du chargement de la saisie des résultats</p>';
    }
}

/**
 * Render results entry for a series
 */
function renderSeriesResults(series, allArchers, individualResultsMap, pairResultsMap) {
    // Filter archers for this series
    const seriesArchers = allArchers.filter(a => a.seriesId === series.id);
    
    if (seriesArchers.length === 0) {
        return `
            <div class="card">
                <div class="card-header">
                    <h3>Série ${series.number}</h3>
                </div>
                <div class="card-body">
                    <p>Aucun archer assigné à cette série</p>
                </div>
            </div>
        `;
    }
    
    // Group archers by target
    const targetGroups = {};
    seriesArchers.forEach(archer => {
        const targetNum = archer.targetNumber;
        if (!targetGroups[targetNum]) {
            targetGroups[targetNum] = { A: null, B: null, C: null, D: null };
        }
        targetGroups[targetNum][archer.position] = archer;
    });

    // Sort targets numerically
    const sortedTargets = Object.keys(targetGroups).sort((a, b) => parseInt(a) - parseInt(b));

    return `
        <div class="card">
            <div class="card-header">
                <h3>Série ${series.number}</h3>
            </div>
            <div class="card-body">
                <div class="table-responsive">
                    <table class="table" style="width: 100%; border-collapse: collapse;">
                        <thead>
                            <tr style="background-color: var(--light-bg);">
                                <th rowspan="2" style="border: 1px solid var(--border-color); padding: 0.75rem; text-align: center; vertical-align: middle;">Cible</th>
                                <th rowspan="2" style="border: 1px solid var(--border-color); padding: 0.75rem; text-align: center; vertical-align: middle;">Pos.</th>
                                <th rowspan="2" style="border: 1px solid var(--border-color); padding: 0.75rem; vertical-align: middle;">Archer</th>
                                <th colspan="2" style="border: 1px solid var(--border-color); padding: 0.75rem; text-align: center;">Résultats</th>
                            </tr>
                            <tr style="background-color: var(--light-bg);">
                                <th style="border: 1px solid var(--border-color); padding: 0.75rem; text-align: center; min-width: 120px;">Score Individuel<br><small>(0-300)</small></th>
                                <th style="border: 1px solid var(--border-color); padding: 0.75rem; text-align: center; min-width: 120px;">Score Binôme<br><small>(0-310)</small></th>
                            </tr>
                        </thead>
                        <tbody>
                            ${sortedTargets.map(targetNum => renderTargetResults(series, targetNum, targetGroups[targetNum], individualResultsMap, pairResultsMap)).join('')}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    `;
}

/**
 * Render results entry for a single target
 */
function renderTargetResults(series, targetNumber, positions, individualResultsMap, pairResultsMap) {
    const rows = [];
    const positionOrder = ['A', 'C', 'B', 'D'];
    
    positionOrder.forEach((pos, index) => {
        const archer = positions[pos];
        const isFirstOfPair = index === 0 || index === 2;
        const pairType = index < 2 ? 'AC' : 'BD';
        const rowspanCount = 2;
        
        // Get individual score
        const individualResult = archer ? individualResultsMap.get(archer.id) : null;
        const individualScore = individualResult ? individualResult.individualScore : '';
        
        // Get pair score (only for first position of pair)
        const pairKey = `${series.id}-${targetNumber}-${pairType}`;
        const pairResult = pairResultsMap.get(pairKey);
        const pairScore = pairResult ? pairResult.pairScore : '';
        
        rows.push(`
            <tr>
                ${isFirstOfPair ? `<td rowspan="${rowspanCount}" style="border: 1px solid var(--border-color); padding: 0.75rem; text-align: center; vertical-align: middle; font-weight: bold;">${targetNumber}</td>` : ''}
                <td style="border: 1px solid var(--border-color); padding: 0.75rem; text-align: center; font-weight: bold;">${pos}</td>
                <td style="border: 1px solid var(--border-color); padding: 0.75rem;">
                    ${archer ? `${archer.firstName} ${archer.name}` : '<em style="color: var(--light-text);">-</em>'}
                </td>
                <td style="border: 1px solid var(--border-color); padding: 0.5rem; text-align: center;">
                    ${archer ? `
                        <input type="number" 
                            class="form-input individual-score" 
                            style="width: 100px; text-align: center; padding: 0.5rem;"
                            min="0" 
                            max="300" 
                            value="${individualScore}"
                            data-archer-id="${archer.id}"
                            data-series-id="${series.id}"
                            data-target-number="${targetNumber}"
                            placeholder="0-300">
                    ` : '-'}
                </td>
                ${isFirstOfPair ? `
                    <td rowspan="${rowspanCount}" style="border: 1px solid var(--border-color); padding: 0.5rem; text-align: center; vertical-align: middle;">
                        <div style="display: flex; flex-direction: column; align-items: center; gap: 0.5rem;">
                            <strong>${pairType}</strong>
                            <input type="number" 
                                class="form-input pair-score" 
                                style="width: 100px; text-align: center; padding: 0.5rem;"
                                min="0" 
                                max="310" 
                                value="${pairScore}"
                                data-series-id="${series.id}"
                                data-target-number="${targetNumber}"
                                data-pair-type="${pairType}"
                                placeholder="0-310">
                        </div>
                    </td>
                ` : ''}
            </tr>
        `);
    });
    
    return rows.join('');
}

/**
 * Add event listeners for score inputs
 */
function addScoreEventListeners() {
    // Individual score inputs
    document.querySelectorAll('.individual-score').forEach(input => {
        input.addEventListener('change', handleIndividualScoreChange);
        input.addEventListener('blur', handleIndividualScoreChange);
    });
    
    // Pair score inputs
    document.querySelectorAll('.pair-score').forEach(input => {
        input.addEventListener('change', handlePairScoreChange);
        input.addEventListener('blur', handlePairScoreChange);
    });
}

/**
 * Handle individual score change
 */
async function handleIndividualScoreChange(e) {
    const input = e.target;
    const archerId = parseInt(input.dataset.archerId);
    const seriesId = parseInt(input.dataset.seriesId);
    const targetNumber = parseInt(input.dataset.targetNumber);
    const scoreValue = input.value.trim();
    
    // Validate score
    if (scoreValue !== '') {
        const score = parseInt(scoreValue);
        if (isNaN(score) || score < 0 || score > 300) {
            showToast('Le score individuel doit être entre 0 et 300', 'error');
            input.value = '';
            return;
        }
        
        // Save result
        try {
            // Check if result exists
            const results = await db.getAll('results');
            const existingResult = results.find(r => r.archerId === archerId && r.individualScore !== null && r.individualScore !== undefined);
            
            if (existingResult) {
                // Update existing result
                await db.update('results', {
                    ...existingResult,
                    individualScore: score,
                    seriesId: seriesId,
                    targetNumber: targetNumber,
                    date: new Date().toISOString()
                });
            } else {
                // Create new result
                await db.addResult({
                    archerId: archerId,
                    seriesId: seriesId,
                    targetNumber: targetNumber,
                    individualScore: score
                });
            }
            
            showToast('Score individuel sauvegardé', 'success', 1500);
        } catch (error) {
            console.error('Error saving individual score:', error);
            showToast('Erreur lors de la sauvegarde du score', 'error');
        }
    }
}

/**
 * Handle pair score change
 */
async function handlePairScoreChange(e) {
    const input = e.target;
    const seriesId = parseInt(input.dataset.seriesId);
    const targetNumber = parseInt(input.dataset.targetNumber);
    const pairType = input.dataset.pairType;
    const scoreValue = input.value.trim();
    
    // Validate score
    if (scoreValue !== '') {
        const score = parseInt(scoreValue);
        if (isNaN(score) || score < 0 || score > 310) {
            showToast('Le score binôme doit être entre 0 et 310', 'error');
            input.value = '';
            return;
        }
        
        // Save result
        try {
            // Check if result exists
            const results = await db.getAll('results');
            const existingResult = results.find(r => 
                r.seriesId === seriesId && 
                r.targetNumber === targetNumber && 
                r.pairType === pairType &&
                r.pairScore !== null &&
                r.pairScore !== undefined
            );
            
            if (existingResult) {
                // Update existing result
                await db.update('results', {
                    ...existingResult,
                    pairScore: score,
                    date: new Date().toISOString()
                });
            } else {
                // Create new result
                await db.addResult({
                    seriesId: seriesId,
                    targetNumber: targetNumber,
                    pairType: pairType,
                    pairScore: score
                });
            }
            
            showToast(`Score binôme ${pairType} sauvegardé`, 'success', 1500);
        } catch (error) {
            console.error('Error saving pair score:', error);
            showToast('Erreur lors de la sauvegarde du score', 'error');
        }
    }
}

