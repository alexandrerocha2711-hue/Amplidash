/**
 * app.js — Main application entry point (/melhores)
 */

import { getCategorizedRankings, applyVotingResults, PARTICIPANTS_DATA } from './data.js';
import { formatNumber, getInitials } from './utils.js';

const $ = (sel) => document.querySelector(sel);

// Votacao State
let currentCategoryIndex = 0;
let currentParticipantIndex = 0;
let currentQueue = [];
let sessionResults = {};

const CATEGORIES_ORDER = [
    { key: 'bestWeek', title: 'Best of The Week', icon: '🌟' },
    { key: 'exercicio', title: 'Exercício Físico', icon: '💪' },
    { key: 'familia', title: 'Família', icon: '👨‍👩‍👧‍👦' },
    { key: 'alimentacao', title: 'Alimentação', icon: '🥗' },
    { key: 'hobbies', title: 'Hobbies', icon: '🎨' },
    { key: 'conhecimentos', title: 'Conhecimentos', icon: '📚' },
];

document.addEventListener('DOMContentLoaded', () => {
    initUI();
    bindVotingEvents();
});

function initUI() {
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
}

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

// --- Voting System Logic ---

function bindVotingEvents() {
    const startBtn = $('#start-voting-btn');
    if(startBtn) startBtn.addEventListener('click', startVotingSystem);
    
    const closeBtn = $('#modal-close-btn');
    if(closeBtn) closeBtn.addEventListener('click', () => { $('#voting-modal').style.display = 'none'; });
    
    // Voting Buttons
    $('#btn-vote-yes').addEventListener('click', () => handleVote(1));
    $('#btn-vote-no').addEventListener('click', () => handleVote(-2));
    $('#btn-vote-neutral').addEventListener('click', () => handleVote(0));
    
    $('#btn-finish-voting').addEventListener('click', finishVotingSystem);
}

function startVotingSystem() {
    sessionResults = {};
    currentCategoryIndex = 0;
    
    prepareQueueForCategory(currentCategoryIndex);
    $('#voting-modal').style.display = 'flex';
    renderVotingStep();
}

function prepareQueueForCategory(catIndex) {
    const cat = CATEGORIES_ORDER[catIndex];
    
    let pool = PARTICIPANTS_DATA.filter(p => {
        if (cat.key === 'bestWeek') return true;
        // Verify if person has an objective string in this category
        return p.objectives[cat.key] && p.objectives[cat.key].trim() !== '';
    });
    
    // Randomize
    pool.sort(() => Math.random() - 0.5);
    
    currentQueue = pool;
    currentParticipantIndex = 0;
}

function renderVotingStep() {
    if (currentParticipantIndex >= currentQueue.length) {
        // Next category
        currentCategoryIndex++;
        if (currentCategoryIndex < CATEGORIES_ORDER.length) {
            prepareQueueForCategory(currentCategoryIndex);
            renderVotingStep();
            return;
        } else {
            // End of voting flow
            showFinishScreen();
            return;
        }
    }
    
    const cat = CATEGORIES_ORDER[currentCategoryIndex];
    const person = currentQueue[currentParticipantIndex];
    
    $('#modal-cat-title').textContent = cat.title;
    $('#modal-cat-icon').textContent = cat.icon;
    $('#modal-progress').textContent = `${currentParticipantIndex + 1} / ${currentQueue.length}`;
    
    $('#modal-avatar').textContent = getInitials(person.name);
    $('#modal-name').textContent = person.name;
    
    if (cat.key === 'bestWeek') {
        $('#modal-objective-text').textContent = 'Decidido em reunião (Meet)';
    } else {
        $('#modal-objective-text').textContent = person.objectives[cat.key];
    }
    
    $('#modal-actions-voting').style.display = 'flex';
    $('#modal-actions-finish').style.display = 'none';
}

function handleVote(points) {
    const person = currentQueue[currentParticipantIndex];
    const cat = CATEGORIES_ORDER[currentCategoryIndex];
    
    if (!sessionResults[person.name]) {
        sessionResults[person.name] = {};
    }
    sessionResults[person.name][cat.key] = points;
    
    currentParticipantIndex++;
    renderVotingStep();
}

function showFinishScreen() {
    $('#modal-cat-title').textContent = 'Votação Concluída!';
    $('#modal-cat-icon').textContent = '🏆';
    $('#modal-progress').textContent = '';
    
    $('#modal-avatar').textContent = '✅';
    $('#modal-name').textContent = 'Todos os objetivos revisados';
    $('#modal-objective-text').textContent = 'Clique em finalizar para aplicar os pontos no ranking.';
    
    $('#modal-actions-voting').style.display = 'none';
    $('#modal-actions-finish').style.display = 'flex';
}

function finishVotingSystem() {
    // Apply temporary points mapped during voting to the app's global state
    applyVotingResults(sessionResults);
    $('#voting-modal').style.display = 'none';
    
    // Re-render the whole dashboard
    initUI();
}
