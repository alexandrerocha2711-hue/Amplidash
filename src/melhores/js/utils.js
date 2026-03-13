/**
 * utils.js — Helper functions
 */

/**
 * Calculate total score by summing all category values
 */
export function calculateTotalScores(categories) {
    if (!categories) return 0;
    return Object.values(categories).reduce((sum, val) => sum + (val || 0), 0);
}

/**
 * Format number with thousands separator (pt-BR)
 */
export function formatNumber(num) {
    return new Intl.NumberFormat('pt-BR').format(num);
}

/**
 * Get initials from a name (up to 2 characters)
 */
export function getInitials(name) {
    if (!name) return '?';
    // For names like "Xandão (Alexandre Neto)", extract just "Xandão"
    const cleanName = name.replace(/\s*\(.*?\)\s*/g, '').trim();
    const parts = cleanName.split(/\s+/);
    if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
    return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
}

/**
 * Animate a number counter from 0 to target
 */
export function animateCounter(element, target, duration = 1200) {
    if (!element) return;
    const start = 0;
    const startTime = performance.now();

    function update(currentTime) {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3);
        const current = Math.round(start + (target - start) * eased);

        element.textContent = formatNumber(current);

        if (progress < 1) {
            requestAnimationFrame(update);
        }
    }

    requestAnimationFrame(update);
}

/**
 * Debounce utility
 */
export function debounce(fn, delay = 300) {
    let timer;
    return (...args) => {
        clearTimeout(timer);
        timer = setTimeout(() => fn(...args), delay);
    };
}
