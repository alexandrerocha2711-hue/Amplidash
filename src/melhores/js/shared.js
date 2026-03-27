export const CATEGORY_DEFINITIONS = [
  { key: 'bestWeek', title: 'Best of The Week', icon: '🌟' },
  { key: 'exercicio', title: 'Exercício Físico', icon: '💪' },
  { key: 'familia', title: 'Família', icon: '👨‍👩‍👧‍👦' },
  { key: 'alimentacao', title: 'Alimentação', icon: '🥗' },
  { key: 'hobbies', title: 'Hobbies', icon: '🎨' },
  { key: 'conhecimentos', title: 'Conhecimentos', icon: '📚' },
];

export const PARTICIPANT_REGISTRY = [
  { id: 'luana', displayName: 'Luana', notionName: 'Luana', handle: '@luana', aliases: ['luana'] },
  { id: 'jf', displayName: 'JF', notionName: 'JF', handle: '@jf', aliases: ['jf'] },
  { id: 'gean', displayName: 'Gean', notionName: 'Gean', handle: '@gean', aliases: ['gean'] },
  { id: 'leonardo', displayName: 'Leonardo', notionName: 'Leo', handle: '@leonardo', aliases: ['leo', 'leonardo'] },
  { id: 'mayra', displayName: 'Mayra', notionName: 'Mayra', handle: '@mayra', aliases: ['mayra'] },
  { id: 'alexandre-costa', displayName: 'Alexandre Costa', notionName: 'Alexandre', handle: '@alexcsta', aliases: ['alexandre', 'alexandre costa'] },
  { id: 'andrei', displayName: 'Andrei', notionName: 'Andrei', handle: '@andrei', aliases: ['andrei'] },
  { id: 'emily', displayName: 'Emily', notionName: 'Emily', handle: '@emily', aliases: ['emily'] },
  { id: 'matheus', displayName: 'Matheus', notionName: 'Matheus', handle: '@matheus', aliases: ['matheus'] },
  { id: 'mavi', displayName: 'Mavi', notionName: 'Mavi', handle: '@mavi', aliases: ['mavi'] },
  { id: 'camila', displayName: 'Camila', notionName: 'Camila', handle: '@camila', aliases: ['camila'] },
  {
    id: 'alexandre-neto',
    displayName: 'Xandão (Alexandre Neto)',
    notionName: 'Alexandre Neto',
    handle: '@xandaoneto',
    aliases: ['alexandre neto', 'ale neto', 'xandao', 'xandao (alexandre neto)', 'xandão', 'xandão (alexandre neto)'],
  },
  { id: 'luan', displayName: 'Luan', notionName: 'Luan', handle: '@luan', aliases: ['luan'] },
  { id: 'vitor', displayName: 'Vitor', notionName: 'Vitor', handle: '@vitor', aliases: ['vitor'] },
  { id: 'nicole', displayName: 'Nicole', notionName: 'Nicole', handle: '@nicole', aliases: ['nicole'] },
  { id: 'bruno', displayName: 'Bruno', notionName: 'Bruno Zardo', handle: '@bruno', aliases: ['bruno', 'bruno zardo'] },
  { id: 'gabriel', displayName: 'Gabriel', notionName: 'Gabriel', handle: '@gabriel', aliases: ['gabriel', 'gabriel tolentino'] },
];

export const FALLBACK_PARTICIPANTS_DATA = [
  { id: 'luana', name: 'Luana', handle: '@luana', categories: { exercicio: 3, familia: 3, alimentacao: 0, hobbies: 3, conhecimentos: 3, bestWeek: 0 }, objectives: { exercicio: 'Exercício 3x na semana', familia: 'Mandar mensagem para família 1x por semana', alimentacao: 'Comer doce apenas 2 dias na semana', hobbies: '1 encontro com amigos ou família por semana', conhecimentos: '1 podcast ou leitura de notícias por semana' }, scoreBreakdown: { melhorFato: 0, piorFato: 0 } },
  { id: 'jf', name: 'JF', handle: '@jf', categories: { exercicio: 1, familia: 3, alimentacao: 0, hobbies: 3, conhecimentos: 2, bestWeek: 0 }, objectives: { exercicio: '3 exercícios por semana (corrida, academia ou futebol)', familia: 'Almoçar com a família 1x por semana', alimentacao: 'Não beber café após 12h', hobbies: 'Jogar futebol 1x por semana', conhecimentos: '3h de estudo por semana' }, scoreBreakdown: { melhorFato: 0, piorFato: 0 } },
  { id: 'gean', name: 'Gean', handle: '@gean', categories: { exercicio: 0, familia: 2, alimentacao: 0, hobbies: 2, conhecimentos: 3, bestWeek: 1 }, objectives: { exercicio: 'Exercício 3x por semana', familia: 'Ligar para meu irmão 1x por semana', alimentacao: 'Beber 2L de água por dia', hobbies: 'Jogar videogame 1x por semana', conhecimentos: 'Duolingo todos os dias' }, scoreBreakdown: { melhorFato: 1, piorFato: 0 } },
  { id: 'leonardo', name: 'Leonardo', handle: '@leonardo', categories: { exercicio: 0, familia: 2, alimentacao: 3, hobbies: 2, conhecimentos: 1, bestWeek: 0 }, objectives: { exercicio: '3 exercícios na semana', familia: 'Visitar ou falar com meu irmão 1x por semana', alimentacao: 'Apenas 1 iFood/lanche fora na semana', hobbies: 'Basquete 1x por semana (30 min)', conhecimentos: 'Leitura 3x por semana' }, scoreBreakdown: { melhorFato: 0, piorFato: 0 } },
  { id: 'mayra', name: 'Mayra', handle: '@mayra', categories: { exercicio: 0, familia: 3, alimentacao: 0, hobbies: 0, conhecimentos: 3, bestWeek: 2 }, objectives: { exercicio: 'Praticar atividade 3x na semana', familia: '1 almoço ou jantar com meus pais', alimentacao: 'Não comer hambúrguer de segunda a sexta', hobbies: 'Praticar ou conhecer algo novo', conhecimentos: 'Reassistir 2 aulas da pós' }, scoreBreakdown: { melhorFato: 2, piorFato: 0 } },
  { id: 'alexandre-costa', name: 'Alexandre Costa', handle: '@alexcsta', categories: { exercicio: 2, familia: 0, alimentacao: 2, hobbies: 1, conhecimentos: 2, bestWeek: 0 }, objectives: { exercicio: '1 check-in todo dia', familia: '1 encontro em família por semana', alimentacao: '200g carbo + 300g proteína por refeição', hobbies: 'Jogar videogame 1x por semana', conhecimentos: '50 páginas de leitura + 2 podcasts/aulas por semana' }, scoreBreakdown: { melhorFato: 0, piorFato: 0 } },
  { id: 'andrei', name: 'Andrei', handle: '@andrei', categories: { exercicio: 0, familia: 2, alimentacao: 2, hobbies: 2, conhecimentos: 1, bestWeek: 0 }, objectives: { exercicio: 'Academia 3 vezes na semana', familia: '1 jantar por semana com Bettina', alimentacao: 'Manter suplementação 5 dias por semana', hobbies: '1 hora por semana em paz', conhecimentos: 'Rever notas 2h por semana' }, scoreBreakdown: { melhorFato: 0, piorFato: 0 } },
  { id: 'emily', name: 'Emily', handle: '@emily', categories: { exercicio: 2, familia: 3, alimentacao: 1, hobbies: 0, conhecimentos: 0, bestWeek: 0 }, objectives: { exercicio: 'Academia 5x na semana', familia: 'Ligar para mãe e irmã 4x na semana', alimentacao: 'Seguir dieta 5x na semana', hobbies: 'Pintar ou desenhar 1x por semana', conhecimentos: 'Ler todos os dias' }, scoreBreakdown: { melhorFato: 0, piorFato: 0 } },
  { id: 'matheus', name: 'Matheus', handle: '@matheus', categories: { exercicio: 2, familia: 3, alimentacao: 0, hobbies: 1, conhecimentos: 0, bestWeek: 0 }, objectives: { exercicio: '5 corridas por semana', familia: '1 reunião semanal sobre casamento', alimentacao: 'Apenas 2 refeições fora da dieta', hobbies: '1 hora de séries por semana', conhecimentos: '1h de mandarim por semana' }, scoreBreakdown: { melhorFato: 0, piorFato: 0 } },
  { id: 'mavi', name: 'Mavi', handle: '@mavi', categories: { exercicio: 2, familia: 2, alimentacao: 1, hobbies: 0, conhecimentos: 1, bestWeek: 0 }, objectives: { exercicio: 'Exercício 4x na semana', familia: 'Ver meus pais 1x por semana', alimentacao: '1 refeição livre por semana', hobbies: 'Desenhar 3 peças de roupa por semana', conhecimentos: '1h de leitura por dia' }, scoreBreakdown: { melhorFato: 0, piorFato: 0 } },
  { id: 'camila', name: 'Camila', handle: '@camila', categories: { exercicio: 0, familia: 2, alimentacao: 0, hobbies: 2, conhecimentos: 2, bestWeek: -1 }, objectives: { exercicio: 'Ir de segunda à sábado para academia 6x', familia: 'Entrar em contato com a família 1x por semana', alimentacao: 'Fazer todas refeições do dia', hobbies: '1h por dia para ler livro', conhecimentos: 'Cursos online 1h30 por semana' }, scoreBreakdown: { melhorFato: 0, piorFato: -1 } },
  { id: 'alexandre-neto', name: 'Xandão (Alexandre Neto)', handle: '@xandaoneto', categories: { exercicio: 0, familia: 1, alimentacao: 1, hobbies: 1, conhecimentos: 1, bestWeek: 0 }, objectives: { exercicio: 'Academia 3x por semana', familia: 'Almoçar com minha mãe 3x por semana', alimentacao: 'Sem besteira durante a semana (5 dias)', hobbies: 'Praticar colorir 1x por semana', conhecimentos: 'Duolingo todos os dias' }, scoreBreakdown: { melhorFato: 0, piorFato: 0 } },
  { id: 'luan', name: 'Luan', handle: '@luan', categories: { exercicio: 0, familia: 2, alimentacao: 0, hobbies: 0, conhecimentos: 2, bestWeek: 0 }, objectives: { exercicio: 'Musculação 3x na semana', familia: 'Ligar para mãe, Karol e avós 1x por semana', alimentacao: '11 refeições saudáveis na semana', hobbies: 'Jogar padel ou futebol 1x por semana', conhecimentos: '3h leitura + Duolingo diário' }, scoreBreakdown: { melhorFato: 0, piorFato: 0 } },
  { id: 'vitor', name: 'Vitor', handle: '@vitor', categories: { exercicio: 0, familia: 3, alimentacao: 1, hobbies: 0, conhecimentos: 0, bestWeek: 0 }, objectives: { exercicio: 'Academia mínimo 2x por semana + esporte (padel)', familia: '1 jantar especial por semana + 1 almoço', alimentacao: 'Zerar refrigerante e reduzir besteiras', hobbies: 'Costurar 1x por semana', conhecimentos: 'Ler 10 páginas de livro de fantasia' }, scoreBreakdown: { melhorFato: 0, piorFato: 0 } },
  { id: 'nicole', name: 'Nicole', handle: '@nicole', categories: { exercicio: 0, familia: 2, alimentacao: 1, hobbies: -2, conhecimentos: 2, bestWeek: -1 }, objectives: { exercicio: 'Exercício físico todos os dias (corrida ou academia)', familia: 'Ligar para minhas irmãs 1x por semana', alimentacao: 'Seguir dieta com apenas 1 refeição livre', hobbies: null, conhecimentos: 'Ler 105 páginas de livro de autoconhecimento' }, scoreBreakdown: { melhorFato: 0, piorFato: -1 } },
  { id: 'bruno', name: 'Bruno', handle: '@bruno', categories: { exercicio: -2, familia: -2, alimentacao: -2, hobbies: -2, conhecimentos: -2, bestWeek: 0 }, objectives: { exercicio: null, familia: null, alimentacao: null, hobbies: null, conhecimentos: null }, scoreBreakdown: { melhorFato: 0, piorFato: 0 } },
  { id: 'gabriel', name: 'Gabriel', handle: '@gabriel', categories: { exercicio: -2, familia: -2, alimentacao: -2, hobbies: -2, conhecimentos: -2, bestWeek: -1 }, objectives: { exercicio: null, familia: null, alimentacao: null, hobbies: null, conhecimentos: null }, scoreBreakdown: { melhorFato: 0, piorFato: -1 } },
];

const PARTICIPANT_LOOKUP = new Map();

for (const participant of PARTICIPANT_REGISTRY) {
  PARTICIPANT_LOOKUP.set(normalizeLookup(participant.displayName), participant);
  PARTICIPANT_LOOKUP.set(normalizeLookup(participant.notionName), participant);

  for (const alias of participant.aliases) {
    PARTICIPANT_LOOKUP.set(normalizeLookup(alias), participant);
  }
}

export function normalizeLookup(value) {
  return (value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .trim()
    .toLowerCase();
}

export function cloneParticipants(participants) {
  return JSON.parse(JSON.stringify(participants));
}

export function createEmptyCategories() {
  return {
    exercicio: 0,
    familia: 0,
    alimentacao: 0,
    hobbies: 0,
    conhecimentos: 0,
    bestWeek: 0,
  };
}

export function createEmptyObjectives() {
  return {
    exercicio: null,
    familia: null,
    alimentacao: null,
    hobbies: null,
    conhecimentos: null,
  };
}

export function createEmptyScoreBreakdown() {
  return {
    melhorFato: 0,
    piorFato: 0,
  };
}

export function findParticipantDefinition(name) {
  if (!name) return null;

  const direct = PARTICIPANT_LOOKUP.get(normalizeLookup(name));
  if (direct) return direct;

  const normalized = normalizeLookup(name);

  for (const participant of PARTICIPANT_REGISTRY) {
    if (participant.aliases.some((alias) => normalized.startsWith(normalizeLookup(alias)))) {
      return participant;
    }
  }

  return null;
}

export function buildParticipantFromRegistry(participantId) {
  const definition = PARTICIPANT_REGISTRY.find((participant) => participant.id === participantId);

  if (!definition) return null;

  const fallback = FALLBACK_PARTICIPANTS_DATA.find((participant) => participant.id === participantId);

  return fallback
    ? cloneParticipants([fallback])[0]
    : {
        id: definition.id,
        name: definition.displayName,
        handle: definition.handle,
        categories: createEmptyCategories(),
        objectives: createEmptyObjectives(),
        scoreBreakdown: createEmptyScoreBreakdown(),
      };
}

export function getParticipantNameById(participantId) {
  const participant = PARTICIPANT_REGISTRY.find((item) => item.id === participantId);
  return participant ? participant.displayName : participantId;
}
