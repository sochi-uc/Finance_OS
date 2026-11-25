import { ngn } from '../lib/format'
import { useApp } from '../state/actions'
import { Card, Empty } from '../ui/Bits'
import { RangeBar, Sparkline } from '../ui/charts'
import Icon from '../ui/Icon'

export default function Research() {
  const { data, open } = useApp()
  return (
    <div className="page">
      <header className="page-head">
        <div>
          <h1 className="page-title">Research</h1>
          <p className="page-sub">Watchlist, price zones and the plan for each name</p>
        </div>
        <div className="page-actions">
          <button type="button" className="btn btn--primary" onClick={() => open({ kind: 'watch' })}>
            <Icon name="plus" size={16} stroke={2} /> New card
          </button>
        </div>
      </header>

      {data.watchlist.length === 0 ? (
        <Card>
          <Empty icon="research" title="No research yet" body="Track a name: support, resistance, thesis and the exact plan — before money moves." />
        </Card>
      ) : (
        <div className="research-grid">
          {data.watchlist.map((w) => {
            const first = w.series[0]
            const change = first ? ((w.price - first) / first) * 100 : null
            return (
              <button key={w.ticker} type="button" className="research card" onClick={() => open({ kind: 'dossier', item: w })}>
                <div className="research-top">
                  <div>
                    <div className="research-ticker">
                      {w.ticker}
                      {w.held && <span className="pill pill--held">Held</span>}
                    </div>
                    <div className="row-sub">{w.name}</div>
                  </div>
                  <div className="research-price">
                    <span className="num strong">{ngn(w.price, true)}</span>
                    {change != null && (
                      <span className={`num small tone-${change >= 0 ? 'gain' : 'loss'}`}>
                        {change >= 0 ? '+' : '−'}
                        {Math.abs(change).toFixed(0)}%
                      </span>
                    )}
                  </div>
                </div>
                <Sparkline series={w.series} width={260} height={48} />
                {w.resistance > w.support && (
                  <div>
                    <RangeBar support={w.support} resistance={w.resistance} price={w.price} pct={w.rangePct} />
                    <div className="range-labels num">
                      <span>{ngn(w.support)}</span>
                      <span>{ngn(w.resistance)}</span>
                    </div>
                  </div>
                )}
                {w.stance && <span className="pill">{w.stance}</span>}
                {w.plan && <p className="research-plan">{w.plan}</p>}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
