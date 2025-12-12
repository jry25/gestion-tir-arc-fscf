/**
 * Simple SPA Router for navigation between pages
 */

class Router {
    constructor() {
        this.routes = {};
        this.currentPage = null;
    }

    /**
     * Register a route
     * @param {string} path - Route path (without #)
     * @param {Function} handler - Function that renders the page
     */
    addRoute(path, handler) {
        this.routes[path] = handler;
    }

    /**
     * Navigate to a route
     * @param {string} path - Route path
     */
    async navigate(path) {
        const handler = this.routes[path];
        
        if (!handler) {
            console.error(`Route not found: ${path}`);
            return;
        }

        // Update active navigation link
        this.updateActiveNav(path);

        // Render the page
        this.currentPage = path;
        await handler();
    }

    /**
     * Update active navigation link
     * @param {string} path - Current route path
     */
    updateActiveNav(path) {
        const navLinks = document.querySelectorAll('.nav-link');
        navLinks.forEach(link => {
            if (link.dataset.page === path) {
                link.classList.add('active');
            } else {
                link.classList.remove('active');
            }
        });
    }

    /**
     * Initialize the router
     */
    init() {
        // Handle hash changes
        window.addEventListener('hashchange', () => {
            const hash = window.location.hash.slice(1) || 'archers';
            this.navigate(hash);
        });

        // Handle initial load
        const initialHash = window.location.hash.slice(1) || 'archers';
        this.navigate(initialHash);

        // Handle navigation link clicks
        document.addEventListener('click', (e) => {
            const navLink = e.target.closest('.nav-link');
            if (navLink) {
                e.preventDefault();
                const page = navLink.dataset.page;
                window.location.hash = page;
            }
        });
    }

    /**
     * Get the current page
     * @returns {string}
     */
    getCurrentPage() {
        return this.currentPage;
    }
}

// Export singleton instance
const router = new Router();
export default router;
