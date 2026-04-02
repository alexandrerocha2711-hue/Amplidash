/**
 * app.js — Main application entry point (/melhores)
 */

import {
  getCategorizedRankings,
  getParticipantsData,
  getSourceInfo,
  loadParticipantsData,
  persistVotingSession,
  resetAllScores,
} from './data.js';
import { getInitials } from './utils.js';
import { CATEGORY_DEFINITIONS } from './shared.js';

const $ = (sel) => document.querySelector(sel);

let currentCategoryIndex = 0;
let currentParticipantIndex = 0;
let currentQueue = [];
let currentVoterIndex = 0;
let sessionResults = {};
let botwVotes = {};
let botwStep = 'SPEAKING';
let bestWinnerId = null;
let worstWinnerId = null;
let pendingRetryIntervalId = null;

const CATEGORIES_ORDER = CATEGORY_DEFINITIONS;

const SFX = {
  win: new Audio('https://assets.mixkit.co/active_storage/sfx/2013/2013-preview.mp3'),
  shame: new Audio('https://assets.mixkit.co/active_storage/sfx/2436/2436-preview.mp3'),
};

Object.entries(SFX).forEach(([key, audio]) => {
  audio.load();
  audio.volume = 0.6;
  audio.oncanplaythrough = () => console.log(`Audio SFX: ${key} loaded and ready.`);
  audio.onerror = (e) => console.error(`Audio SFX: ${key} failed to load.`, e);
});

document.addEventListener('DOMContentLoaded', async () => {
  bindVotingEvents();
  await refreshDashboard('Carregando dados...');
});

function getButtonLabel(button) {
  return button?.querySelector('.btn-label');
}

function setButtonBusy(button, isBusy, busyLabel) {
  if (!button) return;

  const label = getButtonLabel(button);
  if (!button.dataset.defaultLabel && label) {
    button.dataset.defaultLabel = label.textContent;
  }

  button.disabled = isBusy;

  if (label) {
    label.textContent = isBusy ? busyLabel : button.dataset.defaultLabel || label.textContent;
  }
}

function renderDashboard() {
  const rankings = getCategorizedRankings();

  renderCategory('cat-exercicio', rankings.exercicio);
  renderCategory('cat-familia', rankings.familia);
  renderCategory('cat-alimentacao', rankings.alimentacao);
  renderCategory('cat-hobbies', rankings.hobbies);
  renderCategory('cat-conhecimentos', rankings.conhecimentos);
  renderCategory('cat-bestWeek', rankings.bestWeek);
  renderGeneralRanking(rankings.geral);
}

async function refreshDashboard(loadingLabel = 'Carregando...') {
  const startButton = $('#start-voting-btn');
  const resetButton = $('#reset-scores-btn');

  setButtonBusy(startButton, true, loadingLabel);
  setButtonBusy(resetButton, true, loadingLabel);

  await loadParticipantsData();
  renderDashboard();

  setButtonBusy(startButton, false, loadingLabel);
  setButtonBusy(resetButton, false, loadingLabel);
}

function renderCategory(containerId, sortedData) {
  const container = $(`#${containerId} .category-podium`);
  if (!container) return;

  const top5 = sortedData.slice(0, 5);

  container.innerHTML = top5
    .map((person, index) => {
      const rank = index + 1;
      const categoryKey = containerId.replace('cat-', '');
      const points = person.categories[categoryKey];

      return `
        <div class="podium-item">
          <div class="item-rank ${rank <= 3 ? `rank-${rank}` : ''}">${rank}º</div>
          <div class="item-avatar">${getInitials(person.name)}</div>
          <div class="item-info">
            <div class="item-name">${person.name}</div>
            <div class="item-handle">${person.handle}</div>
          </div>
          <div class="item-score">${points} pts</div>
        </div>
      `;
    })
    .join('');
}

function renderGeneralRanking(generalData) {
  const tbody = $('#ranking-geral-tbody');
  if (!tbody) return;

  tbody.innerHTML = generalData
    .map((participant, index) => {
      const rank = index + 1;

      return `
        <tr>
          <td>
            <span class="rank-badge ${rank <= 3 ? `rank-${rank}` : ''}">${rank}</span>
          </td>
          <td>
            <div class="creator-cell">
              <div class="creator-avatar">${getInitials(participant.name)}</div>
              <div>
                <div class="creator-name">${participant.name}</div>
                <div class="creator-handle">${participant.handle}</div>
              </div>
            </div>
          </td>
          <td class="td-metric hide-mobile">${participant.categories.exercicio}</td>
          <td class="td-metric hide-mobile">${participant.categories.familia}</td>
          <td class="td-metric hide-mobile">${participant.categories.alimentacao}</td>
          <td class="td-metric hide-mobile">${participant.categories.hobbies}</td>
          <td class="td-metric hide-mobile">${participant.categories.conhecimentos}</td>
          <td class="td-metric hide-mobile">${participant.categories.bestWeek}</td>
          <td class="td-total">${participant.totalPoints}</td>
        </tr>
      `;
    })
    .join('');
}

function bindVotingEvents() {
  $('#start-voting-btn')?.addEventListener('click', startVotingSystem);
  $('#reset-scores-btn')?.addEventListener('click', handleResetScores);
  $('#modal-close-btn')?.addEventListener('click', () => {
    $('#voting-modal').style.display = 'none';
  });

  $('#btn-vote-yes')?.addEventListener('click', () => handleVote(1));
  $('#btn-vote-no')?.addEventListener('click', () => handleVote(-2));
  $('#btn-vote-neutral')?.addEventListener('click', () => handleVote(0));
  $('#btn-next-speaker')?.addEventListener('click', () => {
    currentParticipantIndex += 1;
    renderVotingStep();
  });
  $('#btn-finish-voting')?.addEventListener('click', finishVotingSystem);

  // Management Events
  $('#manage-dropdown #add-voter-btn')?.addEventListener('click', startAddParticipantFlow);
  $('#manage-dropdown #new-cycle-btn')?.addEventListener('click', startNewCycleFlow);
  $('#management-close-btn')?.addEventListener('click', () => {
    $('#management-modal').style.display = 'none';
  });
  $('#management-btn-back')?.addEventListener('click', handleMgmtBack);
  $('#management-btn-next')?.addEventListener('click', handleMgmtNext);
}

// Management Flow State
let mgmtFlow = null; // 'ADD_PARTICIPANT' | 'NEW_CYCLE'
let mgmtStep = 0;
let mgmtData = {};
const MGMT_CATEGORIES = CATEGORY_DEFINITIONS.filter(c => c.key !== 'bestWeek');

function startAddParticipantFlow() {
  mgmtFlow = 'ADD_PARTICIPANT';
  mgmtStep = 0;
  mgmtData = { name: '', handle: '', objectives: {} };
  
  $('#management-modal').style.display = 'flex';
  $('#management-title').textContent = 'Adicionar Participante';
  $('#management-icon').textContent = '👤';
  renderManagementStep();
}

async function startNewCycleFlow() {
  const confirmed = window.confirm('Isso vai zerar as pontuações atuais e permitir redefinir os objetivos de todos. Continuar?');
  if (!confirmed) return;

  await resetAllScores();
  renderDashboard();

  mgmtFlow = 'NEW_CYCLE';
  mgmtStep = 0;
  mgmtData = { participants: getParticipantsData(), currentIndex: 0, currentCatIndex: 0 };

  $('#management-modal').style.display = 'flex';
  $('#management-title').textContent = 'Novo Ciclo: Objetivos';
  $('#management-icon').textContent = '🚀';
  renderManagementStep();
}

function renderManagementStep() {
  const content = $('#management-content');
  const btnNext = $('#management-btn-next');
  const btnBack = $('#management-btn-back');

  btnBack.style.display = mgmtStep > 0 ? 'flex' : 'none';
  btnNext.textContent = 'Próximo';

  if (mgmtFlow === 'ADD_PARTICIPANT') {
    if (mgmtStep === 0) {
      content.innerHTML = `
        <div class="mgmt-form-group">
          <label>Nome Completo</label>
          <input type="text" id="mgmt-name" class="mgmt-input" placeholder="Ex: João Silva" value="${mgmtData.name}">
        </div>
        <div class="mgmt-form-group">
          <label>Handle (@usuario)</label>
          <input type="text" id="mgmt-handle" class="mgmt-input" placeholder="Ex: @joao" value="${mgmtData.handle}">
        </div>
      `;
    } else if (mgmtStep <= MGMT_CATEGORIES.length) {
      const cat = MGMT_CATEGORIES[mgmtStep - 1];
      content.innerHTML = `
        <div class="wizard-step-info">
          <div class="wizard-step-icon">${cat.icon}</div>
          <div class="wizard-step-title">${cat.title}</div>
          <p style="font-size: 0.85rem; opacity: 0.7; margin-top: 4px;">Defina a meta da semana para esta categoria</p>
        </div>
        <div class="mgmt-form-group">
          <textarea id="mgmt-objective" class="mgmt-input mgmt-area" placeholder="Ex: Treinar 3x na semana">${mgmtData.objectives[cat.key] || ''}</textarea>
        </div>
      `;
      if (mgmtStep === MGMT_CATEGORIES.length) btnNext.textContent = 'Finalizar';
    }
  } else if (mgmtFlow === 'NEW_CYCLE') {
    const participant = mgmtData.participants[mgmtData.currentIndex];
    const cat = MGMT_CATEGORIES[mgmtData.currentCatIndex];

    content.innerHTML = `
      <div class="wizard-step-info">
        <div class="modal-avatar" style="width: 60px; height: 60px; font-size: 20px; margin: 0 auto 12px;">${getInitials(participant.name)}</div>
        <div class="item-name" style="font-size: 1.1rem; margin-bottom: 16px;">${participant.name}</div>
        <hr style="border: 0; border-top: 1px solid rgba(255,255,255,0.1); margin-bottom: 16px;">
        <div class="wizard-step-icon">${cat.icon}</div>
        <div class="wizard-step-title">${cat.title}</div>
      </div>
      <div class="mgmt-form-group">
        <textarea id="mgmt-objective" class="mgmt-input mgmt-area" placeholder="Nova meta para ${cat.title}">${participant.objectives[cat.key] || ''}</textarea>
      </div>
    `;

    const isLast = mgmtData.currentIndex === mgmtData.participants.length - 1 && mgmtData.currentCatIndex === MGMT_CATEGORIES.length - 1;
    if (isLast) btnNext.textContent = 'Finalizar';
  }
}

function handleMgmtBack() {
  if (mgmtFlow === 'ADD_PARTICIPANT' && mgmtStep > 0) {
    mgmtStep--;
    renderManagementStep();
  } else if (mgmtFlow === 'NEW_CYCLE') {
    if (mgmtData.currentCatIndex > 0) {
      mgmtData.currentCatIndex--;
    } else if (mgmtData.currentIndex > 0) {
      mgmtData.currentIndex--;
      mgmtData.currentCatIndex = MGMT_CATEGORIES.length - 1;
    }
    mgmtStep--;
    renderManagementStep();
  }
}

async function handleMgmtNext() {
  if (mgmtFlow === 'ADD_PARTICIPANT') {
    if (mgmtStep === 0) {
      mgmtData.name = $('#mgmt-name').value.trim();
      mgmtData.handle = $('#mgmt-handle').value.trim();
      if (!mgmtData.name || !mgmtData.handle) return alert('Preencha os campos obrigatórios');
      mgmtStep++;
      renderManagementStep();
    } else if (mgmtStep <= MGMT_CATEGORIES.length) {
      const cat = MGMT_CATEGORIES[mgmtStep - 1];
      mgmtData.objectives[cat.key] = $('#mgmt-objective').value.trim();
      
      if (mgmtStep === MGMT_CATEGORIES.length) {
        import('./data.js').then(m => {
          m.addParticipant(mgmtData);
          $('#management-modal').style.display = 'none';
          refreshDashboard();
        });
      } else {
        mgmtStep++;
        renderManagementStep();
      }
    }
  } else if (mgmtFlow === 'NEW_CYCLE') {
    const participant = mgmtData.participants[mgmtData.currentIndex];
    const cat = MGMT_CATEGORIES[mgmtData.currentCatIndex];
    const objText = $('#mgmt-objective').value.trim();

    participant.objectives[cat.key] = objText;

    const isLastCat = mgmtData.currentCatIndex === MGMT_CATEGORIES.length - 1;
    const isLastParticipant = mgmtData.currentIndex === mgmtData.participants.length - 1;

    if (isLastCat && isLastParticipant) {
      for (const p of mgmtData.participants) {
        import('./data.js').then(m => m.updateParticipantObjectives(p.id, p.objectives));
      }
      $('#management-modal').style.display = 'none';
      refreshDashboard();
    } else {
      if (isLastCat) {
        mgmtData.currentIndex++;
        mgmtData.currentCatIndex = 0;
      } else {
        mgmtData.currentCatIndex++;
      }
      mgmtStep++;
      renderManagementStep();
    }
  }
}

async function handleResetScores() {
  const confirmed = window.confirm(
    'Isso vai zerar a classificação atual do Best of The Week no dashboard. Deseja continuar?',
  );

  if (!confirmed) return;

  const startButton = $('#start-voting-btn');
  const resetButton = $('#reset-scores-btn');

  setButtonBusy(startButton, true, 'Zerando...');
  setButtonBusy(resetButton, true, 'Zerando...');

  await resetAllScores();
  renderDashboard();

  setButtonBusy(startButton, false, 'Zerando...');
  setButtonBusy(resetButton, false, 'Zerando...');
}

function startVotingSystem() {
  sessionResults = {};
  currentCategoryIndex = 0;
  botwStep = 'SPEAKING';
  bestWinnerId = null;
  worstWinnerId = null;

  prepareQueueForCategory(currentCategoryIndex);
  $('#voting-modal').style.display = 'flex';
  renderVotingStep();
}

function prepareQueueForCategory(categoryIndex) {
  const category = CATEGORIES_ORDER[categoryIndex];
  const participants = getParticipantsData();

  const pool = participants.filter((participant) => {
    if (category.key === 'bestWeek') return true;
    return participant.objectives[category.key] && participant.objectives[category.key].trim() !== '';
  });

  pool.sort(() => Math.random() - 0.5);

  currentQueue = pool;
  currentParticipantIndex = 0;
}

function renderVotingStep() {
  if (currentParticipantIndex >= currentQueue.length) {
    const category = CATEGORIES_ORDER[currentCategoryIndex];

    if (category.key === 'bestWeek' && botwStep === 'SPEAKING') {
      renderBOTWSelection('BEST');
      return;
    }

    currentCategoryIndex += 1;
    if (currentCategoryIndex < CATEGORIES_ORDER.length) {
      prepareQueueForCategory(currentCategoryIndex);
      renderVotingStep();
      return;
    }

    showFinishScreen();
    return;
  }

  const category = CATEGORIES_ORDER[currentCategoryIndex];
  const participant = currentQueue[currentParticipantIndex];

  $('#modal-participant-content').style.display = 'block';
  $('#modal-selection-grid').style.display = 'none';
  $('#modal-celebration-screen').style.display = 'none';

  $('#modal-cat-title').textContent = category.title;
  $('#modal-cat-icon').textContent = category.icon;
  $('#modal-progress').textContent = `${currentParticipantIndex + 1} / ${currentQueue.length}`;
  $('#modal-avatar').textContent = getInitials(participant.name);
  $('#modal-name').textContent = participant.name;

  if (category.key === 'bestWeek') {
    $('#modal-objective-label').textContent = 'Momento da Fala:';
    $('#modal-objective-text').textContent = 'Diga seu MELHOR e PIOR fato da semana!';
    $('#modal-actions-voting').style.display = 'none';
    $('#modal-actions-speaker').style.display = 'flex';
  } else {
    $('#modal-objective-label').textContent = 'Objetivo da Semana:';
    $('#modal-objective-text').textContent = participant.objectives[category.key];
    $('#modal-actions-voting').style.display = 'flex';
    $('#modal-actions-speaker').style.display = 'none';
  }

  $('#modal-actions-finish').style.display = 'none';
}

function renderBOTWSelection(type, isFirstVoter = true) {
  botwStep = type === 'BEST' ? 'BEST_WINNER' : 'WORST_WINNER';

  if (isFirstVoter) {
    currentVoterIndex = 0;
    botwVotes = {};
    getParticipantsData().forEach((participant) => {
      botwVotes[participant.id] = 0;
    });
  }

  const currentVoter = getParticipantsData()[currentVoterIndex];

  $('#modal-participant-content').style.display = 'none';
  $('#modal-selection-grid').style.display = 'grid';
  $('#modal-actions-speaker').style.display = 'none';
  $('#modal-actions-voting').style.display = 'none';
  $('#modal-actions-finish').style.display = 'none';
  $('#modal-cat-title').textContent = type === 'BEST' ? 'Quem teve o MELHOR fato?' : 'Quem teve o PIOR fato?';
  $('#modal-cat-icon').textContent = type === 'BEST' ? '🥇' : '💀';
  $('#modal-progress').innerHTML = `<span>Votando: ${currentVoter.name}</span> (${currentVoterIndex + 1}/${getParticipantsData().length})`;

  const grid = $('#modal-selection-grid');
  grid.innerHTML = '';

  getParticipantsData().forEach((participant) => {
    const item = document.createElement('div');
    item.className = 'selection-item';
    item.innerHTML = `
      <div class="item-avatar">${getInitials(participant.name)}</div>
      <span>${participant.name.split(' ')[0]}</span>
    `;

    item.addEventListener('click', () => {
      botwVotes[participant.id] += 1;
      currentVoterIndex += 1;

      if (currentVoterIndex < getParticipantsData().length) {
        renderBOTWSelection(type, false);
        return;
      }

      const winnerId = Object.keys(botwVotes).reduce((bestId, candidateId) => (
        botwVotes[bestId] >= botwVotes[candidateId] ? bestId : candidateId
      ));
      const winner = getParticipantsData().find((candidate) => candidate.id === winnerId);

      if (!sessionResults[winnerId]) {
        sessionResults[winnerId] = {};
      }

      sessionResults[winnerId].bestWeek = (sessionResults[winnerId].bestWeek || 0) + (type === 'BEST' ? 1 : -1);

      if (type === 'BEST') {
        bestWinnerId = winnerId;
      } else {
        worstWinnerId = winnerId;
      }

      showCelebrationScreen(winner, type, () => {
        if (type === 'BEST') {
          renderBOTWSelection('WORST');
          return;
        }

        currentCategoryIndex += 1;
        prepareQueueForCategory(currentCategoryIndex);
        renderVotingStep();
      });
    });

    grid.appendChild(item);
  });
}

function showCelebrationScreen(participant, type, callback) {
  const screen = $('#modal-celebration-screen');
  const particlesContainer = $('#celebration-particles');
  const avatar = $('#celebration-avatar');
  const title = $('#celebration-title');
  const subtitle = $('#celebration-subtitle');

  particlesContainer.innerHTML = '';
  screen.style.display = 'flex';
  avatar.textContent = getInitials(participant.name);

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
  if (!audio) return;

  audio.currentTime = 0;
  audio.play().catch((error) => console.log('Audio play blocked or failed:', error));

  setTimeout(() => {
    audio.pause();
    audio.currentTime = 0;
  }, 3000);
}

function generateParticles(list, direction) {
  const container = $('#celebration-particles');
  const count = 40;

  for (let index = 0; index < count; index += 1) {
    const particle = document.createElement('div');
    particle.className = 'particle';
    particle.textContent = list[Math.floor(Math.random() * list.length)];
    particle.style.left = `${Math.random() * 100}%`;
    particle.style.animation = `${direction === 'fall' ? 'particle-fall' : 'particle-rise'} ${2 + Math.random() * 3}s linear infinite`;
    particle.style.animationDelay = `${Math.random() * 2}s`;
    particle.style.opacity = '0';
    container.appendChild(particle);
  }
}

function handleVote(points) {
  const participant = currentQueue[currentParticipantIndex];
  const category = CATEGORIES_ORDER[currentCategoryIndex];

  if (!sessionResults[participant.id]) {
    sessionResults[participant.id] = {};
  }

  sessionResults[participant.id][category.key] = points;
  currentParticipantIndex += 1;
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
  $('#modal-objective-label').textContent = 'Sincronização';
  $('#modal-objective-text').textContent = 'Clique em finalizar para aplicar os pontos no ranking.';
  $('#modal-actions-voting').style.display = 'none';
  $('#modal-actions-speaker').style.display = 'none';
  $('#modal-actions-finish').style.display = 'flex';
}

async function finishVotingSystem() {
  const finishButton = $('#btn-finish-voting');
  const modalCloseButton = $('#modal-close-btn');

  finishButton.disabled = true;
  finishButton.textContent = 'Salvando...';
  modalCloseButton.disabled = true;

  await persistVotingSession({
    sessionResults,
    bestWinnerId,
    worstWinnerId,
    voteDate: new Date().toISOString(),
  });

  $('#voting-modal').style.display = 'none';
  renderDashboard();

  finishButton.disabled = false;
  finishButton.textContent = 'Finalizar Votação';
  modalCloseButton.disabled = false;
}
