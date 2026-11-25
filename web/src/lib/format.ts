import type { Currency } from '../api/types'

const ngnFmt = new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN', maximumFractionDigits: 0 })
const ngnFmt2 = new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN', minimumFractionDigits: 2, maximumFractionDigits: 2 })
const usdFmt = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2, maximumFractionDigits: 2 })
const compactNgn = new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN', notation: 'compact', maximumFractionDigits: 1 })
const units = new Intl.NumberFormat('en-US', { maximumFractionDigits: 8 })
const plain = new Intl.NumberFormat('en-US', { maximumFractionDigits: 2 })

/** ₦ with no kobo for large balances, with kobo for unit prices. */
export const ngn = (v: number, precise = false) => (precise ? ngnFmt2 : ngnFmt).format(v)
export const usd = (v: number) => usdFmt.format(v)
export const money = (v: number, ccy: Currency, precise = false) => (ccy === 'USD' ? usd(v) : ngn(v, precise))
export const compact = (v: number) => compactNgn.format(v)
export const qty = (v: number) => units.format(v)
export const num = (v: number) => plain.format(v)

export const signed = (v: number, f: (x: number) => string) => (v > 0 ? '+' : v < 0 ? '−' : '') + f(Math.abs(v))
export const pct = (v: number, digits = 2) => `${v > 0 ? '+' : v < 0 ? '−' : ''}${Math.abs(v).toFixed(digits)}%`
export const tone = (v: number) => (v > 0 ? 'gain' : v < 0 ? 'loss' : 'flat')

const dateFmt = new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric' })
const dateTimeFmt = new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })
const monthFmt = new Intl.DateTimeFormat(undefined, { month: 'short', year: '2-digit' })
const rtf = new Intl.RelativeTimeFormat(undefined, { numeric: 'auto' })

export const day = (iso: string) => dateFmt.format(new Date(iso))
export const dayTime = (iso: string) => dateTimeFmt.format(new Date(iso))
export const month = (yyyyMm: string) => {
  const [y, m] = yyyyMm.split('-').map(Number)
  return monthFmt.format(new Date(y ?? 2000, (m ?? 1) - 1, 1))
}

export function ago(iso: string): string {
  const s = (new Date(iso).getTime() - Date.now()) / 1000
  const a = Math.abs(s)
  if (a < 60) return 'just now'
  if (a < 3600) return rtf.format(Math.round(s / 60), 'minute')
  if (a < 86400) return rtf.format(Math.round(s / 3600), 'hour')
  if (a < 86400 * 7) return rtf.format(Math.round(s / 86400), 'day')
  return day(iso)
}

/** Parses user-typed numbers like "1,250.50" or "₦20k". Returns NaN when not a number. */
export function parseAmount(raw: string): number {
  const t = raw.trim().replace(/[₦$,\s]/g, '').toLowerCase()
  const m = /^(-?\d*\.?\d+)([km]?)$/.exec(t)
  if (!m) return Number.NaN
  const base = Number(m[1])
  return m[2] === 'k' ? base * 1e3 : m[2] === 'm' ? base * 1e6 : base
}
