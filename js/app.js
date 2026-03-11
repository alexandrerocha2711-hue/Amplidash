/**
 * app.js — Main application entry point
 */

import { fetchRawData, processAndAggregateData } from './data.js';
import { renderRankingChart, renderDistributionChart } from './charts.js';
import { formatNumber, getInitials, animateCounter, debounce } from './utils.js';

// ============================================================
// STATE
// ============================================================
let rawData = [];
let creators = [];
let filteredCreators = [];
let currentFilter = 'this_month';
let countdownInterval = null;
let refreshInterval = null;
const REFRESH_SECONDS = 60;
let countdown = REFRESH_SECONDS;

// ============================================================
// DOM REFERENCES
// ============================================================
const $ = (sel) => document.querySelector(sel);
const loadingOverlay = $('#loading-overlay');
const refreshBtn = $('#refresh-btn');
const downloadPdfBtn = $('#download-pdf-btn');
const refreshStatus = $('#refresh-status');
const searchInput = $('#search-input');
const dateSelect = $('#date-range-select');
const rankingTbody = $('#ranking-tbody');
const tableEmpty = $('#table-empty');
const countdownEl = $('#countdown');

// Summary card values
const totalCreatorsEl = $('#total-creators');
const totalPointsEl = $('#total-points');
const totalReferralsEl = $('#total-referrals');
const totalPostsEl = $('#total-posts');
const totalDoubleEl = $('#total-double');

// ============================================================
// INITIALISE
// ============================================================
async function init() {
    await loadData();
    hideLoading();
    startAutoRefresh();
    bindEvents();
}

// ============================================================
// DATA LOADING
// ============================================================
async function loadData() {
    try {
        refreshBtn.classList.add('spinning');

        // 1. Fetch raw rows
        rawData = await fetchRawData();

        // 2. Process based on current selected date filter
        currentFilter = dateSelect ? dateSelect.value : 'this_month';
        creators = processAndAggregateData(rawData, currentFilter);

        // 3. Reset search filter
        if (searchInput) searchInput.value = '';
        filteredCreators = [...creators];

        render();
        updateRefreshStatus('Atualizado agora');
    } catch (err) {
        console.error('Error loading data:', err);
        updateRefreshStatus('Erro ao carregar');
    } finally {
        refreshBtn.classList.remove('spinning');
    }
}

function hideLoading() {
    if (loadingOverlay) {
        loadingOverlay.classList.add('hidden');
        // Remove from DOM after transition
        setTimeout(() => loadingOverlay.remove(), 600);
    }
}

// ============================================================
// RENDERING
// ============================================================
function render() {
    renderSummaryCards();
    renderPodium();
    renderTable();
    renderRankingChart(creators);
    renderDistributionChart(creators);
}

// --- Summary Cards ---
function renderSummaryCards() {
    const totals = creators.reduce(
        (acc, c) => ({
            creators: acc.creators + 1,
            points: acc.points + c.totalPoints,
            referrals: acc.referrals + (c.referrals || 0),
            posts: acc.posts + (c.posts || 0),
            double: acc.double + (c.double || 0),
        }),
        { creators: 0, points: 0, referrals: 0, posts: 0, double: 0 }
    );

    animateCounter(totalCreatorsEl, totals.creators, 800);
    animateCounter(totalPointsEl, totals.points, 1200);
    animateCounter(totalReferralsEl, totals.referrals, 900);
    animateCounter(totalPostsEl, totals.posts, 900);
    animateCounter(totalDoubleEl, totals.double, 900);
}

// --- Podium (Top 3) ---
function renderPodium() {
    [1, 2, 3].forEach((rank) => {
        const creator = creators[rank - 1];
        const nameEl = $(`#podium-${rank}-name`);
        const handleEl = $(`#podium-${rank}-handle`);
        const scoreEl = $(`#podium-${rank}-score`);
        const initialEl = $(`#podium-${rank}-initial`);

        if (creator) {
            nameEl.textContent = creator.name;
            handleEl.textContent = creator.handle || '—';
            scoreEl.textContent = formatNumber(creator.totalPoints) + ' pts';
            initialEl.textContent = getInitials(creator.name);
        } else {
            nameEl.textContent = '—';
            handleEl.textContent = '—';
            scoreEl.textContent = '0 pts';
            initialEl.textContent = '—';
        }
    });
}

// --- Ranking Table ---
function renderTable() {
    const dataToRender = filteredCreators;

    if (dataToRender.length === 0) {
        rankingTbody.innerHTML = '';
        tableEmpty.style.display = 'block';
        return;
    }

    tableEmpty.style.display = 'none';

    const html = dataToRender
        .map(
            (c) => `
    <tr class="animate-in" style="animation-delay: ${Math.min(c.rank * 30, 500)}ms;">
      <td>
        <span class="rank-badge ${c.rank <= 3 ? 'rank-' + c.rank : ''}">${c.rank}</span>
      </td>
      <td>
        <div class="creator-cell">
          <div class="creator-avatar" style="${getAvatarStyle(c.rank)}">${getInitials(c.name)}</div>
          <div class="creator-info">
            <div class="creator-name">${escapeHtml(c.name)}</div>
            <div class="creator-handle">${escapeHtml(c.handle || '')}</div>
          </div>
        </div>
      </td>
      <td class="td-metric">${formatNumber(c.referrals || 0)}</td>
      <td class="td-metric">${formatNumber(c.posts || 0)}</td>
      <td class="td-metric td-double">${formatNumber(c.double || 0)}</td>
      <td class="td-total">${formatNumber(c.totalPoints)}</td>
    </tr>
  `
        )
        .join('');

    rankingTbody.innerHTML = html;
}

function getAvatarStyle(rank) {
    if (rank === 1) return 'background: linear-gradient(135deg, #fbbf24, #f59e0b);';
    if (rank === 2) return 'background: linear-gradient(135deg, #94a3b8, #64748b);';
    if (rank === 3) return 'background: linear-gradient(135deg, #d97706, #b45309);';
    return '';
}

function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}

// ============================================================
// SEARCH / FILTER
// ============================================================
function filterCreators(query) {
    const q = query.toLowerCase().trim();
    if (!q) {
        filteredCreators = [...creators];
    } else {
        filteredCreators = creators.filter(
            (c) =>
                c.name.toLowerCase().includes(q) ||
                (c.handle && c.handle.toLowerCase().includes(q))
        );
    }
    renderTable();
}

// ============================================================
// AUTO REFRESH
// ============================================================
function startAutoRefresh() {
    countdown = REFRESH_SECONDS;
    updateCountdown();

    clearInterval(countdownInterval);
    countdownInterval = setInterval(() => {
        countdown--;
        updateCountdown();
        if (countdown <= 0) {
            loadData();
            countdown = REFRESH_SECONDS;
        }
    }, 1000);
}

function updateCountdown() {
    if (countdownEl) {
        countdownEl.textContent = countdown;
    }
}

function updateRefreshStatus(text) {
    if (refreshStatus) {
        refreshStatus.textContent = text;
    }
}

// ============================================================
// EVENT BINDINGS
// ============================================================
function bindEvents() {
    // Manual refresh
    if (refreshBtn) {
        refreshBtn.addEventListener('click', async () => {
            await loadData();
            countdown = REFRESH_SECONDS;
        });
    }

    // Download PDF
    if (downloadPdfBtn) {
        downloadPdfBtn.addEventListener('click', () => {
            window.print();
        });
    }

    // Search
    if (searchInput) {
        searchInput.addEventListener(
            'input',
            debounce((e) => {
                filterCreators(e.target.value);
            }, 200)
        );
    }

    // Date Range changed
    if (dateSelect) {
        dateSelect.addEventListener('change', (e) => {
            currentFilter = e.target.value;
            // Reprocess the same raw data without doing a new network fetch
            creators = processAndAggregateData(rawData, currentFilter);

            // Re-apply search if exists
            const q = searchInput ? searchInput.value : '';
            if (q) {
                filterCreators(q);
            } else {
                filteredCreators = [...creators];
                render();
            }
        });
    }
}

// ============================================================
// START
// ============================================================
document.addEventListener('DOMContentLoaded', init);
