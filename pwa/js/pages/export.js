/**
 * Export Page - Export data to various formats
 */

import db from '../db.js';
import { showToast, exportToCSV, downloadFile, formatDate } from '../utils.js';

/**
 * Render the export page
 */
export async function render() {
    const container = document.getElementById('page-content');
    
    container.innerHTML = `
        <div class="card">
            <div class="card-header">
                <h2>Export des Données</h2>
            </div>
            <div class="card-body">
                <p>Exportez vos données de compétition dans différents formats.</p>
                
                <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 1.5rem; margin-top: 2rem;">
                    <!-- Export Archers -->
                    <div class="card">
                        <div class="card-header">
                            <h3>📋 Archers</h3>
                        </div>
                        <div class="card-body">
                            <p>Exporter la liste complète des archers inscrits.</p>
                            <button class="btn btn-primary mt-2" onclick="window.exportArchers()">
                                Exporter CSV
                            </button>
                        </div>
                    </div>

                    <!-- Export Results -->
                    <div class="card">
                        <div class="card-header">
                            <h3>🎯 Résultats</h3>
                        </div>
                        <div class="card-body">
                            <p>Exporter tous les résultats de compétition.</p>
                            <button class="btn btn-primary mt-2" onclick="window.exportResults()">
                                Exporter CSV
                            </button>
                        </div>
                    </div>

                    <!-- Export Shooting Ranges -->
                    <div class="card">
                        <div class="card-header">
                            <h3>🏹 Pas de Tir</h3>
                        </div>
                        <div class="card-body">
                            <p>Exporter la configuration des pas de tir.</p>
                            <button class="btn btn-primary mt-2" onclick="window.exportRanges()">
                                Exporter CSV
                            </button>
                        </div>
                    </div>

                    <!-- Export Complete -->
                    <div class="card">
                        <div class="card-header">
                            <h3>📦 Export Complet</h3>
                        </div>
                        <div class="card-body">
                            <p>Exporter toutes les données en un seul fichier JSON.</p>
                            <button class="btn btn-success mt-2" onclick="window.exportAll()">
                                Exporter JSON
                            </button>
                        </div>
                    </div>
                </div>

                <div class="mt-3" style="border-top: 2px solid var(--border-color); padding-top: 2rem;">
                    <h3 class="mb-2">📊 Statistiques</h3>
                    <div id="stats-container">
                        <p class="text-center">Chargement...</p>
                    </div>
                </div>
            </div>
        </div>
    `;

    // Load and display statistics
    await loadStatistics();
}

/**
 * Load and display statistics
 */
async function loadStatistics() {
    const container = document.getElementById('stats-container');
    
    try {
        const archers = await db.getAll('archers');
        const ranges = await db.getAll('shootingRanges');
        const results = await db.getAll('results');

        // Calculate some basic stats
        let totalScore = 0;
        let maxScore = 0;
        let minScore = Infinity;
        
        results.forEach(r => {
            totalScore += r.score;
            maxScore = Math.max(maxScore, r.score);
            minScore = Math.min(minScore, r.score);
        });

        const avgScore = results.length > 0 ? (totalScore / results.length).toFixed(2) : 0;

        container.innerHTML = `
            <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 1rem;">
                <div class="card" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white;">
                    <div class="card-body text-center">
                        <h4>Archers</h4>
                        <p style="font-size: 2rem; font-weight: bold; margin: 0;">${archers.length}</p>
                    </div>
                </div>

                <div class="card" style="background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); color: white;">
                    <div class="card-body text-center">
                        <h4>Pas de tir</h4>
                        <p style="font-size: 2rem; font-weight: bold; margin: 0;">${ranges.length}</p>
                    </div>
                </div>

                <div class="card" style="background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%); color: white;">
                    <div class="card-body text-center">
                        <h4>Résultats</h4>
                        <p style="font-size: 2rem; font-weight: bold; margin: 0;">${results.length}</p>
                    </div>
                </div>

                <div class="card" style="background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%); color: white;">
                    <div class="card-body text-center">
                        <h4>Score Moyen</h4>
                        <p style="font-size: 2rem; font-weight: bold; margin: 0;">${avgScore}</p>
                    </div>
                </div>

                <div class="card" style="background: linear-gradient(135deg, #fa709a 0%, #fee140 100%); color: white;">
                    <div class="card-body text-center">
                        <h4>Score Max</h4>
                        <p style="font-size: 2rem; font-weight: bold; margin: 0;">${results.length > 0 ? maxScore : '-'}</p>
                    </div>
                </div>

                <div class="card" style="background: linear-gradient(135deg, #30cfd0 0%, #330867 100%); color: white;">
                    <div class="card-body text-center">
                        <h4>Score Min</h4>
                        <p style="font-size: 2rem; font-weight: bold; margin: 0;">${results.length > 0 ? minScore : '-'}</p>
                    </div>
                </div>
            </div>
        `;
    } catch (error) {
        console.error('Error loading statistics:', error);
        container.innerHTML = '<p class="text-center">Erreur lors du chargement des statistiques</p>';
    }
}

/**
 * Export archers to CSV
 */
window.exportArchers = async function() {
    try {
        const archers = await db.getAll('archers');
        
        if (archers.length === 0) {
            showToast('Aucune donnée à exporter', 'warning');
            return;
        }

        const data = archers.map(a => ({
            'Nom': a.name,
            'Prénom': a.firstName,
            'Licence': a.license,
            'Catégorie': a.category,
            'Arc': a.weapon,
            'Club': a.club || '',
            'Date Création': formatDate(a.createdAt)
        }));

        exportToCSV(data, `archers-${Date.now()}.csv`);
        showToast('Export réussi', 'success');
    } catch (error) {
        console.error('Error exporting archers:', error);
        showToast('Erreur lors de l\'export', 'error');
    }
};

/**
 * Export results to CSV
 */
window.exportResults = async function() {
    try {
        const results = await db.getAll('results');
        
        if (results.length === 0) {
            showToast('Aucune donnée à exporter', 'warning');
            return;
        }

        // Get archers and ranges for reference
        const archers = await db.getAll('archers');
        const ranges = await db.getAll('shootingRanges');
        
        const archerMap = new Map(archers.map(a => [a.id, a]));
        const rangeMap = new Map(ranges.map(r => [r.id, r]));

        const data = results.map(r => {
            const archer = archerMap.get(r.archerId);
            const range = rangeMap.get(r.rangeId);
            return {
                'Date': formatDate(r.date),
                'Archer': archer ? `${archer.firstName} ${archer.name}` : 'N/A',
                'Licence': archer ? archer.license : 'N/A',
                'Pas de tir': range ? range.name : 'N/A',
                'Distance': range ? `${range.distance}m` : 'N/A',
                'Score': r.score,
                'Notes': r.notes || ''
            };
        });

        exportToCSV(data, `resultats-${Date.now()}.csv`);
        showToast('Export réussi', 'success');
    } catch (error) {
        console.error('Error exporting results:', error);
        showToast('Erreur lors de l\'export', 'error');
    }
};

/**
 * Export shooting ranges to CSV
 */
window.exportRanges = async function() {
    try {
        const ranges = await db.getAll('shootingRanges');
        
        if (ranges.length === 0) {
            showToast('Aucune donnée à exporter', 'warning');
            return;
        }

        const data = ranges.map(r => ({
            'Nom': r.name,
            'Distance': `${r.distance}m`,
            'Type de cible': r.targetType,
            'Nombre de cibles': r.numberOfTargets,
            'Date Création': formatDate(r.createdAt)
        }));

        exportToCSV(data, `pas-de-tir-${Date.now()}.csv`);
        showToast('Export réussi', 'success');
    } catch (error) {
        console.error('Error exporting ranges:', error);
        showToast('Erreur lors de l\'export', 'error');
    }
};

/**
 * Export all data to JSON
 */
window.exportAll = async function() {
    try {
        const archers = await db.getAll('archers');
        const ranges = await db.getAll('shootingRanges');
        const results = await db.getAll('results');
        const categories = await db.getAll('categories');

        const data = {
            version: '1.0.0', // x-release-please-version
            exportDate: new Date().toISOString(),
            data: {
                archers,
                shootingRanges: ranges,
                results,
                categories
            }
        };

        const json = JSON.stringify(data, null, 2);
        downloadFile(json, `export-complet-${Date.now()}.json`, 'application/json');
        showToast('Export complet réussi', 'success');
    } catch (error) {
        console.error('Error exporting all data:', error);
        showToast('Erreur lors de l\'export', 'error');
    }
};
