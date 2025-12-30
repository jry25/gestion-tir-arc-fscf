/**
 * Main Application Entry Point
 * Gestion Tir à l'Arc FSCF
 */

import db from './db.js';
import router from './router.js';
import { updateOnlineStatus, showToast } from './utils.js';
import * as ArchersPage from './pages/archers.js';
import * as ShootingRangesPage from './pages/shooting-ranges.js';
import * as ResultsPage from './pages/results.js';
import * as ExportPage from './pages/export.js';

/**
 * Application class
 */
class App {
    constructor() {
        this.version = '1.0.0'; // x-release-please-version
        this.serviceWorkerRegistration = null;
    }

    /**
     * Initialize the application
     */
    async init() {
        console.log('🏹 Initializing Gestion Tir à l\'Arc FSCF...');
        
        try {
            // Initialize database
            await this.initDatabase();
            
            // Register service worker
            await this.registerServiceWorker();
            
            // Setup routes
            this.setupRoutes();
            
            // Initialize router
            router.init();
            
            // Setup event listeners
            this.setupEventListeners();
            
            // Update version display
            this.updateVersion();
            
            console.log('✅ Application initialized successfully');
            showToast('Application chargée avec succès', 'success');
            
        } catch (error) {
            console.error('❌ Error initializing application:', error);
            showToast('Erreur lors du chargement de l\'application', 'error');
        }
    }

    /**
     * Initialize IndexedDB
     */
    async initDatabase() {
        console.log('Initializing database...');
        await db.init();
        console.log('Database initialized');
    }

    /**
     * Register service worker for offline functionality
     */
    async registerServiceWorker() {
        if ('serviceWorker' in navigator) {
            try {
                const registration = await navigator.serviceWorker.register('./service-worker.js');
                this.serviceWorkerRegistration = registration;
                
                console.log('Service Worker registered:', registration);
                
                // Check for updates
                registration.addEventListener('updatefound', () => {
                    const newWorker = registration.installing;
                    console.log('Service Worker update found');
                    
                    newWorker.addEventListener('statechange', () => {
                        if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                            // New service worker available
                            showToast('Nouvelle version disponible. Rechargez la page.', 'info', 5000);
                        }
                    });
                });
                
            } catch (error) {
                console.error('Service Worker registration failed:', error);
            }
        } else {
            console.warn('Service Workers not supported');
        }
    }

    /**
     * Setup application routes
     */
    setupRoutes() {
        console.log('Setting up routes...');
        
        router.addRoute('archers', async () => {
            await ArchersPage.render();
        });
        
        router.addRoute('shooting-ranges', async () => {
            await ShootingRangesPage.render();
        });
        
        router.addRoute('results', async () => {
            await ResultsPage.render();
        });
        
        router.addRoute('export', async () => {
            await ExportPage.render();
        });
        
        console.log('Routes configured');
    }

    /**
     * Setup global event listeners
     */
    setupEventListeners() {
        // Online/Offline status
        window.addEventListener('online', () => {
            updateOnlineStatus();
            showToast('Connexion rétablie', 'success');
        });
        
        window.addEventListener('offline', () => {
            updateOnlineStatus();
            showToast('Mode hors ligne activé', 'warning');
        });
        
        // Initial status update
        updateOnlineStatus();
        
        // Service Worker messages
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.addEventListener('message', (event) => {
                console.log('Message from Service Worker:', event.data);
                
                if (event.data.type === 'CACHE_CLEARED') {
                    showToast('Cache vidé avec succès', 'success');
                }
            });
        }
        
        // Before install prompt (PWA installation)
        window.addEventListener('beforeinstallprompt', (e) => {
            console.log('PWA install prompt available');
            // Prevent the mini-infobar from appearing on mobile
            e.preventDefault();
            // Stash the event so it can be triggered later (e.g., from a button)
            window.deferredPrompt = e;
        });
        
        // App installed
        window.addEventListener('appinstalled', () => {
            console.log('PWA installed');
            showToast('Application installée avec succès', 'success');
        });
    }

    /**
     * Update version display
     */
    updateVersion() {
        const versionElement = document.getElementById('app-version');
        if (versionElement) {
            versionElement.textContent = this.version;
        }
    }

    /**
     * Clear application cache
     */
    async clearCache() {
        if (this.serviceWorkerRegistration && this.serviceWorkerRegistration.active) {
            this.serviceWorkerRegistration.active.postMessage({ type: 'CLEAR_CACHE' });
        }
    }
}

// Initialize app when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        const app = new App();
        app.init();
        
        // Make app globally available for debugging
        window.app = app;
    });
} else {
    const app = new App();
    app.init();
    window.app = app;
}
