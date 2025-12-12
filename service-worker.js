/**
 * Service Worker for Gestion Tir à l'Arc FSCF
 * Handles offline caching and synchronization
 */

const CACHE_VERSION = 'v1.0.0';
const CACHE_NAME = `tir-arc-fscf-${CACHE_VERSION}`;

// Files to cache for offline use
const STATIC_ASSETS = [
    '/',
    '/index.html',
    '/manifest.json',
    '/css/styles.css',
    '/js/app.js',
    '/js/db.js',
    '/js/router.js',
    '/js/utils.js',
    '/js/pages/archers.js',
    '/js/pages/shooting-ranges.js',
    '/js/pages/results.js',
    '/js/pages/export.js',
    '/icons/icon-192x192.png',
    '/icons/icon-512x512.png'
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
        icon: '/icons/icon-192x192.png',
        badge: '/icons/icon-72x72.png',
        vibrate: [200, 100, 200]
    };
    
    event.waitUntil(
        self.registration.showNotification('Tir à l\'Arc FSCF', options)
    );
});
