/**
 * Service Worker for Gestion Tir à l'Arc FSCF
 * Handles offline caching and synchronization
 */

const CACHE_VERSION = 'v1.2.1'; // x-release-please-version
const CACHE_NAME = `tir-arc-fscf-${CACHE_VERSION}`;

// Get base path from service worker location
const BASE_PATH = self.location.pathname.substring(0, self.location.pathname.lastIndexOf('/') + 1);

// Files to cache for offline use
const STATIC_ASSETS = [
    `${BASE_PATH}`,
    `${BASE_PATH}index.html`,
    `${BASE_PATH}manifest.json`,
    `${BASE_PATH}css/styles.css`,
    `${BASE_PATH}js/app.js`,
    `${BASE_PATH}js/db.js`,
    `${BASE_PATH}js/router.js`,
    `${BASE_PATH}js/utils.js`,
    `${BASE_PATH}js/pages/archers.js`,
    `${BASE_PATH}js/pages/shooting-ranges.js`,
    `${BASE_PATH}js/pages/results.js`,
    `${BASE_PATH}js/pages/rankings.js`,
    `${BASE_PATH}js/pages/settings.js`,
    `${BASE_PATH}icons/icon-72x72.png`,
    `${BASE_PATH}icons/icon-96x96.png`,
    `${BASE_PATH}icons/icon-128x128.png`,
    `${BASE_PATH}icons/icon-144x144.png`,
    `${BASE_PATH}icons/icon-152x152.png`,
    `${BASE_PATH}icons/icon-192x192.png`,
    `${BASE_PATH}icons/icon-384x384.png`,
    `${BASE_PATH}icons/icon-512x512.png`,
    `${BASE_PATH}icons/icon-512x512-maskable.png`
    // Note: Screenshots are excluded from initial cache as they're only used in install UI
    // They will be cached on-demand when requested
];

/**
 * Install event - Cache static assets
 */
self.addEventListener('install', (event) => {
    console.log('[Service Worker] Installing...');
    
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                console.log('[Service Worker] Caching static assets');
                return cache.addAll(STATIC_ASSETS);
            })
            .then(() => {
                console.log('[Service Worker] Installation complete');
                return self.skipWaiting(); // Activate immediately
            })
            .catch((error) => {
                console.error('[Service Worker] Installation failed:', error);
            })
    );
});

/**
 * Activate event - Clean up old caches
 */
self.addEventListener('activate', (event) => {
    console.log('[Service Worker] Activating...');
    
    event.waitUntil(
        caches.keys()
            .then((cacheNames) => {
                return Promise.all(
                    cacheNames
                        .filter((name) => name.startsWith('tir-arc-fscf-') && name !== CACHE_NAME)
                        .map((name) => {
                            console.log('[Service Worker] Deleting old cache:', name);
                            return caches.delete(name);
                        })
                );
            })
            .then(() => {
                console.log('[Service Worker] Activation complete');
                return self.clients.claim(); // Take control immediately
            })
    );
});

/**
 * Fetch event - Serve from cache with network fallback
 * Strategy: Cache First, falling back to Network
 */
self.addEventListener('fetch', (event) => {
    // Skip non-GET requests
    if (event.request.method !== 'GET') {
        return;
    }
    
    event.respondWith(
        caches.match(event.request)
            .then((cachedResponse) => {
                if (cachedResponse) {
                    console.log('[Service Worker] Serving from cache:', event.request.url);
                    return cachedResponse;
                }
                
                // Not in cache, fetch from network
                console.log('[Service Worker] Fetching from network:', event.request.url);
                return fetch(event.request)
                    .then((networkResponse) => {
                        // Cache the new response for future use
                        if (networkResponse && networkResponse.status === 200) {
                            const responseToCache = networkResponse.clone();
                            caches.open(CACHE_NAME)
                                .then((cache) => {
                                    cache.put(event.request, responseToCache);
                                });
                        }
                        return networkResponse;
                    })
                    .catch((error) => {
                        console.error('[Service Worker] Fetch failed:', error);
                        // Could return a custom offline page here
                        throw error;
                    });
            })
    );
});

/**
 * Message event - Handle messages from the app
 */
self.addEventListener('message', (event) => {
    console.log('[Service Worker] Message received:', event.data);
    
    if (event.data && event.data.type === 'SKIP_WAITING') {
        self.skipWaiting();
    }
    
    // Could handle background sync, cache updates, etc.
    if (event.data && event.data.type === 'CLEAR_CACHE') {
        event.waitUntil(
            caches.delete(CACHE_NAME).then(() => {
                console.log('[Service Worker] Cache cleared');
                return self.clients.matchAll().then(clients => {
                    clients.forEach(client => client.postMessage({ type: 'CACHE_CLEARED' }));
                });
            })
        );
    }
});

/**
 * Sync event - Handle background sync
 * For future implementation of data synchronization
 */
self.addEventListener('sync', (event) => {
    console.log('[Service Worker] Background sync:', event.tag);
    
    if (event.tag === 'sync-results') {
        event.waitUntil(
            // Implement result synchronization logic here
            Promise.resolve()
        );
    }
});

/**
 * Push event - Handle push notifications
 * For future implementation if needed
 */
self.addEventListener('push', (event) => {
    console.log('[Service Worker] Push notification received');
    
    let body = 'Nouvelle notification';
    if (event.data) {
        try {
            body = event.data.text();
        } catch (error) {
            console.error('[Service Worker] Error reading push data:', error);
        }
    }
    
    const options = {
        body: body,
        icon: `${BASE_PATH}icons/icon-192x192.png`,
        badge: `${BASE_PATH}icons/icon-72x72.png`,
        vibrate: [200, 100, 200]
    };
    
    event.waitUntil(
        self.registration.showNotification('Tir à l\'Arc FSCF', options)
    );
});
