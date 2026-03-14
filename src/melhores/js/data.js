/**
 * data.js — Categorized Ranking Data Layer (/melhores)
 */

import { calculateTotalScores } from './utils.js';

export const PARTICIPANTS_DATA = [
    { name: 'Luana', handle: '@luana', categories: { exercicio: 3, familia: 3, alimentacao: 0, hobbies: 3, conhecimentos: 3, bestWeek: 0 }, objectives: { exercicio: 'Exercício 3x na semana', familia: 'Mandar mensagem para família 1x por semana', alimentacao: 'Comer doce apenas 2 dias na semana', hobbies: '1 encontro com amigos ou família por semana', conhecimentos: '1 podcast ou leitura de notícias por semana' } },
    { name: 'JF', handle: '@jf', categories: { exercicio: 1, familia: 3, alimentacao: 0, hobbies: 3, conhecimentos: 2, bestWeek: 0 }, objectives: { exercicio: '3 exercícios por semana (corrida, academia ou futebol)', familia: 'Almoçar com a família 1x por semana', alimentacao: 'Não beber café após 12h', hobbies: 'Jogar futebol 1x por semana', conhecimentos: '3h de estudo por semana' } },
    { name: 'Gean', handle: '@gean', categories: { exercicio: 0, familia: 2, alimentacao: 0, hobbies: 2, conhecimentos: 3, bestWeek: 1 }, objectives: { exercicio: 'Exercício 3x por semana', familia: 'Ligar para meu irmão 1x por semana', alimentacao: 'Beber 2L de água por dia', hobbies: 'Jogar videogame 1x por semana', conhecimentos: 'Duolingo todos os dias' } },
    { name: 'Leonardo', handle: '@leonardo', categories: { exercicio: 0, familia: 2, alimentacao: 3, hobbies: 2, conhecimentos: 1, bestWeek: 0 }, objectives: { exercicio: '3 exercícios na semana', familia: 'Visitar ou falar com meu irmão 1x por semana', alimentacao: 'Apenas 1 iFood/lanche fora na semana', hobbies: 'Basquete 1x por semana (30 min)', conhecimentos: 'Leitura 3x por semana' } },
    { name: 'Mayra', handle: '@mayra', categories: { exercicio: 0, familia: 3, alimentacao: 0, hobbies: 0, conhecimentos: 3, bestWeek: 2 }, objectives: { exercicio: 'Praticar atividade 3x na semana', familia: '1 almoço ou jantar com meus pais', alimentacao: 'Não comer hambúrguer de segunda a sexta', hobbies: 'Praticar ou conhecer algo novo', conhecimentos: 'Reassistir 2 aulas da pós' } },
    { name: 'Alexandre Costa', handle: '@alexcsta', categories: { exercicio: 2, familia: 0, alimentacao: 2, hobbies: 1, conhecimentos: 2, bestWeek: 0 }, objectives: { exercicio: '1 check-in todo dia', familia: '1 encontro em família por semana', alimentacao: '200g carbo + 300g proteína por refeição', hobbies: 'Jogar videogame 1x por semana', conhecimentos: '50 páginas de leitura + 2 podcasts/aulas por semana' } },
    { name: 'Andrei', handle: '@andrei', categories: { exercicio: 0, familia: 2, alimentacao: 2, hobbies: 2, conhecimentos: 1, bestWeek: 0 }, objectives: { exercicio: 'Academia 3 vezes na semana', familia: '1 jantar por semana com Bettina', alimentacao: 'Manter suplementação 5 dias por semana', hobbies: '1 hora por semana em paz', conhecimentos: 'Rever notas 2h por semana' } },
    { name: 'Emily', handle: '@emily', categories: { exercicio: 2, familia: 3, alimentacao: 1, hobbies: 0, conhecimentos: 0, bestWeek: 0 }, objectives: { exercicio: 'Academia 5x na semana', familia: 'Ligar para mãe e irmã 4x na semana', alimentacao: 'Seguir dieta 5x na semana', hobbies: 'Pintar ou desenhar 1x por semana', conhecimentos: 'Ler todos os dias' } },
    { name: 'Matheus', handle: '@matheus', categories: { exercicio: 2, familia: 3, alimentacao: 0, hobbies: 1, conhecimentos: 0, bestWeek: 0 }, objectives: { exercicio: '5 corridas por semana', familia: '1 reunião semanal sobre casamento', alimentacao: 'Apenas 2 refeições fora da dieta', hobbies: '1 hora de séries por semana', conhecimentos: '1h de mandarim por semana' } },
    { name: 'Mavi', handle: '@mavi', categories: { exercicio: 2, familia: 2, alimentacao: 1, hobbies: 0, conhecimentos: 1, bestWeek: 0 }, objectives: { exercicio: 'Exercício 4x na semana', familia: 'Ver meus pais 1x por semana', alimentacao: '1 refeição livre por semana', hobbies: 'Desenhar 3 peças de roupa por semana', conhecimentos: '1h de leitura por dia' } },
    { name: 'Camila', handle: '@camila', categories: { exercicio: 0, familia: 2, alimentacao: 0, hobbies: 2, conhecimentos: 2, bestWeek: -1 }, objectives: { exercicio: 'Ir de segunda à sábado para academia 6x', familia: 'Entrar em contato com a família 1x por semana', alimentacao: 'Fazer todas refeições do dia', hobbies: '1h por dia para ler livro', conhecimentos: 'Cursos online 1h30 por semana' } },
    { name: 'Xandão (Alexandre Neto)', handle: '@xandaoneto', categories: { exercicio: 0, familia: 1, alimentacao: 1, hobbies: 1, conhecimentos: 1, bestWeek: 0 }, objectives: { exercicio: 'Academia 3x por semana', familia: 'Almoçar com minha mãe 3x por semana', alimentacao: 'Sem besteira durante a semana (5 dias)', hobbies: 'Praticar colorir 1x por semana', conhecimentos: 'Duolingo todos os dias' } },
    { name: 'Luan', handle: '@luan', categories: { exercicio: 0, familia: 2, alimentacao: 0, hobbies: 0, conhecimentos: 2, bestWeek: 0 }, objectives: { exercicio: 'Musculação 3x na semana', familia: 'Ligar para mãe, Karol e avós 1x por semana', alimentacao: '11 refeições saudáveis na semana', hobbies: 'Jogar padel ou futebol 1x por semana', conhecimentos: '3h leitura + Duolingo diário' } },
    { name: 'Vitor', handle: '@vitor', categories: { exercicio: 0, familia: 3, alimentacao: 1, hobbies: 0, conhecimentos: 0, bestWeek: 0 }, objectives: { exercicio: 'Academia mínimo 2x por semana + esporte (padel)', familia: '1 jantar especial por semana + 1 almoço', alimentacao: 'Zerar refrigerante e reduzir besteiras', hobbies: 'Costurar 1x por semana', conhecimentos: 'Ler 10 páginas de livro de fantasia' } },
    { name: 'Nicole', handle: '@nicole', categories: { exercicio: 0, familia: 2, alimentacao: 1, hobbies: -2, conhecimentos: 2, bestWeek: -1 }, objectives: { exercicio: 'Exercício físico todos os dias (corrida ou academia)', familia: 'Ligar para minhas irmãs 1x por semana', alimentacao: 'Seguir dieta com apenas 1 refeição livre', hobbies: null, conhecimentos: 'Ler 105 páginas de livro de autoconhecimento' } },
    { name: 'Bruno', handle: '@bruno', categories: { exercicio: -2, familia: -2, alimentacao: -2, hobbies: -2, conhecimentos: -2, bestWeek: 0 }, objectives: { exercicio: null, familia: null, alimentacao: null, hobbies: null, conhecimentos: null } },
    { name: 'Gabriel', handle: '@gabriel', categories: { exercicio: -2, familia: -2, alimentacao: -2, hobbies: -2, conhecimentos: -2, bestWeek: -1 }, objectives: { exercicio: null, familia: null, alimentacao: null, hobbies: null, conhecimentos: null } },
];

/**
 * Persists the voting responses to the mock data list
 * responses: Object of formats { "Luana": { exercicio: 1, familia: -2 }, ... }
 */
export function applyVotingResults(responses) {
    PARTICIPANTS_DATA.forEach(p => {
        if (responses[p.name]) {
            Object.keys(responses[p.name]).forEach(cat => {
                p.categories[cat] += responses[p.name][cat];
            });
        }
    });
}

/**
 * Process the data: calculate totals and sort by category/total
 */
export function getCategorizedRankings() {
    const rawData = PARTICIPANTS_DATA;

    // Calculate total points for each person
    const withTotals = rawData.map(person => {
        return {
            ...person,
            totalPoints: calculateTotalScores(person.categories)
        };
    });

    // Helper to sort by a specific property
    const sortBy = (arr, prop) => [...arr].sort((a, b) => b[prop] - a[prop]);
    const sortByCategory = (arr, cat) => [...arr].sort((a, b) => b.categories[cat] - a.categories[cat]);

    return {
        // Top list per category
        exercicio: sortByCategory(withTotals, 'exercicio'),
        familia: sortByCategory(withTotals, 'familia'),
        alimentacao: sortByCategory(withTotals, 'alimentacao'),
        hobbies: sortByCategory(withTotals, 'hobbies'),
        conhecimentos: sortByCategory(withTotals, 'conhecimentos'),
        bestWeek: sortByCategory(withTotals, 'bestWeek'),
        
        // General total ranking
        geral: sortBy(withTotals, 'totalPoints')
    };
}
