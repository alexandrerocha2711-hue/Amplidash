/**
 * data.js — Local-only state management (/melhores)
 *
 * REGRA DE OURO: O localStorage é a fonte da verdade.
 * Quando o usuário já tem dados salvos, NENHUMA propriedade numérica
 * (categories, scoreBreakdown) nem textual (objectives) é sobrescrita.
 * Apenas metadados visuais (name, handle, photoUrl) são preenchidos
 * caso estejam ausentes, usando os valores padrão como fallback.
 *
 * A única maneira de zerar os dados é o botão "Zerar pontuação"
 * que chama resetAllScores().
 */

import { calculateTotalScores } from './utils.js';
import { INITIAL_PARTICIPANTS_DATA, cloneParticipants } from './shared.js';

const STORAGE_KEY = 'amplify_melhores_v1';
const WEEKLY_FACT_HISTORY_STORAGE_KEY = 'amplify_melhores_history_v1';
const REMOVED_PARTICIPANT_IDS = new Set(['vitor']);
const PARTICIPANT_DEFAULTS_BY_ID = new Map(
  INITIAL_PARTICIPANTS_DATA.map((participant) => [participant.id, participant]),
);

// ---------------------------------------------------------------------------
// LocalStorage helpers
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// Pure helpers (never mutate storage)
// ---------------------------------------------------------------------------

function withTotals(participants) {
  return participants.map((participant) => ({
    ...participant,
    totalPoints: calculateTotalScores(participant.categories),
  }));
}

/**
 * Garante que todo participante do INITIAL_PARTICIPANTS_DATA exista no array,
 * e preenche APENAS metadados visuais (name, handle, photoUrl) caso estejam
 * ausentes. Categorias, objetivos e scoreBreakdown NUNCA são tocados aqui.
 */
function normalizeParticipantMetadata(participants) {
  const existingIds = new Set(participants.map(p => p.id));

  // Adiciona participantes que existem nos padrões mas não estão no state salvo
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
        // Participante adicionado manualmente, sem defaults — manter tudo intacto
        return {
          ...participant,
          photoUrl: participant.photoUrl || null,
        };
      }

      // Preencher APENAS campos visuais ausentes — nunca sobrescrever dados do jogo
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
  const mergedEntriesById = new Map();

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

// ---------------------------------------------------------------------------
// Initial hydration — localStorage is the single source of truth
// ---------------------------------------------------------------------------

let participantState = readStoredState();

if (!participantState) {
  // Primeiro acesso: inicializa com os dados padrão
  participantState = cloneParticipants(INITIAL_PARTICIPANTS_DATA);
}

// Apenas preenche metadados visuais e adiciona participantes novos
participantState = normalizeParticipantMetadata(participantState);
participantState = withTotals(participantState);
writeStoredState(participantState);

// Fatos da semana — carrega do storage, nunca apaga automaticamente
let weeklyFactHistory = normalizeWeeklyFactHistory(readStoredWeeklyFactHistory() || []);

// ---------------------------------------------------------------------------
// Public API — leitura
// ---------------------------------------------------------------------------

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
  return {
    participants: participantState,
    weeklyFactHistory,
    sourceInfo: getSourceInfo(),
  };
}

// ---------------------------------------------------------------------------
// Public API — escrita (todas salvam no localStorage imediatamente)
// ---------------------------------------------------------------------------

/**
 * Persiste os resultados de uma sessão de votação.
 * Soma os pontos ao estado existente e salva.
 */
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

/**
 * Registra um fato semanal (melhor + pior) no histórico e salva.
 */
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

/**
 * Adiciona um novo participante e salva imediatamente.
 */
export function addParticipant({ name, handle, photoUrl, objectives }) {
  const id = name.toLowerCase().replace(/\s+/g, '-');
  const newParticipant = {
    id,
    name,
    handle: handle.startsWith('@') ? handle : `@${handle}`,
    photoUrl: photoUrl || null,
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

/**
 * Remove um participante e salva imediatamente.
 */
export function removeParticipant(id) {
  participantState = participantState.filter((p) => p.id !== id);
  writeStoredState(participantState);
  return participantState;
}

/**
 * Atualiza os objetivos de um participante e salva imediatamente.
 */
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

/**
 * ZERAR PONTUAÇÃO — a ÚNICA função que apaga dados do jogo.
 * Mantém os participantes (nome, handle, foto), mas zera tudo mais.
 */
export async function resetAllScores() {
  participantState = participantState.map(p => ({
    ...p,
    categories: {
      exercicio: 0,
      familia: 0,
      alimentacao: 0,
      hobbies: 0,
      conhecimentos: 0,
      bestWeek: 0,
    },
    objectives: {
      exercicio: '',
      familia: '',
      alimentacao: '',
      hobbies: '',
      conhecimentos: '',
    },
    scoreBreakdown: {
      melhorFato: 0,
      piorFato: 0,
    }
  }));

  participantState = withTotals(participantState);
  writeStoredState(participantState);

  weeklyFactHistory = [];
  writeStoredWeeklyFactHistory(weeklyFactHistory);

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

// ===========================================================================
// Snapshot / Save System
// ===========================================================================

const SNAPSHOTS_STORAGE_KEY = 'amplify_melhores_saves_v1';
const MAX_SNAPSHOTS = 50;

function readSnapshots() {
  if (!isStorageAvailable()) return [];
  try {
    const raw = window.localStorage.getItem(SNAPSHOTS_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function writeSnapshots(snapshots) {
  if (!isStorageAvailable()) return;
  try {
    window.localStorage.setItem(SNAPSHOTS_STORAGE_KEY, JSON.stringify(snapshots));
  } catch {}
}

/**
 * Creates a snapshot of the current game state.
 */
export function createSnapshot(description = 'Salvamento manual') {
  const snapshots = readSnapshots();

  const snapshot = {
    id: `save_${Date.now()}`,
    timestamp: new Date().toISOString(),
    description,
    participants: JSON.parse(JSON.stringify(participantState)),
    weeklyFactHistory: JSON.parse(JSON.stringify(weeklyFactHistory)),
  };

  snapshots.unshift(snapshot); // newest first

  // Limit to MAX_SNAPSHOTS
  if (snapshots.length > MAX_SNAPSHOTS) {
    snapshots.length = MAX_SNAPSHOTS;
  }

  writeSnapshots(snapshots);
  return snapshot;
}

/**
 * Returns all saved snapshots (newest first).
 */
export function getSnapshots() {
  return readSnapshots();
}

/**
 * Restores the game state from a snapshot.
 */
export function restoreSnapshot(snapshotId) {
  const snapshots = readSnapshots();
  const snapshot = snapshots.find((s) => s.id === snapshotId);
  if (!snapshot) return false;

  participantState = withTotals(snapshot.participants || []);
  weeklyFactHistory = snapshot.weeklyFactHistory || [];

  writeStoredState(participantState);
  writeStoredWeeklyFactHistory(weeklyFactHistory);

  return true;
}

/**
 * Deletes a snapshot by ID.
 */
export function deleteSnapshot(snapshotId) {
  const snapshots = readSnapshots();
  const filtered = snapshots.filter((s) => s.id !== snapshotId);
  writeSnapshots(filtered);
}
