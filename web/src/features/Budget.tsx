import { api } from '../api/client'
import type { BudgetCategory, BudgetLine } from '../api/types'
import { ngn } from '../lib/format'
import { useApp } from '../state/actions'
import { Card, Empty, Money } from '../ui/Bits'
import Icon from '../ui/Icon'
import { CATEGORIES } from './dialogs'

const ORDER: BudgetCategory[] = ['income', 'fixed', 'variable', 'savings', 'invest']
const COLOR: Record<BudgetCategory, string> = {
  income: 'var(--gain)',
  fixed: 'var(--cat-4)',
  variable: 'var(--cat-3)',
  savings: 'var(--cat-2)',
  invest: 'var(--cat-1)',
}

export default function Budget() {
  const { data, open, run, toast } = useApp()
  const s = data.budgetSummary
  const outflows = ORDER.filter((c) => c !== 'income')
  const outTotal = s.fixed + s.variable + s.savings + s.invest
  const byCat = (c: BudgetCategory) => data.budget.filter((l) => l.category === c)

  const remove = (l: BudgetLine) =>
    open({
      kind: 'confirm',
      title: `Delete “${l.item}”?`,
      body: 'This removes the line from your monthly plan.',
      confirm: 'Delete',
      onConfirm: async () => {
        const ok = await run(() => api.removeBudget(l.id))
        if (ok) toast('Line deleted')
        return ok
      },
    })

  return (
    <div className="page">
      <header className="page-head">
        <div>
          <h1 className="page-title">Budget</h1>
          <p className="page-sub">Your monthly plan</p>
        </div>
        <div className="page-actions">
          <button type="button" className="btn btn--primary" onClick={() => open({ kind: 'budget' })}>
            <Icon name="plus" size={16} stroke={2} /> Add line
          </button>
        </div>
      </header>

      {data.budget.length === 0 ? (
        <Card>
          <Empty
            icon="budget"
            title="Plan your month"
            body="Add income, bills and what you set aside. Finance OS tracks your savings rate."
            action={
              <button type="button" className="btn btn--primary" onClick={() => open({ kind: 'budget', category: 'income' })}>
                Add income
              </button>
            }
          />
        </Card>
      ) : (
        <>
          <div className="budget-summary card">
            <div className="budget-ring" style={{ '--p': Math.min(100, s.savingsRatePct) } as React.CSSProperties}>
              <span className="budget-ring-value num">{s.savingsRatePct.toFixed(0)}%</span>
              <span className="label">saved & invested</span>
            </div>
            <div className="budget-flow">
              <div className="budget-line-top">
                <span className="label">Income</span>
                <Money className="stat-big">{ngn(s.income)}</Money>
              </div>
              <div className="stack" role="img" aria-label="Where income goes">
                {outflows.map((c) => {
                  const v = s[c]
                  return v > 0 ? <span key={c} style={{ flexGrow: v, background: COLOR[c] }} title={`${c}: ${ngn(v)}`} /> : null
                })}
                {s.unallocated > 0 && <span className="stack-free" style={{ flexGrow: s.unallocated }} title={`Unallocated: ${ngn(s.unallocated)}`} />}
              </div>
              <ul className="legend legend--inline">
                {outflows.map((c) => (
                  <li key={c}>
                    <span className="swatch" style={{ background: COLOR[c] }} />
                    <span className="legend-label">{CATEGORIES.find((x) => x.value === c)!.label}</span>
                    <Money className="legend-value">{ngn(s[c])}</Money>
                  </li>
                ))}
                <li>
                  <span className="swatch swatch--free" />
                  <span className="legend-label">{s.unallocated >= 0 ? 'Unallocated' : 'Over budget'}</span>
                  <Money className={`legend-value${s.unallocated < 0 ? ' tone-loss' : ''}`}>{ngn(s.unallocated)}</Money>
                </li>
              </ul>
              {outTotal > s.income && <p className="form-error">Planned outflows exceed income by {ngn(outTotal - s.income)}.</p>}
            </div>
          </div>

          <div className="budget-groups">
            {ORDER.map((c) => {
              const lines = byCat(c)
              const total = lines.reduce((t, l) => t + l.amount, 0)
              const meta = CATEGORIES.find((x) => x.value === c)!
              return (
                <Card
                  key={c}
                  title={
                    <span className="cat-title">
                      <span className="swatch" style={{ background: COLOR[c] }} />
                      {meta.label}
                    </span>
                  }
                  action={
                    <span className="cat-total">
                      <Money>{ngn(total)}</Money>
                      <button type="button" className="icon-btn icon-btn--sm" onClick={() => open({ kind: 'budget', category: c })} aria-label={`Add ${meta.label} line`}>
                        <Icon name="plus" size={15} />
                      </button>
                    </span>
                  }
                >
                  {lines.length === 0 ? (
                    <p className="muted small pad">{meta.hint}</p>
                  ) : (
                    <ul className="rows">
                      {lines.map((l) => (
                        <li key={l.id} className="row row--static">
                          <span className="row-main">
                            <span className="row-title">{l.item}</span>
                            {l.notes && <span className="row-sub">{l.notes}</span>}
                          </span>
                          <Money className="row-end strong">{ngn(l.amount)}</Money>
                          <span className="row-actions row-actions--hover">
                            <button type="button" className="icon-btn icon-btn--sm" onClick={() => open({ kind: 'budget', line: l })} aria-label={`Edit ${l.item}`}>
                              <Icon name="pencil" size={14} />
                            </button>
                            <button type="button" className="icon-btn icon-btn--sm" onClick={() => remove(l)} aria-label={`Delete ${l.item}`}>
                              <Icon name="trash" size={14} />
                            </button>
                          </span>
                        </li>
                      ))}
                    </ul>
                  )}
                </Card>
              )
            })}
          </div>
        </>
      )}
    </div>
  )
}
