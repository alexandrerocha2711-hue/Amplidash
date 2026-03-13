/**
 * app.js — Main application entry point (/melhores)
 */

import { getCategorizedRankings } from './data.js';
import { formatNumber, getInitials } from './utils.js';

const $ = (sel) => document.querySelector(sel);

document.addEventListener('DOMContentLoaded', () => {
    // 1. Fetch data
    const rankings = getCategorizedRankings();

    // 2. Render each category
    renderCategory('cat-exercicio', rankings.exercicio);
    renderCategory('cat-familia', rankings.familia);
    renderCategory('cat-alimentacao', rankings.alimentacao);
    renderCategory('cat-hobbies', rankings.hobbies);
    renderCategory('cat-conhecimentos', rankings.conhecimentos);
    renderCategory('cat-bestWeek', rankings.bestWeek);

    // 3. Render general ranking
    renderGeneralRanking(rankings.geral);
});

/**
 * Render the top 5 for a specific category card
 */
function renderCategory(containerId, sortedData) {
    const container = $(`#${containerId} .category-podium`);
    if (!container) return;

    // We take top 5 for categories
    const top5 = sortedData.slice(0, 5);

    let html = '';
    top5.forEach((person, index) => {
        const rank = index + 1;
        // The points specifically for THIS category
        // Container IDs map exactly to category keys minus "cat-"
        const catKey = containerId.replace('cat-', '');
        const points = person.categories[catKey];

        html += `
            <div class="podium-item">
                <div class="item-rank ${rank <= 3 ? 'rank-' + rank : ''}">${rank}º</div>
                <div class="item-avatar">${getInitials(person.name)}</div>
                <div class="item-info">
                    <div class="item-name">${person.name}</div>
                    <div class="item-handle">${person.handle}</div>
                </div>
                <div class="item-score">${formatNumber(points)} pts</div>
            </div>
        `;
    });

    container.innerHTML = html;
}

/**
 * Render the bottom comprehensive table
 */
function renderGeneralRanking(generalData) {
    const tbody = $('#ranking-geral-tbody');
    if (!tbody) return;

    let html = '';
    generalData.forEach((p, index) => {
        const rank = index + 1;
        html += `
            <tr>
              <td>
                <span class="rank-badge ${rank <= 3 ? 'rank-' + rank : ''}">${rank}</span>
              </td>
              <td>
                <div class="creator-cell">
                  <div class="creator-avatar">${getInitials(p.name)}</div>
                  <div>
                    <div class="creator-name">${p.name}</div>
                    <div class="creator-handle">${p.handle}</div>
                  </div>
                </div>
              </td>
              <td class="td-metric hide-mobile">${formatNumber(p.categories.exercicio)}</td>
              <td class="td-metric hide-mobile">${formatNumber(p.categories.familia)}</td>
              <td class="td-metric hide-mobile">${formatNumber(p.categories.alimentacao)}</td>
              <td class="td-metric hide-mobile">${formatNumber(p.categories.hobbies)}</td>
              <td class="td-metric hide-mobile">${formatNumber(p.categories.conhecimentos)}</td>
              <td class="td-metric hide-mobile">${formatNumber(p.categories.bestWeek)}</td>
              <td class="td-total">${formatNumber(p.totalPoints)}</td>
            </tr>
        `;
    });

    tbody.innerHTML = html;
}
