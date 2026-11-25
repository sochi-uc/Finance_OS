// Mirrors server/src/FinanceOs.Application/Contracts.cs (camelCase JSON).

export type Market = 'NGX' | 'US'
export type Currency = 'NGN' | 'USD'
export type Side = 'buy' | 'sell'
export type BudgetCategory = 'income' | 'fixed' | 'variable' | 'savings' | 'invest'
export type LedgerKind = 'buy' | 'sell' | 'fund-usd' | 'convert-usd' | 'adjustment'

export interface User {
  email: string
  displayName: string
}

export interface Valuation {
  netWorth: number
  cashNgn: number
  ngnCash: number
  usdCash: number
  investmentsNgn: number
  costBasisNgn: number
  liabilities: number
  unrealizedPnl: number
  unrealizedPnlPct: number
  avgUsdCost: number
  usdFunded: number
}

export interface Holding {
  ticker: string
  name: string
  market: Market
  currency: Currency
  units: number
  avgCost: number
  price: number
  marketValue: number
  costBasis: number
  valueNgn: number
  pnl: number
  pnlPct: number
  weightPct: number
  strategy: string
}

export interface AllocationSlice {
  key: 'ngx' | 'us' | 'ngn-cash' | 'usd-cash'
  label: string
  valueNgn: number
  pct: number
}

export interface BudgetLine {
  id: string
  category: BudgetCategory
  item: string
  amount: number
  notes: string
}

export interface BudgetSummary {
  income: number
  fixed: number
  variable: number
  savings: number
  invest: number
  unallocated: number
  savingsRatePct: number
}

export interface WatchItem {
  ticker: string
  name: string
  price: number
  support: number
  resistance: number
  rangePct: number
  stance: string
  signals: string
  thesis: string
  plan: string
  series: number[]
  held: boolean
}

export interface LedgerEntry {
  id: number
  at: string
  kind: LedgerKind
  ticker: string | null
  units: number
  price: number
  currency: Currency
  amount: number
  fee: number
  note: string
  actor: string
}

export interface Note {
  id: number
  at: string
  author: string
  text: string
}

export interface Activity {
  id: number
  at: string
  actor: string
  summary: string
}

export interface FxPoint {
  at: string
  rate: number
  source: string
}

export interface NetWorthPoint {
  month: string
  cash: number
  investments: number
  liabilities: number
  netWorth: number
}

export interface Dashboard {
  version: number
  settings: { fxRate: number; usdFeeRate: number }
  valuation: Valuation
  holdings: Holding[]
  allocation: AllocationSlice[]
  budget: BudgetLine[]
  budgetSummary: BudgetSummary
  watchlist: WatchItem[]
  ledger: LedgerEntry[]
  notes: Note[]
  activity: Activity[]
  fxHistory: FxPoint[]
  netWorthHistory: NetWorthPoint[]
}

export interface ApiKey {
  id: string
  name: string
  prefix: string
  readOnly: boolean
  createdAt: string
  lastUsedAt: string | null
}

export interface ProblemDetails {
  title?: string
  detail?: string
  errors?: Record<string, string[]>
}
