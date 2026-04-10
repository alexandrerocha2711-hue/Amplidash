import { formatCompactNumber, formatCurrencyBR, formatNumber, formatRatio } from './utils.js';

let performanceChart = null;
let mixChart = null;
let weeklyGoalsChart = null;
let defaultsConfigured = false;

function ensureChartDefaults() {
  if (defaultsConfigured || typeof Chart === 'undefined') {
    return;
  }

  Chart.defaults.color = 'rgba(248, 251, 255, 0.72)';
  Chart.defaults.borderColor = 'rgba(255, 255, 255, 0.08)';
  Chart.defaults.font.family = "'Work Sans', sans-serif";
  Chart.defaults.font.size = 12;
  defaultsConfigured = true;
}

export function renderPerformanceChart(series, compareSeries = [], comparisonLabel = '') {
  const canvas = document.getElementById('performance-chart');
  if (!canvas || typeof Chart === 'undefined') {
    return;
  }

  ensureChartDefaults();

  const labels = series.map((item) => item.label);
  const costValues = series.map((item) => item.cost);
  const revenueValues = series.map((item) => item.revenue);
  const roasValues = series.map((item) => item.roas);
  const compareRevenueValues = labels.map((_, index) => compareSeries[index]?.revenue ?? null);

  const datasets = [
    {
      type: 'bar',
      label: 'Custo',
      data: costValues,
      backgroundColor: 'rgba(255, 255, 255, 0.18)',
      borderRadius: 18,
      borderSkipped: false,
      maxBarThickness: 34,
      order: 2,
    },
    {
      type: 'line',
      label: 'Receita',
      data: revenueValues,
      borderColor: '#ffffff',
      backgroundColor: 'rgba(255, 255, 255, 0.16)',
      borderWidth: 3,
      pointRadius: 4,
      pointHoverRadius: 5,
      pointBackgroundColor: '#ffffff',
      tension: 0.35,
      yAxisID: 'y',
      order: 1,
    },
    {
      type: 'line',
      label: 'ROAS',
      data: roasValues,
      borderColor: '#ff7a9f',
      backgroundColor: 'rgba(255, 122, 159, 0.16)',
      borderWidth: 3,
      pointRadius: 4,
      pointHoverRadius: 5,
      pointBackgroundColor: '#ff7a9f',
      tension: 0.35,
      yAxisID: 'y1',
      order: 0,
    },
  ];

  if (compareSeries.length) {
    datasets.push({
      type: 'line',
      label: comparisonLabel || 'Receita comparação',
      data: compareRevenueValues,
      borderColor: '#80a6ff',
      backgroundColor: 'rgba(128, 166, 255, 0.16)',
      borderWidth: 2,
      pointRadius: 0,
      borderDash: [8, 6],
      tension: 0.3,
      yAxisID: 'y',
      order: 1,
    });
  }

  const config = {
    type: 'bar',
    data: {
      labels,
      datasets,
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: {
        mode: 'index',
        intersect: false,
      },
      plugins: {
        legend: {
          position: 'bottom',
          labels: {
            usePointStyle: true,
            pointStyle: 'circle',
            padding: 18,
          },
        },
        tooltip: {
          backgroundColor: 'rgba(7, 20, 54, 0.95)',
          titleColor: '#ffffff',
          bodyColor: 'rgba(255, 255, 255, 0.88)',
          padding: 12,
          cornerRadius: 14,
          callbacks: {
            label(context) {
              if (context.dataset.label === 'ROAS') {
                return `ROAS: ${formatRatio(context.parsed.y)}`;
              }

              return `${context.dataset.label}: ${formatCurrencyBR(context.parsed.y, true)}`;
            },
          },
        },
      },
      scales: {
        x: {
          grid: {
            display: false,
          },
          ticks: {
            color: 'rgba(248, 251, 255, 0.78)',
          },
        },
        y: {
          beginAtZero: true,
          ticks: {
            callback(value) {
              return formatCompactNumber(value);
            },
          },
        },
        y1: {
          position: 'right',
          beginAtZero: true,
          grid: {
            drawOnChartArea: false,
          },
          ticks: {
            callback(value) {
              return formatRatio(value, 1);
            },
          },
        },
      },
    },
  };

  if (performanceChart) {
    performanceChart.data = config.data;
    performanceChart.options = config.options;
    performanceChart.update();
    return;
  }

  performanceChart = new Chart(canvas, config);
}

export function renderContentMixChart(mixItems) {
  const canvas = document.getElementById('content-mix-chart');
  if (!canvas || typeof Chart === 'undefined') {
    return;
  }

  ensureChartDefaults();

  const labels = mixItems.map((item) => item.label);
  const values = mixItems.map((item) => item.value);
  const colors = ['#ffffff', '#b8cbff', '#ff7a9f', '#7ed7ff', '#89f0c6'];

  const config = {
    type: 'doughnut',
    data: {
      labels,
      datasets: [
        {
          data: values,
          backgroundColor: colors,
          borderWidth: 0,
          hoverOffset: 6,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      cutout: '68%',
      plugins: {
        legend: {
          position: 'bottom',
          labels: {
            usePointStyle: true,
            pointStyle: 'circle',
            padding: 18,
          },
        },
        tooltip: {
          backgroundColor: 'rgba(7, 20, 54, 0.95)',
          titleColor: '#ffffff',
          bodyColor: 'rgba(255, 255, 255, 0.88)',
          padding: 12,
          cornerRadius: 14,
          callbacks: {
            label(context) {
              const total = context.dataset.data.reduce((sum, value) => sum + value, 0);
              const percentage = total ? ((context.parsed / total) * 100).toFixed(1).replace('.', ',') : '0,0';
              return `${context.label}: ${formatCurrencyBR(context.parsed, true)} (${percentage}%)`;
            },
          },
        },
      },
    },
  };

  if (mixChart) {
    mixChart.data = config.data;
    mixChart.options = config.options;
    mixChart.update();
    return;
  }

  mixChart = new Chart(canvas, config);
}

export function renderWeeklyGoalsChart(series, metricMeta) {
  const canvas = document.getElementById('weekly-goals-chart');
  if (!canvas || typeof Chart === 'undefined') {
    return;
  }

  ensureChartDefaults();

  const labels = series.map((item) => item.label);
  const actualValues = series.map((item) => item.actual);
  const goalValues = series.map((item) => item.goal);

  const config = {
    type: 'bar',
    data: {
      labels,
      datasets: [
        {
          type: 'bar',
          label: 'Realizado',
          data: actualValues,
          backgroundColor: 'rgba(128, 166, 255, 0.55)',
          borderColor: 'rgba(184, 203, 255, 0.88)',
          borderWidth: 1,
          borderRadius: 18,
          borderSkipped: false,
          maxBarThickness: 42,
          order: 1,
        },
        {
          type: 'line',
          label: 'Meta',
          data: goalValues,
          borderColor: '#ffffff',
          backgroundColor: 'rgba(255, 255, 255, 0.18)',
          borderWidth: 3,
          borderDash: [8, 6],
          pointRadius: 4,
          pointHoverRadius: 5,
          pointBackgroundColor: '#ffffff',
          tension: 0.28,
          order: 0,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: {
        mode: 'index',
        intersect: false,
      },
      plugins: {
        legend: {
          position: 'bottom',
          labels: {
            usePointStyle: true,
            pointStyle: 'circle',
            padding: 18,
          },
        },
        tooltip: {
          backgroundColor: 'rgba(7, 20, 54, 0.95)',
          titleColor: '#ffffff',
          bodyColor: 'rgba(255, 255, 255, 0.88)',
          padding: 12,
          cornerRadius: 14,
          callbacks: {
            label(context) {
              return `${context.dataset.label}: ${formatChartMetricValue(context.parsed.y, metricMeta?.format)}`;
            },
          },
        },
      },
      scales: {
        x: {
          grid: {
            display: false,
          },
          ticks: {
            color: 'rgba(248, 251, 255, 0.78)',
            maxRotation: 0,
            autoSkipPadding: 16,
          },
        },
        y: {
          beginAtZero: true,
          ticks: {
            callback(value) {
              return formatChartMetricTick(value, metricMeta?.format);
            },
          },
        },
      },
    },
  };

  if (weeklyGoalsChart) {
    weeklyGoalsChart.data = config.data;
    weeklyGoalsChart.options = config.options;
    weeklyGoalsChart.update();
    return;
  }

  weeklyGoalsChart = new Chart(canvas, config);
}

function formatChartMetricValue(value, format) {
  if (format === 'currency') {
    return formatCurrencyBR(value, true);
  }

  if (format === 'hours') {
    return `${Number(value || 0).toFixed(1).replace('.', ',')}h`;
  }

  return formatNumber(value);
}

function formatChartMetricTick(value, format) {
  if (format === 'currency') {
    return formatCompactNumber(value);
  }

  if (format === 'hours') {
    return `${Number(value || 0).toFixed(1).replace('.', ',')}h`;
  }

  return formatCompactNumber(value);
}
