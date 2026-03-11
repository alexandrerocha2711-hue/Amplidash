/**
 * charts.js — Chart.js chart configurations
 * Updated for Amplify Brand Identity (Blue/Red/White)
 */

import { formatNumber } from './utils.js';

let rankingChart = null;
let distributionChart = null;

// Chart.js global defaults for Amplify Blue Theme
Chart.defaults.color = 'rgba(255, 255, 255, 0.7)';
Chart.defaults.borderColor = 'rgba(255, 255, 255, 0.08)';
Chart.defaults.font.family = "'Work Sans', sans-serif";
Chart.defaults.font.size = 12;

/**
 * Create or update the horizontal bar ranking chart (Top 10)
 */
export function renderRankingChart(creators) {
    const ctx = document.getElementById('ranking-chart');
    if (!ctx) return;

    const top10 = creators.slice(0, 10);
    const labels = top10.map((c) => c.name);
    const data = top10.map((c) => c.totalPoints);

    // Amplify Colors: White to Light Blue gradients
    const colors = top10.map((_, i) => {
        const ratio = i / Math.max(top10.length - 1, 1);
        // Start with white (top) and transition to blue/transparent-white
        const opacity = 0.9 - (ratio * 0.4);
        return `rgba(255, 255, 255, ${opacity})`;
    });

    const hoverColors = top10.map(() => 'rgba(255, 255, 255, 1)');

    if (rankingChart) {
        rankingChart.data.labels = labels;
        rankingChart.data.datasets[0].data = data;
        rankingChart.data.datasets[0].backgroundColor = colors;
        rankingChart.data.datasets[0].hoverBackgroundColor = hoverColors;
        rankingChart.update('active');
        return;
    }

    rankingChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels,
            datasets: [
                {
                    label: 'Pontuação Total',
                    data,
                    backgroundColor: colors,
                    hoverBackgroundColor: hoverColors,
                    borderRadius: 6,
                    borderSkipped: false,
                    barPercentage: 0.7,
                    categoryPercentage: 0.85,
                },
            ],
        },
        options: {
            indexAxis: 'y',
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false },
                tooltip: {
                    backgroundColor: 'rgba(22, 64, 176, 0.95)',
                    titleColor: '#FFFFFF',
                    bodyColor: '#FFFFFF',
                    borderColor: 'rgba(255, 255, 255, 0.2)',
                    borderWidth: 1,
                    cornerRadius: 8,
                    padding: 12,
                    displayColors: false,
                    callbacks: {
                        label: (context) => `${formatNumber(context.parsed.x)} pontos`,
                    },
                },
            },
            scales: {
                x: {
                    grid: {
                        color: 'rgba(255, 255, 255, 0.06)',
                    },
                    ticks: {
                        color: 'rgba(255, 255, 255, 0.5)',
                        callback: (value) => formatNumber(value),
                    },
                },
                y: {
                    grid: { display: false },
                    ticks: {
                        font: { weight: 500 },
                        color: '#FFFFFF',
                    },
                },
            },
            animation: {
                duration: 800,
                easing: 'easeOutQuart',
            },
        },
    });
}

/**
 * Create or update the donut distribution chart
 */
export function renderDistributionChart(creators) {
    const ctx = document.getElementById('distribution-chart');
    if (!ctx) return;

    // Aggregate totals across all creators
    let totalReferral = 0;
    let totalPost = 0;
    let totalDouble = 0;

    creators.forEach((c) => {
        totalReferral += c.referralPoints || 0;
        totalPost += c.postPoints || 0;
        totalDouble += c.doublePoints || 0;
    });

    const data = [totalReferral, totalPost, totalDouble];
    const labels = ['Indicações', 'Reels / TikTok', 'Conteúdo Double'];

    // Amplify Brand Palette for Distribution
    const colors = [
        '#FFFFFF',            // White (Referrals - High value)
        '#C90043',            // Amplify Red (Posts)
        'rgba(255, 255, 255, 0.4)', // Muted White (Double)
    ];

    const hoverColors = [
        '#FFFFFF',
        '#E6004D',
        'rgba(255, 255, 255, 0.6)',
    ];

    if (distributionChart) {
        distributionChart.data.datasets[0].data = data;
        distributionChart.update('active');
        return;
    }

    distributionChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels,
            datasets: [
                {
                    data,
                    backgroundColor: colors,
                    hoverBackgroundColor: hoverColors,
                    borderWidth: 0,
                    hoverOffset: 8,
                },
            ],
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            cutout: '65%',
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        color: 'rgba(255, 255, 255, 0.8)',
                        padding: 20,
                        usePointStyle: true,
                        pointStyleWidth: 12,
                        font: { size: 12, weight: 500, family: "'Work Sans', sans-serif" },
                    },
                },
                tooltip: {
                    backgroundColor: 'rgba(22, 64, 176, 0.95)',
                    titleColor: '#FFFFFF',
                    bodyColor: '#FFFFFF',
                    borderColor: 'rgba(255, 255, 255, 0.2)',
                    borderWidth: 1,
                    cornerRadius: 8,
                    padding: 12,
                    callbacks: {
                        label: (context) => {
                            const total = context.dataset.data.reduce((a, b) => a + b, 0);
                            const percentage = total > 0
                                ? ((context.parsed / total) * 100).toFixed(1)
                                : 0;
                            return `${context.label}: ${formatNumber(context.parsed)} pts (${percentage}%)`;
                        },
                    },
                },
            },
            animation: {
                duration: 1000,
                easing: 'easeOutQuart',
            },
        },
    });
}
