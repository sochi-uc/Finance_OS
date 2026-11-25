import type { ApiKey, BudgetCategory, Dashboard, Market, ProblemDetails, Side, User } from './types'

// Sent on every request. The API rejects cookie-authenticated writes without it (CSRF guard):
// a cross-site form can't set custom headers, and a cross-site fetch would need a CORS preflight
// that the API never grants.
const CLIENT_HEADER = { 'X-Finance-Client': 'web' } as const

export class ApiError extends Error {
  readonly status: number
  readonly problem: ProblemDetails | null

  constructor(status: number, problem: ProblemDetails | null) {
    super(messageFor(status, problem))
    this.name = 'ApiError'
    this.status = status
    this.problem = problem
  }

  fieldError(field: string): string | undefined {
    return this.problem?.errors?.[field]?.[0]
  }
}

function messageFor(status: number, p: ProblemDetails | null): string {
  const first = p?.errors && Object.values(p.errors).flat()[0]
  if (first) return first
  if (p?.detail) return p.detail
  if (status === 0) return 'You appear to be offline.'
  if (status === 429) return 'Too many requests — give it a moment.'
  if (status === 403) return 'Not allowed.'
  return p?.title ?? `Request failed (${status}).`
}

let onUnauthorized: () => void = () => {}
export const setUnauthorizedHandler = (fn: () => void) => {
  onUnauthorized = fn
}

export async function request<T>(path: string, init: { method?: string; body?: unknown; signal?: AbortSignal } = {}): Promise<T> {
  const headers: Record<string, string> = { ...CLIENT_HEADER, Accept: 'application/json' }
  if (init.body !== undefined) headers['Content-Type'] = 'application/json'

  let res: Response
  try {
    res = await fetch(`/api${path}`, {
      method: init.method ?? 'GET',
      headers,
      credentials: 'same-origin',
      body: init.body === undefined ? undefined : JSON.stringify(init.body),
      signal: init.signal,
    })
  } catch (err) {
    if ((err as Error).name === 'AbortError') throw err
    throw new ApiError(0, null)
  }

  if (res.status === 401 && !path.startsWith('/auth/login')) onUnauthorized()
  if (res.status === 204) return undefined as T
  const data = res.headers.get('Content-Type')?.includes('json') ? await res.json().catch(() => null) : null
  if (!res.ok) throw new ApiError(res.status, data as ProblemDetails | null)
  return data as T
}

const post = <T = Dashboard>(path: string, body?: unknown) => request<T>(path, { method: 'POST', body: body ?? {} })
const put = <T = Dashboard>(path: string, body: unknown) => request<T>(path, { method: 'PUT', body })
const del = <T = Dashboard>(path: string) => request<T>(path, { method: 'DELETE' })
const seg = encodeURIComponent

export const api = {
  me: () => request<User>('/auth/me'),
  login: (email: string, password: string) => post<User>('/auth/login', { email, password }),
  register: (email: string, password: string, displayName: string) => post<User>('/auth/register', { email, password, displayName }),
  logout: () => post<void>('/auth/logout'),

  portfolio: (signal?: AbortSignal) => request<Dashboard>('/portfolio', { signal }),

  trade: (t: { side: Side; ticker: string; market: Market; units: number; price: number; settleFromCash: boolean; note?: string }) =>
    post('/trades', t),
  upsertHolding: (ticker: string, h: { name?: string; market: Market; units: number; avgCost: number; price: number; strategy?: string }) =>
    put(`/holdings/${seg(ticker)}`, h),
  removeHolding: (ticker: string) => del(`/holdings/${seg(ticker)}`),
  prices: (prices: Record<string, number>) => post('/prices', { prices }),

  setFx: (rate: number, source?: string) => post('/fx', { rate, source }),
  fundUsd: (b: { usd: number; rate?: number; feeNgn?: number; historical?: boolean; note?: string }) => post('/usd/fund', b),
  convertUsd: (b: { usd: number; rate?: number; note?: string }) => post('/usd/convert', b),
  balances: (b: { ngnCash?: number; usdCash?: number; liabilities?: number; note?: string }) => put('/balances', b),
  settings: (usdFeeRate: number) => put('/settings', { usdFeeRate }),

  addBudget: (b: { category: BudgetCategory; item: string; amount: number; notes?: string }) => post('/budget', b),
  updateBudget: (id: string, b: { category: BudgetCategory; item: string; amount: number; notes?: string }) => put(`/budget/${id}`, b),
  removeBudget: (id: string) => del(`/budget/${id}`),

  upsertWatch: (ticker: string, w: Record<string, unknown>) => put(`/watchlist/${seg(ticker)}`, w),
  removeWatch: (ticker: string) => del(`/watchlist/${seg(ticker)}`),

  addNote: (text: string) => post('/notes', { text }),
  removeNote: (id: number) => del(`/notes/${id}`),

  loadSample: () => post('/portfolio/sample'),
  importLegacy: (state: unknown) => post('/import/legacy', state),

  keys: () => request<ApiKey[]>('/keys'),
  createKey: (name: string, readOnly: boolean) => post<{ key: ApiKey; secret: string }>('/keys', { name, readOnly }),
  revokeKey: (id: string) => del<void>(`/keys/${id}`),
}
