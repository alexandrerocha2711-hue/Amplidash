/**
 * data.js — Categorized Ranking Data Layer (/melhores)
 */

import { calculateTotalScores } from './utils.js';

const PARTICIPANTS_DATA = [
    { name: 'Luana', handle: '@luana', categories: { exercicio: 3, familia: 3, alimentacao: 0, hobbies: 3, conhecimentos: 3, bestWeek: 0 } },
    { name: 'JF', handle: '@jf', categories: { exercicio: 1, familia: 3, alimentacao: 0, hobbies: 3, conhecimentos: 2, bestWeek: 0 } },
    { name: 'Gean', handle: '@gean', categories: { exercicio: 0, familia: 2, alimentacao: 0, hobbies: 2, conhecimentos: 3, bestWeek: 1 } },
    { name: 'Leonardo', handle: '@leonardo', categories: { exercicio: 0, familia: 2, alimentacao: 3, hobbies: 2, conhecimentos: 1, bestWeek: 0 } },
    { name: 'Mayra', handle: '@mayra', categories: { exercicio: 0, familia: 3, alimentacao: 0, hobbies: 0, conhecimentos: 3, bestWeek: 2 } },
    { name: 'Alexandre Costa', handle: '@alexcsta', categories: { exercicio: 2, familia: 0, alimentacao: 2, hobbies: 1, conhecimentos: 2, bestWeek: 0 } },
    { name: 'Andrei', handle: '@andrei', categories: { exercicio: 0, familia: 2, alimentacao: 2, hobbies: 2, conhecimentos: 1, bestWeek: 0 } },
    { name: 'Emily', handle: '@emily', categories: { exercicio: 2, familia: 3, alimentacao: 1, hobbies: 0, conhecimentos: 0, bestWeek: 0 } },
    { name: 'Matheus', handle: '@matheus', categories: { exercicio: 2, familia: 3, alimentacao: 0, hobbies: 1, conhecimentos: 0, bestWeek: 0 } },
    { name: 'Mavi', handle: '@mavi', categories: { exercicio: 2, familia: 2, alimentacao: 1, hobbies: 0, conhecimentos: 1, bestWeek: 0 } },
    { name: 'Camila', handle: '@camila', categories: { exercicio: 0, familia: 2, alimentacao: 0, hobbies: 2, conhecimentos: 2, bestWeek: -1 } },
    { name: 'Xandão (Alexandre Neto)', handle: '@xandaoneto', categories: { exercicio: 0, familia: 1, alimentacao: 1, hobbies: 1, conhecimentos: 1, bestWeek: 0 } },
    { name: 'Luan', handle: '@luan', categories: { exercicio: 0, familia: 2, alimentacao: 0, hobbies: 0, conhecimentos: 2, bestWeek: 0 } },
    { name: 'Vitor', handle: '@vitor', categories: { exercicio: 0, familia: 3, alimentacao: 1, hobbies: 0, conhecimentos: 0, bestWeek: 0 } },
    { name: 'Nicole', handle: '@nicole', categories: { exercicio: 0, familia: 2, alimentacao: 1, hobbies: -2, conhecimentos: 2, bestWeek: -1 } },
    { name: 'Bruno', handle: '@bruno', categories: { exercicio: -2, familia: -2, alimentacao: -2, hobbies: -2, conhecimentos: -2, bestWeek: 0 } },
    { name: 'Gabriel', handle: '@gabriel', categories: { exercicio: -2, familia: -2, alimentacao: -2, hobbies: -2, conhecimentos: -2, bestWeek: -1 } },
];

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
