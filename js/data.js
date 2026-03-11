/**
 * data.js — Google Sheets CSV fetching and parsing
 */

import { calculateScore } from './utils.js';

// ==================================================================
// CONFIGURATION
// ==================================================================
const SHEET_CSV_URL =
    'https://docs.google.com/spreadsheets/d/1E8mcrg9b2diShYafCme0sy-SqMo3prf0/export?format=csv&gid=603715759';

// Fallback sample data in case the sheet is not accessible
const SAMPLE_DATA = [
    { date: new Date().toISOString(), name: 'Sayonara', handle: '@euasay', referrals: 5, posts: 12, double: 3 },
    { date: new Date(Date.now() - 86400000 * 10).toISOString(), name: 'Sayonara', handle: '@euasay', referrals: 2, posts: 5, double: 1 }, // 10 days ago
    { date: new Date().toISOString(), name: 'Claudia Rolon', handle: '@clauargshop', referrals: 3, posts: 8, double: 5 },
    { date: new Date().toISOString(), name: 'Nathalia Sausen', handle: '@nathesteta', referrals: 4, posts: 15, double: 2 },
    { date: new Date().toISOString(), name: 'Vitória Vieira', handle: '@motivandovidas32', referrals: 2, posts: 20, double: 4 },
];

/**
 * Parse a CSV string into an array of raw creator entries
 */
function parseCSV(csv) {
    const lines = csv.split(/\r?\n/).filter((line) => line.trim() !== '');

    if (lines.length < 2) return [];

    // Parse header to find column indices
    const headers = lines[0].split(',').map((h) => h.trim().toLowerCase());

    const colMap = {
        date: headers.findIndex(
            (h) => h.includes('data') || h.includes('date') || h.includes('carimbo')
        ),
        name: headers.findIndex(
            (h) => h.includes('nome') || h === 'name'
        ),
        handle: headers.findIndex(
            (h) => h.includes('usuario') || h.includes('user') || h === '@usuario'
        ),
        posts: headers.findIndex(
            (h) => h.includes('post') || h.includes('reels') || h.includes('tiktok')
        ),
        referrals: headers.findIndex(
            (h) => h.includes('indica') || h.includes('referral')
        ),
        double: headers.findIndex(
            (h) => h.includes('double') || h.includes('duplo')
        ),
    };

    const rawEntries = [];

    for (let i = 1; i < lines.length; i++) {
        const cols = parseCSVLine(lines[i]);

        // Skip empty rows
        const name = colMap.name >= 0 ? cleanName(cols[colMap.name]) : '';
        if (!name) continue;

        const dateStr = colMap.date >= 0 ? (cols[colMap.date] || '').trim() : '';
        const timestamp = parseDateBR(dateStr);
        const handle = colMap.handle >= 0 ? (cols[colMap.handle] || '').trim() : '';
        const posts = colMap.posts >= 0 ? parseNum(cols[colMap.posts]) : 0;
        const referrals = colMap.referrals >= 0 ? parseNum(cols[colMap.referrals]) : 0;
        const double = colMap.double >= 0 ? parseNum(cols[colMap.double]) : 0;

        rawEntries.push({ timestamp, name, handle, posts, referrals, double });
    }

    return rawEntries;
}

/**
 * Parse a single CSV line handling quoted fields
 */
function parseCSVLine(line) {
    const result = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
        const char = line[i];
        if (char === '"') {
            inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
            result.push(current);
            current = '';
        } else {
            current += char;
        }
    }
    result.push(current);
    return result;
}

/**
 * Clean creator name
 */
function cleanName(str) {
    if (!str) return '';
    return str.replace(/[\u200B-\u200F\u2028-\u202F\u2060-\u206F\uFEFF]/g, '').trim();
}

/**
 * Parse a numeric string
 */
function parseNum(str) {
    if (!str) return 0;
    const n = parseInt(str.toString().trim(), 10);
    return isNaN(n) ? 0 : Math.max(0, n);
}

/**
 * Parse date string (DD/MM/YYYY or DD/MM/YYYY HH:MM:SS) to Unix timestamp
 * Fallback to current time if invalid
 */
function parseDateBR(str) {
    if (!str) return Date.now();
    try {
        // Handle "15/03/2026 14:30:00" or just "15/03/2026"
        const [datePart] = str.split(' ');
        const [day, month, year] = datePart.split('/');

        if (day && month && year) {
            // JS months are 0-indexed
            const d = new Date(year, parseInt(month) - 1, day);
            if (!isNaN(d.getTime())) {
                return d.getTime();
            }
        }
    } catch (e) { /* ignore */ }

    // Fallback if parsing fails or formula format
    const fallback = new Date(str);
    return isNaN(fallback.getTime()) ? Date.now() : fallback.getTime();
}

/**
 * Fetch raw CSV data from Google Sheets
 */
export async function fetchRawData() {
    let rawData;

    try {
        const response = await fetch(SHEET_CSV_URL);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);

        const csvText = await response.text();
        rawData = parseCSV(csvText);

        if (rawData.length === 0) {
            console.warn('No valid data parsed, using sample data');
            rawData = SAMPLE_DATA.map(d => ({ ...d, timestamp: new Date(d.date).getTime() }));
        }
    } catch (err) {
        console.warn('Could not fetch Google Sheet:', err.message);
        rawData = SAMPLE_DATA.map(d => ({ ...d, timestamp: new Date(d.date).getTime() }));
    }

    return rawData;
}

/**
 * Process raw data: Filter by time window, aggregate by creator, calculate scores, and sort
 */
export function processAndAggregateData(rawData, timeWindow) {
    const now = Date.now();
    const msPerDay = 86400000;

    // 1. Filter by time window
    const filtered = rawData.filter(entry => {
        if (timeWindow === 'all') return true;

        const entryTime = entry.timestamp;

        if (timeWindow === '7') {
            return (now - entryTime) <= (7 * msPerDay);
        }
        if (timeWindow === '14') {
            return (now - entryTime) <= (14 * msPerDay);
        }
        if (timeWindow === 'this_month') {
            const entryDate = new Date(entryTime);
            const today = new Date();
            return entryDate.getMonth() === today.getMonth() && entryDate.getFullYear() === today.getFullYear();
        }

        return true;
    });

    // 2. Aggregate points per creator (group by handle or name)
    const aggregatedMap = new Map();

    filtered.forEach(entry => {
        const key = entry.handle ? entry.handle.toLowerCase() : entry.name.toLowerCase();

        if (aggregatedMap.has(key)) {
            const existing = aggregatedMap.get(key);
            existing.posts += entry.posts;
            existing.referrals += entry.referrals;
            existing.double += entry.double;
        } else {
            aggregatedMap.set(key, {
                name: entry.name,
                handle: entry.handle,
                posts: entry.posts,
                referrals: entry.referrals,
                double: entry.double
            });
        }
    });

    // 3. Convert to array, calculate scores, and sort
    const creators = Array.from(aggregatedMap.values()).map(creator => {
        const scores = calculateScore(creator);
        return { ...creator, ...scores };
    });

    // Sort by total points descending
    creators.sort((a, b) => b.totalPoints - a.totalPoints);

    // 4. Assign rank
    creators.forEach((creator, idx) => {
        creator.rank = idx + 1;
    });

    return creators;
}
