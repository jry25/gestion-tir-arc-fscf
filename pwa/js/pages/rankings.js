/**
 * Rankings Page - Display competition rankings
 */

import db from '../db.js';
import { showToast, getCategoryName, getWeaponName } from '../utils.js';

// Store for manual rank overrides
let rankOverrides = {};

/**
 * Load rank overrides from database
 */
async function loadRankOverrides() {
    try {
        const overrides = await db.getAll('rankOverrides');
        rankOverrides = {};
        overrides.forEach(override => {
            const key = `${override.rankingType}-${override.categoryKey || 'all'}-${override.entityId}`;
            rankOverrides[key] = override.manualRank;
        });
    } catch (error) {
        console.error('Error loading rank overrides:', error);
        rankOverrides = {};
    }
}

/**
 * Save rank override to database
 */
async function saveRankOverride(rankingType, categoryKey, entityId, manualRank) {
    try {
        // Check if override already exists
        const existingOverrides = await db.getAll('rankOverrides');
        const existing = existingOverrides.find(
            o => o.rankingType === rankingType && 
                 o.categoryKey === categoryKey && 
                 o.entityId === entityId
        );
        
        if (existing) {
            // Update existing
            existing.manualRank = manualRank;
            await db.update('rankOverrides', existing);
        } else {
            // Create new
            await db.add('rankOverrides', {
                rankingType,
                categoryKey: categoryKey || 'all',
                entityId,
                manualRank,
                createdAt: new Date().toISOString()
            });
        }
        
        // Update local cache
        const key = `${rankingType}-${categoryKey || 'all'}-${entityId}`;
        rankOverrides[key] = manualRank;
        
        showToast('Rang modifié avec succès', 'success');
    } catch (error) {
        console.error('Error saving rank override:', error);
        showToast('Erreur lors de la modification du rang', 'error');
    }
}

/**
 * Get manual rank override if it exists
 */
function getRankOverride(rankingType, categoryKey, entityId) {
    const key = `${rankingType}-${categoryKey || 'all'}-${entityId}`;
    return rankOverrides[key];
}

/**
 * Detect ties in a ranking array
 * Returns an array of groups, where each group contains indices of tied items
 */
function detectTies(ranking) {
    const tieGroups = [];
    const scoreMap = new Map();
    
    ranking.forEach((item, index) => {
        const score = item.score;
        if (!scoreMap.has(score)) {
            scoreMap.set(score, []);
        }
        scoreMap.get(score).push(index);
    });
    
    // Only include groups with 2+ items (actual ties)
    scoreMap.forEach((indices, score) => {
        if (indices.length > 1) {
            tieGroups.push({ score, indices });
        }
    });
    
    return tieGroups;
}

/**
 * Apply manual rank overrides to a ranking array
 */
function applyRankOverrides(ranking, rankingType, categoryKey) {
    // First, check if any manual overrides exist for this ranking
    const rankedItems = ranking.map((item, index) => {
        // Determine entityId based on ranking type
        let entityId;
        if (item.archer && item.archer.id) {
            // Individual ranking
            entityId = item.archer.id;
        } else if (item.seriesId && item.targetNumber && item.pairType) {
            // Pair ranking
            entityId = `${item.seriesId}-${item.targetNumber}-${item.pairType}`;
        } else if (item.club) {
            // Club ranking
            entityId = item.club;
        } else {
            entityId = index; // Fallback
        }
        
        const manualRank = getRankOverride(rankingType, categoryKey, entityId);
        
        // Determine score field based on item type
        const scoreValue = item.total !== undefined ? item.total : item.score;
        
        return {
            ...item,
            originalIndex: index,
            entityId,
            manualRank: manualRank !== undefined ? manualRank : null,
            scoreValue // Add normalized score value for sorting
        };
    });
    
    // Sort by score first (descending), then by manual rank (if exists), then by original index
    rankedItems.sort((a, b) => {
        // First, sort by score (descending)
        if (a.scoreValue !== b.scoreValue) {
            return b.scoreValue - a.scoreValue;
        }
        
        // If scores are equal (tied), use manual rank to determine order within the tie
        if (a.manualRank !== null && b.manualRank !== null) {
            return a.manualRank - b.manualRank;
        } else if (a.manualRank !== null) {
            return -1; // Item with manual rank comes first
        } else if (b.manualRank !== null) {
            return 1; // Item with manual rank comes first
        } else {
            // Both have same score and no manual rank, maintain original order
            return a.originalIndex - b.originalIndex;
        }
    });
    
    return rankedItems;
}

/**
 * Helper function to get archers in a pair based on pair type
 * @param {Array} archers - All archers
 * @param {number} seriesId - Series ID
 * @param {number} targetNumber - Target number
 * @param {string} pairType - Pair type ('AC' or 'BD')
 * @returns {Array} - Filtered archers in the pair
 */
function getPairArchers(archers, seriesId, targetNumber, pairType) {
    return archers.filter(a => 
        a.seriesId === seriesId && 
        a.targetNumber === targetNumber &&
        (pairType === 'AC' ? (a.position === 'A' || a.position === 'C') : (a.position === 'B' || a.position === 'D'))
    );
}

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

    // Load rank overrides first
    await loadRankOverrides();
    
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
        
        // Setup event handlers for rank adjustment buttons
        setupRankControlEventHandlers();
        
    } catch (error) {
        console.error('Error loading rankings:', error);
        container.innerHTML = '<div class="card"><div class="card-body"><p class="text-center">Erreur lors du chargement des classements</p></div></div>';
    }
}

/**
 * Swap ranks between adjacent items, handling ties correctly
 * @param {string} rankingType - Type of ranking (individual, pair, club, etc.)
 * @param {string} categoryKey - Category key for filtering
 * @param {string} entityId - ID of the entity being moved
 * @param {number} currentDisplayIndex - Current display position (1-indexed)
 * @param {number} direction - Direction to move: -1 for up, 1 for down
 */
async function swapRanks(rankingType, categoryKey, entityId, currentDisplayIndex, direction) {
    try {
        // We need to re-calculate the current ranking to find the adjacent item
        // Get the data fresh
        const archers = await db.getAll('archers');
        const results = await db.getAll('results');
        
        // Calculate the appropriate ranking based on type
        let ranking;
        if (rankingType === 'individual') {
            ranking = calculateIndividualRanking(archers, results);
        } else if (rankingType === 'individual-by-category') {
            const byCategory = calculateIndividualRankingByCategory(archers, results);
            ranking = byCategory[categoryKey] || [];
        } else if (rankingType === 'individual-by-category-weapon') {
            const byCategoryAndWeapon = calculateIndividualRankingByCategoryAndWeapon(archers, results);
            ranking = byCategoryAndWeapon[categoryKey]?.archers || [];
        } else if (rankingType === 'pair') {
            ranking = calculatePairRanking(results, archers);
        } else if (rankingType === 'pair-by-category') {
            const byCategory = calculatePairRankingByCategory(results, archers);
            ranking = byCategory[categoryKey] || [];
        } else if (rankingType === 'pair-by-category-weapon') {
            const byCategoryAndWeapon = calculatePairRankingByCategoryAndWeapon(results, archers);
            ranking = byCategoryAndWeapon[categoryKey]?.pairs || [];
        } else if (rankingType === 'club') {
            ranking = calculateClubRanking(archers, results);
        } else {
            return; // Unknown ranking type
        }
        
        // Apply current overrides to get the sorted order
        const rankedItems = applyRankOverrides(ranking, rankingType, categoryKey);
        
        // Find the current and target items by their positions
        const currentIndex = currentDisplayIndex - 1; // Convert to 0-indexed
        const targetIndex = currentIndex + direction;
        
        if (targetIndex < 0 || targetIndex >= rankedItems.length) {
            return; // Out of bounds
        }
        
        const currentItem = rankedItems[currentIndex];
        const targetItem = rankedItems[targetIndex];
        
        // Get their entity IDs
        let currentEntityId = entityId;
        let targetEntityId;
        
        if (targetItem.archer && targetItem.archer.id) {
            targetEntityId = targetItem.archer.id;
        } else if (targetItem.seriesId && targetItem.targetNumber && targetItem.pairType) {
            targetEntityId = `${targetItem.seriesId}-${targetItem.targetNumber}-${targetItem.pairType}`;
        } else if (targetItem.club) {
            targetEntityId = targetItem.club;
        }
        
        // Swap their manual ranks
        // Use a small relative ordering number that indicates order within the same score
        const currentManualRank = currentItem.manualRank !== null ? currentItem.manualRank : currentIndex;
        const targetManualRank = targetItem.manualRank !== null ? targetItem.manualRank : targetIndex;
        
        // Swap the ranks
        await saveRankOverride(rankingType, categoryKey, currentEntityId, targetManualRank);
        await saveRankOverride(rankingType, categoryKey, targetEntityId, currentManualRank);
        
    } catch (error) {
        console.error('Error swapping ranks:', error);
        showToast('Erreur lors du changement de rang', 'error');
    }
}

/**
 * Setup event handlers for rank control buttons
 */
function setupRankControlEventHandlers() {
    // Use event delegation for better performance
    const container = document.getElementById('rankings-container');
    
    container.addEventListener('click', async (e) => {
        const target = e.target;
        
        if (target.classList.contains('rank-up')) {
            const rankingType = target.dataset.rankingType;
            const categoryKey = target.dataset.categoryKey || 'all';
            const entityId = target.dataset.entityId;
            const currentRank = parseInt(target.dataset.currentRank);
            
            // Validate rank (must be > 1)
            if (currentRank > 1) {
                await swapRanks(rankingType, categoryKey, entityId, currentRank, -1);
                await loadRankings();
            }
        } else if (target.classList.contains('rank-down')) {
            const rankingType = target.dataset.rankingType;
            const categoryKey = target.dataset.categoryKey || 'all';
            const entityId = target.dataset.entityId;
            const currentRank = parseInt(target.dataset.currentRank);
            
            // No upper limit validation needed as button is disabled at bottom
            await swapRanks(rankingType, categoryKey, entityId, currentRank, 1);
            await loadRankings();
        } else if (target.classList.contains('rank-reset')) {
            const rankingType = target.dataset.rankingType;
            const categoryKey = target.dataset.categoryKey || 'all';
            const entityId = target.dataset.entityId;
            
            // Remove the override from database
            try {
                const overrides = await db.getAll('rankOverrides');
                const existing = overrides.find(
                    o => o.rankingType === rankingType && 
                         o.categoryKey === categoryKey && 
                         o.entityId === entityId
                );
                
                if (existing) {
                    await db.delete('rankOverrides', existing.id);
                    const key = `${rankingType}-${categoryKey}-${entityId}`;
                    delete rankOverrides[key];
                    showToast('Rang réinitialisé', 'success');
                    await loadRankings();
                }
            } catch (error) {
                console.error('Error resetting rank:', error);
                showToast('Erreur lors de la réinitialisation', 'error');
            }
        }
    });
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
 * Note: Pairs are grouped by the first archer's attributes (category, weapon, club).
 * This assumes pairs are formed from archers with similar characteristics as per FSCF rules.
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
                const pairArchers = getPairArchers(archers, result.seriesId, result.targetNumber, result.pairType);
                
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
 * Note: Pairs are categorized by the first archer's category as per FSCF competition rules
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
                const pairArchers = getPairArchers(archers, result.seriesId, result.targetNumber, result.pairType);
                
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
 * Note: Pairs are categorized by the first archer's category and weapon type
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
                const pairArchers = getPairArchers(archers, result.seriesId, result.targetNumber, result.pairType);
                
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
 * Note: For pairs, the club of the first archer is used. Mixed-club pairs contribute to the first archer's club.
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
                const pairArchers = getPairArchers(archers, result.seriesId, result.targetNumber, result.pairType);
                
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
function renderIndividualRankingTable(ranking, rankingType = 'individual', categoryKey = 'all') {
    if (ranking.length === 0) {
        return '<p class="text-center">Aucune donnée disponible</p>';
    }
    
    // Apply manual rank overrides
    const rankedItems = applyRankOverrides(ranking, rankingType, categoryKey);
    
    // Detect ties based on scores (find scores that appear more than once)
    const scoreCount = {};
    rankedItems.forEach(item => {
        scoreCount[item.score] = (scoreCount[item.score] || 0) + 1;
    });
    const tiedScores = new Set(Object.keys(scoreCount).filter(score => scoreCount[score] > 1).map(Number));
    
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
                        <th class="no-print">Actions</th>
                    </tr>
                </thead>
                <tbody>
                    ${rankedItems.map((item, displayIndex) => {
                        const isTied = tiedScores.has(item.score);
                        const tieClass = isTied ? 'tie-group' : '';
                        const entityId = item.archer.id;
                        const currentRank = displayIndex + 1;
                        
                        return `
                            <tr class="${tieClass}" data-entity-id="${entityId}">
                                <td>
                                    <strong>${currentRank}</strong>
                                    ${item.manualRank !== null ? '<span style="font-size: 0.8em; color: var(--secondary-color);">*</span>' : ''}
                                </td>
                                <td>${item.archer.name}</td>
                                <td>${item.archer.firstName}</td>
                                <td>${item.archer.license || '-'}</td>
                                <td>${item.archer.club || '-'}</td>
                                <td>${getCategoryName(item.archer.category)}</td>
                                <td>${getWeaponName(item.archer.weapon)}</td>
                                <td><strong>${item.score}</strong></td>
                                <td class="no-print">
                                    ${isTied ? `
                                        <div class="rank-controls">
                                            <button class="rank-btn rank-up" data-ranking-type="${rankingType}" data-category-key="${categoryKey}" data-entity-id="${entityId}" data-current-rank="${currentRank}" ${displayIndex === 0 ? 'disabled' : ''}>▲</button>
                                            <button class="rank-btn rank-down" data-ranking-type="${rankingType}" data-category-key="${categoryKey}" data-entity-id="${entityId}" data-current-rank="${currentRank}" ${displayIndex === rankedItems.length - 1 ? 'disabled' : ''}>▼</button>
                                            ${item.manualRank !== null ? `<button class="rank-btn rank-reset" data-ranking-type="${rankingType}" data-category-key="${categoryKey}" data-entity-id="${entityId}">↻</button>` : ''}
                                        </div>
                                    ` : '-'}
                                </td>
                            </tr>
                        `;
                    }).join('')}
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
            ${renderIndividualRankingTable(byCategory[category], 'individual-by-category', category)}
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
                ${renderIndividualRankingTable(data.archers, 'individual-by-category-weapon', key)}
            </div>
        `;
    }).join('');
}

/**
 * Render pair ranking table
 */
function renderPairRankingTable(ranking, rankingType = 'pair', categoryKey = 'all') {
    if (ranking.length === 0) {
        return '<p class="text-center">Aucune donnée disponible</p>';
    }
    
    // Apply manual rank overrides
    const rankedItems = applyRankOverrides(ranking, rankingType, categoryKey);
    
    // Detect ties based on scores (find scores that appear more than once)
    const scoreCount = {};
    rankedItems.forEach(item => {
        scoreCount[item.score] = (scoreCount[item.score] || 0) + 1;
    });
    const tiedScores = new Set(Object.keys(scoreCount).filter(score => scoreCount[score] > 1).map(Number));
    
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
                        <th class="no-print">Actions</th>
                    </tr>
                </thead>
                <tbody>
                    ${rankedItems.map((item, displayIndex) => {
                        const isTied = tiedScores.has(item.score);
                        const tieClass = isTied ? 'tie-group' : '';
                        const archerNames = item.archers.map(a => `${a.firstName} ${a.name}`).join(' / ');
                        const club = item.archers.length > 0 ? item.archers[0].club || '-' : '-';
                        const entityId = `${item.seriesId}-${item.targetNumber}-${item.pairType}`;
                        const currentRank = displayIndex + 1;
                        
                        return `
                            <tr class="${tieClass}" data-entity-id="${entityId}">
                                <td>
                                    <strong>${currentRank}</strong>
                                    ${item.manualRank !== null ? '<span style="font-size: 0.8em; color: var(--secondary-color);">*</span>' : ''}
                                </td>
                                <td>${item.pairType}</td>
                                <td>${archerNames || '-'}</td>
                                <td>${club}</td>
                                <td><strong>${item.score}</strong></td>
                                <td class="no-print">
                                    ${isTied ? `
                                        <div class="rank-controls">
                                            <button class="rank-btn rank-up" data-ranking-type="${rankingType}" data-category-key="${categoryKey}" data-entity-id="${entityId}" data-current-rank="${currentRank}" ${displayIndex === 0 ? 'disabled' : ''}>▲</button>
                                            <button class="rank-btn rank-down" data-ranking-type="${rankingType}" data-category-key="${categoryKey}" data-entity-id="${entityId}" data-current-rank="${currentRank}" ${displayIndex === rankedItems.length - 1 ? 'disabled' : ''}>▼</button>
                                            ${item.manualRank !== null ? `<button class="rank-btn rank-reset" data-ranking-type="${rankingType}" data-category-key="${categoryKey}" data-entity-id="${entityId}">↻</button>` : ''}
                                        </div>
                                    ` : '-'}
                                </td>
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
            ${renderPairRankingTable(byCategory[category], 'pair-by-category', category)}
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
                ${renderPairRankingTable(data.pairs, 'pair-by-category-weapon', key)}
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
    
    // Apply manual rank overrides
    const rankedItems = applyRankOverrides(ranking, 'club', 'all');
    
    // Detect ties based on total scores (find scores that appear more than once)
    const scoreCount = {};
    rankedItems.forEach(item => {
        scoreCount[item.total] = (scoreCount[item.total] || 0) + 1;
    });
    const tiedScores = new Set(Object.keys(scoreCount).filter(score => scoreCount[score] > 1).map(Number));
    
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
                        <th class="no-print">Actions</th>
                    </tr>
                </thead>
                <tbody>
                    ${rankedItems.map((item, displayIndex) => {
                        const isTied = tiedScores.has(item.total);
                        const tieClass = isTied ? 'tie-group' : '';
                        const entityId = item.club;
                        const currentRank = displayIndex + 1;
                        
                        return `
                            <tr class="${tieClass}" data-entity-id="${entityId}">
                                <td>
                                    <strong>${currentRank}</strong>
                                    ${item.manualRank !== null ? '<span style="font-size: 0.8em; color: var(--secondary-color);">*</span>' : ''}
                                </td>
                                <td>${item.club}</td>
                                <td>${item.individualTotal}</td>
                                <td>${item.pairTotal}</td>
                                <td><strong>${item.total}</strong></td>
                                <td class="no-print">
                                    ${isTied ? `
                                        <div class="rank-controls">
                                            <button class="rank-btn rank-up" data-ranking-type="club" data-category-key="all" data-entity-id="${entityId}" data-current-rank="${currentRank}" ${displayIndex === 0 ? 'disabled' : ''}>▲</button>
                                            <button class="rank-btn rank-down" data-ranking-type="club" data-category-key="all" data-entity-id="${entityId}" data-current-rank="${currentRank}" ${displayIndex === rankedItems.length - 1 ? 'disabled' : ''}>▼</button>
                                            ${item.manualRank !== null ? `<button class="rank-btn rank-reset" data-ranking-type="club" data-category-key="all" data-entity-id="${entityId}">↻</button>` : ''}
                                        </div>
                                    ` : '-'}
                                </td>
                            </tr>
                        `;
                    }).join('')}
                </tbody>
            </table>
        </div>
    `;
}
