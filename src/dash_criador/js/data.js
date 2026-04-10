import { cloneData } from './utils.js';

const STORAGE_KEYS = {
  profile: 'amplidash:dash_criador:profile',
  submissions: 'amplidash:dash_criador:submissions',
  weeklyGoals: 'amplidash:dash_criador:weekly_goals',
  calendarInterests: 'amplidash:dash_criador:calendar_interests',
};

const MARI_GIL_AVATAR_URL = '/images/mari-gil-profile.jpg';

const ONE_DAY_MS = 24 * 60 * 60 * 1000;
const WEEKDAY_MULTIPLIERS = [0.9, 1.02, 1.08, 1.04, 1.12, 1.18, 1.1];

export const DATE_PRESET_OPTIONS = [
  { value: 'today', label: 'Hoje' },
  { value: 'yesterday', label: 'Ontem' },
  { value: 'last_7_days', label: 'Últimos 7 dias' },
  { value: 'last_14_days', label: 'Últimos 14 dias' },
  { value: 'last_30_days', label: 'Últimos 30 dias' },
  { value: 'this_month', label: 'Este mês' },
  { value: 'last_month', label: 'Mês passado' },
  { value: 'custom', label: 'Intervalo personalizado' },
];

export const ATTRIBUTION_OPTIONS = [
  { value: 'click_1d', label: '1 dia clique' },
  { value: 'click_7d', label: '7 dias clique' },
  { value: 'view_1d', label: '1 dia view' },
  { value: 'click_7d_view_1d', label: '7 dias clique + 1 dia view' },
];

export const COMPARISON_OPTIONS = [
  { value: 'none', label: 'Sem comparação' },
  { value: 'previous_period', label: 'Comparar com período anterior' },
  { value: 'previous_month', label: 'Comparar com mesmo período do mês anterior' },
];

export const WEEKLY_GOAL_METRICS = [
  {
    key: 'gmv',
    label: 'GMV semanal',
    shortLabel: 'GMV',
    format: 'currency',
    weight: 0.4,
    inputStep: '100',
    inputMin: '0',
  },
  {
    key: 'videos',
    label: 'Vídeos publicados',
    shortLabel: 'Vídeos',
    format: 'number',
    weight: 0.2,
    inputStep: '1',
    inputMin: '0',
  },
  {
    key: 'liveHours',
    label: 'Horas em live',
    shortLabel: 'Lives',
    format: 'hours',
    weight: 0.2,
    inputStep: '0.5',
    inputMin: '0',
  },
  {
    key: 'productsTested',
    label: 'Produtos testados',
    shortLabel: 'Testes',
    format: 'number',
    weight: 0.2,
    inputStep: '1',
    inputMin: '0',
  },
];

const METRIC_DEFINITIONS = [
  {
    key: 'impressions',
    label: 'Impressões',
    format: 'number',
    helper: 'Soma de impressões dentro do período selecionado.',
    positiveTrend: 'up',
    highlight: true,
  },
  {
    key: 'clicks',
    label: 'Cliques',
    format: 'number',
    helper: 'Soma de cliques válida apenas dentro da janela ativa.',
    positiveTrend: 'up',
  },
  {
    key: 'conversions',
    label: 'Conversões',
    format: 'number',
    helper: 'Conversões atribuídas pela janela selecionada e contabilizadas pela data do evento.',
    positiveTrend: 'up',
  },
  {
    key: 'cost',
    label: 'Custo',
    format: 'currency-decimal',
    helper: 'Investimento total no período, sem mistura com janelas externas.',
    positiveTrend: 'neutral',
  },
  {
    key: 'revenue',
    label: 'Receita',
    format: 'currency',
    helper: 'Receita atribuída às conversões do período.',
    positiveTrend: 'up',
    highlight: true,
  },
  {
    key: 'ctr',
    label: 'CTR',
    format: 'percent',
    helper: 'CTR recalculado como cliques / impressões dentro do range.',
    positiveTrend: 'up',
  },
  {
    key: 'cpm',
    label: 'CPM',
    format: 'currency-decimal',
    helper: 'CPM recalculado como custo / impressões * 1000.',
    positiveTrend: 'down',
  },
  {
    key: 'cpc',
    label: 'CPC',
    format: 'currency-decimal',
    helper: 'CPC recalculado como custo / cliques.',
    positiveTrend: 'down',
  },
  {
    key: 'cpa',
    label: 'CPA',
    format: 'currency-decimal',
    helper: 'CPA recalculado como custo / conversões.',
    positiveTrend: 'down',
  },
  {
    key: 'roas',
    label: 'ROAS',
    format: 'ratio',
    helper: 'ROAS recalculado como receita / custo no período.',
    positiveTrend: 'up',
    highlight: true,
  },
  {
    key: 'videos',
    label: 'Vídeos no período',
    format: 'number',
    helper: 'Quantidade de vídeos publicados dentro do período.',
    positiveTrend: 'up',
  },
  {
    key: 'lives',
    label: 'Lives no período',
    format: 'number',
    helper: 'Quantidade de lives realizadas dentro do período.',
    positiveTrend: 'up',
  },
];

const BASE_PROFILE = {
  fullName: 'Mariana Gil Marcelino',
  instagram: '@_marigil',
  email: 'ugc.marianagil@gmail.com',
  phone: '+55 11 94715-2343',
  city: 'São Paulo, SP',
  niche: 'Beleza, Lifestyle e TikTok Shop',
  shippingAddress: 'Rua Taiuvinha, 682 - Vila Jacuí, São Paulo - SP, 08060-040',
  pixKey: '47040373807',
  contactPreference: 'WhatsApp',
  notes:
    'Criadora focada em produtos de cabelo, com dedicação 100% ao digital e objetivo de se tornar referência no nicho.',
  photoUrl: MARI_GIL_AVATAR_URL,
};

const BASE_CREATOR = {
  fullName: BASE_PROFILE.fullName,
  handle: BASE_PROFILE.instagram,
  segment: BASE_PROFILE.niche,
  city: BASE_PROFILE.city,
  focus: 'TikTok Shop + Beleza',
  category: 'Diamond',
  avatarUrl: BASE_PROFILE.photoUrl,
};

const BASE_ACCOUNT_MANAGER = {
  name: 'Bianca Mendes',
  role: 'Senior Account Manager',
  email: 'bianca@amplify.com.br',
  phone: '+55 11 99876-4321',
  coverage: 'Beauty, Retail e Live Commerce',
  meetingAt: '2026-04-15T16:30:00-03:00',
  note:
    'Acione este contato para destravar briefings, validar prioridades de campanha, pedidos de produto e escalonamentos rápidos.',
};

const TITLE_BANK = {
  Reels: [
    'Top 3 combos que vendem sozinhos',
    'Rotina pronta para live commerce',
    'Antes e depois com prova social',
    'A dica que mais puxou cliques',
    'Setup rápido para creator day',
  ],
  TikTok: [
    'Hook de 3 segundos para oferta',
    'Review curto com prova real',
    'Trend adaptada para varejo',
    'Teste de produto com CTA forte',
    'Storytelling em 15 segundos',
  ],
  'UGC Ads': [
    'UGC performance com oferta aberta',
    'Criativo de conversão para remarketing',
    'Ad curto com call to action forte',
    'Prova social orientada a checkout',
    'Variação de hook para CPA',
  ],
  Lives: [
    'Live shopping com combos',
    'Live de rotina beauty',
    'Live de lançamento com perguntas',
    'Live de oferta relâmpago',
  ],
};

const FORMAT_LIBRARY = {
  Reels: {
    platform: 'Instagram Reels',
    contentType: 'video',
    activeDays: 11,
    baseImpressions: 22000,
    ctrBase: 0.034,
    cpmBase: 23.8,
    conversionRateBase: 0.046,
    viewThroughRateBase: 0.28,
    aovBase: 138,
  },
  TikTok: {
    platform: 'TikTok',
    contentType: 'video',
    activeDays: 9,
    baseImpressions: 27500,
    ctrBase: 0.029,
    cpmBase: 19.6,
    conversionRateBase: 0.038,
    viewThroughRateBase: 0.22,
    aovBase: 121,
  },
  'UGC Ads': {
    platform: 'Meta Ads',
    contentType: 'video',
    activeDays: 16,
    baseImpressions: 18200,
    ctrBase: 0.041,
    cpmBase: 27.9,
    conversionRateBase: 0.054,
    viewThroughRateBase: 0.3,
    aovBase: 156,
  },
  Lives: {
    platform: 'Live Shopping',
    contentType: 'live',
    activeDays: 4,
    baseImpressions: 15600,
    ctrBase: 0.051,
    cpmBase: 17.4,
    conversionRateBase: 0.071,
    viewThroughRateBase: 0.36,
    aovBase: 194,
  },
};

const TODAY_KEY = getTodayDateKey();
const CREATIVE_ASSETS = generateCreativeAssets(160);
const MEDIA_ROWS = generateMediaRows(CREATIVE_ASSETS, TODAY_KEY);
const CONVERSION_EVENTS = generateConversionEvents(MEDIA_ROWS, CREATIVE_ASSETS, TODAY_KEY);
const BASE_CREATOR_PROJECTS = buildBaseCreatorProjects();

const MEDIA_ROWS_BY_DATE = groupByDate(MEDIA_ROWS, 'date');
const CONVERSIONS_BY_DATE = groupByDate(CONVERSION_EVENTS, 'conversionDate');
const ASSETS_BY_PUBLISHED_DATE = groupByDate(CREATIVE_ASSETS, 'publishedAt');
const ASSET_MAP = new Map(CREATIVE_ASSETS.map((asset) => [asset.id, asset]));

const BASE_PRODUCTS = buildBaseProducts(TODAY_KEY);
const BASE_SUBMISSIONS = buildSeedSubmissions(TODAY_KEY);
const analyticsCache = new Map();

export function getDefaultFilters() {
  return {
    preset: 'last_7_days',
    customStart: '',
    customEnd: '',
    attribution: 'click_7d_view_1d',
    comparison: 'previous_period',
  };
}

export function getCreatorHubSnapshot(filters = getDefaultFilters()) {
  const normalizedFilters = normalizeFilters(filters);
  const range = resolveDateRange(normalizedFilters);
  const comparisonRange = resolveComparisonRange(range, normalizedFilters.comparison);

  const currentAnalytics = getRangeAnalytics(range, normalizedFilters.attribution);
  const comparisonAnalytics = comparisonRange
    ? getRangeAnalytics(comparisonRange, normalizedFilters.attribution)
    : null;

  const savedProfile = readStorage(STORAGE_KEYS.profile, null);
  const savedSubmissions = readStorage(STORAGE_KEYS.submissions, []);
  const savedWeeklyGoals = readStorage(STORAGE_KEYS.weeklyGoals, []);
  const savedCalendarInterests = readStorage(STORAGE_KEYS.calendarInterests, []);
  const profile = savedProfile?.fields ? { ...BASE_PROFILE, ...savedProfile.fields } : cloneData(BASE_PROFILE);

  const creator = {
    ...BASE_CREATOR,
    fullName: profile.fullName,
    handle: profile.instagram,
    segment: profile.niche,
    city: profile.city,
    avatarUrl: profile.photoUrl || BASE_CREATOR.avatarUrl,
  };

  const submissions = [...savedSubmissions, ...BASE_SUBMISSIONS]
    .sort((left, right) => new Date(right.createdAt) - new Date(left.createdAt))
    .filter((submission) => isBetweenDateKeys(getIsoDateKey(submission.createdAt), range.start, range.end))
    .slice(0, 6);

  const filteredProducts = BASE_PRODUCTS
    .filter((product) => isBetweenDateKeys(getIsoDateKey(product.requestedAt), range.start, range.end))
    .sort((left, right) => new Date(right.requestedAt) - new Date(left.requestedAt));

  const weeklyGoals = buildWeeklyGoalsModule(savedWeeklyGoals, normalizedFilters.attribution);
  const projects = buildProjectsModule(BASE_CREATOR_PROJECTS);
  const calendar = buildCalendarModule(projects.items, savedCalendarInterests);

  return {
    filters: normalizedFilters,
    period: {
      ...range,
      comparisonLabel: comparisonRange?.label ?? 'Sem comparação',
      attributionLabel: getOptionLabel(ATTRIBUTION_OPTIONS, normalizedFilters.attribution),
      comparisonShortLabel: getOptionLabel(COMPARISON_OPTIONS, normalizedFilters.comparison),
      granularityLabel: currentAnalytics.granularity.label,
      description: `${range.absoluteLabel} · ${getOptionLabel(
        ATTRIBUTION_OPTIONS,
        normalizedFilters.attribution,
      )} · ${currentAnalytics.granularity.label}`,
      compareRange: comparisonRange,
    },
    creator,
    accountManager: cloneData(BASE_ACCOUNT_MANAGER),
    sync: {
      label: savedProfile ? 'Aguardando automação' : 'Pronto para automação',
      lastUpdatedAt: savedProfile?.updatedAt ?? null,
    },
    analytics: {
      totals: currentAnalytics.totals,
      metricCards: buildMetricCards(currentAnalytics, comparisonAnalytics, comparisonRange),
      chartSeries: currentAnalytics.chartSeries,
      compareChartSeries: comparisonAnalytics?.chartSeries ?? [],
      breakdownRows: currentAnalytics.breakdownRows,
      bestVideos: currentAnalytics.bestVideos,
      contentMix: currentAnalytics.contentMix,
      comparisonInsights: buildComparisonInsights(currentAnalytics, comparisonAnalytics, comparisonRange),
      topVideo: currentAnalytics.bestVideos[0] ?? null,
    },
    products: filteredProducts,
    productSummary: buildProductSummary(filteredProducts),
    submissions,
    weeklyGoals,
    projects,
    calendar,
    profile,
  };
}

export function saveProfileUpdate(fields) {
  const payload = {
    fields,
    updatedAt: new Date().toISOString(),
  };

  writeStorage(STORAGE_KEYS.profile, payload);
  return payload;
}

export function saveFormSubmission(type, payload) {
  const current = readStorage(STORAGE_KEYS.submissions, []);
  const entry = {
    id: `${type}-${Date.now()}`,
    type,
    title: buildSubmissionTitle(type),
    summary: buildSubmissionSummary(type, payload),
    createdAt: new Date().toISOString(),
    status: type === 'anonymous-report' ? 'Confidencial' : 'Recebido',
  };

  current.unshift(entry);
  writeStorage(STORAGE_KEYS.submissions, current.slice(0, 25));

  return entry;
}

export function saveWeeklyGoal(payload) {
  const current = readStorage(STORAGE_KEYS.weeklyGoals, []);
  const today = TODAY_KEY;
  const activeGoal = current.find((goal) => goal.startDate <= today && goal.endDate >= today);

  if (activeGoal) {
    return {
      goal: activeGoal,
      created: false,
    };
  }

  const entry = {
    id: `weekly-goal-${Date.now()}`,
    startDate: today,
    endDate: addDays(today, 6),
    createdAt: new Date().toISOString(),
    lockedAt: new Date().toISOString(),
    goals: normalizeGoalPayload(payload),
  };

  current.unshift(entry);
  writeStorage(STORAGE_KEYS.weeklyGoals, current.slice(0, 20));

  return {
    goal: entry,
    created: true,
  };
}

export function saveCalendarInterest(eventId) {
  const current = readStorage(STORAGE_KEYS.calendarInterests, []);

  if (current.includes(eventId)) {
    return {
      created: false,
      eventId,
    };
  }

  const next = [eventId, ...current].slice(0, 50);
  writeStorage(STORAGE_KEYS.calendarInterests, next);

  return {
    created: true,
    eventId,
  };
}

function normalizeFilters(filters) {
  const defaults = getDefaultFilters();
  return {
    preset: filters.preset || defaults.preset,
    customStart: filters.customStart || '',
    customEnd: filters.customEnd || '',
    attribution: filters.attribution || defaults.attribution,
    comparison: filters.comparison || defaults.comparison,
  };
}

function getRangeAnalytics(range, attribution) {
  const cacheKey = `${range.start}:${range.end}:${attribution}`;

  if (analyticsCache.has(cacheKey)) {
    return cloneData(analyticsCache.get(cacheKey));
  }

  const dateKeys = listDateKeys(range.start, range.end);
  const dailyMap = new Map(
    dateKeys.map((dateKey) => [
      dateKey,
      {
        date: dateKey,
        impressions: 0,
        clicks: 0,
        conversions: 0,
        cost: 0,
        revenue: 0,
        videos: 0,
        lives: 0,
        liveHours: 0,
        productsTested: 0,
      },
    ]),
  );

  const assetPerformance = new Map();
  const spendByFormat = new Map();

  dateKeys.forEach((dateKey) => {
    const daySummary = dailyMap.get(dateKey);
    const mediaRows = MEDIA_ROWS_BY_DATE.get(dateKey) || [];
    const publishedAssets = ASSETS_BY_PUBLISHED_DATE.get(dateKey) || [];

    publishedAssets.forEach((asset) => {
      if (asset.contentType === 'live') {
        daySummary.lives += 1;
        daySummary.liveHours += asset.liveHours;
      } else {
        daySummary.videos += 1;
      }

      daySummary.productsTested += asset.productsTested || 0;
    });

    mediaRows.forEach((row) => {
      daySummary.impressions += row.impressions;
      daySummary.clicks += row.clicks;
      daySummary.cost += row.cost;

      const formatSpend = spendByFormat.get(row.format) || 0;
      spendByFormat.set(row.format, formatSpend + row.cost);

      const asset = ASSET_MAP.get(row.assetId);
      const currentAssetStats = assetPerformance.get(row.assetId) || createAssetSummary(asset);

      currentAssetStats.impressions += row.impressions;
      currentAssetStats.clicks += row.clicks;
      currentAssetStats.cost += row.cost;
      currentAssetStats.daysActive += 1;
      currentAssetStats.productsTested = asset.productsTested || 0;
      currentAssetStats.liveHours = asset.liveHours || 0;

      assetPerformance.set(row.assetId, currentAssetStats);
    });

    const conversions = CONVERSIONS_BY_DATE.get(dateKey) || [];
    conversions.forEach((event) => {
      if (!isEventAttributed(event, attribution)) {
        return;
      }

      daySummary.conversions += 1;
      daySummary.revenue += event.revenue;

      const asset = ASSET_MAP.get(event.assetId);
      const currentAssetStats = assetPerformance.get(event.assetId) || createAssetSummary(asset);
      currentAssetStats.conversions += 1;
      currentAssetStats.revenue += event.revenue;
      assetPerformance.set(event.assetId, currentAssetStats);
    });

    applyDerivedMetrics(daySummary);
  });

  const dailyRows = Array.from(dailyMap.values()).sort((left, right) => left.date.localeCompare(right.date));
  const totals = accumulateTotals(dailyRows);
  const granularity = resolveGranularity(range.days);
  const groupedRows = groupRowsByGranularity(dailyRows, granularity);
  const bestVideos = buildBestVideos(Array.from(assetPerformance.values()));
  const contentMix = buildContentMix(spendByFormat);

  const analytics = {
    range,
    totals,
    granularity,
    chartSeries: groupedRows,
    breakdownRows: groupedRows,
    bestVideos,
    contentMix,
  };

  analyticsCache.set(cacheKey, analytics);
  return cloneData(analytics);
}

function buildMetricCards(currentAnalytics, comparisonAnalytics, comparisonRange) {
  return METRIC_DEFINITIONS.map((definition) => {
    const currentValue = currentAnalytics.totals[definition.key];
    const previousValue = comparisonAnalytics?.totals?.[definition.key] ?? null;
    const deltaAbsolute = previousValue == null ? null : currentValue - previousValue;
    const deltaPercent =
      previousValue == null || previousValue === 0
        ? null
        : ((currentValue - previousValue) / Math.abs(previousValue)) * 100;

    return {
      ...definition,
      value: currentValue,
      previousValue,
      deltaAbsolute,
      deltaPercent,
      tone: getDeltaTone(definition.positiveTrend, deltaAbsolute),
      comparisonLabel: comparisonRange?.label ?? 'Sem comparação',
    };
  });
}

function buildComparisonInsights(currentAnalytics, comparisonAnalytics, comparisonRange) {
  if (!comparisonAnalytics || !comparisonRange) {
    return [
      {
        title: 'Sem comparação ativa',
        value: 'Comparação desativada',
        copy:
          'Ative uma das opções de comparação para visualizar diferença absoluta e percentual contra outro período.',
      },
    ];
  }

  const current = currentAnalytics.totals;
  const previous = comparisonAnalytics.totals;

  return [
    {
      title: 'Receita atribuída',
      value: buildDeltaPercentLabel(current.revenue, previous.revenue),
      copy: `${buildDeltaAbsoluteLabel('currency', current.revenue - previous.revenue)} em relação a ${comparisonRange.label.toLowerCase()}.`,
    },
    {
      title: 'Conversões',
      value: buildDeltaPercentLabel(current.conversions, previous.conversions),
      copy: `${buildDeltaAbsoluteLabel('number', current.conversions - previous.conversions)} em conversões dentro do range comparado.`,
    },
    {
      title: 'Eficiência de ROAS',
      value: buildDeltaPercentLabel(current.roas, previous.roas),
      copy: `${buildDeltaAbsoluteLabel('ratio', current.roas - previous.roas)} considerando somente custo e receita válidos em cada janela.`,
    },
  ];
}

function buildProductSummary(products) {
  return [
    { label: 'Solicitações no período', value: products.length },
    { label: 'Aprovados', value: products.filter((item) => item.status === 'Aprovado').length },
    { label: 'Em rota', value: products.filter((item) => item.status === 'Em rota').length },
    { label: 'Entregues', value: products.filter((item) => item.status === 'Entregue').length },
  ];
}

function buildWeeklyGoalsModule(savedWeeklyGoals, attribution) {
  const seededGoals = buildSeedWeeklyGoals(attribution);
  const combinedGoals = mergeWeeklyGoalCollections(savedWeeklyGoals, seededGoals);
  const cycleSummaries = combinedGoals
    .map((goal) => buildWeeklyCycleSummary(goal, attribution))
    .sort((left, right) => right.startDate.localeCompare(left.startDate));

  const activeCycle = cycleSummaries.find((cycle) => cycle.isCurrentWindow) ?? null;
  const previousCycle = activeCycle
    ? cycleSummaries.find((cycle) => cycle.startDate === addDays(activeCycle.startDate, -7))
    : cycleSummaries[0] ?? null;
  const hasUserDefinedActiveCycle = Boolean(
    savedWeeklyGoals.find((goal) => goal.startDate <= TODAY_KEY && goal.endDate >= TODAY_KEY),
  );
  const recentCompletedCycles = cycleSummaries.filter((cycle) => cycle.startDate < TODAY_KEY).slice(0, 3);
  const onboardingDefaults = buildGoalDefaults(recentCompletedCycles);

  return {
    onboarding: {
      isVisible: !hasUserDefinedActiveCycle,
      startDate: TODAY_KEY,
      endDate: addDays(TODAY_KEY, 6),
      defaults: onboardingDefaults,
    },
    activeCycle,
    previousCycle,
    cycles: cycleSummaries.slice(0, 4),
    comparison: activeCycle ? buildWeeklyComparison(activeCycle) : null,
    history: buildWeeklyHistorySeries(cycleSummaries),
    alerts: activeCycle ? buildWeeklyAlerts(activeCycle) : [],
  };
}

function buildSeedWeeklyGoals(attribution) {
  const seeds = [];

  for (let offset = 28; offset >= 7; offset -= 7) {
    const startDate = addDays(TODAY_KEY, -offset);
    const endDate = addDays(startDate, 6);
    const actuals = getWeeklyGoalActuals({ startDate, endDate }, attribution, endDate);

    seeds.push({
      id: `seed-goal-${startDate}`,
      startDate,
      endDate,
      createdAt: `${startDate}T09:00:00-03:00`,
      lockedAt: `${startDate}T09:05:00-03:00`,
      goals: {
        gmv: roundToStep(actuals.gmv * (1.06 + ((offset / 7) % 3) * 0.03), 100),
        videos: Math.max(4, Math.round(actuals.videos * 1.08)),
        liveHours: roundToStep(Math.max(1, actuals.liveHours * 1.05), 0.5),
        productsTested: Math.max(2, Math.round(actuals.productsTested * 1.12)),
      },
    });
  }

  return seeds;
}

function mergeWeeklyGoalCollections(savedGoals, seededGoals) {
  const merged = new Map();

  [...seededGoals, ...savedGoals].forEach((goal) => {
    const normalized = normalizeStoredGoal(goal);
    if (!normalized) {
      return;
    }

    merged.set(normalized.startDate, normalized);
  });

  return Array.from(merged.values());
}

function normalizeStoredGoal(goal) {
  if (!goal?.startDate || !goal?.endDate || !goal?.goals) {
    return null;
  }

  return {
    id: goal.id || `weekly-goal-${goal.startDate}`,
    startDate: goal.startDate,
    endDate: goal.endDate,
    createdAt: goal.createdAt || `${goal.startDate}T09:00:00-03:00`,
    lockedAt: goal.lockedAt || goal.createdAt || `${goal.startDate}T09:05:00-03:00`,
    goals: normalizeGoalPayload(goal.goals),
  };
}

function normalizeGoalPayload(payload) {
  return {
    gmv: roundToStep(Number(payload.gmv) || 0, 100),
    videos: Math.max(0, Math.round(Number(payload.videos) || 0)),
    liveHours: roundToStep(Number(payload.liveHours) || 0, 0.5),
    productsTested: Math.max(0, Math.round(Number(payload.productsTested) || 0)),
  };
}

function buildWeeklyCycleSummary(goal, attribution) {
  const actualEndDate = goal.endDate < TODAY_KEY ? goal.endDate : TODAY_KEY;
  const elapsedDays = actualEndDate < goal.startDate ? 0 : diffDaysInclusive(goal.startDate, actualEndDate);
  const actuals = getWeeklyGoalActuals(goal, attribution, actualEndDate);
  const progressByMetric = buildWeeklyProgress(goal.goals, actuals);
  const score = calculateWeeklyScore(progressByMetric);
  const level = getScoreLevel(score);
  const status = resolveWeeklyCycleStatus(goal, progressByMetric);
  const previousWindow = {
    startDate: addDays(goal.startDate, -7),
    endDate: addDays(goal.endDate, -7),
  };
  const previousActualEnd =
    status === 'ativa'
      ? addDays(previousWindow.startDate, Math.max(elapsedDays - 1, 0))
      : previousWindow.endDate;
  const previousActuals = getWeeklyGoalActuals(previousWindow, attribution, previousActualEnd);

  return {
    ...goal,
    periodLabel: `${formatDateLabel(goal.startDate)} - ${formatDateLabel(goal.endDate)}`,
    isCurrentWindow: goal.startDate <= TODAY_KEY && goal.endDate >= TODAY_KEY,
    actualEndDate,
    elapsedDays,
    daysLeft: goal.endDate >= TODAY_KEY ? Math.max(diffDaysInclusive(TODAY_KEY, goal.endDate) - 1, 0) : 0,
    totalDays: diffDaysInclusive(goal.startDate, goal.endDate),
    progressByMetric,
    actuals,
    previousActuals,
    score,
    level,
    status,
    completionRate: calculateAverageProgress(progressByMetric),
    comparison: buildWeeklyMetricComparison(actuals, previousActuals),
  };
}

function getWeeklyGoalActuals(goal, attribution, actualEndDate) {
  if (!actualEndDate || actualEndDate < goal.startDate) {
    return {
      gmv: 0,
      videos: 0,
      liveHours: 0,
      productsTested: 0,
    };
  }

  const analytics = getRangeAnalytics(
    {
      start: goal.startDate,
      end: actualEndDate,
      days: diffDaysInclusive(goal.startDate, actualEndDate),
      label: 'Meta semanal',
      absoluteLabel: `${formatDateLabel(goal.startDate)} - ${formatDateLabel(actualEndDate)}`,
    },
    attribution,
  );

  return {
    gmv: round2(analytics.totals.revenue),
    videos: analytics.totals.videos || 0,
    liveHours: round2(analytics.totals.liveHours || 0),
    productsTested: analytics.totals.productsTested || 0,
  };
}

function buildWeeklyProgress(goals, actuals) {
  return WEEKLY_GOAL_METRICS.map((metric) => {
    const target = goals[metric.key] || 0;
    const actual = actuals[metric.key] || 0;
    const rawProgress = target > 0 ? (actual / target) * 100 : 0;
    const progress = round2(rawProgress);

    return {
      ...metric,
      target,
      actual,
      progress,
      cappedProgress: Math.min(progress, 100),
      status: getWeeklyMetricStatus(progress),
    };
  });
}

function calculateWeeklyScore(progressByMetric) {
  return round2(
    progressByMetric.reduce((total, metric) => total + metric.cappedProgress * metric.weight, 0),
  );
}

function calculateAverageProgress(progressByMetric) {
  if (!progressByMetric.length) {
    return 0;
  }

  return round2(progressByMetric.reduce((total, metric) => total + metric.cappedProgress, 0) / progressByMetric.length);
}

function resolveWeeklyCycleStatus(goal, progressByMetric) {
  const allGoalsAchieved = progressByMetric.every((metric) => metric.progress >= 100);

  if (allGoalsAchieved) {
    return 'concluída';
  }

  if (goal.endDate >= TODAY_KEY) {
    return 'ativa';
  }

  return 'não atingida';
}

function getWeeklyMetricStatus(progress) {
  if (progress >= 100) {
    return 'Meta batida';
  }

  if (progress >= 80) {
    return 'Quase lá';
  }

  return 'Abaixo';
}

function getScoreLevel(score) {
  if (score >= 90) {
    return 'Elite';
  }

  if (score >= 70) {
    return 'Forte';
  }

  if (score >= 50) {
    return 'Regular';
  }

  return 'Abaixo';
}

function buildWeeklyMetricComparison(currentActuals, previousActuals) {
  return WEEKLY_GOAL_METRICS.map((metric) => {
    const current = currentActuals[metric.key] || 0;
    const previous = previousActuals[metric.key] || 0;
    const absolute = round2(current - previous);
    const percent = previous > 0 ? round2(((current - previous) / Math.abs(previous)) * 100) : null;

    return {
      ...metric,
      current,
      previous,
      absolute,
      percent,
    };
  });
}

function buildWeeklyComparison(activeCycle) {
  return {
    referenceLabel:
      activeCycle.status === 'ativa'
        ? 'Mesma fase da semana anterior'
        : 'Semana anterior completa',
    items: activeCycle.comparison,
  };
}

function buildWeeklyHistorySeries(cycles) {
  const ordered = [...cycles].sort((left, right) => left.startDate.localeCompare(right.startDate));

  return {
    defaultMetric: 'gmv',
    labels: ordered.map((cycle) => cycle.periodLabel),
    metrics: WEEKLY_GOAL_METRICS.reduce((accumulator, metric) => {
      accumulator[metric.key] = ordered.map((cycle) => ({
        label: cycle.periodLabel,
        goal: cycle.goals[metric.key] || 0,
        actual: cycle.actuals[metric.key] || 0,
      }));
      return accumulator;
    }, {}),
  };
}

function buildWeeklyAlerts(activeCycle) {
  const alerts = [];
  const elapsedRatio = activeCycle.totalDays > 0 ? activeCycle.elapsedDays / activeCycle.totalDays : 0;
  const belowHalfMetrics = activeCycle.progressByMetric.filter((metric) => metric.progress < 50);
  const allGoalsAchieved = activeCycle.progressByMetric.every((metric) => metric.progress >= 100);
  const daysLeft = diffDaysInclusive(TODAY_KEY, activeCycle.endDate) - 1;

  if (elapsedRatio >= 0.5 && belowHalfMetrics.length) {
    alerts.push({
      type: 'warning',
      title: 'Meta abaixo de 50% no meio da semana',
      copy: `Atenção para ${belowHalfMetrics.map((metric) => metric.shortLabel).join(', ')}: o progresso ainda está abaixo de 50%.`,
    });
  }

  if (allGoalsAchieved) {
    alerts.push({
      type: 'success',
      title: 'Meta semanal batida',
      copy: 'Parabéns! Todas as metas da semana já foram atingidas dentro do ciclo atual.',
    });
  }

  if (daysLeft <= 1 && !allGoalsAchieved && activeCycle.status === 'ativa') {
    alerts.push({
      type: 'info',
      title: 'Faltam 24h para o fechamento',
      copy: 'O ciclo semanal está perto do fim. Vale reforçar ações para fechar as metas restantes.',
    });
  }

  return alerts;
}

function buildGoalDefaults(recentCycles) {
  if (!recentCycles.length) {
    return {
      gmv: 12000,
      videos: 5,
      liveHours: 4,
      productsTested: 3,
    };
  }

  const baseline = recentCycles.reduce(
    (accumulator, cycle) => {
      accumulator.gmv += cycle.actuals.gmv;
      accumulator.videos += cycle.actuals.videos;
      accumulator.liveHours += cycle.actuals.liveHours;
      accumulator.productsTested += cycle.actuals.productsTested;
      return accumulator;
    },
    {
      gmv: 0,
      videos: 0,
      liveHours: 0,
      productsTested: 0,
    },
  );

  return {
    gmv: roundToStep((baseline.gmv / recentCycles.length) * 1.08, 100),
    videos: Math.max(4, Math.round((baseline.videos / recentCycles.length) * 1.05)),
    liveHours: roundToStep(Math.max(2, (baseline.liveHours / recentCycles.length) * 1.08), 0.5),
    productsTested: Math.max(2, Math.round((baseline.productsTested / recentCycles.length) * 1.1)),
  };
}

function resolveDateRange(filters) {
  const today = TODAY_KEY;
  let start = today;
  let end = today;
  let label = 'Hoje';

  switch (filters.preset) {
    case 'today':
      start = today;
      end = today;
      label = 'Hoje';
      break;
    case 'yesterday':
      start = addDays(today, -1);
      end = addDays(today, -1);
      label = 'Ontem';
      break;
    case 'last_7_days':
      start = addDays(today, -6);
      end = today;
      label = 'Últimos 7 dias';
      break;
    case 'last_14_days':
      start = addDays(today, -13);
      end = today;
      label = 'Últimos 14 dias';
      break;
    case 'last_30_days':
      start = addDays(today, -29);
      end = today;
      label = 'Últimos 30 dias';
      break;
    case 'this_month':
      start = startOfMonth(today);
      end = today;
      label = 'Este mês';
      break;
    case 'last_month':
      start = startOfMonth(addMonths(today, -1));
      end = endOfMonth(addMonths(today, -1));
      label = 'Mês passado';
      break;
    case 'custom': {
      const fallbackStart = addDays(today, -6);
      const fallbackEnd = today;
      start = filters.customStart || fallbackStart;
      end = filters.customEnd || fallbackEnd;

      if (start > end) {
        [start, end] = [end, start];
      }

      label = 'Intervalo personalizado';
      break;
    }
    default:
      break;
  }

  return {
    start,
    end,
    label,
    days: diffDaysInclusive(start, end),
    absoluteLabel: `${formatDateLabel(start)} - ${formatDateLabel(end)}`,
  };
}

function resolveComparisonRange(range, comparison) {
  if (comparison === 'none') {
    return null;
  }

  if (comparison === 'previous_period') {
    const end = addDays(range.start, -1);
    const start = addDays(end, -(range.days - 1));
    return {
      start,
      end,
      days: diffDaysInclusive(start, end),
      label: 'Período anterior',
      absoluteLabel: `${formatDateLabel(start)} - ${formatDateLabel(end)}`,
    };
  }

  const start = addMonths(range.start, -1);
  const end = addMonths(range.end, -1);

  return {
    start,
    end,
    days: diffDaysInclusive(start, end),
    label: 'Mesmo período do mês anterior',
    absoluteLabel: `${formatDateLabel(start)} - ${formatDateLabel(end)}`,
  };
}

function resolveGranularity(dayCount) {
  if (dayCount <= 14) {
    return { value: 'day', label: 'Granularidade diária' };
  }

  if (dayCount <= 92) {
    return { value: 'week', label: 'Granularidade semanal' };
  }

  return { value: 'month', label: 'Granularidade mensal' };
}

function groupRowsByGranularity(rows, granularity) {
  const buckets = new Map();

  rows.forEach((row) => {
    const key =
      granularity.value === 'day'
        ? row.date
        : granularity.value === 'week'
          ? startOfWeek(row.date)
          : startOfMonth(row.date);

    if (!buckets.has(key)) {
      buckets.set(key, {
        key,
        start: row.date,
        end: row.date,
        impressions: 0,
        clicks: 0,
        conversions: 0,
        cost: 0,
        revenue: 0,
      });
    }

    const bucket = buckets.get(key);
    bucket.start = row.date < bucket.start ? row.date : bucket.start;
    bucket.end = row.date > bucket.end ? row.date : bucket.end;
    bucket.impressions += row.impressions;
    bucket.clicks += row.clicks;
    bucket.conversions += row.conversions;
    bucket.cost += row.cost;
    bucket.revenue += row.revenue;
  });

  return Array.from(buckets.values())
    .sort((left, right) => left.start.localeCompare(right.start))
    .map((bucket) => {
      applyDerivedMetrics(bucket);
      return {
        ...bucket,
        label:
          granularity.value === 'day'
            ? formatDateLabel(bucket.start)
            : granularity.value === 'week'
              ? `${formatDateLabel(bucket.start)} - ${formatDateLabel(bucket.end)}`
              : formatMonthLabel(bucket.start),
      };
    });
}

function buildBestVideos(assetRows) {
  return assetRows
    .filter((asset) => asset.contentType === 'video' && asset.impressions > 0)
    .map((asset) => {
      applyDerivedMetrics(asset);
      return asset;
    })
    .sort((left, right) => {
      if (right.revenue !== left.revenue) {
        return right.revenue - left.revenue;
      }

      return right.roas - left.roas;
    })
    .slice(0, 4);
}

function buildContentMix(spendByFormat) {
  return Array.from(spendByFormat.entries())
    .map(([label, value]) => ({ label, value: round2(value) }))
    .filter((item) => item.value > 0)
    .sort((left, right) => right.value - left.value);
}

function accumulateTotals(rows) {
  const totals = rows.reduce(
    (accumulator, row) => {
      accumulator.impressions += row.impressions;
      accumulator.clicks += row.clicks;
      accumulator.conversions += row.conversions;
      accumulator.cost += row.cost;
      accumulator.revenue += row.revenue;
      accumulator.videos += row.videos || 0;
      accumulator.lives += row.lives || 0;
      accumulator.liveHours += row.liveHours || 0;
      accumulator.productsTested += row.productsTested || 0;
      return accumulator;
    },
    {
      impressions: 0,
      clicks: 0,
      conversions: 0,
      cost: 0,
      revenue: 0,
      videos: 0,
      lives: 0,
      liveHours: 0,
      productsTested: 0,
    },
  );

  applyDerivedMetrics(totals);
  return totals;
}

function applyDerivedMetrics(target) {
  const impressions = target.impressions || 0;
  const clicks = target.clicks || 0;
  const conversions = target.conversions || 0;
  const cost = target.cost || 0;
  const revenue = target.revenue || 0;

  target.ctr = impressions > 0 ? (clicks / impressions) * 100 : 0;
  target.cpm = impressions > 0 ? (cost / impressions) * 1000 : 0;
  target.cpc = clicks > 0 ? cost / clicks : 0;
  target.cpa = conversions > 0 ? cost / conversions : 0;
  target.roas = cost > 0 ? revenue / cost : 0;
  target.cost = round2(cost);
  target.revenue = round2(revenue);
}

function isEventAttributed(event, attribution) {
  const clickDiff = event.clickDate ? diffDaysInclusive(event.clickDate, event.conversionDate) - 1 : null;
  const viewDiff = event.viewDate ? diffDaysInclusive(event.viewDate, event.conversionDate) - 1 : null;

  switch (attribution) {
    case 'click_1d':
      return clickDiff != null && clickDiff <= 1;
    case 'click_7d':
      return clickDiff != null && clickDiff <= 7;
    case 'view_1d':
      return viewDiff != null && viewDiff <= 1;
    case 'click_7d_view_1d':
    default:
      return (clickDiff != null && clickDiff <= 7) || (viewDiff != null && viewDiff <= 1);
  }
}

function generateCreativeAssets(daysBack) {
  const assets = [];
  let sequence = 0;

  for (let offset = daysBack; offset >= 0; offset -= 1) {
    const dateKey = addDays(TODAY_KEY, -offset);
    const weekday = parseDateKey(dateKey).getDay();

    if (weekday !== 0) {
      assets.push(createAsset(sequence, dateKey, pickFormatForDay(weekday, sequence)));
      sequence += 1;
    }

    if (weekday === 2 || weekday === 5) {
      assets.push(createAsset(sequence, dateKey, pickFormatForDay(weekday + 1, sequence)));
      sequence += 1;
    }

    if (offset % 19 === 0 || weekday === 4) {
      assets.push(createAsset(sequence, dateKey, 'Lives'));
      sequence += 1;
    }
  }

  return assets;
}

function createAsset(sequence, publishedAt, format) {
  const config = FORMAT_LIBRARY[format];
  const titleList = TITLE_BANK[format];

  return {
    id: `asset-${sequence + 1}`,
    sequence,
    title: titleList[sequence % titleList.length],
    format,
    platform: config.platform,
    contentType: config.contentType,
    publishedAt,
    activeDays: config.activeDays,
    baseImpressions: config.baseImpressions * (1 + (((sequence % 6) - 2.5) * 0.05)),
    ctrBase: config.ctrBase + (((sequence % 5) - 2) * 0.0018),
    cpmBase: config.cpmBase * (1 + (((sequence % 4) - 1.5) * 0.04)),
    conversionRateBase: config.conversionRateBase * (1 + (((sequence % 7) - 3) * 0.03)),
    viewThroughRateBase: config.viewThroughRateBase,
    aovBase: config.aovBase * (1 + (((sequence % 4) - 1.5) * 0.05)),
    productsTested: config.contentType === 'live' ? 2 + (sequence % 2) : 1 + (sequence % 3 === 0 ? 1 : 0),
    liveHours:
      config.contentType === 'live'
        ? round2(1.4 + ((sequence % 4) * 0.35))
        : 0,
  };
}

function pickFormatForDay(weekday, sequence) {
  if (weekday === 1 || weekday === 3) {
    return sequence % 2 === 0 ? 'Reels' : 'UGC Ads';
  }

  if (weekday === 2 || weekday === 6) {
    return 'TikTok';
  }

  if (weekday === 4) {
    return 'UGC Ads';
  }

  return 'Reels';
}

function generateMediaRows(assets, todayKey) {
  const rows = [];

  assets.forEach((asset) => {
    for (let dayIndex = 0; dayIndex < asset.activeDays; dayIndex += 1) {
      const dateKey = addDays(asset.publishedAt, dayIndex);
      if (dateKey > todayKey) {
        break;
      }

      const fatigue = asset.contentType === 'live' ? Math.exp(-dayIndex / 1.4) : Math.exp(-dayIndex / 4.7);
      const weekdayBoost = WEEKDAY_MULTIPLIERS[parseDateKey(dateKey).getDay()];
      const creativeBoost = 1 + (((asset.sequence % 7) - 3) * 0.04);
      const launchBoost = dayIndex === 0 ? 1.14 : 1;
      const impressions = Math.max(
        540,
        Math.round(asset.baseImpressions * fatigue * weekdayBoost * creativeBoost * launchBoost),
      );
      const ctr = Math.max(0.011, asset.ctrBase + (((asset.sequence + dayIndex) % 5) - 2) * 0.0014);
      const clicks = Math.max(0, Math.round(impressions * ctr));
      const cpm = Math.max(10.5, asset.cpmBase * (1 + (((asset.sequence + dayIndex) % 6) - 2.5) * 0.025));
      const cost = round2((impressions / 1000) * cpm);

      rows.push({
        assetId: asset.id,
        date: dateKey,
        format: asset.format,
        platform: asset.platform,
        contentType: asset.contentType,
        impressions,
        clicks,
        cost,
      });
    }
  });

  return rows;
}

function generateConversionEvents(rows, assets, todayKey) {
  const assetMap = new Map(assets.map((asset) => [asset.id, asset]));
  const events = [];
  const clickDelayPattern = [0, 0, 1, 1, 2, 3, 5];
  const viewDelayPattern = [0, 1, 1, 0];

  rows.forEach((row) => {
    const asset = assetMap.get(row.assetId);
    const clickConversions = Math.max(
      0,
      Math.round(row.clicks * asset.conversionRateBase * (0.84 + ((asset.sequence + row.clicks) % 5) * 0.05)),
    );

    for (let index = 0; index < clickConversions; index += 1) {
      const delay = clickDelayPattern[(asset.sequence + index) % clickDelayPattern.length];
      const conversionDate = addDays(row.date, delay);

      if (conversionDate > todayKey) {
        continue;
      }

      events.push({
        assetId: asset.id,
        conversionDate,
        clickDate: row.date,
        viewDate: index % 3 === 0 ? row.date : null,
        revenue: round2(asset.aovBase * (1 + (((asset.sequence + index) % 4) - 1.5) * 0.08)),
      });
    }

    const viewConversions = Math.max(
      0,
      Math.round((row.impressions / 10000) * asset.viewThroughRateBase * (asset.contentType === 'live' ? 1.2 : 0.55)),
    );

    for (let index = 0; index < viewConversions; index += 1) {
      const delay = viewDelayPattern[(asset.sequence + index) % viewDelayPattern.length];
      const conversionDate = addDays(row.date, delay);

      if (conversionDate > todayKey) {
        continue;
      }

      events.push({
        assetId: asset.id,
        conversionDate,
        clickDate: null,
        viewDate: row.date,
        revenue: round2(asset.aovBase * 0.72 * (1 + (((asset.sequence + index) % 3) - 1) * 0.06)),
      });
    }
  });

  return events;
}

function createAssetSummary(asset) {
  return {
    assetId: asset.id,
    title: asset.title,
    platform: asset.platform,
    format: asset.format,
    contentType: asset.contentType,
    publishedAt: asset.publishedAt,
    impressions: 0,
    clicks: 0,
    conversions: 0,
    cost: 0,
    revenue: 0,
    daysActive: 0,
    productsTested: asset.productsTested || 0,
    liveHours: asset.liveHours || 0,
  };
}

function buildBaseCreatorProjects() {
  // A entrega por creator foi estimada a partir do total do squad,
  // porque as linhas individuais de vídeo vieram vazias no fetch atual.
  return [
    {
      id: 'project-max-titanium-2hot',
      name: 'Max Titanium 2HOT',
      fullName: '[SQUAD ELITE] Max Titanium 2HOT',
      brand: 'Max Titanium',
      rawStatus: 'Enviar na comunidade',
      rawPhase: 'Fase 0',
      contractStart: '2026-03-20',
      contractEnd: '2026-04-20',
      contractLink: '',
      projectUrl: 'https://www.notion.so/324b0bbef15380f484d7dd9eeebfec12',
      squadUrl: 'https://www.notion.so/325b0bbef153806d9e65f65d2b23e74d',
      deliveriesUrl: 'https://www.notion.so/325b0bbef153815cb936f50861e1d174',
      responsibleName: 'Emily Ceriolli',
      responsibleEmail: 'emily@amplifyugc.co',
      totalVideosCampaign: 34,
      creatorsCount: 18,
      creatorContractedVideos: 2,
      creatorDeliveredVideos: 0,
    },
  ];
}

function buildProjectsModule(baseProjects) {
  const items = baseProjects
    .map((project) => {
      const creatorContractedVideos =
        project.creatorContractedVideos || Math.max(1, Math.round(project.totalVideosCampaign / Math.max(project.creatorsCount, 1)));
      const creatorDeliveredVideos = Math.min(project.creatorDeliveredVideos || 0, creatorContractedVideos);
      const pendingVideos = Math.max(creatorContractedVideos - creatorDeliveredVideos, 0);
      const status = mapProjectStatus(project.rawStatus, project.rawPhase);
      const deliveries = buildProjectDeliveries({
        ...project,
        creatorContractedVideos,
        creatorDeliveredVideos,
      });
      const nextPendingDelivery =
        deliveries
          .filter((delivery) => delivery.status !== 'Entregue')
          .sort((left, right) => new Date(left.dueAt) - new Date(right.dueAt))[0] || null;

      return {
        ...project,
        status,
        creatorContractedVideos,
        creatorDeliveredVideos,
        pendingVideos,
        progress: creatorContractedVideos > 0 ? round2((creatorDeliveredVideos / creatorContractedVideos) * 100) : 0,
        isCompleted: pendingVideos === 0,
        isActive: project.contractEnd >= TODAY_KEY && status !== 'Fechamento',
        contractPeriodLabel: `${formatDateLabel(project.contractStart)} - ${formatDateLabel(project.contractEnd)}`,
        deliveries,
        nextPendingDelivery,
        alertTone: pendingVideos === 0 ? 'success' : 'danger',
        alertLabel:
          pendingVideos === 0
            ? 'Concluído'
            : `Você deve ${pendingVideos} vídeo${pendingVideos > 1 ? 's' : ''}`,
      };
    })
    .sort((left, right) => {
      if (left.isCompleted !== right.isCompleted) {
        return Number(left.isCompleted) - Number(right.isCompleted);
      }

      return new Date(left.contractEnd) - new Date(right.contractEnd);
    });

  return {
    items,
    summary: [
      {
        label: 'Projetos ativos',
        value: items.filter((project) => project.isActive).length,
      },
      {
        label: 'Vídeos contratados',
        value: items.reduce((total, project) => total + project.creatorContractedVideos, 0),
      },
      {
        label: 'Entregues',
        value: items.reduce((total, project) => total + project.creatorDeliveredVideos, 0),
      },
      {
        label: 'Pendentes',
        value: items.reduce((total, project) => total + project.pendingVideos, 0),
      },
    ],
  };
}

function buildProjectDeliveries(project) {
  const templates = [
    {
      title: 'Vídeo 1',
      dueAt: '2026-04-12T18:00:00-03:00',
      objective: 'Hook + oferta',
    },
    {
      title: 'Vídeo 2',
      dueAt: '2026-04-16T18:00:00-03:00',
      objective: 'Review + CTA',
    },
    {
      title: 'Vídeo 3',
      dueAt: '2026-04-18T18:00:00-03:00',
      objective: 'Prova social',
    },
  ];

  return Array.from({ length: project.creatorContractedVideos }).map((_, index) => ({
    id: `${project.id}-delivery-${index + 1}`,
    title: templates[index]?.title || `Vídeo ${index + 1}`,
    dueAt: templates[index]?.dueAt || `${project.contractEnd}T18:00:00-03:00`,
    objective: templates[index]?.objective || 'Entrega prevista no squad',
    status: index < project.creatorDeliveredVideos ? 'Entregue' : 'Pendente',
  }));
}

function mapProjectStatus(rawStatus, rawPhase) {
  const normalizedStatus = `${rawStatus || ''} ${rawPhase || ''}`.toLowerCase();

  if (normalizedStatus.includes('prospec') || normalizedStatus.includes('fase 0') || normalizedStatus.includes('comunidade')) {
    return 'Prospecção';
  }

  if (normalizedStatus.includes('onboarding')) {
    return 'Onboarding';
  }

  if (normalizedStatus.includes('execução') || normalizedStatus.includes('colaboração')) {
    return 'Execução';
  }

  if (normalizedStatus.includes('entrega') || normalizedStatus.includes('finalização')) {
    return 'Entrega';
  }

  if (normalizedStatus.includes('fechamento') || normalizedStatus.includes('financeiro') || normalizedStatus.includes('relatório')) {
    return 'Fechamento';
  }

  return 'Prospecção';
}

function buildCalendarModule(projects, savedInterests) {
  const interestSet = new Set(savedInterests);
  const events = buildProjectMilestoneEvents(projects)
    .map((event) => decorateCalendarEvent(event, interestSet))
    .sort((left, right) => new Date(left.startsAt) - new Date(right.startsAt));
  const now = new Date();
  const upcoming = events.filter((event) => new Date(event.endsAt) >= now).slice(0, 6);
  const anchorDateKey = upcoming[0]?.dateKey || events[0]?.dateKey || TODAY_KEY;

  return {
    categoryLabel: BASE_CREATOR.category,
    events,
    upcoming,
    month: buildCalendarMonth(events, anchorDateKey),
    projectLinkedCount: events.filter((event) => Boolean(event.projectId)).length,
    liveCount: events.filter((event) => event.timingState === 'live').length,
  };
}

function buildProjectMilestoneEvents(projects) {
  return projects.flatMap((project) => {
    const milestoneEvents = [
      {
        id: `${project.id}-meeting`,
        title: `Reunião de alinhamento · ${project.name}`,
        shortTitle: 'Reunião',
        type: 'Reunião',
        startsAt: '2026-04-10T15:00:00-03:00',
        endsAt: '2026-04-10T15:45:00-03:00',
        description: 'Check-in rápido para validar entregas, pendências e próximos passos.',
        objective: 'Alinhar prioridade e destravar execução da semana.',
        brand: project.brand,
        projectId: project.id,
        projectName: project.name,
        materialsUrl: project.squadUrl,
        meetingUrl: '',
        recordingUrl: '',
      },
      {
        id: `${project.id}-training-brand`,
        title: `Treinamento da marca ${project.brand}`,
        shortTitle: 'Treinamento marca',
        type: 'Treinamento Marca',
        startsAt: '2026-04-11T10:00:00-03:00',
        endsAt: '2026-04-11T11:00:00-03:00',
        description: 'Treinamento curto sobre posicionamento, oferta e roteiros da campanha.',
        objective: 'Garantir consistência criativa antes das entregas.',
        brand: project.brand,
        projectId: project.id,
        projectName: project.name,
        materialsUrl: project.projectUrl,
        meetingUrl: '',
        recordingUrl: '',
      },
    ];

    const deliveryEvents = project.deliveries.map((delivery) => ({
      id: `${delivery.id}-calendar`,
      title: `${delivery.title} · ${project.name}`,
      shortTitle: delivery.title,
      type: 'Projeto',
      startsAt: delivery.dueAt,
      endsAt: delivery.dueAt,
      description: `Publicar ${delivery.title.toLowerCase()} e registrar a entrega no projeto.`,
      objective: delivery.objective,
      brand: project.brand,
      projectId: project.id,
      projectName: project.name,
      materialsUrl: project.deliveriesUrl,
      meetingUrl: '',
      recordingUrl: '',
    }));

    return [...milestoneEvents, ...deliveryEvents];
  });
}

function decorateCalendarEvent(event, interestSet) {
  const now = new Date();
  const startsAt = new Date(event.startsAt);
  const endsAt = new Date(event.endsAt || event.startsAt);
  const diffHours = (startsAt - now) / (1000 * 60 * 60);
  const timingState =
    startsAt <= now && endsAt >= now
      ? 'live'
      : diffHours >= 0 && diffHours <= 24
        ? 'soon'
        : endsAt < now
          ? 'done'
          : 'scheduled';

  return {
    ...event,
    dateKey: getIsoDateKey(event.startsAt),
    typeLabel: getCalendarTypeLabel(event.type),
    interestRegistered: interestSet.has(event.id),
    timingState,
  };
}

function getCalendarTypeLabel(type) {
  if (type === 'Treinamento Mentora') {
    return '🎓 Treinamento Mentora';
  }

  if (type === 'Treinamento Marca') {
    return '🏷️ Treinamento Marca';
  }

  if (type === 'Evento') {
    return '📅 Evento';
  }

  if (type === 'Reunião') {
    return '🤝 Reunião';
  }

  return '🎬 Projeto';
}

function buildCalendarMonth(events, anchorDateKey) {
  const monthStart = startOfMonth(anchorDateKey);
  const gridStart = startOfWeek(monthStart);
  const monthEnd = endOfMonth(anchorDateKey);
  const eventsByDate = groupByDate(events, 'dateKey');
  const days = [];

  for (let index = 0; index < 42; index += 1) {
    const dateKey = addDays(gridStart, index);
    const dayEvents = (eventsByDate.get(dateKey) || []).sort((left, right) => new Date(left.startsAt) - new Date(right.startsAt));

    days.push({
      key: dateKey,
      dayNumber: Number(dateKey.slice(-2)),
      isCurrentMonth: dateKey >= monthStart && dateKey <= monthEnd,
      isToday: dateKey === TODAY_KEY,
      events: dayEvents.slice(0, 2),
      extraCount: Math.max(dayEvents.length - 2, 0),
    });
  }

  return {
    label: formatMonthLabel(anchorDateKey),
    days,
  };
}

function buildBaseProducts(todayKey) {
  return [
    {
      name: 'Kit Live 4K',
      category: 'Equipamento',
      requestedAt: `${addDays(todayKey, -8)}T14:00:00-03:00`,
      status: 'Em rota',
      nextStep: 'Entrega prevista para esta semana',
    },
    {
      name: 'Ring Light Pro Max',
      category: 'Equipamento',
      requestedAt: `${addDays(todayKey, -5)}T10:30:00-03:00`,
      status: 'Aprovado',
      nextStep: 'Separação no estoque central',
    },
    {
      name: 'Kit Skincare Campanha Abril',
      category: 'Sampling',
      requestedAt: `${addDays(todayKey, -3)}T09:15:00-03:00`,
      status: 'Em análise',
      nextStep: 'Validação do estoque com operação',
    },
    {
      name: 'Microfone Pocket Wireless',
      category: 'Equipamento',
      requestedAt: `${addDays(todayKey, -24)}T17:00:00-03:00`,
      status: 'Entregue',
      nextStep: 'Uso confirmado em live recente',
    },
    {
      name: 'Amplify Merch Box',
      category: 'Branded',
      requestedAt: `${addDays(todayKey, -11)}T12:20:00-03:00`,
      status: 'Aguardando estoque',
      nextStep: 'Reposição prevista para a próxima semana',
    },
    {
      name: 'Tripé Creator Pro',
      category: 'Equipamento',
      requestedAt: `${addDays(todayKey, -41)}T15:05:00-03:00`,
      status: 'Entregue',
      nextStep: 'Pedido concluído',
    },
  ];
}

function buildSeedSubmissions(todayKey) {
  return [
    {
      id: 'seed-1',
      type: 'quick-request',
      title: 'Formulário rápido',
      summary: 'Solicitação de produto enviada para reforçar setup de gravação.',
      createdAt: `${addDays(todayKey, -4)}T10:30:00-03:00`,
      status: 'Em andamento',
    },
    {
      id: 'seed-2',
      type: 'nps',
      title: 'NPS enviado',
      summary: 'Nota 9 enviada para o ciclo de experiência do creator.',
      createdAt: `${addDays(todayKey, -9)}T18:40:00-03:00`,
      status: 'Recebido',
    },
    {
      id: 'seed-3',
      type: 'anonymous-report',
      title: 'Denúncia anônima',
      summary: 'Relato confidencial registrado com rastreio interno.',
      createdAt: `${addDays(todayKey, -28)}T13:15:00-03:00`,
      status: 'Confidencial',
    },
  ];
}

function getDeltaTone(positiveTrend, deltaAbsolute) {
  if (deltaAbsolute == null || positiveTrend === 'neutral') {
    return 'neutral';
  }

  if (deltaAbsolute === 0) {
    return 'neutral';
  }

  if (positiveTrend === 'down') {
    return deltaAbsolute < 0 ? 'positive' : 'negative';
  }

  return deltaAbsolute > 0 ? 'positive' : 'negative';
}

function buildSubmissionSummary(type, payload) {
  if (type === 'quick-request') {
    return `${payload.requestType} · prioridade ${payload.priority.toLowerCase()} · ${payload.details}`;
  }

  if (type === 'anonymous-report') {
    return `${payload.reportType} em ${payload.channel.toLowerCase()} registrado com confidencialidade.`;
  }

  if (type === 'nps') {
    const comment = payload.comment ? ` Comentário: ${payload.comment}` : '';
    return `Nota ${payload.score} enviada para a experiência do creator.${comment}`;
  }

  return 'Solicitação registrada na plataforma.';
}

function buildSubmissionTitle(type) {
  if (type === 'quick-request') {
    return 'Formulário rápido';
  }

  if (type === 'anonymous-report') {
    return 'Denúncia anônima';
  }

  if (type === 'nps') {
    return 'NPS enviado';
  }

  return 'Novo envio';
}

function buildDeltaPercentLabel(currentValue, previousValue) {
  if (!previousValue) {
    return 'Sem base anterior';
  }

  const deltaPercent = ((currentValue - previousValue) / Math.abs(previousValue)) * 100;
  const prefix = deltaPercent > 0 ? '+' : '';
  return `${prefix}${deltaPercent.toFixed(1).replace('.', ',')}%`;
}

function buildDeltaAbsoluteLabel(format, delta) {
  const absolute = delta;
  const prefix = absolute > 0 ? '+' : '';

  if (format === 'currency') {
    return `${prefix}R$ ${Math.abs(absolute).toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, '.')}`;
  }

  if (format === 'ratio') {
    return `${prefix}${Math.abs(absolute).toFixed(2).replace('.', ',')}x`;
  }

  return `${prefix}${Math.abs(absolute).toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, '.')}`;
}

function canUseLocalStorage() {
  try {
    return typeof window !== 'undefined' && Boolean(window.localStorage);
  } catch {
    return false;
  }
}

function readStorage(key, fallback) {
  if (!canUseLocalStorage()) {
    return fallback;
  }

  try {
    const raw = window.localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function writeStorage(key, value) {
  if (!canUseLocalStorage()) {
    return;
  }

  window.localStorage.setItem(key, JSON.stringify(value));
}

function getOptionLabel(options, value) {
  return options.find((option) => option.value === value)?.label ?? value;
}

function groupByDate(items, key) {
  const map = new Map();

  items.forEach((item) => {
    const dateKey = item[key];
    if (!map.has(dateKey)) {
      map.set(dateKey, []);
    }

    map.get(dateKey).push(item);
  });

  return map;
}

function listDateKeys(start, end) {
  const keys = [];
  let current = start;

  while (current <= end) {
    keys.push(current);
    current = addDays(current, 1);
  }

  return keys;
}

function round2(value) {
  return Math.round(value * 100) / 100;
}

function roundToStep(value, step) {
  if (!step) {
    return round2(value);
  }

  return round2(Math.round(value / step) * step);
}

function diffDaysInclusive(start, end) {
  return Math.round((parseDateKey(end) - parseDateKey(start)) / ONE_DAY_MS) + 1;
}

function isBetweenDateKeys(dateKey, start, end) {
  return dateKey >= start && dateKey <= end;
}

function parseDateKey(dateKey) {
  return new Date(`${dateKey}T12:00:00`);
}

function pad(value) {
  return String(value).padStart(2, '0');
}

function toDateKey(date) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

function getTodayDateKey() {
  return toDateKey(new Date());
}

function addDays(dateKey, amount) {
  const date = parseDateKey(dateKey);
  date.setDate(date.getDate() + amount);
  return toDateKey(date);
}

function addMonths(dateKey, amount) {
  const date = parseDateKey(dateKey);
  const targetDay = date.getDate();
  date.setDate(1);
  date.setMonth(date.getMonth() + amount);
  const lastDay = new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  date.setDate(Math.min(targetDay, lastDay));
  return toDateKey(date);
}

function startOfMonth(dateKey) {
  const date = parseDateKey(dateKey);
  date.setDate(1);
  return toDateKey(date);
}

function endOfMonth(dateKey) {
  const date = parseDateKey(dateKey);
  date.setMonth(date.getMonth() + 1, 0);
  return toDateKey(date);
}

function startOfWeek(dateKey) {
  const date = parseDateKey(dateKey);
  const weekday = date.getDay();
  const diff = weekday === 0 ? -6 : 1 - weekday;
  date.setDate(date.getDate() + diff);
  return toDateKey(date);
}

function formatDateLabel(dateKey) {
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: 'short',
  }).format(parseDateKey(dateKey));
}

function formatMonthLabel(dateKey) {
  return new Intl.DateTimeFormat('pt-BR', {
    month: 'long',
    year: 'numeric',
  }).format(parseDateKey(dateKey));
}

function getIsoDateKey(dateTime) {
  return dateTime.slice(0, 10);
}
