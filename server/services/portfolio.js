import { db, getStateData } from '../db.js';

export const valueInNgn = (holding, fxRate) =>
  holding.units * holding.price * (holding.ccy === 'USD' ? fxRate : 1);

export const formatNumber = (num) =>
  Math.round(num).toLocaleString('en-US');

/**
 * Persists an end-of-month snapshot of consolidated assets and liabilities
 */
export function takeSnapshot(now = new Date()) {
  const state = getStateData();
  const fx = state.settings.fx || 1;
  const investments = state.holdings.reduce((sum, h) => sum + valueInNgn(h, fx), 0);
  const monthKey = now.toLocaleString('en-US', { month: 'short', year: 'numeric' });

  db.prepare(`
    insert into networth values(?,?,?,?)
    on conflict(month) do update set
      cash = excluded.cash,
      investments = excluded.investments,
      liabilities = excluded.liabilities
  `).run(
    monthKey,
    state.settings.cash + (state.settings.usd_cash || 0) * fx,
    Math.round(investments * 100) / 100,
    state.settings.liabilities || 0
  );
}

/**
 * Calculates current portfolio totals and returns high-level metrics
 */
export function calculatePortfolioMetrics() {
  const state = getStateData();
  const fx = state.settings.fx || 1;
  const investments = state.holdings.reduce((sum, h) => sum + valueInNgn(h, fx), 0);
  const totalCost = state.holdings.reduce(
    (sum, h) => sum + h.units * h.avg * (h.ccy === 'USD' ? fx : 1),
    0
  );
  const netWorth = state.settings.cash + (state.settings.usd_cash || 0) * fx + investments - (state.settings.liabilities || 0);
  const pnlPercent = totalCost ? ((investments / totalCost - 1) * 100).toFixed(2) : '0.00';

  return {
    netWorth,
    investments,
    totalCost,
    pnlPercent,
    cash: state.settings.cash,
    usdCash: state.settings.usd_cash || 0,
    fx,
    liabilities: state.settings.liabilities || 0,
  };
}
