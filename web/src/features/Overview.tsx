import { useMemo, useState } from 'react'
import { api } from '../api/client'
import type { Dashboard } from '../api/types'
import { ago, compact, month, ngn, pct, signed, tone, usd } from '../lib/format'
import { useApp } from '../state/actions'
import type { View } from '../state/prefs'
import { Card, Delta, Money } from '../ui/Bits'
import { AreaChart, Donut, type Slice } from '../ui/charts'
import Icon from '../ui/Icon'

const SLICE_COLORS: Record<string, string> = {
  ngx: 'var(--cat-1)',
  us: 'var(--cat-4)',
  'ngn-cash': 'var(--cat-2)',
  'usd-cash': 'var(--cat-3)',
}

export default function Overview({ go }: { go: (v: View) => void }) {
  const { data, open } = useApp()
  const v = data.valuation
  const isEmpty = data.holdings.length === 0 && v.netWorth === 0 && data.budget.length === 0

  if (isEmpty) return <Welcome />

  return (
    <div className="page">
      <Hero data={data} />

      <div className="kpis">
        <Kpi label="Investments" value={ngn(v.investmentsNgn)} sub={<Delta value={v.unrealizedPnlPct} size="sm" />} onClick={() => go('investments')} />
        <Kpi label="Cash" value={ngn(v.cashNgn)} sub={<span className="muted">{ngn(v.ngnCash)} + {usd(v.usdCash)}</span>} onClick={() => go('cash')} />
        <Kpi
          label="Unrealized P&L"
          value={signed(v.unrealizedPnl, ngn)}
          valueTone={tone(v.unrealizedPnl)}
          sub={<span className="muted">on {ngn(v.costBasisNgn)} invested</span>}
          onClick={() => go('investments')}
        />
        <Kpi
          label="Savings rate"
          value={`${data.budgetSummary.savingsRatePct.toFixed(0)}%`}
          sub={<span className="muted">of monthly income</span>}
          onClick={() => go('budget')}
          plain
        />
      </div>

      <div className="grid-2">
        <Allocation data={data} />
        <Card
          title="Top positions"
          action={
            <button type="button" className="link-btn" onClick={() => go('investments')}>
              See all <Icon name="right" size={14} />
            </button>
          }
        >
          {data.holdings.length === 0 ? (
            <p className="muted pad">No positions yet.</p>
          ) : (
            <ul className="rows">
              {data.holdings.slice(0, 5).map((h) => (
                <li key={h.ticker}>
                  <button type="button" className="row" onClick={() => open({ kind: 'trade', side: 'buy', holding: h })}>
                    <span className={`ticker-badge ticker-badge--${h.market.toLowerCase()}`}>{h.ticker.slice(0, 4)}</span>
                    <span className="row-main">
                      <span className="row-title">{h.ticker}</span>
                      <span className="row-sub">{h.name}</span>
                    </span>
                    <span className="row-end">
                      <Money className="row-title">{ngn(h.valueNgn)}</Money>
                      <Delta value={h.pnlPct} size="sm" />
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      <Card
        title="Recent activity"
        action={
          <button type="button" className="link-btn" onClick={() => go('journal')}>
            Journal <Icon name="right" size={14} />
          </button>
        }
      >
        <ul className="timeline">
          {data.activity.slice(0, 6).map((a) => (
            <li key={a.id}>
              <span className={`tl-dot${a.actor.startsWith('key:') ? ' tl-dot--agent' : ''}`} aria-hidden="true" />
              <span className="tl-text">{a.summary}</span>
              <span className="tl-meta">
                {a.actor.startsWith('key:') && <span className="pill pill--agent">{a.actor.slice(4)}</span>}
                {ago(a.at)}
              </span>
            </li>
          ))}
        </ul>
      </Card>
    </div>
  )
}

function Hero({ data }: { data: Dashboard }) {
  const v = data.valuation
  const history = data.netWorthHistory
  const points = useMemo(
    () => (history.length ? history.map((s) => ({ label: month(s.month), value: s.netWorth })) : [{ label: 'Now', value: v.netWorth }]),
    [history, v.netWorth],
  )
  const [scrub, setScrub] = useState<number | null>(null)
  const shown = scrub != null ? points[scrub]! : null
  const value = shown?.value ?? v.netWorth
  const first = points[0]?.value ?? 0
  const change = value - first
  const changePct = first ? (change / Math.abs(first)) * 100 : 0
  const t = tone(change)

  return (
    <section className="hero card card--hero">
      <div className="hero-top">
        <div>
          <div className="label">Net worth{shown ? ` · ${shown.label}` : ''}</div>
          <div className="hero-value num">
            <Money>{ngn(value)}</Money>
          </div>
          <div className={`hero-change hero-change--${t}`}>
            <Money>{signed(change, ngn)}</Money>
            <span className="num">({pct(changePct)})</span>
            <span className="muted">{points.length > 1 ? `since ${points[0]!.label}` : 'tracking starts this month'}</span>
          </div>
        </div>
        <div className="hero-side">
          <div className="hero-stat">
            <span className="label">USD rate</span>
            <span className="num">₦{data.settings.fxRate.toLocaleString()}</span>
          </div>
          {v.liabilities > 0 && (
            <div className="hero-stat">
              <span className="label">Liabilities</span>
              <Money>{ngn(v.liabilities)}</Money>
            </div>
          )}
        </div>
      </div>
      {points.length > 1 ? (
        <div className="reveal">
          <AreaChart points={points} height={190} tone={t === 'loss' ? 'loss' : 'gain'} onScrub={setScrub} ariaLabel="Net worth by month" />
        </div>
      ) : (
        <div className="hero-empty">
          <Icon name="investments" size={18} />
          <span>Your net-worth chart builds month by month — a snapshot is saved every time something changes.</span>
        </div>
      )}
    </section>
  )
}

function Kpi({
  label,
  value,
  sub,
  onClick,
  valueTone,
  plain,
}: {
  label: string
  value: string
  sub: React.ReactNode
  onClick: () => void
  valueTone?: string
  plain?: boolean
}) {
  return (
    <button type="button" className="kpi card" onClick={onClick}>
      <span className="label">{label}</span>
      {plain ? <span className="kpi-value num">{value}</span> : <Money className={`kpi-value${valueTone ? ` tone-${valueTone}` : ''}`}>{value}</Money>}
      <span className="kpi-sub">{sub}</span>
    </button>
  )
}

function Allocation({ data }: { data: Dashboard }) {
  const slices: Slice[] = data.allocation.map((a) => ({ key: a.key, label: a.label, value: a.valueNgn, color: SLICE_COLORS[a.key] ?? 'var(--text-3)' }))
  const total = slices.reduce((s, x) => s + x.value, 0)
  return (
    <Card title="Allocation">
      <div className="alloc">
        <Donut
          slices={slices}
          center={(h) => (
            <>
              <span className="label">{h ? h.label : 'Total assets'}</span>
              <Money className="donut-value">{compact(h ? h.value : total)}</Money>
              {h && <span className="muted num">{total ? ((h.value / total) * 100).toFixed(1) : 0}%</span>}
            </>
          )}
        />
        <ul className="legend">
          {data.allocation.map((a) => (
            <li key={a.key}>
              <span className="swatch" style={{ background: SLICE_COLORS[a.key] }} />
              <span className="legend-label">{a.label}</span>
              <span className="legend-pct num">{a.pct.toFixed(1)}%</span>
              <Money className="legend-value">{compact(a.valueNgn)}</Money>
            </li>
          ))}
        </ul>
      </div>
    </Card>
  )
}

function Welcome() {
  const { open, run, toast } = useApp()
  const [busy, setBusy] = useState(false)
  return (
    <div className="page">
      <section className="welcome card card--hero">
        <span className="welcome-icon" aria-hidden="true">
          <Icon name="sparkle" size={26} />
        </span>
        <h1>Welcome to Finance OS</h1>
        <p>Your net worth, Naira and dollar positions, budget and research — in one private place. Start with your balances, or explore with sample data.</p>
        <div className="welcome-actions">
          <button type="button" className="btn btn--primary btn--lg" onClick={() => open({ kind: 'balances' })}>
            Set my balances
          </button>
          <button type="button" className="btn btn--lg" onClick={() => open({ kind: 'holding' })}>
            Add a position
          </button>
          <button
            type="button"
            className="btn btn--ghost btn--lg"
            aria-busy={busy}
            onClick={async () => {
              setBusy(true)
              if (await run(() => api.loadSample())) toast('Sample portfolio loaded')
              setBusy(false)
            }}
          >
            Explore with sample data
          </button>
        </div>
        <p className="muted small">
          Coming from Finance OS v1? Import your data from <a href="#/settings">Settings</a>.
        </p>
      </section>
    </div>
  )
}
