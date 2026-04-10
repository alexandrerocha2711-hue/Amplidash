/**
 * data.js — Local-only state management (/melhores)
 */

import { calculateTotalScores } from './utils.js';
import { INITIAL_PARTICIPANTS_DATA, cloneParticipants } from './shared.js';

const STORAGE_KEY = 'amplify_melhores_v1';
const WEEKLY_FACT_HISTORY_STORAGE_KEY = 'amplify_melhores_history_v1';
const REMOVED_PARTICIPANT_IDS = new Set(['vitor']);
const PARTICIPANT_DEFAULTS_BY_ID = new Map(
  INITIAL_PARTICIPANTS_DATA.map((participant) => [participant.id, participant]),
);
const INITIAL_WEEKLY_FACT_HISTORY = [];

function isStorageAvailable() {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';
}

function readStoredState() {
  if (!isStorageAvailable()) return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (error) {
    console.error('Error reading local storage:', error);
    return null;
  }
}

function writeStoredState(state) {
  if (!isStorageAvailable()) return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (error) {
    console.error('Error writing local storage:', error);
  }
}

function readStoredWeeklyFactHistory() {
  if (!isStorageAvailable()) return null;
  try {
    const raw = window.localStorage.getItem(WEEKLY_FACT_HISTORY_STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (error) {
    console.error('Error reading weekly fact history from local storage:', error);
    return null;
  }
}

function writeStoredWeeklyFactHistory(entries) {
  if (!isStorageAvailable()) return;
  try {
    window.localStorage.setItem(WEEKLY_FACT_HISTORY_STORAGE_KEY, JSON.stringify(entries));
  } catch (error) {
    console.error('Error writing weekly fact history to local storage:', error);
  }
}

function withTotals(participants) {
  return participants.map((participant) => ({
    ...participant,
    totalPoints: calculateTotalScores(participant.categories),
  }));
}

function normalizeParticipantMetadata(participants) {
  const existingIds = new Set(participants.map(p => p.id));
  
  for (const [id, defaultData] of PARTICIPANT_DEFAULTS_BY_ID.entries()) {
    if (!existingIds.has(id) && !REMOVED_PARTICIPANT_IDS.has(id)) {
      participants.push(cloneParticipants([defaultData])[0]);
    }
  }

  return participants
    .filter((participant) => !REMOVED_PARTICIPANT_IDS.has(participant.id))
    .map((participant) => {
    const defaults = PARTICIPANT_DEFAULTS_BY_ID.get(participant.id);

    if (!defaults) {
      return {
        ...participant,
        photoUrl: participant.photoUrl || null,
      };
    }

    return {
      ...participant,
      name: participant.name || defaults.name,
      handle: participant.handle || defaults.handle,
      photoUrl: participant.photoUrl ?? defaults.photoUrl ?? null,
    };
    });
}

function normalizeFactDescription(value) {
  return String(value || '').trim();
}

function hasMeaningfulFactDescription(value) {
  const normalized = normalizeFactDescription(value);
  return normalized !== '' && normalized !== '.';
}

function normalizeWeeklyFactHistory(entries) {
  const mergedEntriesById = new Map(
    INITIAL_WEEKLY_FACT_HISTORY.map((entry) => [entry.id, cloneParticipants([entry])[0]]),
  );

  for (const entry of entries || []) {
    if (!entry?.id) continue;
    mergedEntriesById.set(entry.id, {
      ...entry,
      best: {
        participantId: entry.best?.participantId || null,
        label: entry.best?.label || '',
        description: normalizeFactDescription(entry.best?.description),
      },
      worst: {
        participantId: entry.worst?.participantId || null,
        label: entry.worst?.label || '',
        description: normalizeFactDescription(entry.worst?.description),
      },
    });
  }

  return [...mergedEntriesById.values()]
    .filter((entry) => (
      entry?.date
      && hasMeaningfulFactDescription(entry.best?.description)
      && hasMeaningfulFactDescription(entry.worst?.description)
    ))
    .sort((a, b) => a.date.localeCompare(b.date));
}

// Initial hydration: try storage, then fallback to INITIAL_PARTICIPANTS_DATA
let participantState = readStoredState();

if (!participantState) {
  participantState = cloneParticipants(INITIAL_PARTICIPANTS_DATA);
}

// HOTFIX: Force overwrite objectives for Bruno and Gabriel, and force sync categories/scoreBreakdown for all
participantState = participantState.map((participant) => {
  const defaults = PARTICIPANT_DEFAULTS_BY_ID.get(participant.id);
  if (defaults) {
    const isOverrideObjectives = participant.id === 'bruno' || participant.id === 'gabriel';
    return {
      ...participant,
      categories: { ...defaults.categories },
      scoreBreakdown: { ...defaults.scoreBreakdown },
      objectives: isOverrideObjectives ? { ...defaults.objectives } : participant.objectives
    };
  }
  return participant;
});

participantState = normalizeParticipantMetadata(participantState);
participantState = withTotals(participantState);
writeStoredState(participantState);

let weeklyFactHistory = normalizeWeeklyFactHistory(readStoredWeeklyFactHistory() || []);

// HOTFIX: Wipe localStorage weekly facts completely as requested
weeklyFactHistory = [];
writeStoredWeeklyFactHistory(weeklyFactHistory);

export function getParticipantsData() {
  return participantState;
}

export function getSourceInfo() {
  return {
    source: 'local',
    syncedAt: new Date().toISOString(),
    error: null,
  };
}

export function getWeeklyFactHistory() {
  return weeklyFactHistory;
}

export async function loadParticipantsData() {
  // Always returns the current in-memory state
  return {
    participants: participantState,
    weeklyFactHistory,
    sourceInfo: getSourceInfo(),
  };
}

export async function persistVotingSession({ sessionResults, bestWinnerId, worstWinnerId }) {
  participantState = participantState.map((participant) => {
    const result = sessionResults[participant.id] || {};
    const scoreBreakdown = { ...participant.scoreBreakdown };

    const categories = {
      ...participant.categories,
      exercicio: participant.categories.exercicio + Number(result.exercicio || 0),
      familia: participant.categories.familia + Number(result.familia || 0),
      alimentacao: participant.categories.alimentacao + Number(result.alimentacao || 0),
      hobbies: participant.categories.hobbies + Number(result.hobbies || 0),
      conhecimentos: participant.categories.conhecimentos + Number(result.conhecimentos || 0),
    };

    if (participant.id === bestWinnerId) {
      scoreBreakdown.melhorFato = (scoreBreakdown.melhorFato || 0) + 1;
    }

    if (participant.id === worstWinnerId) {
      scoreBreakdown.piorFato = (scoreBreakdown.piorFato || 0) - 1;
    }

    // bestWeek category is the sum of MF and PF
    categories.bestWeek = (scoreBreakdown.melhorFato || 0) + (scoreBreakdown.piorFato || 0);

    return {
      ...participant,
      categories,
      scoreBreakdown,
    };
  });

  participantState = withTotals(participantState);
  writeStoredState(participantState);

  return {
    participants: participantState,
    weeklyFactHistory,
    sourceInfo: getSourceInfo(),
  };
}

export function recordWeeklyFactHistory(entry) {
  const normalizedEntry = {
    id: entry.id || entry.date,
    date: entry.date,
    best: {
      participantId: entry.best?.participantId || null,
      label: entry.best?.label || '',
      description: normalizeFactDescription(entry.best?.description),
    },
    worst: {
      participantId: entry.worst?.participantId || null,
      label: entry.worst?.label || '',
      description: normalizeFactDescription(entry.worst?.description),
    },
  };

  weeklyFactHistory = normalizeWeeklyFactHistory([...weeklyFactHistory, normalizedEntry]);
  writeStoredWeeklyFactHistory(weeklyFactHistory);

  return weeklyFactHistory;
}

export function addParticipant({ name, handle, objectives }) {
  const id = name.toLowerCase().replace(/\s+/g, '-');
  const newParticipant = {
    id,
    name,
    handle: handle.startsWith('@') ? handle : `@${handle}`,
    photoUrl: null,
    categories: {
      exercicio: 0,
      familia: 0,
      alimentacao: 0,
      hobbies: 0,
      conhecimentos: 0,
      bestWeek: 0,
    },
    objectives: {
      exercicio: objectives.exercicio || '',
      familia: objectives.familia || '',
      alimentacao: objectives.alimentacao || '',
      hobbies: objectives.hobbies || '',
      conhecimentos: objectives.conhecimentos || '',
    },
    scoreBreakdown: {
      melhorFato: 0,
      piorFato: 0,
    },
  };

  participantState.push(withTotals([newParticipant])[0]);
  writeStoredState(participantState);
  return participantState;
}

export function updateParticipantObjectives(id, objectives) {
  participantState = participantState.map((p) => {
    if (p.id !== id) return p;
    return {
      ...p,
      objectives: {
        ...p.objectives,
        ...objectives,
      },
    };
  });
  writeStoredState(participantState);
  return participantState;
}

export async function resetAllScores() {
  participantState = INITIAL_PARTICIPANTS_DATA.map(p => ({
    ...cloneParticipants([p])[0],
    categories: { ...p.categories },
    scoreBreakdown: { ...p.scoreBreakdown }
  }));

  participantState = withTotals(participantState);
  writeStoredState(participantState);

  return {
    participants: participantState,
    weeklyFactHistory,
    sourceInfo: getSourceInfo(),
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
