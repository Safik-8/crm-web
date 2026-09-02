import {
  formatCurrency as baseFormatCurrency,
  formatCurrencyShort as baseFormatCurrencyShort,
} from "./formatters";

/**
 * Short currency formatter (e.g. ₹1.2Cr, ₹5L, ₹10k, ₹500 or $1.2M, $500k)
 */
export const formatCurrencyShort = (val, symbol = "₹") => {
  return baseFormatCurrencyShort(val, symbol);
};

/**
 * Full currency formatter (e.g. ₹1,23,456)
 */
export const formatCurrencyFull = (val, symbol = "₹") => {
  return baseFormatCurrency(val, symbol);
};

/**
 * Transforms status distribution object into [{ name, value }] array for Pie charts
 * @param {Object} statusDistribution - e.g. { "NEW": 12, "QUALIFIED": 8 }
 */
export const toStatusPieData = (statusDistribution = {}) => {
  if (!statusDistribution || typeof statusDistribution !== 'object') return [];
  return Object.entries(statusDistribution).map(([name, value]) => ({
    name,
    value: Number(value) || 0,
  }));
};

/**
 * Transforms monthly trend data for line/bar charts
 */
export const toMonthlyTrendData = (monthlyTrend = []) => {
  if (!Array.isArray(monthlyTrend)) return [];
  return monthlyTrend.map((item) => ({
    ...item,
    name: item.monthName || item.month || 'Unknown',
    revenue: Number(item.revenue || 0),
    previousYearRevenue: Number(item.previousYearRevenue || 0),
  }));
};

/**
 * Transforms quarterly trend data for line/bar charts
 */
export const toQuarterlyTrendData = (quarterlyTrend = []) => {
  if (!Array.isArray(quarterlyTrend)) return [];
  return quarterlyTrend.map((item) => ({
    ...item,
    name: item.quarter || 'Unknown',
    revenue: Number(item.revenue || 0),
  }));
};

/**
 * Aggregates BDE performance array into sales funnel stages with drop rates
 */
export const toPipelineFunnelData = (bdeData = []) => {
  if (!Array.isArray(bdeData)) return [];

  const totalLeads = bdeData.reduce((acc, curr) => acc + (curr.leadsAssigned || 0), 0);
  const qualified = bdeData.reduce((acc, curr) => acc + (curr.qualifiedLeads || 0), 0);
  const opportunities = bdeData.reduce((acc, curr) => acc + (curr.opportunitiesCreated || 0), 0);
  const dealsWon = bdeData.reduce((acc, curr) => acc + (curr.dealsWon || 0), 0);

  const rawStages = [
    { stage: 'Assigned Leads', count: totalLeads, color: '#6366f1' },
    { stage: 'Qualified Leads', count: qualified, color: '#3b82f6' },
    { stage: 'Opportunities', count: opportunities, color: '#f59e0b' },
    { stage: 'Deals Won', count: dealsWon, color: '#10b981' },
  ];

  return rawStages.map((item, index, arr) => {
    const prevCount = index > 0 ? arr[index - 1].count : item.count;
    const dropCount = prevCount > item.count ? prevCount - item.count : 0;
    const dropPct = prevCount > 0 ? Number(((dropCount / prevCount) * 100).toFixed(1)) : 0;
    const conversionFromStart = totalLeads > 0 ? Number(((item.count / totalLeads) * 100).toFixed(1)) : 0;

    return {
      ...item,
      name: item.stage,
      value: item.count,
      dropCount,
      dropPct,
      conversionFromStart,
    };
  });
};

/**
 * Maps team performance data into bar dataset
 */
export const toTeamRevenueBarData = (teamData = []) => {
  if (!Array.isArray(teamData)) return [];
  return teamData.map((t) => ({
    ...t,
    name: t.teamName || t.teamCode || 'Team',
    revenue: Number(t.totalRevenue || 0),
    deals: Number(t.dealsWon || 0),
  }));
};

/**
 * Transforms dashboard metric cards array into bar chart data format
 */
export const toDashboardBarData = (cards = [], chartColors = {}) => {
  if (!Array.isArray(cards)) return [];
  return cards.map((c) => ({
    label: c.label,
    stageName: c.stageName,
    key: c.key,
    count: Number(c.count || 0),
    color: chartColors[c.key] || chartColors.fallback || '#94a3b8',
  }));
};

/**
 * Pad missing calendar months with 0 revenue for smooth line rendering
 */
export const fillMissingMonths = (data = [], year = new Date().getFullYear()) => {
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const dataMap = new Map((data || []).map((d) => [d.monthName || d.name, d]));

  return monthNames.map((month) => {
    if (dataMap.has(month)) {
      return dataMap.get(month);
    }
    return {
      monthName: month,
      name: month,
      revenue: 0,
      previousYearRevenue: 0,
      year,
    };
  });
};
