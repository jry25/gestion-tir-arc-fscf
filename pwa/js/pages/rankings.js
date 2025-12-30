/**
 * Rankings Page - Display competition rankings
 */

import db from '../db.js';
import { showToast, getCategoryName, getWeaponName } from '../utils.js';

/**
 * Render the rankings page
 */
export async function render() {
    const container = document.getElementById('page-content');
    
    container.innerHTML = `
        <div class="card no-print">
            <div class="card-header">
                <h2>Classements de la Compétition</h2>
            </div>
            <div class="card-body">
                <p>Consultez et imprimez les classements de la compétition.</p>
                <button id="print-rankings-btn" class="btn btn-primary">🖨️ Imprimer les classements</button>
            </div>
        </div>
        
        <div id="rankings-container">
            <p class="text-center">Chargement...</p>
        </div>
    `;

    // Load rankings
    await loadRankings();
    
    // Setup print button
    document.getElementById('print-rankings-btn').addEventListener('click', () => {
        window.print();
    });
}

/**
 * Load and display all rankings
 */
async function loadRankings() {
    const container = document.getElementById('rankings-container');
    
    try {
        const archers = await db.getAll('archers');
        const results = await db.getAll('results');
        const categories = await db.getAll('categories');
        
        if (archers.length === 0 || results.length === 0) {
            container.innerHTML = '<div class="card"><div class="card-body"><p class="text-center">Aucune donnée disponible pour générer les classements.</p></div></div>';
            return;
        }
        
        // Calculate all rankings
        const individualAll = calculateIndividualRanking(archers, results);
        const individualByCategory = calculateIndividualRankingByCategory(archers, results);
        const individualByCategoryAndWeapon = calculateIndividualRankingByCategoryAndWeapon(archers, results);
        const pairAll = calculatePairRanking(results, archers);
        const pairByCategory = calculatePairRankingByCategory(results, archers);
        const pairByCategoryAndWeapon = calculatePairRankingByCategoryAndWeapon(results, archers);
        const clubRanking = calculateClubRanking(archers, results);
        
        // Render all rankings
        let html = '';
        
        // Individual rankings
        html += renderRankingSection(
            'Classement Individuel - Tous clubs, toutes catégories, tous types d\'arc',
            renderIndividualRankingTable(individualAll),
            true
        );
        
        html += renderRankingSection(
            'Classement Individuel - Tous clubs, par catégories, tous types d\'arc',
            renderIndividualRankingByCategory(individualByCategory),
            true
        );
        
        html += renderRankingSection(
            'Classement Individuel - Tous clubs, par catégories, par types d\'arc',
            renderIndividualRankingByCategoryAndWeapon(individualByCategoryAndWeapon),
            true
        );
        
        // Pair rankings
        html += renderRankingSection(
            'Classement Binômes - Tous clubs, toutes catégories, tous types d\'arc',
            renderPairRankingTable(pairAll),
            true
        );
        
        html += renderRankingSection(
            'Classement Binômes - Tous clubs, par catégories, tous types d\'arc',
            renderPairRankingByCategory(pairByCategory),
            true
        );
        
        html += renderRankingSection(
            'Classement Binômes - Tous clubs, par catégories, par types d\'arc',
            renderPairRankingByCategoryAndWeapon(pairByCategoryAndWeapon),
            true
        );
        
        // Club ranking
        html += renderRankingSection(
            'Classement par Clubs - Cumul des points individuels et binômes',
            renderClubRankingTable(clubRanking),
            false
        );
        
        container.innerHTML = html;
        
    } catch (error) {
        console.error('Error loading rankings:', error);
        container.innerHTML = '<div class="card"><div class="card-body"><p class="text-center">Erreur lors du chargement des classements</p></div></div>';
    }
}

/**
 * Calculate individual ranking (all clubs, all categories, all bow types)
 */
function calculateIndividualRanking(archers, results) {
    const ranking = [];
    
    archers.forEach(archer => {
        const individualResult = results.find(r => 
            r.archerId === archer.id && 
            r.individualScore !== null && 
            r.individualScore !== undefined
        );
        
        if (individualResult) {
            ranking.push({
                archer: archer,
                score: individualResult.individualScore
            });
        }
    });
    
    // Sort by score descending
    ranking.sort((a, b) => b.score - a.score);
    
    return ranking;
}

/**
 * Calculate individual ranking by category
 */
function calculateIndividualRankingByCategory(archers, results) {
    const byCategory = {};
    
    archers.forEach(archer => {
        const individualResult = results.find(r => 
            r.archerId === archer.id && 
            r.individualScore !== null && 
            r.individualScore !== undefined
        );
        
        if (individualResult && archer.category) {
            if (!byCategory[archer.category]) {
                byCategory[archer.category] = [];
            }
            byCategory[archer.category].push({
                archer: archer,
                score: individualResult.individualScore
            });
        }
    });
    
    // Sort each category by score descending
    Object.keys(byCategory).forEach(category => {
        byCategory[category].sort((a, b) => b.score - a.score);
    });
    
    return byCategory;
}

/**
 * Calculate individual ranking by category and weapon
 */
function calculateIndividualRankingByCategoryAndWeapon(archers, results) {
    const byCategoryAndWeapon = {};
    
    archers.forEach(archer => {
        const individualResult = results.find(r => 
            r.archerId === archer.id && 
            r.individualScore !== null && 
            r.individualScore !== undefined
        );
        
        if (individualResult && archer.category && archer.weapon) {
            const key = `${archer.category}-${archer.weapon}`;
            if (!byCategoryAndWeapon[key]) {
                byCategoryAndWeapon[key] = {
                    category: archer.category,
                    weapon: archer.weapon,
                    archers: []
                };
            }
            byCategoryAndWeapon[key].archers.push({
                archer: archer,
                score: individualResult.individualScore
            });
        }
    });
    
    // Sort each group by score descending
    Object.keys(byCategoryAndWeapon).forEach(key => {
        byCategoryAndWeapon[key].archers.sort((a, b) => b.score - a.score);
    });
    
    return byCategoryAndWeapon;
}

/**
 * Calculate pair ranking
 */
function calculatePairRanking(results, archers) {
    const ranking = [];
    const processedPairs = new Set();
    
    results.forEach(result => {
        if (result.pairScore !== null && result.pairScore !== undefined && result.pairType) {
            const key = `${result.seriesId}-${result.targetNumber}-${result.pairType}`;
            if (!processedPairs.has(key)) {
                processedPairs.add(key);
                
                // Find the two archers in this pair
                const pairArchers = archers.filter(a => 
                    a.seriesId === result.seriesId && 
                    a.targetNumber === result.targetNumber &&
                    (result.pairType === 'AC' ? (a.position === 'A' || a.position === 'C') : (a.position === 'B' || a.position === 'D'))
                );
                
                ranking.push({
                    pairType: result.pairType,
                    score: result.pairScore,
                    archers: pairArchers,
                    seriesId: result.seriesId,
                    targetNumber: result.targetNumber
                });
            }
        }
    });
    
    // Sort by score descending
    ranking.sort((a, b) => b.score - a.score);
    
    return ranking;
}

/**
 * Calculate pair ranking by category
 */
function calculatePairRankingByCategory(results, archers) {
    const byCategory = {};
    const processedPairs = new Set();
    
    results.forEach(result => {
        if (result.pairScore !== null && result.pairScore !== undefined && result.pairType) {
            const key = `${result.seriesId}-${result.targetNumber}-${result.pairType}`;
            if (!processedPairs.has(key)) {
                processedPairs.add(key);
                
                // Find the two archers in this pair
                const pairArchers = archers.filter(a => 
                    a.seriesId === result.seriesId && 
                    a.targetNumber === result.targetNumber &&
                    (result.pairType === 'AC' ? (a.position === 'A' || a.position === 'C') : (a.position === 'B' || a.position === 'D'))
                );
                
                // Group by first archer's category (or use a common category logic)
                if (pairArchers.length > 0 && pairArchers[0].category) {
                    const category = pairArchers[0].category;
                    if (!byCategory[category]) {
                        byCategory[category] = [];
                    }
                    byCategory[category].push({
                        pairType: result.pairType,
                        score: result.pairScore,
                        archers: pairArchers,
                        seriesId: result.seriesId,
                        targetNumber: result.targetNumber
                    });
                }
            }
        }
    });
    
    // Sort each category by score descending
    Object.keys(byCategory).forEach(category => {
        byCategory[category].sort((a, b) => b.score - a.score);
    });
    
    return byCategory;
}

/**
 * Calculate pair ranking by category and weapon
 */
function calculatePairRankingByCategoryAndWeapon(results, archers) {
    const byCategoryAndWeapon = {};
    const processedPairs = new Set();
    
    results.forEach(result => {
        if (result.pairScore !== null && result.pairScore !== undefined && result.pairType) {
            const key = `${result.seriesId}-${result.targetNumber}-${result.pairType}`;
            if (!processedPairs.has(key)) {
                processedPairs.add(key);
                
                // Find the two archers in this pair
                const pairArchers = archers.filter(a => 
                    a.seriesId === result.seriesId && 
                    a.targetNumber === result.targetNumber &&
                    (result.pairType === 'AC' ? (a.position === 'A' || a.position === 'C') : (a.position === 'B' || a.position === 'D'))
                );
                
                // Group by first archer's category and weapon
                if (pairArchers.length > 0 && pairArchers[0].category && pairArchers[0].weapon) {
                    const groupKey = `${pairArchers[0].category}-${pairArchers[0].weapon}`;
                    if (!byCategoryAndWeapon[groupKey]) {
                        byCategoryAndWeapon[groupKey] = {
                            category: pairArchers[0].category,
                            weapon: pairArchers[0].weapon,
                            pairs: []
                        };
                    }
                    byCategoryAndWeapon[groupKey].pairs.push({
                        pairType: result.pairType,
                        score: result.pairScore,
                        archers: pairArchers,
                        seriesId: result.seriesId,
                        targetNumber: result.targetNumber
                    });
                }
            }
        }
    });
    
    // Sort each group by score descending
    Object.keys(byCategoryAndWeapon).forEach(key => {
        byCategoryAndWeapon[key].pairs.sort((a, b) => b.score - a.score);
    });
    
    return byCategoryAndWeapon;
}

/**
 * Calculate club ranking
 */
function calculateClubRanking(archers, results) {
    const clubScores = {};
    
    // Add individual scores
    archers.forEach(archer => {
        if (archer.club) {
            const individualResult = results.find(r => 
                r.archerId === archer.id && 
                r.individualScore !== null && 
                r.individualScore !== undefined
            );
            
            if (individualResult) {
                if (!clubScores[archer.club]) {
                    clubScores[archer.club] = {
                        club: archer.club,
                        individualTotal: 0,
                        pairTotal: 0,
                        total: 0
                    };
                }
                clubScores[archer.club].individualTotal += individualResult.individualScore;
            }
        }
    });
    
    // Add pair scores (avoid double counting)
    const processedPairs = new Set();
    results.forEach(result => {
        if (result.pairScore !== null && result.pairScore !== undefined && result.pairType) {
            const key = `${result.seriesId}-${result.targetNumber}-${result.pairType}`;
            if (!processedPairs.has(key)) {
                processedPairs.add(key);
                
                // Find the two archers in this pair
                const pairArchers = archers.filter(a => 
                    a.seriesId === result.seriesId && 
                    a.targetNumber === result.targetNumber &&
                    (result.pairType === 'AC' ? (a.position === 'A' || a.position === 'C') : (a.position === 'B' || a.position === 'D'))
                );
                
                // Add pair score to club (use first archer's club)
                if (pairArchers.length > 0 && pairArchers[0].club) {
                    const club = pairArchers[0].club;
                    if (!clubScores[club]) {
                        clubScores[club] = {
                            club: club,
                            individualTotal: 0,
                            pairTotal: 0,
                            total: 0
                        };
                    }
                    clubScores[club].pairTotal += result.pairScore;
                }
            }
        }
    });
    
    // Calculate totals
    const ranking = Object.values(clubScores).map(club => {
        club.total = club.individualTotal + club.pairTotal;
        return club;
    });
    
    // Sort by total score descending
    ranking.sort((a, b) => b.total - a.total);
    
    return ranking;
}

/**
 * Render a ranking section with page break
 */
function renderRankingSection(title, content, pageBreak = true) {
    return `
        <div class="card ranking-section" style="${pageBreak ? 'page-break-after: always;' : ''}">
            <div class="card-header">
                <h2>${title}</h2>
            </div>
            <div class="card-body">
                ${content}
            </div>
        </div>
    `;
}

/**
 * Render individual ranking table
 */
function renderIndividualRankingTable(ranking) {
    if (ranking.length === 0) {
        return '<p class="text-center">Aucune donnée disponible</p>';
    }
    
    return `
        <div class="table-responsive">
            <table class="table">
                <thead>
                    <tr>
                        <th>Rang</th>
                        <th>Nom</th>
                        <th>Prénom</th>
                        <th>Licence</th>
                        <th>Club</th>
                        <th>Catégorie</th>
                        <th>Type d'Arc</th>
                        <th>Score</th>
                    </tr>
                </thead>
                <tbody>
                    ${ranking.map((item, index) => `
                        <tr>
                            <td><strong>${index + 1}</strong></td>
                            <td>${item.archer.name}</td>
                            <td>${item.archer.firstName}</td>
                            <td>${item.archer.license || '-'}</td>
                            <td>${item.archer.club || '-'}</td>
                            <td>${getCategoryName(item.archer.category)}</td>
                            <td>${getWeaponName(item.archer.weapon)}</td>
                            <td><strong>${item.score}</strong></td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>
    `;
}

/**
 * Render individual ranking by category
 */
function renderIndividualRankingByCategory(byCategory) {
    const categories = Object.keys(byCategory).sort();
    
    if (categories.length === 0) {
        return '<p class="text-center">Aucune donnée disponible</p>';
    }
    
    return categories.map(category => `
        <div style="margin-bottom: 2rem;">
            <h3 style="margin-bottom: 1rem; color: var(--primary-color);">Catégorie: ${getCategoryName(category)}</h3>
            ${renderIndividualRankingTable(byCategory[category])}
        </div>
    `).join('');
}

/**
 * Render individual ranking by category and weapon
 */
function renderIndividualRankingByCategoryAndWeapon(byCategoryAndWeapon) {
    const keys = Object.keys(byCategoryAndWeapon).sort();
    
    if (keys.length === 0) {
        return '<p class="text-center">Aucune donnée disponible</p>';
    }
    
    return keys.map(key => {
        const data = byCategoryAndWeapon[key];
        return `
            <div style="margin-bottom: 2rem;">
                <h3 style="margin-bottom: 1rem; color: var(--primary-color);">
                    Catégorie: ${getCategoryName(data.category)} - ${getWeaponName(data.weapon)}
                </h3>
                ${renderIndividualRankingTable(data.archers)}
            </div>
        `;
    }).join('');
}

/**
 * Render pair ranking table
 */
function renderPairRankingTable(ranking) {
    if (ranking.length === 0) {
        return '<p class="text-center">Aucune donnée disponible</p>';
    }
    
    return `
        <div class="table-responsive">
            <table class="table">
                <thead>
                    <tr>
                        <th>Rang</th>
                        <th>Binôme</th>
                        <th>Archers</th>
                        <th>Club</th>
                        <th>Score</th>
                    </tr>
                </thead>
                <tbody>
                    ${ranking.map((item, index) => {
                        const archerNames = item.archers.map(a => `${a.firstName} ${a.name}`).join(' / ');
                        const club = item.archers.length > 0 ? item.archers[0].club || '-' : '-';
                        return `
                            <tr>
                                <td><strong>${index + 1}</strong></td>
                                <td>${item.pairType}</td>
                                <td>${archerNames || '-'}</td>
                                <td>${club}</td>
                                <td><strong>${item.score}</strong></td>
                            </tr>
                        `;
                    }).join('')}
                </tbody>
            </table>
        </div>
    `;
}

/**
 * Render pair ranking by category
 */
function renderPairRankingByCategory(byCategory) {
    const categories = Object.keys(byCategory).sort();
    
    if (categories.length === 0) {
        return '<p class="text-center">Aucune donnée disponible</p>';
    }
    
    return categories.map(category => `
        <div style="margin-bottom: 2rem;">
            <h3 style="margin-bottom: 1rem; color: var(--primary-color);">Catégorie: ${getCategoryName(category)}</h3>
            ${renderPairRankingTable(byCategory[category])}
        </div>
    `).join('');
}

/**
 * Render pair ranking by category and weapon
 */
function renderPairRankingByCategoryAndWeapon(byCategoryAndWeapon) {
    const keys = Object.keys(byCategoryAndWeapon).sort();
    
    if (keys.length === 0) {
        return '<p class="text-center">Aucune donnée disponible</p>';
    }
    
    return keys.map(key => {
        const data = byCategoryAndWeapon[key];
        return `
            <div style="margin-bottom: 2rem;">
                <h3 style="margin-bottom: 1rem; color: var(--primary-color);">
                    Catégorie: ${getCategoryName(data.category)} - ${getWeaponName(data.weapon)}
                </h3>
                ${renderPairRankingTable(data.pairs)}
            </div>
        `;
    }).join('');
}

/**
 * Render club ranking table
 */
function renderClubRankingTable(ranking) {
    if (ranking.length === 0) {
        return '<p class="text-center">Aucune donnée disponible</p>';
    }
    
    return `
        <div class="table-responsive">
            <table class="table">
                <thead>
                    <tr>
                        <th>Rang</th>
                        <th>Club</th>
                        <th>Total Individuel</th>
                        <th>Total Binômes</th>
                        <th>Total Général</th>
                    </tr>
                </thead>
                <tbody>
                    ${ranking.map((item, index) => `
                        <tr>
                            <td><strong>${index + 1}</strong></td>
                            <td>${item.club}</td>
                            <td>${item.individualTotal}</td>
                            <td>${item.pairTotal}</td>
                            <td><strong>${item.total}</strong></td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>
    `;
}
