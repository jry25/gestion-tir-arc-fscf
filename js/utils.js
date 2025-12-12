/**
 * Utility functions for the application
 */

/**
 * Show a toast notification
 * @param {string} message - Message to display
 * @param {string} type - Type of toast (success, error, warning, info)
 * @param {number} duration - Duration in ms (default: 3000)
 */
export function showToast(message, type = 'info', duration = 3000) {
    const container = document.getElementById('toast-container');
    
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `
        <div class="toast-content">
            <p>${message}</p>
        </div>
    `;
    
    container.appendChild(toast);
    
    // Auto-remove after duration
    setTimeout(() => {
        toast.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => {
            container.removeChild(toast);
        }, 300);
    }, duration);
}

/**
 * Show loading overlay
 */
export function showLoading() {
    const overlay = document.getElementById('loading-overlay');
    overlay.classList.remove('hidden');
}

/**
 * Hide loading overlay
 */
export function hideLoading() {
    const overlay = document.getElementById('loading-overlay');
    overlay.classList.add('hidden');
}

/**
 * Format date to French locale
 * @param {Date|string} date - Date to format
 * @returns {string}
 */
export function formatDate(date) {
    const d = typeof date === 'string' ? new Date(date) : date;
    return d.toLocaleDateString('fr-FR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
    });
}

/**
 * Format date and time to French locale
 * @param {Date|string} date - Date to format
 * @returns {string}
 */
export function formatDateTime(date) {
    const d = typeof date === 'string' ? new Date(date) : date;
    return d.toLocaleDateString('fr-FR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

/**
 * Validate required fields in a form
 * @param {HTMLFormElement} form - Form element
 * @returns {boolean}
 */
export function validateForm(form) {
    const requiredFields = form.querySelectorAll('[required]');
    let isValid = true;
    
    requiredFields.forEach(field => {
        if (!field.value.trim()) {
            field.style.borderColor = 'var(--danger-color)';
            isValid = false;
        } else {
            field.style.borderColor = 'var(--border-color)';
        }
    });
    
    return isValid;
}

/**
 * Clear form fields
 * @param {HTMLFormElement} form - Form element
 */
export function clearForm(form) {
    form.reset();
    // Remove validation styles
    form.querySelectorAll('input, select, textarea').forEach(field => {
        field.style.borderColor = 'var(--border-color)';
    });
}

/**
 * Debounce function
 * @param {Function} func - Function to debounce
 * @param {number} wait - Wait time in ms
 * @returns {Function}
 */
export function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

/**
 * Generate a unique ID
 * @returns {string}
 */
export function generateId() {
    return `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
}

/**
 * Download data as file
 * @param {string} data - Data to download
 * @param {string} filename - Name of the file
 * @param {string} type - MIME type
 */
export function downloadFile(data, filename, type = 'text/plain') {
    const blob = new Blob([data], { type });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}

/**
 * Check if the app is online
 * @returns {boolean}
 */
export function isOnline() {
    return navigator.onLine;
}

/**
 * Update online status indicator
 */
export function updateOnlineStatus() {
    const indicator = document.getElementById('online-indicator');
    const text = document.getElementById('online-text');
    
    if (isOnline()) {
        indicator.classList.remove('offline');
        text.textContent = 'En ligne';
    } else {
        indicator.classList.add('offline');
        text.textContent = 'Hors ligne';
    }
}

/**
 * Confirm dialog
 * @param {string} message - Message to display
 * @returns {boolean}
 */
export function confirm(message) {
    return window.confirm(message);
}

/**
 * Parse CSV data
 * @param {string} csv - CSV string
 * @returns {Array}
 */
export function parseCSV(csv) {
    const lines = csv.split('\n');
    const headers = lines[0].split(',').map(h => h.trim());
    const data = [];
    
    for (let i = 1; i < lines.length; i++) {
        if (!lines[i].trim()) continue;
        
        const values = lines[i].split(',').map(v => v.trim());
        const row = {};
        
        headers.forEach((header, index) => {
            row[header] = values[index];
        });
        
        data.push(row);
    }
    
    return data;
}

/**
 * Export data to CSV
 * @param {Array} data - Array of objects
 * @param {string} filename - Name of the file
 */
export function exportToCSV(data, filename) {
    if (!data.length) {
        showToast('Aucune donnée à exporter', 'warning');
        return;
    }
    
    const headers = Object.keys(data[0]);
    const csv = [
        headers.join(','),
        ...data.map(row => headers.map(header => row[header] || '').join(','))
    ].join('\n');
    
    downloadFile(csv, filename, 'text/csv');
}

/**
 * Get FSCF category name from code
 * @param {string} code - Category code
 * @returns {string}
 */
export function getCategoryName(code) {
    const categories = {
        // Championnat Jeune
        'BF': 'Benjamine',
        'BH': 'Benjamin',
        'MF': 'Minime fille',
        'MH': 'Minime garçon',
        'CF': 'Cadette',
        'CH': 'Cadet',
        // Championnat Adulte - Junior
        'JFCL': 'Junior femme arc classique',
        'JFAP': 'Junior femme arc à poulie',
        'JHCL': 'Junior homme arc classique',
        'JHAP': 'Junior homme arc à poulie',
        // Championnat Adulte - Senior
        'SFCL': 'Senior femme arc classique',
        'SFAP': 'Senior femme arc à poulie',
        'SHCL': 'Senior homme arc classique',
        'SHAP': 'Senior homme arc à poulie',
        // Championnat Adulte - Vétéran
        'VFCL': 'Vétéran femme arc classique',
        'VFAP': 'Vétéran femme arc à poulie',
        'VHCL': 'Vétéran homme arc classique',
        'VHAP': 'Vétéran homme arc à poulie',
        // Championnat Adulte - Super Vétéran
        'SVFCL': 'Super vétéran femme arc classique',
        'SVFAP': 'Super vétéran femme arc à poulie',
        'SVHCL': 'Super vétéran homme arc classique',
        'SVHAP': 'Super vétéran homme arc à poulie'
    };
    return categories[code] || code;
}

/**
 * Get weapon type name from code
 * @param {string} code - Weapon code
 * @returns {string}
 */
export function getWeaponName(code) {
    const weapons = {
        'CL': 'Arc Classique',
        'CO': 'Arc à Poulies',
        'BB': 'Bare Bow',
        'AD': 'Arc Droit'
    };
    return weapons[code] || code;
}
