import { calculateTotalScores } from '../src/melhores/js/utils.js';
import {
  PARTICIPANT_REGISTRY,
  CATEGORY_DEFINITIONS,
  buildParticipantFromRegistry,
  createEmptyObjectives,
  createEmptyScoreBreakdown,
  findParticipantDefinition,
  normalizeLookup,
  cloneParticipants,
} from '../src/melhores/js/shared.js';
import { retrievePageMarkdown, updatePageMarkdownContent } from './notion-client.js';

const SCORE_CATEGORY_KEYS = ['exercicio', 'familia', 'alimentacao', 'hobbies', 'conhecimentos'];
const CATEGORY_SECTION_MATCHERS = [
  { key: 'exercicio', matcher: 'exercicio fisico' },
  { key: 'familia', matcher: 'familia' },
  { key: 'alimentacao', matcher: 'alimentacao' },
  { key: 'hobbies', matcher: 'hobbies' },
  { key: 'conhecimentos', matcher: 'conhecimento' },
];

function cleanPlainText(value) {
  return (value || '')
    .replace(/<br\s*\/?>/gi, ' ')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\*\*/g, '')
    .replace(/\\/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function parseSignedNumber(value) {
  const match = cleanPlainText(value).match(/-?\d+/);
  return match ? parseInt(match[0], 10) : 0;
}

function formatDateForNotion(input = new Date()) {
  const value = input instanceof Date ? input : new Date(input);

  if (Number.isNaN(value.getTime())) {
    return new Date().toLocaleDateString('pt-BR');
  }

  return value.toLocaleDateString('pt-BR');
}

function renderCell(value, { color = null } = {}) {
  const attrs = color ? ` color="${color}"` : '';
  return `<td${attrs}>${value ?? ''}</td>`;
}

function stringifyTable(rows, { attrs = '' } = {}) {
  return [
    `<table${attrs}>`,
    ...rows.map((row) => `<tr>${row.join('')}</tr>`),
    '</table>',
  ].join('\n');
}

function extractTables(markdown) {
  return [...markdown.matchAll(/<table(?:\s[^>]*)?>[\s\S]*?<\/table>/g)].map((match) => {
    const raw = match[0];
    const rows = [...raw.matchAll(/<tr(?:\s[^>]*)?>([\s\S]*?)<\/tr>/g)].map((rowMatch) => {
      const rowRaw = rowMatch[0];
      const cells = [...rowRaw.matchAll(/<td(?:\s[^>]*)?>([\s\S]*?)<\/td>/g)].map((cellMatch) => {
        const rawCell = cellMatch[1];
        return {
          raw: rawCell,
          plain: cleanPlainText(rawCell),
        };
      });

      return {
        raw: rowRaw,
        cells,
        plainCells: cells.map((cell) => cell.plain),
      };
    });

    return {
      raw,
      rows,
    };
  });
}

function isClassificationTable(table) {
  return table.rows.some((row) => {
    const normalizedCells = row.plainCells.map((cell) => normalizeLookup(cell));
    return (
      normalizedCells.includes('nome') &&
      normalizedCells.some((cell) => cell.includes('resultado final'))
    );
  });
}

function isRankingSummaryTable(table) {
  return table.rows.some((row) => {
    const normalizedCells = row.plainCells.map((cell) => normalizeLookup(cell));
    return (
      normalizedCells.includes('posicao') &&
      normalizedCells.includes('nome') &&
      normalizedCells.includes('pontos')
    );
  });
}

function isWinnerHistoryTable(table) {
  return table.rows.some((row) => {
    const normalizedCells = row.plainCells.map((cell) => normalizeLookup(cell));
    return (
      normalizedCells.includes('data') &&
      normalizedCells.some((cell) => cell.includes('melhor')) &&
      normalizedCells.some((cell) => cell.includes('pior'))
    );
  });
}

function isObjectiveTable(table) {
  return table.rows.some((row) => {
    const firstCell = normalizeLookup(row.plainCells[0]);
    return CATEGORY_SECTION_MATCHERS.some((section) => firstCell.includes(section.matcher));
  });
}

function identifyRelevantTables(markdown) {
  const tables = extractTables(markdown);

  return {
    classificationTable: tables.find(isClassificationTable) || null,
    rankingSummaryTable: tables.find(isRankingSummaryTable) || null,
    winnerHistoryTable: tables.find(isWinnerHistoryTable) || null,
    objectiveTable: tables.find(isObjectiveTable) || null,
  };
}

function parseClassificationTable(table) {
  if (!table) {
    return {
      order: [],
      scoresByParticipantId: new Map(),
    };
  }

  const headerRowIndex = table.rows.findIndex((row) => isClassificationTable({ rows: [row] }));

  if (headerRowIndex === -1) {
    return {
      order: [],
      scoresByParticipantId: new Map(),
    };
  }

  const headerRow = table.rows[headerRowIndex];
  const headers = headerRow.plainCells.map((cell) => normalizeLookup(cell));
  const columnIndex = {
    name: headers.findIndex((cell) => cell === 'nome'),
    exercicio: headers.findIndex((cell) => cell.includes('exercicio')),
    familia: headers.findIndex((cell) => cell.includes('familia')),
    alimentacao: headers.findIndex((cell) => cell.includes('alimentacao')),
    hobbies: headers.findIndex((cell) => cell.includes('hobbies')),
    conhecimentos: headers.findIndex((cell) => cell.includes('conhecimento')),
    melhorFato: headers.findIndex((cell) => cell.includes('melhor fato')),
    piorFato: headers.findIndex((cell) => cell.includes('pior fato')),
  };

  const order = [];
  const scoresByParticipantId = new Map();

  for (let index = headerRowIndex + 1; index < table.rows.length; index += 1) {
    const row = table.rows[index];
    const name = row.plainCells[columnIndex.name];

    if (!name) continue;

    const participant = findParticipantDefinition(name);
    if (!participant) continue;

    const scoreBreakdown = {
      melhorFato: columnIndex.melhorFato >= 0 ? parseSignedNumber(row.plainCells[columnIndex.melhorFato]) : 0,
      piorFato: columnIndex.piorFato >= 0 ? parseSignedNumber(row.plainCells[columnIndex.piorFato]) : 0,
    };

    scoresByParticipantId.set(participant.id, {
      categories: {
        exercicio: columnIndex.exercicio >= 0 ? parseSignedNumber(row.plainCells[columnIndex.exercicio]) : 0,
        familia: columnIndex.familia >= 0 ? parseSignedNumber(row.plainCells[columnIndex.familia]) : 0,
        alimentacao: columnIndex.alimentacao >= 0 ? parseSignedNumber(row.plainCells[columnIndex.alimentacao]) : 0,
        hobbies: columnIndex.hobbies >= 0 ? parseSignedNumber(row.plainCells[columnIndex.hobbies]) : 0,
        conhecimentos: columnIndex.conhecimentos >= 0 ? parseSignedNumber(row.plainCells[columnIndex.conhecimentos]) : 0,
        bestWeek: scoreBreakdown.melhorFato + scoreBreakdown.piorFato,
      },
      scoreBreakdown,
    });
    order.push(participant.id);
  }

  return { order, scoresByParticipantId };
}

function parseObjectiveCell(cellText) {
  const cleaned = cleanPlainText(cellText);
  if (!cleaned) return null;

  const match = cleaned.match(/^(.*?)\s*[-–—]\s*(.*)$/);
  if (!match) {
    const participant = findParticipantDefinition(cleaned);
    if (!participant) return null;

    return {
      participantId: participant.id,
      objective: null,
    };
  }

  const participant = findParticipantDefinition(match[1]);
  if (!participant) return null;

  const objective = match[2].trim() || null;

  return {
    participantId: participant.id,
    objective,
  };
}

function parseObjectivesFromTable(table) {
  const objectivesByParticipantId = new Map();

  if (!table) {
    return objectivesByParticipantId;
  }

  for (let index = 0; index < table.rows.length; index += 1) {
    const row = table.rows[index];
    const firstCell = normalizeLookup(row.plainCells[0]);
    const section = CATEGORY_SECTION_MATCHERS.find((candidate) => firstCell.includes(candidate.matcher));

    if (!section) continue;

    const objectiveRow = table.rows[index + 1];
    if (!objectiveRow) continue;

    for (let cellIndex = 1; cellIndex < objectiveRow.plainCells.length; cellIndex += 1) {
      const parsed = parseObjectiveCell(objectiveRow.plainCells[cellIndex]);
      if (!parsed) continue;

      if (!objectivesByParticipantId.has(parsed.participantId)) {
        objectivesByParticipantId.set(parsed.participantId, createEmptyObjectives());
      }

      objectivesByParticipantId.get(parsed.participantId)[section.key] = parsed.objective;
    }
  }

  return objectivesByParticipantId;
}

function parseWinnerHistoryTable(table) {
  if (!table) return [];

  const headerRowIndex = table.rows.findIndex((row) => isWinnerHistoryTable({ rows: [row] }));
  if (headerRowIndex === -1) return [];

  const rows = [];

  for (let index = headerRowIndex + 1; index < table.rows.length; index += 1) {
    const row = table.rows[index];
    const date = row.plainCells[0];
    const best = row.plainCells[1];
    const worst = row.plainCells[2];

    if (!date && !best && !worst) continue;

    rows.push({
      date,
      best,
      worst,
    });
  }

  return rows;
}

function buildParticipantsFromParsedTables({ classification, objectives }) {
  const orderedIds = classification.order.length
    ? [...classification.order]
    : PARTICIPANT_REGISTRY.map((participant) => participant.id);

  const seen = new Set(orderedIds);
  for (const participant of PARTICIPANT_REGISTRY) {
    if (!seen.has(participant.id)) {
      orderedIds.push(participant.id);
    }
  }

  return orderedIds
    .map((participantId) => {
      const participant = buildParticipantFromRegistry(participantId);
      if (!participant) return null;

      const scoreState = classification.scoresByParticipantId.get(participantId);
      if (scoreState) {
        participant.categories = {
          ...participant.categories,
          ...scoreState.categories,
        };
        participant.scoreBreakdown = {
          ...participant.scoreBreakdown,
          ...scoreState.scoreBreakdown,
        };
      } else {
        participant.scoreBreakdown = createEmptyScoreBreakdown();
      }

      const objectiveState = objectives.get(participantId);
      if (objectiveState) {
        participant.objectives = {
          ...participant.objectives,
          ...objectiveState,
        };
      }

      participant.totalPoints = calculateTotalScores(participant.categories);
      return participant;
    })
    .filter(Boolean);
}

function sortParticipantsForRanking(participants) {
  return cloneParticipants(participants).sort((left, right) => {
    if (right.totalPoints !== left.totalPoints) {
      return right.totalPoints - left.totalPoints;
    }

    return left.name.localeCompare(right.name, 'pt-BR');
  });
}

function buildClassificationTable(participants, orderIds) {
  const safeOrder = orderIds && orderIds.length
    ? orderIds
    : participants.map((participant) => participant.id);

  const orderedParticipants = safeOrder
    .map((participantId) => participants.find((participant) => participant.id === participantId))
    .filter(Boolean);

  const rows = [
    [
      renderCell('**Classificação 🏆**', { color: 'blue_bg' }),
      renderCell('', { color: 'blue_bg' }),
      renderCell('', { color: 'blue_bg' }),
      renderCell('', { color: 'blue_bg' }),
      renderCell('', { color: 'blue_bg' }),
      renderCell('', { color: 'blue_bg' }),
      renderCell('', { color: 'blue_bg' }),
      renderCell('', { color: 'blue_bg' }),
      renderCell('', { color: 'blue_bg' }),
    ],
    [
      renderCell('**Nome**', { color: 'blue_bg' }),
      renderCell('**Exercício Físico**'),
      renderCell('**Família**'),
      renderCell('**Alimentação**'),
      renderCell('**Hobbies**'),
      renderCell('**Conhecimento**'),
      renderCell('**Melhor Fato**'),
      renderCell('**Pior Fato**'),
      renderCell('**Resultado Final**'),
    ],
  ];

  for (const participant of orderedParticipants) {
    const notionParticipant = PARTICIPANT_REGISTRY.find((item) => item.id === participant.id);
    rows.push([
      renderCell(notionParticipant?.notionName || participant.name, { color: 'blue_bg' }),
      renderCell(String(participant.categories.exercicio || 0)),
      renderCell(String(participant.categories.familia || 0)),
      renderCell(String(participant.categories.alimentacao || 0)),
      renderCell(String(participant.categories.hobbies || 0)),
      renderCell(String(participant.categories.conhecimentos || 0)),
      renderCell(String(participant.scoreBreakdown?.melhorFato || 0)),
      renderCell(String(participant.scoreBreakdown?.piorFato || 0)),
      renderCell(String(calculateTotalScores(participant.categories))),
    ]);
  }

  return stringifyTable(rows);
}

function buildRankingSummaryTable(participants) {
  const rankedParticipants = sortParticipantsForRanking(participants);
  const totalsFrequency = new Map();

  for (const participant of rankedParticipants) {
    totalsFrequency.set(participant.totalPoints, (totalsFrequency.get(participant.totalPoints) || 0) + 1);
  }

  let currentRank = 0;
  let previousScore = null;

  const rows = [[
    renderCell('Posição', { color: 'gray_bg' }),
    renderCell('Nome', { color: 'gray_bg' }),
    renderCell('Pontos', { color: 'gray_bg' }),
  ]];

  rankedParticipants.forEach((participant, index) => {
    if (participant.totalPoints !== previousScore) {
      currentRank = index + 1;
      previousScore = participant.totalPoints;
    }

    const hasTie = (totalsFrequency.get(participant.totalPoints) || 0) > 1;
    const positionLabel = `${currentRank}º${hasTie ? ' (empate)' : ''}`;
    const notionParticipant = PARTICIPANT_REGISTRY.find((item) => item.id === participant.id);

    rows.push([
      renderCell(positionLabel),
      renderCell(notionParticipant?.notionName || participant.name),
      renderCell(String(participant.totalPoints)),
    ]);
  });

  return stringifyTable(rows, { attrs: ' fit-page-width="true" header-row="true"' });
}

function buildWinnerHistoryTable(historyRows) {
  const rows = [
    [
      renderCell('**Data**'),
      renderCell('**Melhor | Nome**'),
      renderCell('**Pior | Nome**'),
    ],
  ];

  for (const row of historyRows) {
    rows.push([
      renderCell(row.date || ''),
      renderCell(row.best || ''),
      renderCell(row.worst || ''),
    ]);
  }

  return stringifyTable(rows);
}

function appendWinnerHistoryRow(historyRows, bestWinnerId, worstWinnerId, voteDate) {
  const bestParticipant = PARTICIPANT_REGISTRY.find((participant) => participant.id === bestWinnerId);
  const worstParticipant = PARTICIPANT_REGISTRY.find((participant) => participant.id === worstWinnerId);

  if (!bestParticipant && !worstParticipant) {
    return historyRows;
  }

  return [
    ...historyRows,
    {
      date: formatDateForNotion(voteDate),
      best: bestParticipant ? bestParticipant.notionName : '',
      worst: worstParticipant ? worstParticipant.notionName : '',
    },
  ];
}

function applySessionToParticipants(participants, sessionResults, bestWinnerId, worstWinnerId) {
  const nextParticipants = cloneParticipants(participants);
  const participantsById = new Map(nextParticipants.map((participant) => [participant.id, participant]));

  for (const [participantKey, scores] of Object.entries(sessionResults || {})) {
    const participant = participantsById.get(participantKey);
    if (!participant) continue;

    for (const categoryKey of SCORE_CATEGORY_KEYS) {
      participant.categories[categoryKey] += Number(scores[categoryKey] || 0);
    }
  }

  if (bestWinnerId && participantsById.has(bestWinnerId)) {
    const participant = participantsById.get(bestWinnerId);
    participant.scoreBreakdown.melhorFato += 1;
  }

  if (worstWinnerId && participantsById.has(worstWinnerId)) {
    const participant = participantsById.get(worstWinnerId);
    participant.scoreBreakdown.piorFato -= 1;
  }

  for (const participant of nextParticipants) {
    participant.categories.bestWeek =
      Number(participant.scoreBreakdown.melhorFato || 0) +
      Number(participant.scoreBreakdown.piorFato || 0);
    participant.totalPoints = calculateTotalScores(participant.categories);
  }

  return nextParticipants;
}

function resetParticipantScores(participants) {
  return cloneParticipants(participants).map((participant) => {
    for (const categoryKey of SCORE_CATEGORY_KEYS) {
      participant.categories[categoryKey] = 0;
    }

    participant.scoreBreakdown.melhorFato = 0;
    participant.scoreBreakdown.piorFato = 0;
    participant.categories.bestWeek = 0;
    participant.totalPoints = 0;
    return participant;
  });
}

function parseMarkdownState(markdown) {
  const tables = identifyRelevantTables(markdown);
  const classification = parseClassificationTable(tables.classificationTable);
  const objectives = parseObjectivesFromTable(tables.objectiveTable);
  const winnerHistoryRows = parseWinnerHistoryTable(tables.winnerHistoryTable);
  const participants = buildParticipantsFromParsedTables({ classification, objectives });

  return {
    markdown,
    participants,
    winnerHistoryRows,
    classificationOrder: classification.order,
    tables,
  };
}

function buildStateResponse(parsed) {
  return {
    source: 'notion',
    syncedAt: new Date().toISOString(),
    participants: parsed.participants,
  };
}

export async function loadMelhoresStateFromNotion() {
  const pageMarkdown = await retrievePageMarkdown();
  const parsed = parseMarkdownState(pageMarkdown.markdown);
  return buildStateResponse(parsed);
}

export async function applyVotingSessionToNotion({
  sessionResults = {},
  bestWinnerId = null,
  worstWinnerId = null,
  voteDate = null,
}) {
  const pageMarkdown = await retrievePageMarkdown();
  const parsed = parseMarkdownState(pageMarkdown.markdown);
  const updatedParticipants = applySessionToParticipants(
    parsed.participants,
    sessionResults,
    bestWinnerId,
    worstWinnerId,
  );

  const contentUpdates = [];

  if (parsed.tables.classificationTable) {
    contentUpdates.push({
      old_str: parsed.tables.classificationTable.raw,
      new_str: buildClassificationTable(updatedParticipants, parsed.classificationOrder),
    });
  }

  if (parsed.tables.rankingSummaryTable) {
    contentUpdates.push({
      old_str: parsed.tables.rankingSummaryTable.raw,
      new_str: buildRankingSummaryTable(updatedParticipants),
    });
  }

  if (parsed.tables.winnerHistoryTable && (bestWinnerId || worstWinnerId)) {
    contentUpdates.push({
      old_str: parsed.tables.winnerHistoryTable.raw,
      new_str: buildWinnerHistoryTable(
        appendWinnerHistoryRow(parsed.winnerHistoryRows, bestWinnerId, worstWinnerId, voteDate),
      ),
    });
  }

  if (contentUpdates.length > 0) {
    await updatePageMarkdownContent(contentUpdates);
  }

  return {
    ...buildStateResponse({
      participants: updatedParticipants,
    }),
    updatedTables: contentUpdates.length,
  };
}

export async function resetMelhoresScoresOnNotion() {
  const pageMarkdown = await retrievePageMarkdown();
  const parsed = parseMarkdownState(pageMarkdown.markdown);
  const resetParticipants = resetParticipantScores(parsed.participants);

  const contentUpdates = [];

  if (parsed.tables.classificationTable) {
    contentUpdates.push({
      old_str: parsed.tables.classificationTable.raw,
      new_str: buildClassificationTable(resetParticipants, parsed.classificationOrder),
    });
  }

  if (parsed.tables.rankingSummaryTable) {
    contentUpdates.push({
      old_str: parsed.tables.rankingSummaryTable.raw,
      new_str: buildRankingSummaryTable(resetParticipants),
    });
  }

  if (contentUpdates.length > 0) {
    await updatePageMarkdownContent(contentUpdates);
  }

  return {
    ...buildStateResponse({
      participants: resetParticipants,
    }),
    resetAt: new Date().toISOString(),
  };
}
