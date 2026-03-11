/**
 * utils.js — Scoring logic and helper functions
 */

// Scoring constants
export const POINTS = {
    REFERRAL: 1000,
    POST: 100,
    DOUBLE: 200,
};

/**
 * Calculate total score for a creator
 */
export function calculateScore(creator) {
    const referralPoints = (creator.referrals || 0) * POINTS.REFERRAL;
    const postPoints = (creator.posts || 0) * POINTS.POST;
    const doublePoints = (creator.double || 0) * POINTS.DOUBLE;

    return {
        referralPoints,
        postPoints,
        doublePoints,
        totalPoints: referralPoints + postPoints + doublePoints,
    };
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
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
    return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
}

/**
 * Animate a number counter from 0 to target
 */
export function animateCounter(element, target, duration = 1200) {
    const start = 0;
    const startTime = performance.now();

    function update(currentTime) {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        // Ease out cubic
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
