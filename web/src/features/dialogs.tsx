import { useMemo, useRef, useState } from 'react'
import { api } from '../api/client'
import type { BudgetCategory, BudgetLine, Holding, Market, Side, WatchItem } from '../api/types'
import { money, ngn, parseAmount, qty, usd } from '../lib/format'
import { useApp, useSubmit, type DialogSpec } from '../state/actions'
import { Field, Money, Segmented } from '../ui/Bits'
import { RangeBar, Sparkline } from '../ui/charts'
import Dialog, { FormDialog } from '../ui/Dialog'
import Icon from '../ui/Icon'
import Select from '../ui/Select'

const isNum = (s: string) => Number.isFinite(parseAmount(s))
const n = (s: string) => parseAmount(s)
const opt = (s: string) => (s.trim() === '' ? undefined : parseAmount(s))

/** Renders whichever dialog is open. */
export function DialogHost({ spec, onClose }: { spec: DialogSpec | null; onClose: () => void }) {
  if (!spec) return null
  const p = { onClose }
  switch (spec.kind) {
    case 'trade':
      return <TradeDialog {...p} side={spec.side} holding={spec.holding} ticker={spec.ticker} />
    case 'holding':
      return <HoldingDialog {...p} holding={spec.holding} />
    case 'prices':
      return <PricesDialog {...p} />
    case 'fund':
      return <FundDialog {...p} />
    case 'convert':
      return <ConvertDialog {...p} />
    case 'fx':
      return <FxDialog {...p} />
    case 'balances':
      return <BalancesDialog {...p} />
    case 'fee':
      return <FeeDialog {...p} />
    case 'budget':
      return <BudgetDialog {...p} line={spec.line} category={spec.category} />
    case 'watch':
      return <WatchDialog {...p} item={spec.item} />
    case 'dossier':
      return <DossierDialog {...p} item={spec.item} />
    case 'confirm':
      return <ConfirmDialog {...p} {...spec} />
  }
}

type P = { onClose: () => void }

// ------------------------------------------------------------------ trade

function TradeDialog({ onClose, side: initialSide, holding, ticker: presetTicker }: P & { side: Side; holding?: Holding; ticker?: string }) {
  const { data, run, toast } = useApp()
  const [side, setSide] = useState<Side>(initialSide)
  const [ticker, setTicker] = useState(holding?.ticker ?? presetTicker ?? '')
  const [market, setMarket] = useState<Market>(holding?.market ?? 'NGX')
  const [units, setUnits] = useState('')
  const [price, setPrice] = useState(holding ? String(holding.price) : '')
  const [settle, setSettle] = useState(true)
  const [note, setNote] = useState('')
  const { busy, errors, submit } = useSubmit()
  const first = useRef<HTMLInputElement>(null)

  const known = data.holdings.find((h) => h.ticker === ticker.trim().toUpperCase())
  const mkt = known?.market ?? market
  const ccy = mkt === 'US' ? 'USD' : 'NGN'
  const gross = isNum(units) && isNum(price) ? n(units) * n(price) : 0
  const fee = ccy === 'USD' ? gross * data.settings.usdFeeRate : 0
  const total = side === 'buy' ? gross + fee : gross - fee
  const available = ccy === 'USD' ? data.valuation.usdCash : data.valuation.ngnCash
  const short = side === 'buy' && (ccy === 'USD' || settle) && total > available
  const can = ticker.trim() !== '' && isNum(units) && n(units) > 0 && isNum(price) && n(price) > 0

  return (
    <FormDialog
      open
      onClose={onClose}
      title={side === 'buy' ? 'Buy' : 'Sell'}
      subtitle={known ? `${known.name} · you hold ${qty(known.units)}` : 'Record a trade'}
      submitLabel={side === 'buy' ? 'Buy' : 'Sell'}
      busy={busy}
      canSubmit={can}
      initialFocus={holding ? undefined : first}
      onSubmit={() =>
        submit(async () => {
          const ok = await run(
            () => api.trade({ side, ticker: ticker.trim(), market: mkt, units: n(units), price: n(price), settleFromCash: settle, note }),
            { rethrowValidation: true },
          )
          if (ok) {
            toast(`${side === 'buy' ? 'Bought' : 'Sold'} ${qty(n(units))} ${ticker.toUpperCase()}`)
            onClose()
          }
          return ok
        })
      }
    >
      <Segmented
        label="Side"
        value={side}
        onChange={setSide}
        options={[
          { value: 'buy', label: 'Buy' },
          { value: 'sell', label: 'Sell' },
        ]}
      />
      <div className="form-row">
        <Field label="Ticker" error={errors.ticker}>
          <input ref={first} className="input input--caps" value={ticker} onChange={(e) => setTicker(e.target.value)} maxLength={15} placeholder="UCAP" autoComplete="off" />
        </Field>
        <Field label="Market" error={errors.market}>
          {known ? (
            <input className="input" value={known.market === 'US' ? 'US · USD' : 'NGX · NGN'} readOnly />
          ) : (
            <Select
              label="Market"
              value={market}
              onChange={setMarket}
              options={[
                { value: 'NGX', label: 'NGX', hint: 'Naira' },
                { value: 'US', label: 'US', hint: 'Dollar' },
              ]}
            />
          )}
        </Field>
      </div>
      <div className="form-row">
        <Field label="Units" error={errors.units}>
          <input className="input num" inputMode="decimal" value={units} onChange={(e) => setUnits(e.target.value)} placeholder="0" />
        </Field>
        <Field label={`Price (${ccy})`} error={errors.price}>
          <input className="input num" inputMode="decimal" value={price} onChange={(e) => setPrice(e.target.value)} placeholder="0.00" />
        </Field>
      </div>
      {ccy === 'NGN' && (
        <label className="check">
          <input type="checkbox" checked={settle} onChange={(e) => setSettle(e.target.checked)} />
          <span>{side === 'buy' ? 'Pay from Naira cash' : 'Credit proceeds to Naira cash'}</span>
        </label>
      )}
      <Field label="Note" hint="Why this trade? It's saved to your ledger.">
        <input className="input" value={note} onChange={(e) => setNote(e.target.value)} maxLength={500} />
      </Field>
      <div className="summary">
        <div>
          <span>{side === 'buy' ? 'Total cost' : 'Proceeds'}</span>
          <Money className="summary-big">{money(total, ccy, true)}</Money>
        </div>
        {ccy === 'USD' && (
          <div>
            <span>Fee ({(data.settings.usdFeeRate * 100).toFixed(1)}%)</span>
            <Money>{usd(fee)}</Money>
          </div>
        )}
        {(ccy === 'USD' || settle) && (
          <div className={short ? 'is-bad' : ''}>
            <span>Available</span>
            <Money>{money(available, ccy, true)}</Money>
          </div>
        )}
      </div>
    </FormDialog>
  )
}

// ------------------------------------------------------------------ positions

function HoldingDialog({ onClose, holding }: P & { holding?: Holding }) {
  const { run, toast } = useApp()
  const [ticker, setTicker] = useState(holding?.ticker ?? '')
  const [name, setName] = useState(holding?.name ?? '')
  const [market, setMarket] = useState<Market>(holding?.market ?? 'NGX')
  const [units, setUnits] = useState(holding ? String(holding.units) : '')
  const [avg, setAvg] = useState(holding ? String(holding.avgCost) : '')
  const [price, setPrice] = useState(holding ? String(holding.price) : '')
  const [strategy, setStrategy] = useState(holding?.strategy ?? '')
  const { busy, errors, submit } = useSubmit()
  const first = useRef<HTMLInputElement>(null)
  const can = ticker.trim() !== '' && isNum(units) && isNum(avg)

  return (
    <FormDialog
      open
      onClose={onClose}
      title={holding ? `Edit ${holding.ticker}` : 'Add a position'}
      subtitle="Sets the position directly — use Buy/Sell to record trades that move cash."
      submitLabel="Save"
      busy={busy}
      canSubmit={can}
      initialFocus={first}
      onSubmit={() =>
        submit(async () => {
          const ok = await run(
            () => api.upsertHolding(ticker.trim(), { name, market, units: n(units), avgCost: n(avg), price: opt(price) ?? n(avg), strategy }),
            { rethrowValidation: true },
          )
          if (ok) {
            toast(holding ? 'Position updated' : 'Position added')
            onClose()
          }
          return ok
        })
      }
    >
      <div className="form-row">
        <Field label="Ticker" error={errors.ticker}>
          <input ref={first} className="input input--caps" value={ticker} onChange={(e) => setTicker(e.target.value)} readOnly={!!holding} maxLength={15} />
        </Field>
        <Field label="Market" error={errors.market}>
          <Select label="Market" value={market} onChange={setMarket} options={[{ value: 'NGX', label: 'NGX', hint: 'Naira' }, { value: 'US', label: 'US', hint: 'Dollar' }]} />
        </Field>
      </div>
      <Field label="Name" error={errors.name}>
        <input className="input" value={name} onChange={(e) => setName(e.target.value)} maxLength={80} placeholder="Company name" />
      </Field>
      <div className="form-row form-row--3">
        <Field label="Units" error={errors.units}>
          <input className="input num" inputMode="decimal" value={units} onChange={(e) => setUnits(e.target.value)} />
        </Field>
        <Field label="Avg cost" error={errors.avgCost}>
          <input className="input num" inputMode="decimal" value={avg} onChange={(e) => setAvg(e.target.value)} />
        </Field>
        <Field label="Last price" error={errors.price}>
          <input className="input num" inputMode="decimal" value={price} onChange={(e) => setPrice(e.target.value)} placeholder="= avg" />
        </Field>
      </div>
      <Field label="Strategy" error={errors.strategy} hint="One line on why you own it.">
        <input className="input" value={strategy} onChange={(e) => setStrategy(e.target.value)} maxLength={200} />
      </Field>
    </FormDialog>
  )
}

function PricesDialog({ onClose }: P) {
  const { data, run, toast } = useApp()
  const [prices, setPrices] = useState<Record<string, string>>(() => Object.fromEntries(data.holdings.map((h) => [h.ticker, String(h.price)])))
  const { busy, errors, submit } = useSubmit()
  const changed = Object.entries(prices).filter(([t, v]) => isNum(v) && n(v) !== data.holdings.find((h) => h.ticker === t)?.price)

  return (
    <FormDialog
      open
      onClose={onClose}
      title="Update prices"
      subtitle="Mark positions to market. Only changed prices are sent."
      submitLabel={changed.length ? `Update ${changed.length}` : 'Update'}
      busy={busy}
      canSubmit={changed.length > 0}
      onSubmit={() =>
        submit(async () => {
          const ok = await run(() => api.prices(Object.fromEntries(changed.map(([t, v]) => [t, n(v)]))), { rethrowValidation: true })
          if (ok) {
            toast('Prices updated')
            onClose()
          }
          return ok
        })
      }
    >
      {errors.prices && <p className="form-error">{errors.prices}</p>}
      <div className="price-grid">
        {data.holdings.map((h) => (
          <label key={h.ticker} className="price-row">
            <span className="price-ticker">{h.ticker}</span>
            <span className="price-ccy">{h.currency === 'USD' ? '$' : '₦'}</span>
            <input className="input num" inputMode="decimal" value={prices[h.ticker] ?? ''} onChange={(e) => setPrices((p) => ({ ...p, [h.ticker]: e.target.value }))} aria-label={`${h.ticker} price`} />
          </label>
        ))}
      </div>
    </FormDialog>
  )
}

// ------------------------------------------------------------------ cash

function FundDialog({ onClose }: P) {
  const { data, run, toast } = useApp()
  const [amount, setAmount] = useState('')
  const [rate, setRate] = useState(String(data.settings.fxRate))
  const [fee, setFee] = useState('')
  const [historical, setHistorical] = useState(false)
  const { busy, errors, submit } = useSubmit()
  const first = useRef<HTMLInputElement>(null)
  const cost = (isNum(amount) ? n(amount) : 0) * (isNum(rate) ? n(rate) : 0) + (isNum(fee) ? n(fee) : 0)

  return (
    <FormDialog
      open
      onClose={onClose}
      title="Buy dollars"
      subtitle="Move Naira into your USD wallet."
      submitLabel="Fund wallet"
      busy={busy}
      canSubmit={isNum(amount) && n(amount) > 0}
      initialFocus={first}
      onSubmit={() =>
        submit(async () => {
          const ok = await run(() => api.fundUsd({ usd: n(amount), rate: opt(rate), feeNgn: opt(fee), historical }), { rethrowValidation: true })
          if (ok) {
            toast(historical ? 'Past funding logged' : `Added ${usd(n(amount))} to your wallet`)
            onClose()
          }
          return ok
        })
      }
    >
      <Field label="Amount (USD)" error={errors.usd}>
        <input ref={first} className="input input--xl num" inputMode="decimal" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="$0" />
      </Field>
      <div className="form-row">
        <Field label="Rate (₦ per $)" error={errors.rate}>
          <input className="input num" inputMode="decimal" value={rate} onChange={(e) => setRate(e.target.value)} />
        </Field>
        <Field label="Fee (₦)" error={errors.feeNgn}>
          <input className="input num" inputMode="decimal" value={fee} onChange={(e) => setFee(e.target.value)} placeholder="0" />
        </Field>
      </div>
      <label className="check">
        <input type="checkbox" checked={historical} onChange={(e) => setHistorical(e.target.checked)} />
        <span>Past funding — only update my average cost, don't move balances</span>
      </label>
      <div className="summary">
        <div>
          <span>Naira cost</span>
          <Money className="summary-big">{ngn(cost, true)}</Money>
        </div>
        {!historical && (
          <div className={cost > data.valuation.ngnCash ? 'is-bad' : ''}>
            <span>Naira cash</span>
            <Money>{ngn(data.valuation.ngnCash, true)}</Money>
          </div>
        )}
      </div>
    </FormDialog>
  )
}

function ConvertDialog({ onClose }: P) {
  const { data, run, toast } = useApp()
  const [amount, setAmount] = useState('')
  const [rate, setRate] = useState(String(data.settings.fxRate))
  const { busy, errors, submit } = useSubmit()
  const first = useRef<HTMLInputElement>(null)
  const ngnOut = (isNum(amount) ? n(amount) : 0) * (isNum(rate) ? n(rate) : 0)

  return (
    <FormDialog
      open
      onClose={onClose}
      title="Convert to Naira"
      subtitle={`Wallet balance ${usd(data.valuation.usdCash)}`}
      submitLabel="Convert"
      busy={busy}
      canSubmit={isNum(amount) && n(amount) > 0}
      initialFocus={first}
      onSubmit={() =>
        submit(async () => {
          const ok = await run(() => api.convertUsd({ usd: n(amount), rate: opt(rate) }), { rethrowValidation: true })
          if (ok) {
            toast(`Converted ${usd(n(amount))}`)
            onClose()
          }
          return ok
        })
      }
    >
      <Field label="Amount (USD)" error={errors.usd}>
        <div className="input-with-action">
          <input ref={first} className="input input--xl num" inputMode="decimal" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="$0" />
          <button type="button" className="chip-btn" onClick={() => setAmount(String(data.valuation.usdCash))}>
            Max
          </button>
        </div>
      </Field>
      <Field label="Rate (₦ per $)" error={errors.rate}>
        <input className="input num" inputMode="decimal" value={rate} onChange={(e) => setRate(e.target.value)} />
      </Field>
      <div className="summary">
        <div>
          <span>You receive</span>
          <Money className="summary-big">{ngn(ngnOut, true)}</Money>
        </div>
      </div>
    </FormDialog>
  )
}

function FxDialog({ onClose }: P) {
  const { data, run, toast } = useApp()
  const [rate, setRate] = useState(String(data.settings.fxRate))
  const [source, setSource] = useState('')
  const { busy, errors, submit } = useSubmit()
  const first = useRef<HTMLInputElement>(null)
  return (
    <FormDialog
      open
      onClose={onClose}
      title="Exchange rate"
      subtitle="Used to value dollar assets in Naira."
      submitLabel="Save rate"
      busy={busy}
      canSubmit={isNum(rate)}
      initialFocus={first}
      size="sm"
      onSubmit={() =>
        submit(async () => {
          const ok = await run(() => api.setFx(n(rate), source || undefined), { rethrowValidation: true })
          if (ok) {
            toast('Rate updated')
            onClose()
          }
          return ok
        })
      }
    >
      <Field label="₦ per $1" error={errors.rate}>
        <input ref={first} className="input input--xl num" inputMode="decimal" value={rate} onChange={(e) => setRate(e.target.value)} />
      </Field>
      <Field label="Source" hint="e.g. parallel market, CBN, bank" error={errors.source}>
        <input className="input" value={source} onChange={(e) => setSource(e.target.value)} maxLength={60} />
      </Field>
    </FormDialog>
  )
}

function BalancesDialog({ onClose }: P) {
  const { data, run, toast } = useApp()
  const v = data.valuation
  const [ngnCash, setNgnCash] = useState(String(v.ngnCash))
  const [usdCash, setUsdCash] = useState(String(v.usdCash))
  const [liab, setLiab] = useState(String(v.liabilities))
  const { busy, errors, submit } = useSubmit()
  const first = useRef<HTMLInputElement>(null)
  return (
    <FormDialog
      open
      onClose={onClose}
      title="Set balances"
      subtitle="Reconcile with your bank. Recorded as an adjustment in the ledger."
      submitLabel="Save balances"
      busy={busy}
      canSubmit={isNum(ngnCash) && isNum(usdCash) && isNum(liab)}
      initialFocus={first}
      onSubmit={() =>
        submit(async () => {
          const ok = await run(() => api.balances({ ngnCash: n(ngnCash), usdCash: n(usdCash), liabilities: n(liab) }), { rethrowValidation: true })
          if (ok) {
            toast('Balances saved')
            onClose()
          }
          return ok
        })
      }
    >
      <Field label="Naira cash (₦)" error={errors.ngnCash}>
        <input ref={first} className="input num" inputMode="decimal" value={ngnCash} onChange={(e) => setNgnCash(e.target.value)} />
      </Field>
      <Field label="Dollar wallet ($)" error={errors.usdCash}>
        <input className="input num" inputMode="decimal" value={usdCash} onChange={(e) => setUsdCash(e.target.value)} />
      </Field>
      <Field label="Liabilities (₦)" hint="Loans, card balances — subtracted from net worth." error={errors.liabilities}>
        <input className="input num" inputMode="decimal" value={liab} onChange={(e) => setLiab(e.target.value)} />
      </Field>
    </FormDialog>
  )
}

function FeeDialog({ onClose }: P) {
  const { data, run, toast } = useApp()
  const [fee, setFee] = useState(String(+(data.settings.usdFeeRate * 100).toFixed(2)))
  const { busy, errors, submit } = useSubmit()
  return (
    <FormDialog
      open
      onClose={onClose}
      title="US trading fee"
      submitLabel="Save"
      size="sm"
      busy={busy}
      canSubmit={isNum(fee)}
      onSubmit={() =>
        submit(async () => {
          const ok = await run(() => api.settings(n(fee) / 100), { rethrowValidation: true })
          if (ok) {
            toast('Fee updated')
            onClose()
          }
          return ok
        })
      }
    >
      <Field label="Fee per trade (%)" hint="Applied to US buys and sells." error={errors.usdFeeRate}>
        <input className="input num" inputMode="decimal" value={fee} onChange={(e) => setFee(e.target.value)} />
      </Field>
    </FormDialog>
  )
}

// ------------------------------------------------------------------ budget

export const CATEGORIES: { value: BudgetCategory; label: string; hint: string }[] = [
  { value: 'income', label: 'Income', hint: 'Money in' },
  { value: 'fixed', label: 'Fixed', hint: 'Rent, bills' },
  { value: 'variable', label: 'Variable', hint: 'Food, transport' },
  { value: 'savings', label: 'Savings', hint: 'Emergency fund' },
  { value: 'invest', label: 'Invest', hint: 'Equities, ETFs' },
]

function BudgetDialog({ onClose, line, category }: P & { line?: BudgetLine; category?: BudgetCategory }) {
  const { run, toast } = useApp()
  const [cat, setCat] = useState<BudgetCategory>(line?.category ?? category ?? 'variable')
  const [item, setItem] = useState(line?.item ?? '')
  const [amount, setAmount] = useState(line ? String(line.amount) : '')
  const [notes, setNotes] = useState(line?.notes ?? '')
  const { busy, errors, submit } = useSubmit()
  const first = useRef<HTMLInputElement>(null)
  const body = () => ({ category: cat, item, amount: n(amount), notes })
  return (
    <FormDialog
      open
      onClose={onClose}
      title={line ? 'Edit line' : 'Add budget line'}
      subtitle="Monthly amounts in Naira."
      submitLabel="Save"
      busy={busy}
      canSubmit={item.trim() !== '' && isNum(amount)}
      initialFocus={first}
      onSubmit={() =>
        submit(async () => {
          const ok = await run(() => (line ? api.updateBudget(line.id, body()) : api.addBudget(body())), { rethrowValidation: true })
          if (ok) {
            toast(line ? 'Line updated' : 'Line added')
            onClose()
          }
          return ok
        })
      }
    >
      <Field label="Category" error={errors.category}>
        <Select label="Category" value={cat} onChange={setCat} options={CATEGORIES} />
      </Field>
      <div className="form-row">
        <Field label="Item" error={errors.item}>
          <input ref={first} className="input" value={item} onChange={(e) => setItem(e.target.value)} maxLength={80} placeholder="Rent" />
        </Field>
        <Field label="Amount (₦ / month)" error={errors.amount}>
          <input className="input num" inputMode="decimal" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0" />
        </Field>
      </div>
      <Field label="Notes" error={errors.notes}>
        <input className="input" value={notes} onChange={(e) => setNotes(e.target.value)} maxLength={200} />
      </Field>
    </FormDialog>
  )
}

// ------------------------------------------------------------------ research

function WatchDialog({ onClose, item }: P & { item?: WatchItem }) {
  const { run, toast } = useApp()
  const [f, setF] = useState({
    ticker: item?.ticker ?? '',
    name: item?.name ?? '',
    price: item ? String(item.price) : '',
    support: item?.support ? String(item.support) : '',
    resistance: item?.resistance ? String(item.resistance) : '',
    stance: item?.stance ?? '',
    signals: item?.signals ?? '',
    thesis: item?.thesis ?? '',
    plan: item?.plan ?? '',
    series: item?.series.join(', ') ?? '',
  })
  const set = (k: keyof typeof f) => (e: { target: { value: string } }) => setF((s) => ({ ...s, [k]: e.target.value }))
  const { busy, errors, submit } = useSubmit()
  const first = useRef<HTMLInputElement>(null)
  const series = useMemo(() => f.series.split(/[\s,;]+/).filter(Boolean).map(parseAmount), [f.series])
  const seriesOk = series.every(Number.isFinite)

  return (
    <FormDialog
      open
      onClose={onClose}
      title={item ? `Edit ${item.ticker}` : 'New research card'}
      submitLabel="Save"
      size="lg"
      busy={busy}
      canSubmit={f.ticker.trim() !== '' && isNum(f.price) && seriesOk}
      initialFocus={first}
      onSubmit={() =>
        submit(async () => {
          const ok = await run(
            () =>
              api.upsertWatch(f.ticker.trim(), {
                name: f.name,
                price: n(f.price),
                support: opt(f.support) ?? 0,
                resistance: opt(f.resistance) ?? 0,
                stance: f.stance,
                signals: f.signals,
                thesis: f.thesis,
                plan: f.plan,
                series,
              }),
            { rethrowValidation: true },
          )
          if (ok) {
            toast('Research saved')
            onClose()
          }
          return ok
        })
      }
    >
      <div className="form-row">
        <Field label="Ticker" error={errors.ticker}>
          <input ref={first} className="input input--caps" value={f.ticker} onChange={set('ticker')} readOnly={!!item} maxLength={15} />
        </Field>
        <Field label="Name" error={errors.name}>
          <input className="input" value={f.name} onChange={set('name')} maxLength={80} />
        </Field>
      </div>
      <div className="form-row form-row--3">
        <Field label="Price" error={errors.price}>
          <input className="input num" inputMode="decimal" value={f.price} onChange={set('price')} />
        </Field>
        <Field label="Support" error={errors.support}>
          <input className="input num" inputMode="decimal" value={f.support} onChange={set('support')} />
        </Field>
        <Field label="Resistance" error={errors.resistance}>
          <input className="input num" inputMode="decimal" value={f.resistance} onChange={set('resistance')} />
        </Field>
      </div>
      <div className="form-row">
        <Field label="Stance" hint="e.g. Bull flag, Accumulate" error={errors.stance}>
          <input className="input" value={f.stance} onChange={set('stance')} maxLength={80} />
        </Field>
        <Field label="Price history" hint="Comma-separated, oldest first" error={errors.series ?? (seriesOk ? undefined : 'Numbers only')}>
          <input className="input num" value={f.series} onChange={set('series')} />
        </Field>
      </div>
      <Field label="Signals" hint="Moving averages, volume, pattern" error={errors.signals}>
        <input className="input" value={f.signals} onChange={set('signals')} maxLength={500} />
      </Field>
      <Field label="Thesis" error={errors.thesis}>
        <textarea className="input textarea" rows={3} value={f.thesis} onChange={set('thesis')} maxLength={4000} />
      </Field>
      <Field label="Plan" hint="Entry, stop, target" error={errors.plan}>
        <textarea className="input textarea" rows={2} value={f.plan} onChange={set('plan')} maxLength={500} />
      </Field>
    </FormDialog>
  )
}

function DossierDialog({ onClose, item }: P & { item: WatchItem }) {
  const { data, open, run, toast } = useApp()
  return (
    <Dialog
      open
      onClose={onClose}
      size="lg"
      title={item.ticker}
      subtitle={item.name}
      footer={
        <>
          <button
            type="button"
            className="btn btn--ghost btn--danger-text"
            onClick={() =>
              open({
                kind: 'confirm',
                title: `Remove ${item.ticker}?`,
                body: 'The research card and its notes will be deleted.',
                confirm: 'Remove',
                onConfirm: async () => {
                  const ok = await run(() => api.removeWatch(item.ticker))
                  if (ok) toast('Card removed')
                  return ok
                },
              })
            }
          >
            Remove
          </button>
          <span className="spacer" />
          <button type="button" className="btn" onClick={() => open({ kind: 'watch', item })}>
            <Icon name="pencil" size={15} /> Edit
          </button>
          <button type="button" className="btn btn--primary" onClick={() => open({ kind: 'trade', side: 'buy', holding: data.holdings.find((h) => h.ticker === item.ticker), ticker: item.ticker })}>
            Trade
          </button>
        </>
      }
    >
      <div className="dossier">
        <div className="dossier-top">
          <div>
            <div className="label">Price</div>
            <div className="dossier-price num">{ngn(item.price, true)}</div>
            {item.stance && <span className="pill">{item.stance}</span>}
          </div>
          <Sparkline series={item.series} width={220} height={64} />
        </div>
        {item.resistance > item.support && (
          <div className="dossier-range">
            <div className="range-labels num">
              <span>Support {ngn(item.support, true)}</span>
              <span>{item.rangePct.toFixed(0)}% of range</span>
              <span>Resistance {ngn(item.resistance, true)}</span>
            </div>
            <RangeBar support={item.support} resistance={item.resistance} price={item.price} pct={item.rangePct} />
          </div>
        )}
        {item.signals && (
          <section>
            <h3 className="label">Signals</h3>
            <p>{item.signals}</p>
          </section>
        )}
        {item.thesis && (
          <section>
            <h3 className="label">Thesis</h3>
            <p>{item.thesis}</p>
          </section>
        )}
        {item.plan && (
          <section className="dossier-plan">
            <h3 className="label">Plan</h3>
            <p>{item.plan}</p>
          </section>
        )}
      </div>
    </Dialog>
  )
}

// ------------------------------------------------------------------ confirm

function ConfirmDialog({ onClose, title, body, confirm, onConfirm }: P & { title: string; body: string; confirm: string; onConfirm: () => Promise<unknown> | void }) {
  const [busy, setBusy] = useState(false)
  const cancel = useRef<HTMLButtonElement>(null)
  return (
    <Dialog
      open
      onClose={onClose}
      size="sm"
      title={title}
      initialFocus={cancel}
      footer={
        <>
          <button ref={cancel} type="button" className="btn btn--ghost" onClick={onClose}>
            Cancel
          </button>
          <button
            type="button"
            className="btn btn--danger"
            aria-busy={busy}
            onClick={async () => {
              setBusy(true)
              const ok = await onConfirm()
              setBusy(false)
              if (ok !== false) onClose()
            }}
          >
            {confirm}
          </button>
        </>
      }
    >
      <p className="muted">{body}</p>
    </Dialog>
  )
}
