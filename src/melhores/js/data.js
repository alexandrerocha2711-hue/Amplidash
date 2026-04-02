/**
 * data.js — Local-only state management (/melhores)
 */

import { calculateTotalScores } from './utils.js';
import { INITIAL_PARTICIPANTS_DATA, cloneParticipants } from './shared.js';

const STORAGE_KEY = 'amplify_melhores_v1';

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

function withTotals(participants) {
  return participants.map((participant) => ({
    ...participant,
    totalPoints: calculateTotalScores(participant.categories),
  }));
}

// Initial hydration: try storage, then fallback to INITIAL_PARTICIPANTS_DATA
let participantState = readStoredState();

if (!participantState) {
  participantState = cloneParticipants(INITIAL_PARTICIPANTS_DATA);
}

participantState = withTotals(participantState);

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

export async function loadParticipantsData() {
  // Always returns the current in-memory state
  return {
    participants: participantState,
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
    sourceInfo: getSourceInfo(),
  };
}

export function addParticipant({ name, handle, objectives }) {
  const id = name.toLowerCase().replace(/\s+/g, '-');
  const newParticipant = {
    id,
    name,
    handle: handle.startsWith('@') ? handle : `@${handle}`,
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
