/**
 * IndexedDB Module for Gestion Tir à l'Arc FSCF
 * Manages local database for offline storage
 */

const DB_NAME = 'TirArcFSCF';
const DB_VERSION = 2;

/**
 * Database Schema
 * 
 * Collections:
 * - archers: Archer information (name, license, category, etc.)
 * - categories: Competition categories (age groups, weapon types)
 * - shootingRanges: Shooting range configurations (pas de tir)
 * - results: Competition results and scores
 */

class Database {
    constructor() {
        this.db = null;
    }

    /**
     * Initialize the database
     * @returns {Promise<IDBDatabase>}
     */
    async init() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(DB_NAME, DB_VERSION);

            request.onerror = () => {
                console.error('Database error:', request.error);
                reject(request.error);
            };

            request.onsuccess = () => {
                this.db = request.result;
                console.log('Database initialized successfully');
                resolve(this.db);
            };

            request.onupgradeneeded = (event) => {
                const db = event.target.result;
                console.log('Upgrading database...');

                // Create Archers store
                if (!db.objectStoreNames.contains('archers')) {
                    const archersStore = db.createObjectStore('archers', { 
                        keyPath: 'id', 
                        autoIncrement: true 
                    });
                    archersStore.createIndex('license', 'license', { unique: true });
                    archersStore.createIndex('name', 'name', { unique: false });
                    archersStore.createIndex('category', 'category', { unique: false });
                    archersStore.createIndex('seriesId', 'seriesId', { unique: false });
                    console.log('Created archers store');
                }

                // Create Series store (new)
                if (!db.objectStoreNames.contains('series')) {
                    const seriesStore = db.createObjectStore('series', { 
                        keyPath: 'id', 
                        autoIncrement: true 
                    });
                    seriesStore.createIndex('number', 'number', { unique: false });
                    seriesStore.createIndex('rangeId', 'rangeId', { unique: false });
                    console.log('Created series store');
                }

                // Create Categories store
                if (!db.objectStoreNames.contains('categories')) {
                    const categoriesStore = db.createObjectStore('categories', { 
                        keyPath: 'id', 
                        autoIncrement: true 
                    });
                    categoriesStore.createIndex('code', 'code', { unique: true });
                    categoriesStore.createIndex('type', 'type', { unique: false });
                    console.log('Created categories store');
                    
                    // Add default categories based on FSCF regulations
                    this._addDefaultCategories(categoriesStore);
                }

                // Create Shooting Ranges store
                if (!db.objectStoreNames.contains('shootingRanges')) {
                    const rangesStore = db.createObjectStore('shootingRanges', { 
                        keyPath: 'id', 
                        autoIncrement: true 
                    });
                    rangesStore.createIndex('name', 'name', { unique: false });
                    rangesStore.createIndex('distance', 'distance', { unique: false });
                    console.log('Created shootingRanges store');
                }

                // Create Results store
                if (!db.objectStoreNames.contains('results')) {
                    const resultsStore = db.createObjectStore('results', { 
                        keyPath: 'id', 
                        autoIncrement: true 
                    });
                    resultsStore.createIndex('archerId', 'archerId', { unique: false });
                    resultsStore.createIndex('rangeId', 'rangeId', { unique: false });
                    resultsStore.createIndex('date', 'date', { unique: false });
                    resultsStore.createIndex('score', 'score', { unique: false });
                    console.log('Created results store');
                }
            };
        });
    }

    /**
     * Add default FSCF categories
     * @private
     */
    _addDefaultCategories(store) {
        const defaultCategories = [
            // Championnat Jeune - Categories individuelles
            { code: 'BF', name: 'Benjamine', type: 'jeune', gender: 'F', minAge: 0, maxAge: 12 },
            { code: 'BH', name: 'Benjamin', type: 'jeune', gender: 'H', minAge: 0, maxAge: 12 },
            { code: 'MF', name: 'Minime fille', type: 'jeune', gender: 'F', minAge: 13, maxAge: 14 },
            { code: 'MH', name: 'Minime garçon', type: 'jeune', gender: 'H', minAge: 13, maxAge: 14 },
            { code: 'CF', name: 'Cadette', type: 'jeune', gender: 'F', minAge: 15, maxAge: 17 },
            { code: 'CH', name: 'Cadet', type: 'jeune', gender: 'H', minAge: 15, maxAge: 17 },
            
            // Championnat Adulte - Junior
            { code: 'JFCL', name: 'Junior femme arc classique', type: 'adulte', gender: 'F', weapon: 'CL', minAge: 18, maxAge: 20 },
            { code: 'JFAP', name: 'Junior femme arc à poulie', type: 'adulte', gender: 'F', weapon: 'CO', minAge: 18, maxAge: 20 },
            { code: 'JHCL', name: 'Junior homme arc classique', type: 'adulte', gender: 'H', weapon: 'CL', minAge: 18, maxAge: 20 },
            { code: 'JHAP', name: 'Junior homme arc à poulie', type: 'adulte', gender: 'H', weapon: 'CO', minAge: 18, maxAge: 20 },
            
            // Championnat Adulte - Senior
            { code: 'SFCL', name: 'Senior femme arc classique', type: 'adulte', gender: 'F', weapon: 'CL', minAge: 21, maxAge: 50 },
            { code: 'SFAP', name: 'Senior femme arc à poulie', type: 'adulte', gender: 'F', weapon: 'CO', minAge: 21, maxAge: 50 },
            { code: 'SHCL', name: 'Senior homme arc classique', type: 'adulte', gender: 'H', weapon: 'CL', minAge: 21, maxAge: 50 },
            { code: 'SHAP', name: 'Senior homme arc à poulie', type: 'adulte', gender: 'H', weapon: 'CO', minAge: 21, maxAge: 50 },
            
            // Championnat Adulte - Vétéran
            { code: 'VFCL', name: 'Vétéran femme arc classique', type: 'adulte', gender: 'F', weapon: 'CL', minAge: 51, maxAge: 65 },
            { code: 'VFAP', name: 'Vétéran femme arc à poulie', type: 'adulte', gender: 'F', weapon: 'CO', minAge: 51, maxAge: 65 },
            { code: 'VHCL', name: 'Vétéran homme arc classique', type: 'adulte', gender: 'H', weapon: 'CL', minAge: 51, maxAge: 65 },
            { code: 'VHAP', name: 'Vétéran homme arc à poulie', type: 'adulte', gender: 'H', weapon: 'CO', minAge: 51, maxAge: 65 },
            
            // Championnat Adulte - Super Vétéran
            { code: 'SVFCL', name: 'Super vétéran femme arc classique', type: 'adulte', gender: 'F', weapon: 'CL', minAge: 66, maxAge: 999 },
            { code: 'SVFAP', name: 'Super vétéran femme arc à poulie', type: 'adulte', gender: 'F', weapon: 'CO', minAge: 66, maxAge: 999 },
            { code: 'SVHCL', name: 'Super vétéran homme arc classique', type: 'adulte', gender: 'H', weapon: 'CL', minAge: 66, maxAge: 999 },
            { code: 'SVHAP', name: 'Super vétéran homme arc à poulie', type: 'adulte', gender: 'H', weapon: 'CO', minAge: 66, maxAge: 999 }
        ];

        defaultCategories.forEach(category => {
            store.add(category);
        });
    }

    /**
     * Generic CRUD operations
     */

    /**
     * Add a record to a store
     * @param {string} storeName - Name of the object store
     * @param {Object} data - Data to add
     * @returns {Promise<number>} - ID of the added record
     */
    async add(storeName, data) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([storeName], 'readwrite');
            const store = transaction.objectStore(storeName);
            const request = store.add(data);

            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    /**
     * Get a record by ID
     * @param {string} storeName - Name of the object store
     * @param {number} id - ID of the record
     * @returns {Promise<Object>}
     */
    async get(storeName, id) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([storeName], 'readonly');
            const store = transaction.objectStore(storeName);
            const request = store.get(id);

            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    /**
     * Get all records from a store
     * @param {string} storeName - Name of the object store
     * @returns {Promise<Array>}
     */
    async getAll(storeName) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([storeName], 'readonly');
            const store = transaction.objectStore(storeName);
            const request = store.getAll();

            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    /**
     * Update a record
     * @param {string} storeName - Name of the object store
     * @param {Object} data - Data to update (must include id)
     * @returns {Promise<number>}
     */
    async update(storeName, data) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([storeName], 'readwrite');
            const store = transaction.objectStore(storeName);
            const request = store.put(data);

            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    /**
     * Delete a record
     * @param {string} storeName - Name of the object store
     * @param {number} id - ID of the record to delete
     * @returns {Promise<void>}
     */
    async delete(storeName, id) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([storeName], 'readwrite');
            const store = transaction.objectStore(storeName);
            const request = store.delete(id);

            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    }

    /**
     * Query records by index
     * @param {string} storeName - Name of the object store
     * @param {string} indexName - Name of the index
     * @param {*} value - Value to search for
     * @returns {Promise<Array>}
     */
    async getByIndex(storeName, indexName, value) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([storeName], 'readonly');
            const store = transaction.objectStore(storeName);
            const index = store.index(indexName);
            const request = index.getAll(value);

            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    /**
     * Clear all data from a store
     * @param {string} storeName - Name of the object store
     * @returns {Promise<void>}
     */
    async clear(storeName) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([storeName], 'readwrite');
            const store = transaction.objectStore(storeName);
            const request = store.clear();

            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    }

    /**
     * Domain-specific methods
     */

    /**
     * Add an archer
     * @param {Object} archer - Archer data
     * @returns {Promise<number>}
     */
    async addArcher(archer) {
        const archerData = {
            name: archer.name,
            firstName: archer.firstName,
            license: archer.license,
            category: archer.category,
            weapon: archer.weapon,
            club: archer.club || '',
            seriesId: archer.seriesId || null,
            targetNumber: archer.targetNumber || null,
            position: archer.position || null, // A, B, C, or D
            createdAt: new Date().toISOString()
        };
        return this.add('archers', archerData);
    }

    /**
     * Add a series
     * @param {Object} series - Series data
     * @returns {Promise<number>}
     */
    async addSeries(series) {
        const seriesData = {
            number: series.number,
            rangeId: series.rangeId || null,
            numberOfTargets: series.numberOfTargets || 0,
            createdAt: new Date().toISOString()
        };
        return this.add('series', seriesData);
    }

    /**
     * Add a shooting range
     * @param {Object} range - Range data
     * @returns {Promise<number>}
     */
    async addShootingRange(range) {
        const rangeData = {
            name: range.name,
            distance: range.distance,
            targetType: range.targetType,
            numberOfTargets: range.numberOfTargets,
            createdAt: new Date().toISOString()
        };
        return this.add('shootingRanges', rangeData);
    }

    /**
     * Add a result
     * @param {Object} result - Result data
     * @returns {Promise<number>}
     */
    async addResult(result) {
        const resultData = {
            archerId: result.archerId,
            rangeId: result.rangeId,
            score: result.score,
            arrows: result.arrows || [],
            date: result.date || new Date().toISOString(),
            notes: result.notes || ''
        };
        return this.add('results', resultData);
    }

    /**
     * Get results by archer
     * @param {number} archerId - Archer ID
     * @returns {Promise<Array>}
     */
    async getResultsByArcher(archerId) {
        return this.getByIndex('results', 'archerId', archerId);
    }

    /**
     * Get results by range
     * @param {number} rangeId - Range ID
     * @returns {Promise<Array>}
     */
    async getResultsByRange(rangeId) {
        return this.getByIndex('results', 'rangeId', rangeId);
    }
}

// Export singleton instance
const db = new Database();
export default db;
