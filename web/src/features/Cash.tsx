import { useMemo } from 'react'
import { day, ngn, usd } from '../lib/format'
import { useApp } from '../state/actions'
import { Card, Money } from '../ui/Bits'
import { AreaChart } from '../ui/charts'
import Icon from '../ui/Icon'

export default function Cash() {
  const { data, open } = useApp()
  const v = data.valuation
  const fx = data.settings.fxRate
  const fxPoints = useMemo(() => data.fxHistory.map((q) => ({ label: day(q.at), value: q.rate })), [data.fxHistory])
  const fxVsCost = v.avgUsdCost ? ((fx - v.avgUsdCost) / v.avgUsdCost) * 100 : 0

  return (
    <div className="page">
      <header className="page-head">
        <div>
          <h1 className="page-title">Cash</h1>
          <p className="page-sub">
            <Money>{ngn(v.cashNgn)}</Money> across Naira and dollars
          </p>
        </div>
        <div className="page-actions">
          <button type="button" className="btn" onClick={() => open({ kind: 'balances' })}>
            <Icon name="pencil" size={15} /> Set balances
          </button>
        </div>
      </header>

      <div className="wallets">
        <article className="wallet wallet--ngn">
          <div className="wallet-head">
            <span className="wallet-flag" aria-hidden="true">₦</span>
            <span className="label">Naira cash</span>
          </div>
          <Money className="wallet-value">{ngn(v.ngnCash, true)}</Money>
          <div className="wallet-actions">
            <button type="button" className="btn btn--glass" onClick={() => open({ kind: 'fund' })}>
              <Icon name="swap" size={15} /> Buy dollars
            </button>
          </div>
        </article>

        <article className="wallet wallet--usd">
          <div className="wallet-head">
            <span className="wallet-flag" aria-hidden="true">$</span>
            <span className="label">Dollar wallet</span>
          </div>
          <Money className="wallet-value">{usd(v.usdCash)}</Money>
          <Money className="wallet-sub">≈ {ngn(v.usdCash * fx)}</Money>
          <div className="wallet-actions">
            <button type="button" className="btn btn--glass" onClick={() => open({ kind: 'fund' })}>
              <Icon name="plus" size={15} /> Add
            </button>
            <button type="button" className="btn btn--glass" onClick={() => open({ kind: 'convert' })} disabled={v.usdCash <= 0}>
              <Icon name="swap" size={15} /> To Naira
            </button>
          </div>
        </article>
      </div>

      <div className="grid-2">
        <Card
          title="Exchange rate"
          action={
            <button type="button" className="btn btn--sm" onClick={() => open({ kind: 'fx' })}>
              Update
            </button>
          }
        >
          <div className="stat-row">
            <div>
              <span className="label">Current</span>
              <span className="stat-big num">₦{fx.toLocaleString(undefined, { maximumFractionDigits: 2 })}</span>
            </div>
            {v.avgUsdCost > 0 && (
              <div>
                <span className="label">Your average cost</span>
                <span className="stat-big num">₦{v.avgUsdCost.toLocaleString(undefined, { maximumFractionDigits: 2 })}</span>
                <span className={`muted small tone-${fxVsCost >= 0 ? 'gain' : 'loss'}`}>
                  {fxVsCost >= 0 ? 'Dollars bought below today’s rate' : 'Rate is below your cost'} ({fxVsCost.toFixed(1)}%)
                </span>
              </div>
            )}
          </div>
          {fxPoints.length > 1 ? (
            <AreaChart points={fxPoints} height={150} ariaLabel="Naira per dollar over time" />
          ) : (
            <p className="muted small">Log rates as they change to build a history.</p>
          )}
        </Card>

        <Card title="Dollar funding">
          <dl className="facts">
            <div>
              <dt>Total funded</dt>
              <dd>
                <Money>{usd(v.usdFunded)}</Money>
              </dd>
            </div>
            <div>
              <dt>Naira spent</dt>
              <dd>
                <Money>{ngn(v.usdFunded * v.avgUsdCost)}</Money>
              </dd>
            </div>
            <div>
              <dt>US trading fee</dt>
              <dd>
                <button type="button" className="link-btn" onClick={() => open({ kind: 'fee' })}>
                  {(data.settings.usdFeeRate * 100).toFixed(2)}% <Icon name="pencil" size={13} />
                </button>
              </dd>
            </div>
            <div>
              <dt>Liabilities</dt>
              <dd>
                <Money>{ngn(v.liabilities)}</Money>
              </dd>
            </div>
          </dl>
        </Card>
      </div>
    </div>
  )
}
