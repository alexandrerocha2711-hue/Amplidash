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
let botwStep = 'SPEAKING'; // 'SPEAKING' | 'BEST_WINNER' | 'WORST_WINNER'

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

// Audio Assets (Mixkit - Royalty Free)
const SFX = {
    win: new Audio('https://assets.mixkit.co/active_storage/sfx/2013/2013-preview.mp3'),
    shame: new Audio('https://assets.mixkit.co/active_storage/sfx/2436/2436-preview.mp3')
};

// Pre-load audio
Object.entries(SFX).forEach(([key, audio]) => {
    audio.load();
    audio.volume = 0.6;
    audio.oncanplaythrough = () => console.log(`Audio SFX: ${key} loaded and ready.`);
    audio.onerror = (e) => console.error(`Audio SFX: ${key} failed to load.`, e);
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
    
    // BOTW specific
    $('#btn-next-speaker').addEventListener('click', () => {
        currentParticipantIndex++;
        renderVotingStep();
    });

    $('#btn-finish-voting').addEventListener('click', finishVotingSystem);
}

function startVotingSystem() {
    sessionResults = {};
    currentCategoryIndex = 0;
    botwStep = 'SPEAKING';
    
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
    // Check if category is finished
    if (currentParticipantIndex >= currentQueue.length) {
        const cat = CATEGORIES_ORDER[currentCategoryIndex];
        
        // Special logic for BotW winners after everyone speaks
        if (cat.key === 'bestWeek' && botwStep === 'SPEAKING') {
            renderBOTWSelection('BEST');
            return;
        }

        // Standard category progression
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
    
    // Layout reset
    $('#modal-participant-content').style.display = 'block';
    $('#modal-selection-grid').style.display = 'none';

    $('#modal-cat-title').textContent = cat.title;
    $('#modal-cat-icon').textContent = cat.icon;
    $('#modal-progress').textContent = `${currentParticipantIndex + 1} / ${currentQueue.length}`;
    
    $('#modal-avatar').textContent = getInitials(person.name);
    $('#modal-name').textContent = person.name;
    
    if (cat.key === 'bestWeek') {
        $('#modal-objective-label').textContent = 'Momento da Fala:';
        $('#modal-objective-text').textContent = 'Diga seu MELHOR e PIOR fato da semana!';
        
        $('#modal-actions-voting').style.display = 'none';
        $('#modal-actions-speaker').style.display = 'flex';
    } else {
        $('#modal-objective-label').textContent = 'Objetivo da Semana:';
        $('#modal-objective-text').textContent = person.objectives[cat.key];
        
        $('#modal-actions-voting').style.display = 'flex';
        $('#modal-actions-speaker').style.display = 'none';
    }
    
    $('#modal-actions-finish').style.display = 'none';
}

let currentVoterIndex = 0;
let botwVotes = {};

function renderBOTWSelection(type, isFirstVoter = true) {
    botwStep = type === 'BEST' ? 'BEST_WINNER' : 'WORST_WINNER';
    
    if (isFirstVoter) {
        currentVoterIndex = 0;
        botwVotes = {};
        PARTICIPANTS_DATA.forEach(p => botwVotes[p.name] = 0);
    }

    const currentVoter = PARTICIPANTS_DATA[currentVoterIndex];

    $('#modal-participant-content').style.display = 'none';
    $('#modal-selection-grid').style.display = 'grid';
    $('#modal-actions-speaker').style.display = 'none';
    $('#modal-actions-voting').style.display = 'none';

    const titleText = type === 'BEST' ? 'Quem teve o MELHOR fato?' : 'Quem teve o PIOR fato?';
    $('#modal-cat-title').textContent = titleText;
    $('#modal-cat-icon').textContent = type === 'BEST' ? '🥇' : '💀';
    
    // UI indicator for who is voting
    $('#modal-progress').innerHTML = `<span style="color:var(--accent-blue)">Votando: ${currentVoter.name}</span> (${currentVoterIndex + 1}/${PARTICIPANTS_DATA.length})`;

    const grid = $('#modal-selection-grid');
    grid.innerHTML = '';

    PARTICIPANTS_DATA.forEach(p => {
        const item = document.createElement('div');
        item.className = 'selection-item';
        item.innerHTML = `
            <div class="item-avatar">${getInitials(p.name)}</div>
            <span>${p.name.split(' ')[0]}</span>
        `;
        item.addEventListener('click', () => {
            // Tally vote
            botwVotes[p.name]++;

            currentVoterIndex++;
            if (currentVoterIndex < PARTICIPANTS_DATA.length) {
                // Next voter
                renderBOTWSelection(type, false);
            } else {
                // All voted! Determine winner
                const winnerName = Object.keys(botwVotes).reduce((a, b) => botwVotes[a] >= botwVotes[b] ? a : b);
                const winnerObj = PARTICIPANTS_DATA.find(p => p.name === winnerName);

                // Record point in sessionResults
                if (!sessionResults[winnerName]) sessionResults[winnerName] = {};
                sessionResults[winnerName]['bestWeek'] = (sessionResults[winnerName]['bestWeek'] || 0) + (type === 'BEST' ? 1 : -1);

                // Show Celebration/Shame Interstitial
                showCelebrationScreen(winnerObj, type, () => {
                    if (type === 'BEST') {
                        renderBOTWSelection('WORST');
                    } else {
                        // Done with BOTW, move to next category
                        currentCategoryIndex++;
                        prepareQueueForCategory(currentCategoryIndex);
                        renderVotingStep();
                    }
                });
            }
        });
        grid.appendChild(item);
    });
}

function showCelebrationScreen(person, type, callback) {
    const screen = $('#modal-celebration-screen');
    const particlesContainer = $('#celebration-particles');
    const avatar = $('#celebration-avatar');
    const title = $('#celebration-title');
    const subtitle = $('#celebration-subtitle');

    particlesContainer.innerHTML = '';
    screen.style.display = 'flex';
    avatar.textContent = getInitials(person.name);

    if (type === 'BEST') {
        playSFX('win');
        title.textContent = 'WINNER!';
        title.style.color = '#FFD700';
        title.style.textShadow = '0 0 20px rgba(255, 215, 0, 0.6)';
        subtitle.textContent = 'Melhor Fato da Semana';
        generateParticles(['🎉', '🎊', '✨', '⭐', '🏆', '🔥'], 'fall');
    } else {
        playSFX('shame');
        title.textContent = 'SHAME!';
        title.style.color = '#4CAF50';
        title.style.textShadow = '0 0 20px rgba(76, 175, 80, 0.6)';
        subtitle.textContent = 'Pior Fato da Semana';
        generateParticles(['💩', '💨', '🤢', '🤢', '🤮'], 'rise');
    }

    setTimeout(() => {
        screen.style.display = 'none';
        callback();
    }, 3000);
}

function playSFX(type) {
    const audio = SFX[type];
    if (audio) {
        audio.currentTime = 0;
        audio.play().catch(e => console.log('Audio play blocked or failed:', e));
        
        // Stop audio after 3s
        setTimeout(() => {
            audio.pause();
            audio.currentTime = 0;
        }, 3000);
    }
}

function generateParticles(list, direction) {
    const container = $('#celebration-particles');
    const count = 40;
    
    for (let i = 0; i < count; i++) {
        const p = document.createElement('div');
        p.className = 'particle';
        p.textContent = list[Math.floor(Math.random() * list.length)];
        p.style.left = Math.random() * 100 + '%';
        p.style.animation = `${direction === 'fall' ? 'particle-fall' : 'particle-rise'} ${2 + Math.random() * 3}s linear infinite`;
        p.style.animationDelay = Math.random() * 2 + 's';
        p.style.opacity = '0';
        container.appendChild(p);
    }
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
    $('#modal-participant-content').style.display = 'block';
    $('#modal-selection-grid').style.display = 'none';
    $('#modal-celebration-screen').style.display = 'none';

    $('#modal-cat-title').textContent = 'Votação Concluída!';
    $('#modal-cat-icon').textContent = '🏆';
    $('#modal-progress').textContent = '';
    
    $('#modal-avatar').textContent = '✅';
    $('#modal-name').textContent = 'Todos os objetivos revisados';
    $('#modal-objective-text').textContent = 'Clique em finalizar para aplicar os pontos no ranking.';
    
    $('#modal-actions-voting').style.display = 'none';
    $('#modal-actions-speaker').style.display = 'none';
    $('#modal-actions-finish').style.display = 'flex';
}

function finishVotingSystem() {
    // Apply temporary points mapped during voting to the app's global state
    applyVotingResults(sessionResults);
    $('#voting-modal').style.display = 'none';
    
    // Re-render the whole dashboard
    initUI();
}
