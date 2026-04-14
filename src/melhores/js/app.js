/**
 * app.js — Main application entry point (/melhores)
 */

import {
  addParticipant,
  createSnapshot,
  deleteSnapshot,
  getCategorizedRankings,
  getParticipantsData,
  getSnapshots,
  getSourceInfo,
  getWeeklyFactHistory,
  loadParticipantsData,
  persistVotingSession,
  recordWeeklyFactHistory,
  removeParticipant,
  restoreSnapshot,
  resetAllScores,
  updateParticipantObjectives,
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
let navigationHistory = [];

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

function escapeHtml(value = '') {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function getParticipantPhotoUrl(participant) {
  return participant?.photoUrl || participant?.avatarUrl || '';
}

function buildAvatarMarkup(participant, className, fallbackText = getInitials(participant?.name)) {
  const photoUrl = getParticipantPhotoUrl(participant);
  const classes = [className, photoUrl ? 'avatar-has-image' : ''].filter(Boolean).join(' ');

  if (photoUrl) {
    return `
      <div class="${classes}">
        <img
          class="avatar-image"
          src="${escapeHtml(photoUrl)}"
          alt="Foto de ${escapeHtml(participant?.name || 'participante')}"
          loading="lazy"
          referrerpolicy="no-referrer"
        />
      </div>
    `;
  }

  return `<div class="${classes}">${escapeHtml(fallbackText || '?')}</div>`;
}

function setAvatarContent(element, participant, fallbackText = getInitials(participant?.name)) {
  if (!element) return;

  const photoUrl = getParticipantPhotoUrl(participant);
  element.classList.toggle('avatar-has-image', Boolean(photoUrl));

  if (photoUrl) {
    element.innerHTML = `
      <img
        class="avatar-image"
        src="${escapeHtml(photoUrl)}"
        alt="Foto de ${escapeHtml(participant?.name || 'participante')}"
        loading="lazy"
        referrerpolicy="no-referrer"
      />
    `;
    return;
  }

  element.innerHTML = '';
  element.textContent = fallbackText || '?';
}

function cloneState(value) {
  return JSON.parse(JSON.stringify(value));
}

function buildParticipantsById() {
  return new Map(getParticipantsData().map((participant) => [participant.id, participant]));
}

function snapshotGameState() {
  return {
    currentCategoryIndex,
    currentParticipantIndex,
    currentQueueIds: currentQueue.map((participant) => participant.id),
    currentVoterIndex,
    sessionResults: cloneState(sessionResults),
    botwVotes: cloneState(botwVotes),
    botwStep,
    bestWinnerId,
    worstWinnerId,
  };
}

function restoreGameState(snapshot) {
  const participantsById = buildParticipantsById();

  currentCategoryIndex = snapshot.currentCategoryIndex;
  currentParticipantIndex = snapshot.currentParticipantIndex;
  currentQueue = snapshot.currentQueueIds
    .map((participantId) => participantsById.get(participantId))
    .filter(Boolean);
  currentVoterIndex = snapshot.currentVoterIndex;
  sessionResults = cloneState(snapshot.sessionResults);
  botwVotes = cloneState(snapshot.botwVotes);
  botwStep = snapshot.botwStep;
  bestWinnerId = snapshot.bestWinnerId;
  worstWinnerId = snapshot.worstWinnerId;
}

function pushGameStateSnapshot() {
  navigationHistory.push(snapshotGameState());
}

function setNavigationActions({ showBack = true, showSkip = true, skipLabel = 'Pular participante ausente' } = {}) {
  const nav = $('#modal-actions-nav');
  const backButton = $('#btn-back-step');
  const skipButton = $('#btn-skip-step');

  if (!nav || !backButton || !skipButton) return;

  const shouldShowBack = showBack && navigationHistory.length > 0;
  nav.style.display = shouldShowBack || showSkip ? 'flex' : 'none';
  backButton.style.display = shouldShowBack ? 'flex' : 'none';
  skipButton.style.display = showSkip ? 'flex' : 'none';
  skipButton.textContent = skipLabel;
}

function formatDateForDisplay(dateValue) {
  if (!dateValue) return '--';
  const [year, month, day] = String(dateValue).split('-');
  if (!year || !month || !day) return dateValue;
  return `${day}/${month}/${year}`;
}

function formatDateForInput(date = new Date()) {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const day = `${date.getDate()}`.padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function hasMeaningfulWeeklyFactDescription(value) {
  const normalized = String(value || '').trim();
  return normalized !== '' && normalized !== '.';
}

function buildHistoryFactMarkup(entrySide) {
  const participantsById = buildParticipantsById();
  const participant = entrySide?.participantId ? participantsById.get(entrySide.participantId) : null;
  const displayName = entrySide?.label || participant?.name || 'Sem registro';
  const description = entrySide?.description || 'Sem descrição registrada.';

  return `
    <div class="history-fact-entry">
      ${participant ? buildAvatarMarkup(participant, 'item-avatar') : '<div class="item-avatar">?</div>'}
      <div class="history-fact-copy">
        <div class="history-fact-name">${escapeHtml(displayName)}</div>
        <div class="history-fact-description">${escapeHtml(description)}</div>
      </div>
    </div>
  `;
}

function buildWinnerSummaryMarkup(participant) {
  if (!participant) return '<div class="weekly-history-summary-name">Participante não encontrado</div>';

  return `
    <div class="weekly-history-summary">
      ${buildAvatarMarkup(participant, 'item-avatar')}
      <div>
        <div class="weekly-history-summary-name">${escapeHtml(participant.name)}</div>
        <div class="weekly-history-summary-handle">${escapeHtml(participant.handle || '')}</div>
      </div>
    </div>
  `;
}

function renderWeeklyFactHistory(entries = getWeeklyFactHistory()) {
  const tbody = $('#weekly-facts-tbody');
  if (!tbody) return;

  if (!entries.length) {
    tbody.innerHTML = `
      <tr class="history-empty-row">
        <td colspan="3">Nenhum fato semanal registrado ainda.</td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = entries
    .map((entry) => `
      <tr>
        <td class="history-date-cell">${formatDateForDisplay(entry.date)}</td>
        <td class="history-fact-cell">${buildHistoryFactMarkup(entry.best)}</td>
        <td class="history-fact-cell">${buildHistoryFactMarkup(entry.worst)}</td>
      </tr>
    `)
    .join('');
}

function renderCurrentGameState() {
  if (currentCategoryIndex >= CATEGORIES_ORDER.length) {
    showFinishScreen();
    return;
  }

  if (botwStep === 'BEST_WINNER') {
    renderBOTWSelection('BEST', false);
    return;
  }

  if (botwStep === 'WORST_WINNER') {
    renderBOTWSelection('WORST', false);
    return;
  }

  if (botwStep === 'DESCRIPTION_CAPTURE') {
    showWeeklyFactCaptureStep();
    return;
  }

  renderVotingStep();
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
  renderWeeklyFactHistory();
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
          <div class="podium-clickable" onclick="window.showParticipantGoals('${escapeHtml(person.id)}')">
            ${buildAvatarMarkup(person, 'item-avatar')}
            <div class="item-info">
              <div class="item-name">${person.name}</div>
              <div class="item-handle">${person.handle}</div>
            </div>
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
            <div class="creator-cell creator-cell-clickable" onclick="window.showParticipantGoals('${escapeHtml(participant.id)}')">
              ${buildAvatarMarkup(participant, 'creator-avatar')}
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
  $('#btn-vote-neutral')?.addEventListener('click', () => handleVote(0));
  $('#btn-next-speaker')?.addEventListener('click', handleAdvanceSpeaker);
  $('#btn-finish-voting')?.addEventListener('click', finishVotingSystem);
  $('#btn-save-history')?.addEventListener('click', handleSaveWeeklyFactHistory);
  $('#btn-back-step')?.addEventListener('click', handleBackStep);
  $('#btn-skip-step')?.addEventListener('click', handleSkipStep);

  // Management Events
  $('#manage-dropdown #add-voter-btn')?.addEventListener('click', startAddParticipantFlow);
  $('#manage-dropdown #manage-participants-btn')?.addEventListener('click', startManageParticipantsFlow);
  $('#manage-dropdown #add-weekly-fact-btn')?.addEventListener('click', startAddWeeklyFactFlow);
  $('#manage-dropdown #new-cycle-btn')?.addEventListener('click', startNewCycleFlow);
  $('#manage-dropdown #toggle-goals-btn')?.addEventListener('click', toggleGoalsWindow);
  $('#management-close-btn')?.addEventListener('click', () => {
    $('#management-modal').style.display = 'none';
  });
  $('#management-btn-back')?.addEventListener('click', handleMgmtBack);
  $('#management-btn-next')?.addEventListener('click', handleMgmtNext);

  // Goals Modal Events
  $('#add-goals-btn')?.addEventListener('click', openGoalsModal);
  $('#goals-close-btn')?.addEventListener('click', () => {
    $('#goals-modal').style.display = 'none';
  });
  $('#goals-btn-back')?.addEventListener('click', handleGoalsBack);
  $('#goals-btn-next')?.addEventListener('click', handleGoalsNext);

  // Initialize goals countdown timer
  startGoalsCountdown();
}

// Management Flow State
let mgmtFlow = null; // 'ADD_PARTICIPANT' | 'ADD_WEEKLY_FACT' | 'NEW_CYCLE'
let mgmtStep = 0;
let mgmtData = {};
const MGMT_CATEGORIES = CATEGORY_DEFINITIONS.filter(c => c.key !== 'bestWeek');

function buildParticipantOptionsMarkup(selectedId = '') {
  const options = [...getParticipantsData()]
    .sort((left, right) => left.name.localeCompare(right.name, 'pt-BR'))
    .map((participant) => `
      <option value="${escapeHtml(participant.id)}" ${participant.id === selectedId ? 'selected' : ''}>
        ${escapeHtml(participant.name)}
      </option>
    `);

  return [
    '<option value="">Selecione um participante</option>',
    ...options,
  ].join('');
}

function setManagementModalVariant(variant = 'default') {
  const modal = $('#management-modal');
  if (!modal) return;

  modal.classList.toggle('management-modal--weekly-fact', variant === 'weekly-fact');
}

function startAddParticipantFlow() {
  mgmtFlow = 'ADD_PARTICIPANT';
  mgmtStep = 0;
  mgmtData = { name: '', handle: '', photoUrl: '', objectives: {} };
  
  $('#management-modal').style.display = 'flex';
  $('#management-title').textContent = 'Adicionar Participante';
  $('#management-icon').textContent = '👤';
  renderManagementStep();
}

function startManageParticipantsFlow() {
  mgmtFlow = 'MANAGE_PARTICIPANTS';
  mgmtStep = 0;
  mgmtData = {};

  $('#management-modal').style.display = 'flex';
  $('#management-title').textContent = 'Gerenciar Participantes';
  $('#management-icon').textContent = '🗑️';
  renderManagementStep();
}

export async function handleRemoveParticipant(id) {
  const confirmMsg = 'Tem certeza que deseja excluir permanentemente este participante? As pontuações dele(a) serão apagadas.';
  if (window.confirm(confirmMsg)) {
    const name = getParticipantsData().find(p => p.id === id)?.name || id;
    removeParticipant(id);
    createSnapshot(`Participante removido: ${name}`);
    renderManagementStep();
    renderDashboard();
  }
}
// Torna global para que o onclick= inline funcione
window.handleRemoveParticipant = handleRemoveParticipant;

function startAddWeeklyFactFlow() {
  mgmtFlow = 'ADD_WEEKLY_FACT';
  mgmtStep = 0;
  mgmtData = {
    date: formatDateForInput(),
    bestParticipantId: '',
    bestDescription: '',
    worstParticipantId: '',
    worstDescription: '',
  };

  $('#management-modal').style.display = 'flex';
  $('#management-title').textContent = 'Adicionar Melhor e Pior Fato';
  $('#management-icon').textContent = '📝';
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

  setManagementModalVariant(mgmtFlow === 'ADD_WEEKLY_FACT' ? 'weekly-fact' : 'default');
  btnBack.style.display = mgmtStep > 0 ? 'flex' : 'none';
  btnNext.style.display = mgmtFlow === 'MANAGE_PARTICIPANTS' ? 'none' : 'flex';
  btnNext.textContent = 'Próximo';

  if (mgmtFlow === 'MANAGE_PARTICIPANTS') {
    const participants = getParticipantsData().sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'));
    
    if (participants.length === 0) {
      content.innerHTML = '<p style="text-align: center; padding: 20px; opacity: 0.7;">Nenhum participante cadastrado.</p>';
      return;
    }

    content.innerHTML = `
      <div class="mgmt-participants-list" style="display: flex; flex-direction: column; gap: 8px; max-height: 400px; overflow-y: auto; padding-right: 8px;">
        ${participants.map((p) => `
          <div class="mgmt-participant-item" style="display: flex; justify-content: space-between; align-items: center; padding: 8px 12px; background: rgba(255,255,255,0.03); border-radius: 8px; border: 1px solid rgba(255,255,255,0.05);">
            <div style="display: flex; align-items: center; gap: 12px;">
              ${buildAvatarMarkup(p, 'item-avatar', getInitials(p.name))}
              <div style="display: flex; flex-direction: column;">
                <span style="font-weight: 500;">${escapeHtml(p.name)}</span>
                <span style="font-size: 0.8rem; opacity: 0.6;">${escapeHtml(p.handle)}</span>
              </div>
            </div>
            <button class="btn btn-danger-ghost btn-sm remove-participant-btn" onclick="window.handleRemoveParticipant('${escapeHtml(p.id)}')" style="padding: 6px 12px; font-size: 0.85rem; border-color: rgba(255,70,70,0.5); color: #ff5555;">Excluir</button>
          </div>
        `).join('')}
      </div>
    `;
    return;
  }

  if (mgmtFlow === 'ADD_WEEKLY_FACT') {
    btnNext.textContent = 'Salvar fatos';
    content.innerHTML = `
      <div class="mgmt-weekly-shell">
        <section class="mgmt-weekly-intro">
          <span class="mgmt-weekly-eyebrow">Histórico manual</span>
          <h4 class="mgmt-weekly-title">Registrar melhor e pior fato da semana</h4>
          <p class="mgmt-weekly-copy">
            Escolha os responsáveis e descreva os fatos para manter o histórico da home sempre atualizado.
          </p>
        </section>

        <div class="mgmt-weekly-grid">
          <aside class="mgmt-weekly-date-card">
            <span class="mgmt-weekly-date-label">Semana de referência</span>
            <div class="mgmt-form-group">
              <label for="mgmt-weekly-date">Data</label>
              <input type="date" id="mgmt-weekly-date" class="mgmt-input" value="${escapeHtml(mgmtData.date || formatDateForInput())}">
            </div>
          </aside>

          <section class="weekly-history-card mgmt-weekly-card">
            <div class="weekly-history-card-header mgmt-weekly-card-header">
              <div>
                <span class="weekly-history-badge badge-best">Melhor fato</span>
                <h5 class="mgmt-weekly-card-title">Quem viveu o melhor momento?</h5>
              </div>
              <p class="mgmt-weekly-card-copy">Selecione o responsável e registre o que aconteceu.</p>
            </div>
            <div class="mgmt-form-group">
              <label for="mgmt-best-participant">Responsável</label>
              <select id="mgmt-best-participant" class="mgmt-input">
                ${buildParticipantOptionsMarkup(mgmtData.bestParticipantId)}
              </select>
            </div>
            <div class="mgmt-form-group mgmt-form-group-last">
              <label for="mgmt-best-description">Descrição do fato</label>
              <textarea id="mgmt-best-description" class="mgmt-input mgmt-area mgmt-area-compact" placeholder="Ex: Participou de show">${escapeHtml(mgmtData.bestDescription || '')}</textarea>
            </div>
          </section>

          <section class="weekly-history-card mgmt-weekly-card">
            <div class="weekly-history-card-header mgmt-weekly-card-header">
              <div>
                <span class="weekly-history-badge badge-worst">Pior fato</span>
                <h5 class="mgmt-weekly-card-title">Quem passou pelo pior momento?</h5>
              </div>
              <p class="mgmt-weekly-card-copy">Selecione o responsável e descreva o fato com clareza.</p>
            </div>
            <div class="mgmt-form-group">
              <label for="mgmt-worst-participant">Responsável</label>
              <select id="mgmt-worst-participant" class="mgmt-input">
                ${buildParticipantOptionsMarkup(mgmtData.worstParticipantId)}
              </select>
            </div>
            <div class="mgmt-form-group mgmt-form-group-last">
              <label for="mgmt-worst-description">Descrição do fato</label>
              <textarea id="mgmt-worst-description" class="mgmt-input mgmt-area mgmt-area-compact" placeholder="Ex: Torceu o pé no futebol">${escapeHtml(mgmtData.worstDescription || '')}</textarea>
            </div>
          </section>
        </div>
      </div>
    `;
    return;
  }

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
        <div class="mgmt-form-group">
          <label>Foto (Link Direto ou Google Drive)</label>
          <input type="text" id="mgmt-photoUrl" class="mgmt-input" placeholder="Ex: https://drive.google.com/file/d/..." value="${mgmtData.photoUrl || ''}">
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
        ${buildAvatarMarkup(participant, 'modal-avatar modal-avatar-compact')}
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
  if (mgmtFlow === 'ADD_WEEKLY_FACT') {
    mgmtData.date = $('#mgmt-weekly-date')?.value || '';
    mgmtData.bestParticipantId = $('#mgmt-best-participant')?.value || '';
    mgmtData.bestDescription = $('#mgmt-best-description')?.value.trim() || '';
    mgmtData.worstParticipantId = $('#mgmt-worst-participant')?.value || '';
    mgmtData.worstDescription = $('#mgmt-worst-description')?.value.trim() || '';

    if (
      !mgmtData.date
      || !mgmtData.bestParticipantId
      || !hasMeaningfulWeeklyFactDescription(mgmtData.bestDescription)
      || !mgmtData.worstParticipantId
      || !hasMeaningfulWeeklyFactDescription(mgmtData.worstDescription)
    ) {
      window.alert('Preencha data, responsável e descrições válidas para o melhor e o pior fato. Apenas "." não é permitido.');
      return;
    }

    const bestParticipant = getParticipantsData().find((participant) => participant.id === mgmtData.bestParticipantId);
    const worstParticipant = getParticipantsData().find((participant) => participant.id === mgmtData.worstParticipantId);

    recordWeeklyFactHistory({
      id: mgmtData.date,
      date: mgmtData.date,
      best: {
        participantId: mgmtData.bestParticipantId,
        label: bestParticipant?.name || '',
        description: mgmtData.bestDescription,
      },
      worst: {
        participantId: mgmtData.worstParticipantId,
        label: worstParticipant?.name || '',
        description: mgmtData.worstDescription,
      },
    });

    createSnapshot('Fato da semana registrado');
    $('#management-modal').style.display = 'none';
    renderDashboard();
    return;
  }

  if (mgmtFlow === 'ADD_PARTICIPANT') {
    if (mgmtStep === 0) {
      mgmtData.name = $('#mgmt-name').value.trim();
      mgmtData.handle = $('#mgmt-handle').value.trim();
      
      let rawPhotoUrl = $('#mgmt-photoUrl')?.value.trim() || '';
      
      // Convert GDrive links to the thumbnail format that works (same as existing participants)
      const gDriveMatch = rawPhotoUrl.match(/drive\.google\.com\/(?:file\/d\/|open\?id=|uc\?.*id=)([a-zA-Z0-9_-]+)/);
      if (gDriveMatch && gDriveMatch[1]) {
        rawPhotoUrl = `https://drive.google.com/thumbnail?id=${gDriveMatch[1]}&sz=w1000`;
      }
      
      mgmtData.photoUrl = rawPhotoUrl;

      if (!mgmtData.name || !mgmtData.handle) return alert('Preencha os campos obrigatórios');
      mgmtStep++;
      renderManagementStep();
    } else if (mgmtStep <= MGMT_CATEGORIES.length) {
      const cat = MGMT_CATEGORIES[mgmtStep - 1];
      mgmtData.objectives[cat.key] = $('#mgmt-objective').value.trim();
      
      if (mgmtStep === MGMT_CATEGORIES.length) {
        addParticipant(mgmtData);
        createSnapshot(`Participante adicionado: ${mgmtData.name}`);
        $('#management-modal').style.display = 'none';
        refreshDashboard();
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
        updateParticipantObjectives(p.id, p.objectives);
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
  createSnapshot('Pontuação zerada');
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
  navigationHistory = [];
  if ($('#weekly-facts-date')) $('#weekly-facts-date').value = formatDateForInput();
  if ($('#weekly-best-description')) $('#weekly-best-description').value = '';
  if ($('#weekly-worst-description')) $('#weekly-worst-description').value = '';

  prepareQueueForCategory(currentCategoryIndex);
  $('#voting-modal').style.display = 'flex';
  renderVotingStep();
}

function prepareQueueForCategory(categoryIndex) {
  const category = CATEGORIES_ORDER[categoryIndex];
  const participants = getParticipantsData();

  const pool = participants.filter((participant) => {
    if (category.key === 'bestWeek') return true;
    const obj = participant.objectives?.[category.key];
    return obj && String(obj).trim() !== '';
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
  $('#modal-history-capture').style.display = 'none';
  $('#modal-celebration-screen').style.display = 'none';

  $('#modal-cat-title').textContent = category.title;
  $('#modal-cat-icon').textContent = category.icon;
  $('#modal-progress').textContent = `${currentParticipantIndex + 1} / ${currentQueue.length}`;
  setAvatarContent($('#modal-avatar'), participant);
  $('#modal-name').textContent = participant.name;

  if (category.key === 'bestWeek') {
    $('#modal-objective-label').textContent = 'Momento da Fala:';
    $('#modal-objective-text').textContent = 'Diga seu MELHOR e PIOR fato da semana!';
    $('#modal-actions-voting').style.display = 'none';
    $('#modal-actions-speaker').style.display = 'flex';
    setNavigationActions({ skipLabel: 'Pular participante ausente' });
  } else {
    $('#modal-objective-label').textContent = 'Objetivo da Semana:';
    $('#modal-objective-text').textContent = participant.objectives[category.key];
    $('#modal-actions-voting').style.display = 'flex';
    $('#modal-actions-speaker').style.display = 'none';
    setNavigationActions({ skipLabel: 'Pular participante ausente' });
  }

  $('#modal-actions-finish').style.display = 'none';
  $('#modal-actions-history').style.display = 'none';
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
  $('#modal-history-capture').style.display = 'none';
  $('#modal-actions-speaker').style.display = 'none';
  $('#modal-actions-voting').style.display = 'none';
  $('#modal-actions-finish').style.display = 'none';
  $('#modal-actions-history').style.display = 'none';
  $('#modal-cat-title').textContent = type === 'BEST' ? 'Quem teve o MELHOR fato?' : 'Quem teve o PIOR fato?';
  $('#modal-cat-icon').textContent = type === 'BEST' ? '🥇' : '💀';
  $('#modal-progress').innerHTML = `<span>Votando: ${currentVoter.name}</span> (${currentVoterIndex + 1}/${getParticipantsData().length})`;
  setNavigationActions({ skipLabel: 'Pular votante ausente' });

  const grid = $('#modal-selection-grid');
  grid.innerHTML = '';

  getParticipantsData().forEach((participant) => {
    const item = document.createElement('div');
    item.className = 'selection-item';
    item.innerHTML = `
      ${buildAvatarMarkup(participant, 'item-avatar')}
      <span class="selection-item-name">${participant.name}</span>
    `;

    item.addEventListener('click', () => castBOTWVote(participant.id, type));

    grid.appendChild(item);
  });
}

function finalizeBOTWSelection(type) {
  const totalVotes = Object.values(botwVotes).reduce((sum, value) => sum + Number(value || 0), 0);

  if (totalVotes <= 0) {
    if (type === 'BEST') {
      renderBOTWSelection('WORST');
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

  const winnerId = Object.keys(botwVotes).reduce((bestId, candidateId) => (
    botwVotes[bestId] >= botwVotes[candidateId] ? bestId : candidateId
  ));
  const winner = getParticipantsData().find((candidate) => candidate.id === winnerId);

  if (!winner) {
    renderCurrentGameState();
    return;
  }

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

    showWeeklyFactCaptureStep();
  });
}

function castBOTWVote(participantId, type, { shouldSnapshot = true } = {}) {
  if (shouldSnapshot) {
    pushGameStateSnapshot();
  }

  botwVotes[participantId] = (botwVotes[participantId] || 0) + 1;
  currentVoterIndex += 1;

  if (currentVoterIndex < getParticipantsData().length) {
    renderBOTWSelection(type, false);
    return;
  }

  finalizeBOTWSelection(type);
}

function showCelebrationScreen(participant, type, callback) {
  const screen = $('#modal-celebration-screen');
  const particlesContainer = $('#celebration-particles');
  const avatar = $('#celebration-avatar');
  const title = $('#celebration-title');
  const name = $('#celebration-name');
  const subtitle = $('#celebration-subtitle');

  particlesContainer.innerHTML = '';
  screen.style.display = 'flex';
  setAvatarContent(avatar, participant);
  name.textContent = participant.name;

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
  pushGameStateSnapshot();

  const participant = currentQueue[currentParticipantIndex];
  const category = CATEGORIES_ORDER[currentCategoryIndex];

  if (!sessionResults[participant.id]) {
    sessionResults[participant.id] = {};
  }

  sessionResults[participant.id][category.key] = points;
  currentParticipantIndex += 1;
  renderVotingStep();
}

function handleAdvanceSpeaker() {
  pushGameStateSnapshot();
  currentParticipantIndex += 1;
  renderVotingStep();
}

function handleBackStep() {
  const previousState = navigationHistory.pop();

  if (!previousState) return;

  restoreGameState(previousState);
  renderCurrentGameState();
}

function handleSkipStep() {
  if (currentCategoryIndex >= CATEGORIES_ORDER.length) return;

  if (botwStep === 'DESCRIPTION_CAPTURE') {
    return;
  }

  const botwType = botwStep === 'BEST_WINNER'
    ? 'BEST'
    : botwStep === 'WORST_WINNER'
      ? 'WORST'
      : null;

  if (botwType) {
    pushGameStateSnapshot();
    currentVoterIndex += 1;

    if (currentVoterIndex < getParticipantsData().length) {
      renderBOTWSelection(botwType, false);
      return;
    }

    finalizeBOTWSelection(botwType);
    return;
  }

  const category = CATEGORIES_ORDER[currentCategoryIndex];

  if (category.key === 'bestWeek') {
    pushGameStateSnapshot();
    currentParticipantIndex += 1;
    renderVotingStep();
    return;
  }

  handleVote(0);
}

function showWeeklyFactCaptureStep() {
  const bestWinner = getParticipantsData().find((participant) => participant.id === bestWinnerId);
  const worstWinner = getParticipantsData().find((participant) => participant.id === worstWinnerId);

  if (!bestWinner || !worstWinner) {
    currentCategoryIndex += 1;
    botwStep = 'SPEAKING';

    if (currentCategoryIndex < CATEGORIES_ORDER.length) {
      prepareQueueForCategory(currentCategoryIndex);
      renderVotingStep();
      return;
    }

    showFinishScreen();
    return;
  }

  botwStep = 'DESCRIPTION_CAPTURE';
  $('#modal-participant-content').style.display = 'none';
  $('#modal-selection-grid').style.display = 'none';
  $('#modal-history-capture').style.display = 'block';
  $('#modal-celebration-screen').style.display = 'none';
  $('#modal-cat-title').textContent = 'Registrar fatos da semana';
  $('#modal-cat-icon').textContent = '📝';
  $('#modal-progress').textContent = 'Salvar descrições do melhor e pior fato';
  $('#weekly-best-summary').innerHTML = buildWinnerSummaryMarkup(bestWinner);
  $('#weekly-worst-summary').innerHTML = buildWinnerSummaryMarkup(worstWinner);

  const dateInput = $('#weekly-facts-date');
  if (dateInput && !dateInput.value) {
    dateInput.value = formatDateForInput();
  }

  $('#modal-actions-voting').style.display = 'none';
  $('#modal-actions-speaker').style.display = 'none';
  $('#modal-actions-finish').style.display = 'none';
  $('#modal-actions-history').style.display = 'flex';
  setNavigationActions({ showBack: true, showSkip: false });
}

function showFinishScreen() {
  $('#modal-participant-content').style.display = 'block';
  $('#modal-selection-grid').style.display = 'none';
  $('#modal-history-capture').style.display = 'none';
  $('#modal-celebration-screen').style.display = 'none';
  $('#modal-cat-title').textContent = 'Votação Concluída!';
  $('#modal-cat-icon').textContent = '🏆';
  $('#modal-progress').textContent = '';
  setAvatarContent($('#modal-avatar'), null, '✅');
  $('#modal-name').textContent = 'Todos os objetivos revisados';
  $('#modal-objective-label').textContent = 'Sincronização';
  $('#modal-objective-text').textContent = 'Clique em finalizar para aplicar os pontos no ranking.';
  $('#modal-actions-voting').style.display = 'none';
  $('#modal-actions-speaker').style.display = 'none';
  $('#modal-actions-finish').style.display = 'flex';
  $('#modal-actions-history').style.display = 'none';
  setNavigationActions({ showBack: true, showSkip: false });
}

function handleSaveWeeklyFactHistory() {
  const date = $('#weekly-facts-date')?.value;
  const bestDescription = $('#weekly-best-description')?.value.trim();
  const worstDescription = $('#weekly-worst-description')?.value.trim();
  const bestWinner = getParticipantsData().find((participant) => participant.id === bestWinnerId);
  const worstWinner = getParticipantsData().find((participant) => participant.id === worstWinnerId);

  if (!date || !hasMeaningfulWeeklyFactDescription(bestDescription) || !hasMeaningfulWeeklyFactDescription(worstDescription)) {
    window.alert('Preencha a data e duas descrições válidas para salvar o histórico da semana. Apenas "." não é permitido.');
    return;
  }

  recordWeeklyFactHistory({
    id: date,
    date,
    best: {
      participantId: bestWinnerId,
      label: bestWinner?.name || '',
      description: bestDescription,
    },
    worst: {
      participantId: worstWinnerId,
      label: worstWinner?.name || '',
      description: worstDescription,
    },
  });

  if ($('#weekly-facts-date')) $('#weekly-facts-date').value = formatDateForInput();
  if ($('#weekly-best-description')) $('#weekly-best-description').value = '';
  if ($('#weekly-worst-description')) $('#weekly-worst-description').value = '';

  botwStep = 'SPEAKING';
  currentCategoryIndex += 1;
  renderWeeklyFactHistory();

  if (currentCategoryIndex < CATEGORIES_ORDER.length) {
    prepareQueueForCategory(currentCategoryIndex);
    renderVotingStep();
    return;
  }

  showFinishScreen();
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

  createSnapshot('Votação finalizada');

  $('#voting-modal').style.display = 'none';
  renderDashboard();

  finishButton.disabled = false;
  finishButton.textContent = 'Finalizar Votação';
  modalCloseButton.disabled = false;
}

// ===========================================================================
// Goals System — "Adicionar minhas metas"
// ===========================================================================

const GOALS_FORM_CATEGORIES = CATEGORY_DEFINITIONS.filter(c => c.key !== 'bestWeek');

// Deadline: 22/04/2026 às 23:59:59 no horário de Brasília (UTC-3)
const GOALS_DEADLINE = new Date('2026-04-23T02:59:59Z'); // 23:59:59 BRT = 02:59:59 UTC next day

let goalsStep = 0; // 0 = tutorial, 1 = form
let goalsSelectedParticipantId = '';
let goalsCountdownInterval = null;

function getGoalsTimeRemaining() {
  const now = new Date();
  const diff = GOALS_DEADLINE.getTime() - now.getTime();
  if (diff <= 0) return null;

  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((diff % (1000 * 60)) / 1000);

  return { days, hours, minutes, seconds, total: diff };
}

function isGoalsWindowActive() {
  return getGoalsTimeRemaining() !== null;
}

function formatCountdown(remaining) {
  if (!remaining) return 'Encerrado';
  const pad = (n) => String(n).padStart(2, '0');

  if (remaining.days > 0) {
    return `${remaining.days}d ${pad(remaining.hours)}h ${pad(remaining.minutes)}m`;
  }
  return `${pad(remaining.hours)}:${pad(remaining.minutes)}:${pad(remaining.seconds)}`;
}

function syncGoalsButtonState() {
  const btn = $('#add-goals-btn');
  const banner = $('#countdown-banner');
  const statusEl = $('#countdown-status');
  if (!btn) return;

  const remaining = getGoalsTimeRemaining();
  const active = remaining !== null;
  const pad = (n) => String(n).padStart(2, '0');

  btn.disabled = !active;

  if (banner) {
    banner.classList.toggle('countdown-active', active);
    banner.classList.toggle('countdown-expired', !active);
  }

  if (active) {
    const d = $('#cd-days');
    const h = $('#cd-hours');
    const m = $('#cd-mins');
    const s = $('#cd-secs');
    if (d) d.textContent = pad(remaining.days);
    if (h) h.textContent = pad(remaining.hours);
    if (m) m.textContent = pad(remaining.minutes);
    if (s) s.textContent = pad(remaining.seconds);
    if (statusEl) statusEl.textContent = 'Aberto — encerra em 22/04 às 23:59';
  } else {
    const d = $('#cd-days');
    const h = $('#cd-hours');
    const m = $('#cd-mins');
    const s = $('#cd-secs');
    if (d) d.textContent = '00';
    if (h) h.textContent = '00';
    if (m) m.textContent = '00';
    if (s) s.textContent = '00';
    if (statusEl) statusEl.textContent = 'Encerrado — prazo expirado';
  }

  // Auto-close modal if deadline passed
  if (!active && $('#goals-modal')?.style.display === 'flex') {
    $('#goals-modal').style.display = 'none';
    window.alert('O prazo para adicionar metas foi encerrado!');
  }
}

function startGoalsCountdown() {
  syncGoalsButtonState();
  if (goalsCountdownInterval) clearInterval(goalsCountdownInterval);
  goalsCountdownInterval = setInterval(syncGoalsButtonState, 1000);
}

function toggleGoalsWindow() {
  // Informational only now — deadline-based
  const active = isGoalsWindowActive();
  if (active) {
    const remaining = getGoalsTimeRemaining();
    window.alert(`A janela de metas está ABERTA!\n\nTempo restante: ${formatCountdown(remaining)}\n\nEncerra automaticamente em 22/04 às 23:59.`);
  } else {
    window.alert('A janela de metas está ENCERRADA.\n\nO prazo era até 22/04 às 23:59.');
  }
}

function openGoalsModal() {
  if (!isGoalsWindowActive()) return;
  goalsStep = 0;
  goalsSelectedParticipantId = '';
  $('#goals-modal').style.display = 'flex';
  renderGoalsStep();
}

function renderGoalsStep() {
  const content = $('#goals-modal-content');
  const btnBack = $('#goals-btn-back');
  const btnNext = $('#goals-btn-next');

  if (goalsStep === 0) {
    // Tutorial
    btnBack.style.display = 'none';
    btnNext.textContent = 'Começar a registrar minhas metas';
    $('#goals-modal-icon').textContent = '📋';
    $('#goals-modal-title').textContent = 'Como registrar suas metas';

    content.innerHTML = `
      <div class="goals-tutorial">
        <div class="goals-tutorial-step">
          <div class="goals-tutorial-num">1</div>
          <div class="goals-tutorial-text">
            <strong>Selecione o seu nome</strong> na lista de participantes para que suas metas fiquem vinculadas a você.
            <span class="goals-tutorial-example">Caso não ache seu perfil, volte à tela inicial e peça para ser adicionado como participante.</span>
          </div>
        </div>

        <div class="goals-tutorial-step">
          <div class="goals-tutorial-num">2</div>
          <div class="goals-tutorial-text">
            <strong>Seja específico</strong> na sua meta. Quanto mais claro, melhor para ser avaliado.
            <span class="goals-tutorial-example">✅ Exercício: Fazer 5 treinos de musculação e/ou corrida na semana</span>
          </div>
        </div>

        <div class="goals-tutorial-step">
          <div class="goals-tutorial-num">3</div>
          <div class="goals-tutorial-text">
            <strong>Preencha todas as categorias.</strong> Se deixar alguma sem meta, ela vai contabilizar <strong>–2 pontos</strong> na soma da semana.
          </div>
        </div>

        <div class="goals-tutorial-step">
          <div class="goals-tutorial-num">4</div>
          <div class="goals-tutorial-text">
            As metas precisam ser <strong>claras, mensuráveis e semanais.</strong>
            <span class="goals-tutorial-example goals-tutorial-bad">❌ Saúde: Começar na academia (não dá pra "começar" toda semana)</span>
          </div>
        </div>

        <div class="goals-tutorial-step">
          <div class="goals-tutorial-num">5</div>
          <div class="goals-tutorial-text">
            As metas devem ser <strong>desafiadoras.</strong> Se já faz parte da sua rotina, não é uma meta.
          </div>
        </div>

        <div class="goals-tutorial-warn">
          ⚠️ Você pode editar suas metas enquanto a janela estiver aberta.
        </div>
      </div>
    `;
  } else if (goalsStep === 1) {
    // Form
    btnBack.style.display = 'flex';
    btnNext.textContent = 'Salvar metas';
    $('#goals-modal-icon').textContent = '🎯';
    $('#goals-modal-title').textContent = 'Registrar minhas metas';

    const participants = [...getParticipantsData()].sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'));
    const selectedParticipant = participants.find(p => p.id === goalsSelectedParticipantId);

    let headerHtml = '';
    if (selectedParticipant) {
      headerHtml = `
        <div class="goals-form-header">
          ${buildAvatarMarkup(selectedParticipant, 'item-avatar', getInitials(selectedParticipant.name))}
          <div class="goals-form-header-info">
            <span class="goals-form-header-name">${escapeHtml(selectedParticipant.name)}</span>
            <span class="goals-form-header-handle">${escapeHtml(selectedParticipant.handle)}</span>
          </div>
        </div>
      `;
    }

    const categoriesHtml = GOALS_FORM_CATEGORIES.map(cat => {
      const currentValue = selectedParticipant?.objectives?.[cat.key] || '';
      return `
        <div class="goals-category-group">
          <div class="goals-category-label">
            <span class="goals-category-label-icon">${cat.icon}</span>
            ${cat.title}
          </div>
          <textarea
            class="goals-category-input"
            id="goals-cat-${cat.key}"
            placeholder="Ex: Meta semanal para ${cat.title}..."
            ${!selectedParticipant ? 'disabled' : ''}
          >${escapeHtml(currentValue)}</textarea>
        </div>
      `;
    }).join('');

    content.innerHTML = `
      <div class="mgmt-form-group">
        <label for="goals-participant-select">Selecione seu nome</label>
        <select id="goals-participant-select" class="mgmt-input">
          <option value="">Selecione um participante</option>
          ${participants.map(p => `
            <option value="${escapeHtml(p.id)}" ${p.id === goalsSelectedParticipantId ? 'selected' : ''}>
              ${escapeHtml(p.name)}
            </option>
          `).join('')}
        </select>
      </div>
      ${headerHtml}
      ${selectedParticipant ? categoriesHtml : '<p style="text-align: center; opacity: 0.5; padding: 16px 0;">Selecione um participante acima para preencher as metas.</p>'}
    `;

    // Bind participant select change
    $('#goals-participant-select')?.addEventListener('change', (e) => {
      goalsSelectedParticipantId = e.target.value;
      renderGoalsStep();
    });
  }
}

function handleGoalsBack() {
  if (goalsStep > 0) {
    goalsStep--;
    renderGoalsStep();
  }
}

function handleGoalsNext() {
  if (goalsStep === 0) {
    // Advance from tutorial to form
    goalsStep = 1;
    renderGoalsStep();
    return;
  }

  // Save goals
  if (!goalsSelectedParticipantId) {
    window.alert('Selecione seu nome na lista de participantes antes de salvar.');
    return;
  }

  const objectives = {};
  let hasEmpty = false;
  for (const cat of GOALS_FORM_CATEGORIES) {
    const value = $(`#goals-cat-${cat.key}`)?.value.trim() || '';
    objectives[cat.key] = value;
    if (!value) hasEmpty = true;
  }

  if (hasEmpty) {
    const proceed = window.confirm(
      'Atenção! Você deixou uma ou mais categorias sem meta.\n\nCategorias sem meta contabilizam –2 pontos por semana.\n\nDeseja salvar mesmo assim?'
    );
    if (!proceed) return;
  }

  updateParticipantObjectives(goalsSelectedParticipantId, objectives);
  const pName = getParticipantsData().find(p => p.id === goalsSelectedParticipantId)?.name || '';
  createSnapshot(`Metas atualizadas: ${pName}`);
  $('#goals-modal').style.display = 'none';
  renderDashboard();
  window.alert('Suas metas foram salvas com sucesso! 🎯');
}

// ===========================================================================
// Participant Profile Popup — click on name/avatar to see goals
// ===========================================================================

const PROFILE_CATEGORIES = CATEGORY_DEFINITIONS.filter(c => c.key !== 'bestWeek');

function showParticipantGoals(participantId) {
  const participant = getParticipantsData().find(p => p.id === participantId);
  if (!participant) return;

  // Remove existing popup if any
  const existing = $('#participant-profile-popup');
  if (existing) existing.remove();

  const goalsHtml = PROFILE_CATEGORIES.map(cat => {
    const value = participant.objectives?.[cat.key];
    const hasGoal = value && String(value).trim() !== '';
    return `
      <div class="profile-goal-item ${hasGoal ? '' : 'profile-goal-empty'}">
        <div class="profile-goal-header">
          <span class="profile-goal-icon">${cat.icon}</span>
          <span class="profile-goal-cat">${cat.title}</span>
          <span class="profile-goal-pts">${participant.categories[cat.key]} pts</span>
        </div>
        <div class="profile-goal-text">${hasGoal ? escapeHtml(value) : 'Nenhuma meta registrada'}</div>
      </div>
    `;
  }).join('');

  const bestWeekPts = participant.categories.bestWeek;
  const mf = participant.scoreBreakdown?.melhorFato || 0;
  const pf = participant.scoreBreakdown?.piorFato || 0;

  const popup = document.createElement('div');
  popup.id = 'participant-profile-popup';
  popup.className = 'modal-backdrop';
  popup.style.display = 'flex';
  popup.innerHTML = `
    <div class="modal-card profile-popup-card">
      <button class="modal-close-btn" id="profile-popup-close">×</button>

      <div class="profile-popup-header">
        ${buildAvatarMarkup(participant, 'profile-popup-avatar')}
        <div class="profile-popup-name">${escapeHtml(participant.name)}</div>
        <div class="profile-popup-handle">${escapeHtml(participant.handle)}</div>
        <div class="profile-popup-points">
          <span class="profile-popup-total">${participant.totalPoints} pts</span>
          <span class="profile-popup-badge">🌟 BW: ${bestWeekPts} · MF: ${mf} · PF: ${pf}</span>
        </div>
      </div>

      <div class="modal-body profile-popup-body">
        <div class="profile-popup-section-title">Metas registradas</div>
        <div class="profile-goals-list">
          ${goalsHtml}
        </div>
      </div>
    </div>
  `;

  document.body.appendChild(popup);

  popup.querySelector('#profile-popup-close').addEventListener('click', () => popup.remove());
  popup.addEventListener('click', (e) => {
    if (e.target === popup) popup.remove();
  });
}

window.showParticipantGoals = showParticipantGoals;

// ===========================================================================
// Saves / Snapshots Popup
// ===========================================================================

async function openSavesPopup() {
  // Remove existing if any
  const existing = $('#saves-popup');
  if (existing) existing.remove();

  // Show loading state
  const loading = document.createElement('div');
  loading.id = 'saves-popup';
  loading.className = 'modal-backdrop';
  loading.style.display = 'flex';
  loading.innerHTML = `
    <div class="modal-card saves-popup-card">
      <div class="modal-header">
        <span class="modal-category-icon">💾</span>
        <h3 class="modal-category-title">Carregando salvamentos...</h3>
      </div>
    </div>
  `;
  document.body.appendChild(loading);

  const snapshots = await getSnapshots();
  loading.remove();

  const listHtml = snapshots.length === 0
    ? '<p class="saves-empty">Nenhum salvamento encontrado.<br>Os saves são criados automaticamente quando algo muda no jogo.</p>'
    : snapshots.map(s => {
        const date = new Date(s.timestamp);
        const dateStr = date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
        const timeStr = date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
        const pCount = s.participants?.length || 0;

        return `
          <div class="save-item">
            <div class="save-item-left">
              <div class="save-item-icon">💾</div>
              <div class="save-item-info">
                <div class="save-item-desc">${escapeHtml(s.description)}</div>
                <div class="save-item-meta">${dateStr} às ${timeStr} · ${pCount} participantes</div>
              </div>
            </div>
            <div class="save-item-actions">
              <button class="save-btn-restore" data-id="${s.id}" title="Restaurar este save">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"/></svg>
                Restaurar
              </button>
              <button class="save-btn-delete" data-id="${s.id}" title="Excluir save">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
              </button>
            </div>
          </div>
        `;
      }).join('');

  const popup = document.createElement('div');
  popup.id = 'saves-popup';
  popup.className = 'modal-backdrop';
  popup.style.display = 'flex';
  popup.innerHTML = `
    <div class="modal-card saves-popup-card">
      <button class="modal-close-btn" id="saves-popup-close">×</button>

      <div class="modal-header">
        <span class="modal-category-icon">💾</span>
        <h3 class="modal-category-title">Salvamentos</h3>
        <p style="font-size: 0.85rem; opacity: 0.6; margin-top: 2px;">${snapshots.length} save${snapshots.length !== 1 ? 's' : ''} encontrado${snapshots.length !== 1 ? 's' : ''}</p>
      </div>

      <div class="modal-body saves-popup-body">
        <button class="save-btn-manual" id="saves-btn-manual">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>
          Criar save manual agora
        </button>
        <div class="saves-list">
          ${listHtml}
        </div>
      </div>
    </div>
  `;

  document.body.appendChild(popup);

  // Close
  popup.querySelector('#saves-popup-close').addEventListener('click', () => popup.remove());
  popup.addEventListener('click', (e) => { if (e.target === popup) popup.remove(); });

  // Manual save
  popup.querySelector('#saves-btn-manual').addEventListener('click', async () => {
    createSnapshot('Salvamento manual');
    popup.remove();
    // Small delay so server has time to save
    setTimeout(() => openSavesPopup(), 600);
  });

  // Restore
  popup.querySelectorAll('.save-btn-restore').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      const id = e.currentTarget.dataset.id;
      const snapshot = snapshots.find(s => s.id === id);
      if (!snapshot) return;
      const confirmed = window.confirm(
        `Restaurar o save de "${snapshot.description}"?\n\nIsso vai substituir todos os dados atuais pelo estado desse salvamento.`
      );
      if (!confirmed) return;

      await restoreSnapshot(id);
      popup.remove();
      renderDashboard();
      window.alert('Save restaurado com sucesso! 🔄');
    });
  });

  // Delete
  popup.querySelectorAll('.save-btn-delete').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      const id = e.currentTarget.dataset.id;
      if (window.confirm('Excluir este salvamento?')) {
        await deleteSnapshot(id);
        popup.remove();
        openSavesPopup();
      }
    });
  });
}

window.openSavesPopup = openSavesPopup;
