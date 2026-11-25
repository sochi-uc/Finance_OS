import { useMemo, useState } from 'react'
import { api } from '../api/client'
import type { Holding } from '../api/types'
import { money, ngn, qty, signed, tone } from '../lib/format'
import { useApp } from '../state/actions'
import { Card, Delta, Empty, Money, Segmented } from '../ui/Bits'
import Icon from '../ui/Icon'

type Filter = 'all' | 'NGX' | 'US'
type Sort = 'value' | 'pnl' | 'name'

export default function Investments() {
  const { data, open, run, toast } = useApp()
  const [filter, setFilter] = useState<Filter>('all')
  const [sort, setSort] = useState<Sort>('value')

  const rows = useMemo(() => {
    const list = data.holdings.filter((h) => filter === 'all' || h.market === filter)
    return [...list].sort((a, b) => (sort === 'name' ? a.ticker.localeCompare(b.ticker) : sort === 'pnl' ? b.pnlPct - a.pnlPct : b.valueNgn - a.valueNgn))
  }, [data.holdings, filter, sort])

  const value = rows.reduce((s, h) => s + h.valueNgn, 0)
  const cost = rows.reduce((s, h) => s + (h.currency === 'USD' ? h.costBasis * data.settings.fxRate : h.costBasis), 0)
  const pnl = value - cost

  const remove = (h: Holding) =>
    open({
      kind: 'confirm',
      title: `Remove ${h.ticker}?`,
      body: 'This deletes the position without recording a sale. To record proceeds, use Sell instead.',
      confirm: 'Remove',
      onConfirm: async () => {
        const ok = await run(() => api.removeHolding(h.ticker))
        if (ok) toast(`${h.ticker} removed`)
        return ok
      },
    })

  return (
    <div className="page">
      <header className="page-head">
        <div>
          <h1 className="page-title">Investments</h1>
          <p className="page-sub">
            <Money>{ngn(value)}</Money>
            <span className={`tone-${tone(pnl)}`}>
              <Money> {signed(pnl, ngn)}</Money>
            </span>{' '}
            unrealized
          </p>
        </div>
        <div className="page-actions">
          <button type="button" className="btn" onClick={() => open({ kind: 'prices' })} disabled={!data.holdings.length}>
            <Icon name="swap" size={16} /> Update prices
          </button>
          <button type="button" className="btn" onClick={() => open({ kind: 'trade', side: 'sell' })} disabled={!data.holdings.length}>
            Sell
          </button>
          <button type="button" className="btn btn--primary" onClick={() => open({ kind: 'trade', side: 'buy' })}>
            <Icon name="plus" size={16} stroke={2} /> Buy
          </button>
        </div>
      </header>

      <div className="toolbar">
        <Segmented
          label="Market"
          value={filter}
          onChange={setFilter}
          options={[
            { value: 'all', label: 'All' },
            { value: 'NGX', label: 'Naira · NGX' },
            { value: 'US', label: 'Dollar · US' },
          ]}
        />
        <Segmented
          label="Sort"
          value={sort}
          onChange={setSort}
          options={[
            { value: 'value', label: 'Value' },
            { value: 'pnl', label: 'Return' },
            { value: 'name', label: 'A–Z' },
          ]}
        />
      </div>

      {rows.length === 0 ? (
        <Card>
          <Empty
            icon="investments"
            title="No positions"
            body={filter === 'all' ? 'Record your first buy, or add an existing position.' : 'Nothing in this market yet.'}
            action={
              <div className="row-actions">
                <button type="button" className="btn btn--primary" onClick={() => open({ kind: 'trade', side: 'buy' })}>
                  Buy
                </button>
                <button type="button" className="btn" onClick={() => open({ kind: 'holding' })}>
                  Add existing position
                </button>
              </div>
            }
          />
        </Card>
      ) : (
        <Card className="card--flush">
          <div className="table-wrap">
            <table className="table">
              <caption className="sr-only">Holdings</caption>
              <thead>
                <tr>
                  <th scope="col">Asset</th>
                  <th scope="col" className="r">Units</th>
                  <th scope="col" className="r hide-sm">Avg cost</th>
                  <th scope="col" className="r">Price</th>
                  <th scope="col" className="r">Value</th>
                  <th scope="col" className="r">Return</th>
                  <th scope="col" className="r hide-sm">Weight</th>
                  <th scope="col"><span className="sr-only">Actions</span></th>
                </tr>
              </thead>
              <tbody>
                {rows.map((h) => (
                  <tr key={h.ticker}>
                    <th scope="row">
                      <div className="asset">
                        <span className={`ticker-badge ticker-badge--${h.market.toLowerCase()}`}>{h.ticker.slice(0, 4)}</span>
                        <span>
                          <span className="row-title">{h.ticker}</span>
                          <span className="row-sub">{h.name}</span>
                        </span>
                      </div>
                    </th>
                    <td className="r num">
                      <Money>{qty(h.units)}</Money>
                    </td>
                    <td className="r num hide-sm">{money(h.avgCost, h.currency, true)}</td>
                    <td className="r num">{money(h.price, h.currency, true)}</td>
                    <td className="r">
                      <Money className="strong">{money(h.marketValue, h.currency)}</Money>
                      {h.currency === 'USD' && <Money className="row-sub">{ngn(h.valueNgn)}</Money>}
                    </td>
                    <td className="r">
                      <Delta value={h.pnlPct} size="sm" />
                      <Money className={`row-sub tone-${tone(h.pnl)}`}>{signed(h.pnl, (x) => money(x, h.currency))}</Money>
                    </td>
                    <td className="r hide-sm">
                      <span className="weight">
                        <span className="weight-bar" style={{ inlineSize: `${Math.min(100, h.weightPct)}%` }} />
                        <span className="num">{h.weightPct.toFixed(1)}%</span>
                      </span>
                    </td>
                    <td className="r">
                      <span className="row-actions">
                        <button type="button" className="btn btn--sm" onClick={() => open({ kind: 'trade', side: 'buy', holding: h })}>
                          Buy
                        </button>
                        <button type="button" className="btn btn--sm" onClick={() => open({ kind: 'trade', side: 'sell', holding: h })}>
                          Sell
                        </button>
                        <button type="button" className="icon-btn icon-btn--sm" onClick={() => open({ kind: 'holding', holding: h })} aria-label={`Edit ${h.ticker}`}>
                          <Icon name="pencil" size={15} />
                        </button>
                        <button type="button" className="icon-btn icon-btn--sm" onClick={() => remove(h)} aria-label={`Remove ${h.ticker}`}>
                          <Icon name="trash" size={15} />
                        </button>
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
      {data.holdings.some((h) => h.strategy) && (
        <Card title="Why you own them">
          <ul className="strategies">
            {data.holdings
              .filter((h) => h.strategy)
              .map((h) => (
                <li key={h.ticker}>
                  <span className="strong">{h.ticker}</span>
                  <span className="muted">{h.strategy}</span>
                </li>
              ))}
          </ul>
        </Card>
      )}
    </div>
  )
}
