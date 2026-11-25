import { useState } from 'react'
import { api } from '../api/client'
import type { LedgerKind } from '../api/types'
import { ago, dayTime, money, qty } from '../lib/format'
import { useApp } from '../state/actions'
import { Card, Empty, Money, Segmented } from '../ui/Bits'
import Icon from '../ui/Icon'

const KIND: Record<LedgerKind, { label: string; tone: string }> = {
  buy: { label: 'Buy', tone: 'gain' },
  sell: { label: 'Sell', tone: 'loss' },
  'fund-usd': { label: 'Fund $', tone: 'accent' },
  'convert-usd': { label: 'To ₦', tone: 'accent' },
  adjustment: { label: 'Adjust', tone: 'flat' },
}

type Tab = 'notes' | 'ledger' | 'activity'

export default function Journal() {
  const { data, run, toast, open } = useApp()
  const [tab, setTab] = useState<Tab>('notes')
  const [text, setText] = useState('')
  const [busy, setBusy] = useState(false)

  const add = async () => {
    if (!text.trim()) return
    setBusy(true)
    if (await run(() => api.addNote(text.trim()))) {
      setText('')
      toast('Note saved')
    }
    setBusy(false)
  }

  return (
    <div className="page">
      <header className="page-head">
        <div>
          <h1 className="page-title">Journal</h1>
          <p className="page-sub">Your reasoning, every transaction, and who did what</p>
        </div>
      </header>

      <Segmented
        label="Section"
        value={tab}
        onChange={setTab}
        options={[
          { value: 'notes', label: 'Notes' },
          { value: 'ledger', label: 'Ledger' },
          { value: 'activity', label: 'Activity' },
        ]}
      />

      {tab === 'notes' && (
        <>
          <Card>
            <div className="composer">
              <textarea
                className="input textarea"
                rows={3}
                placeholder="What are you thinking? Thesis changes, lessons, plans…"
                value={text}
                maxLength={4000}
                onChange={(e) => setText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) void add()
                }}
                aria-label="New note"
              />
              <div className="composer-foot">
                <span className="muted small">⌘/Ctrl + Enter to save</span>
                <button type="button" className="btn btn--primary btn--sm" aria-busy={busy} disabled={!text.trim()} onClick={add}>
                  Save note
                </button>
              </div>
            </div>
          </Card>
          {data.notes.length === 0 ? (
            <Card>
              <Empty icon="journal" title="No notes yet" body="Write down why before you act — future you will thank you." />
            </Card>
          ) : (
            <ul className="notes">
              {data.notes.map((n) => (
                <li key={n.id} className="note card">
                  <header>
                    <span className="strong">{n.author}</span>
                    <span className="muted small">{dayTime(n.at)}</span>
                    <button
                      type="button"
                      className="icon-btn icon-btn--sm note-del"
                      aria-label="Delete note"
                      onClick={() =>
                        open({
                          kind: 'confirm',
                          title: 'Delete note?',
                          body: 'This cannot be undone.',
                          confirm: 'Delete',
                          onConfirm: () => run(() => api.removeNote(n.id)),
                        })
                      }
                    >
                      <Icon name="trash" size={14} />
                    </button>
                  </header>
                  <p>{n.text}</p>
                </li>
              ))}
            </ul>
          )}
        </>
      )}

      {tab === 'ledger' && (
        <Card className="card--flush">
          {data.ledger.length === 0 ? (
            <Empty icon="journal" title="No transactions" body="Trades, funding and adjustments appear here." />
          ) : (
            <div className="table-wrap">
              <table className="table">
                <caption className="sr-only">Ledger</caption>
                <thead>
                  <tr>
                    <th scope="col">When</th>
                    <th scope="col">Type</th>
                    <th scope="col">Asset</th>
                    <th scope="col" className="r">Units</th>
                    <th scope="col" className="r">Amount</th>
                    <th scope="col" className="hide-sm">Note</th>
                    <th scope="col" className="hide-sm">By</th>
                  </tr>
                </thead>
                <tbody>
                  {data.ledger.map((l) => (
                    <tr key={l.id}>
                      <td className="muted small nowrap">{dayTime(l.at)}</td>
                      <td>
                        <span className={`pill pill--${KIND[l.kind].tone}`}>{KIND[l.kind].label}</span>
                      </td>
                      <th scope="row" className="strong">{l.ticker ?? '—'}</th>
                      <td className="r num">{l.units ? qty(l.units) : '—'}</td>
                      <td className="r">
                        <Money>{l.amount ? money(l.amount, l.currency, true) : '—'}</Money>
                        {l.fee > 0 && <span className="row-sub num">fee {money(l.fee, l.kind === 'fund-usd' ? 'NGN' : l.currency, true)}</span>}
                      </td>
                      <td className="hide-sm muted clamp">{l.note}</td>
                      <td className="hide-sm">
                        <span className={`pill${l.actor.startsWith('key:') ? ' pill--agent' : ''}`}>{l.actor.replace(/^key:/, '')}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      )}

      {tab === 'activity' && (
        <Card>
          <ul className="timeline">
            {data.activity.map((a) => (
              <li key={a.id}>
                <span className={`tl-dot${a.actor.startsWith('key:') ? ' tl-dot--agent' : ''}`} aria-hidden="true" />
                <span className="tl-text">{a.summary}</span>
                <span className="tl-meta">
                  <span className={`pill${a.actor.startsWith('key:') ? ' pill--agent' : ''}`}>{a.actor.replace(/^key:/, '')}</span>
                  {ago(a.at)}
                </span>
              </li>
            ))}
          </ul>
        </Card>
      )}
    </div>
  )
}
