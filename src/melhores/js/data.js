/**
 * data.js — Notion-backed data layer (/melhores)
 */

import { calculateTotalScores } from './utils.js';
import { FALLBACK_PARTICIPANTS_DATA, cloneParticipants } from './shared.js';

const API_BASE = '/api/melhores';
const PENDING_ACTIONS_STORAGE_KEY = 'melhores_pending_actions';
const PENDING_STATE_STORAGE_KEY = 'melhores_pending_state';

let participantState = withTotals(cloneParticipants(FALLBACK_PARTICIPANTS_DATA));
let sourceInfo = {
  source: 'fallback',
  syncedAt: null,
  error: null,
};

function isStorageAvailable() {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';
}

function readStoredJson(key, fallbackValue) {
  if (!isStorageAvailable()) return fallbackValue;

  try {
    const raw = window.localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallbackValue;
  } catch (error) {
    return fallbackValue;
  }
}

function writeStoredJson(key, value) {
  if (!isStorageAvailable()) return;
  window.localStorage.setItem(key, JSON.stringify(value));
}

function removeStoredValue(key) {
  if (!isStorageAvailable()) return;
  window.localStorage.removeItem(key);
}

function readPendingActions() {
  const actions = readStoredJson(PENDING_ACTIONS_STORAGE_KEY, []);
  return Array.isArray(actions) ? actions : [];
}

function writePendingActions(actions) {
  if (!actions.length) {
    removeStoredValue(PENDING_ACTIONS_STORAGE_KEY);
    return;
  }

  writeStoredJson(PENDING_ACTIONS_STORAGE_KEY, actions);
}

function savePendingSnapshot(errorMessage) {
  writeStoredJson(PENDING_STATE_STORAGE_KEY, {
    participants: participantState,
    sourceInfo: {
      source: 'pending',
      syncedAt: null,
      error: errorMessage,
    },
  });
}

function restorePendingSnapshot(errorMessage = null) {
  const snapshot = readStoredJson(PENDING_STATE_STORAGE_KEY, null);

  if (!snapshot?.participants) {
    return false;
  }

  participantState = withTotals(snapshot.participants);
  sourceInfo = {
    source: 'pending',
    syncedAt: snapshot?.sourceInfo?.syncedAt || null,
    error: errorMessage || snapshot?.sourceInfo?.error || 'Existem alterações pendentes para enviar ao Notion.',
  };

  return true;
}

function clearPendingPersistence() {
  removeStoredValue(PENDING_ACTIONS_STORAGE_KEY);
  removeStoredValue(PENDING_STATE_STORAGE_KEY);
}

function queuePendingAction(action, errorMessage) {
  const actions = readPendingActions();
  actions.push(action);
  writePendingActions(actions);
  savePendingSnapshot(errorMessage);
}

function withTotals(participants) {
  return participants.map((participant) => ({
    ...participant,
    totalPoints: calculateTotalScores(participant.categories),
  }));
}

function hydrateParticipants(participants) {
  const fallbackById = new Map(FALLBACK_PARTICIPANTS_DATA.map((participant) => [participant.id, participant]));

  return withTotals(
    participants.map((participant) => {
      const fallback = fallbackById.get(participant.id);
      return {
        ...fallback,
        ...participant,
        categories: {
          ...(fallback?.categories || {}),
          ...(participant.categories || {}),
        },
        objectives: {
          ...(fallback?.objectives || {}),
          ...(participant.objectives || {}),
        },
        scoreBreakdown: {
          ...(fallback?.scoreBreakdown || {}),
          ...(participant.scoreBreakdown || {}),
        },
      };
    }),
  );
}

async function requestJson(path, options = {}) {
  const response = await fetch(`${API_BASE}${path}`, {
    method: options.method || 'GET',
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  let payload = {};

  try {
    payload = await response.json();
  } catch (error) {
    payload = {};
  }

  if (!response.ok || payload.ok === false) {
    throw new Error(payload.error || `Request failed with status ${response.status}`);
  }

  return payload;
}

async function flushPendingActions() {
  const actions = readPendingActions();

  if (!actions.length) {
    return null;
  }

  let lastPayload = null;
  let processedCount = 0;

  for (const action of actions) {
    try {
      if (action.type === 'apply') {
        lastPayload = await requestJson('/apply', {
          method: 'POST',
          body: action.payload || {},
        });
      } else if (action.type === 'reset') {
        lastPayload = await requestJson('/reset', {
          method: 'POST',
        });
      }

      processedCount += 1;
    } catch (error) {
      const remainingActions = actions.slice(processedCount);
      writePendingActions(remainingActions);
      throw error;
    }
  }

  clearPendingPersistence();
  return lastPayload;
}

function applyVotingLocally(sessionResults, bestWinnerId, worstWinnerId) {
  participantState = withTotals(
    participantState.map((participant) => {
      const result = sessionResults[participant.id] || {};
      const scoreBreakdown = {
        ...participant.scoreBreakdown,
      };

      const categories = {
        ...participant.categories,
        exercicio: participant.categories.exercicio + Number(result.exercicio || 0),
        familia: participant.categories.familia + Number(result.familia || 0),
        alimentacao: participant.categories.alimentacao + Number(result.alimentacao || 0),
        hobbies: participant.categories.hobbies + Number(result.hobbies || 0),
        conhecimentos: participant.categories.conhecimentos + Number(result.conhecimentos || 0),
        bestWeek: participant.categories.bestWeek,
      };

      if (participant.id === bestWinnerId) {
        scoreBreakdown.melhorFato = Number(scoreBreakdown.melhorFato || 0) + 1;
      }

      if (participant.id === worstWinnerId) {
        scoreBreakdown.piorFato = Number(scoreBreakdown.piorFato || 0) - 1;
      }

      categories.bestWeek = Number(scoreBreakdown.melhorFato || 0) + Number(scoreBreakdown.piorFato || 0);

      return {
        ...participant,
        categories,
        scoreBreakdown,
      };
    }),
  );
}

function resetScoresLocally() {
  participantState = withTotals(
    participantState.map((participant) => ({
      ...participant,
      categories: {
        exercicio: 0,
        familia: 0,
        alimentacao: 0,
        hobbies: 0,
        conhecimentos: 0,
        bestWeek: 0,
      },
      scoreBreakdown: {
        melhorFato: 0,
        piorFato: 0,
      },
    })),
  );
}

export function getParticipantsData() {
  return participantState;
}

export function getSourceInfo() {
  return sourceInfo;
}

export async function loadParticipantsData() {
  try {
    const pendingPayload = await flushPendingActions();
    const payload = pendingPayload || await requestJson('/state');
    participantState = hydrateParticipants(payload.participants || []);
    sourceInfo = {
      source: payload.source || 'notion',
      syncedAt: payload.syncedAt || new Date().toISOString(),
      error: null,
    };

    clearPendingPersistence();
  } catch (error) {
    if (restorePendingSnapshot(error.message)) {
      return {
        participants: participantState,
        sourceInfo,
      };
    }

    participantState = withTotals(cloneParticipants(FALLBACK_PARTICIPANTS_DATA));
    sourceInfo = {
      source: 'fallback',
      syncedAt: null,
      error: error.message,
    };
  }

  return {
    participants: participantState,
    sourceInfo,
  };
}

export async function persistVotingSession({ sessionResults, bestWinnerId, worstWinnerId, voteDate }) {
  try {
    const payload = await requestJson('/apply', {
      method: 'POST',
      body: {
        sessionResults,
        bestWinnerId,
        worstWinnerId,
        voteDate,
      },
    });

    participantState = hydrateParticipants(payload.participants || []);
    sourceInfo = {
      source: payload.source || 'notion',
      syncedAt: payload.syncedAt || new Date().toISOString(),
      error: null,
    };

    clearPendingPersistence();
  } catch (error) {
    applyVotingLocally(sessionResults, bestWinnerId, worstWinnerId);
    queuePendingAction(
      {
        type: 'apply',
        payload: {
          sessionResults,
          bestWinnerId,
          worstWinnerId,
          voteDate,
        },
      },
      error.message,
    );
    sourceInfo = {
      ...sourceInfo,
      source: 'pending',
      syncedAt: null,
      error: error.message,
    };
  }

  return {
    participants: participantState,
    sourceInfo,
  };
}

export async function resetAllScores() {
  try {
    const payload = await requestJson('/reset', {
      method: 'POST',
    });

    participantState = hydrateParticipants(payload.participants || []);
    sourceInfo = {
      source: payload.source || 'notion',
      syncedAt: payload.syncedAt || new Date().toISOString(),
      error: null,
    };

    clearPendingPersistence();
  } catch (error) {
    resetScoresLocally();
    queuePendingAction({ type: 'reset' }, error.message);
    sourceInfo = {
      ...sourceInfo,
      source: 'pending',
      syncedAt: null,
      error: error.message,
    };
  }

  return {
    participants: participantState,
    sourceInfo,
  };
}

/**
 * Process the data: calculate totals and sort by category/total
 */
export function getCategorizedRankings() {
  const withCurrentTotals = withTotals(participantState);

  const sortBy = (arr, prop) => [...arr].sort((a, b) => b[prop] - a[prop]);
  const sortByCategory = (arr, categoryKey) =>
    [...arr].sort((a, b) => b.categories[categoryKey] - a.categories[categoryKey]);

  return {
    exercicio: sortByCategory(withCurrentTotals, 'exercicio'),
    familia: sortByCategory(withCurrentTotals, 'familia'),
    alimentacao: sortByCategory(withCurrentTotals, 'alimentacao'),
    hobbies: sortByCategory(withCurrentTotals, 'hobbies'),
    conhecimentos: sortByCategory(withCurrentTotals, 'conhecimentos'),
    bestWeek: sortByCategory(withCurrentTotals, 'bestWeek'),
    geral: sortBy(withCurrentTotals, 'totalPoints'),
  };
}
