import { useEffect, useRef, useState } from 'react'
import { api } from '../api/client'
import type { ApiKey, User } from '../api/types'
import { ago } from '../lib/format'
import { useApp } from '../state/actions'
import type { Theme } from '../state/prefs'
import { Card, Field, Segmented } from '../ui/Bits'
import Icon from '../ui/Icon'

export default function Settings({ user, theme, onTheme, privacy, onPrivacy, onSignOut }: {
  user: User
  theme: Theme
  onTheme: (t: Theme) => void
  privacy: boolean
  onPrivacy: () => void
  onSignOut: () => void
}) {
  return (
    <div className="page page--narrow">
      <header className="page-head">
        <div>
          <h1 className="page-title">Settings</h1>
          <p className="page-sub">{user.email}</p>
        </div>
      </header>

      <Card title="Appearance">
        <div className="setting">
          <div>
            <div className="strong">Theme</div>
            <div className="muted small">Dark is tuned for evening sessions.</div>
          </div>
          <Segmented label="Theme" value={theme} onChange={onTheme} options={[{ value: 'system', label: 'Auto' }, { value: 'light', label: 'Light' }, { value: 'dark', label: 'Dark' }]} />
        </div>
        <div className="setting">
          <div>
            <div className="strong">Privacy mode</div>
            <div className="muted small">Blur amounts until you hover them. Shortcut: H</div>
          </div>
          <button type="button" role="switch" aria-checked={privacy} className={`switch${privacy ? ' is-on' : ''}`} onClick={onPrivacy}>
            <span className="sr-only">Privacy mode</span>
          </button>
        </div>
      </Card>

      <ApiKeys />
      <DataTools />

      <Card title="Account">
        <div className="setting">
          <div>
            <div className="strong">{user.displayName}</div>
            <div className="muted small">{user.email}</div>
          </div>
          <button type="button" className="btn" onClick={onSignOut}>
            <Icon name="logout" size={15} /> Sign out
          </button>
        </div>
      </Card>
    </div>
  )
}

function ApiKeys() {
  const { toast, open } = useApp()
  const [keys, setKeys] = useState<ApiKey[] | null>(null)
  const [name, setName] = useState('')
  const [readOnly, setReadOnly] = useState(true)
  const [secret, setSecret] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const load = () => api.keys().then(setKeys, (e: Error) => setError(e.message))
  useEffect(() => {
    void load()
  }, [])

  const create = async () => {
    setBusy(true)
    setError(null)
    try {
      const r = await api.createKey(name.trim(), readOnly)
      setSecret(r.secret)
      setName('')
      void load()
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <Card title="API keys">
      <p className="muted small pad-b">
        Let scripts and AI agents read or update your portfolio. Each key acts under its own name in your ledger, can be read-only, and is shown only once.
      </p>

      {secret && (
        <div className="secret" role="status">
          <div className="strong">Copy your key now — it won’t be shown again.</div>
          <div className="secret-row">
            <code className="secret-value">{secret}</code>
            <button
              type="button"
              className="btn btn--sm"
              onClick={async () => {
                await navigator.clipboard.writeText(secret)
                toast('Key copied')
              }}
            >
              <Icon name="copy" size={14} /> Copy
            </button>
          </div>
          <div className="muted small">
            Use it as <code>Authorization: Bearer &lt;key&gt;</code>.{' '}
            <button type="button" className="link-btn" onClick={() => setSecret(null)}>
              Done
            </button>
          </div>
        </div>
      )}

      <form
        className="key-form"
        onSubmit={(e) => {
          e.preventDefault()
          if (name.trim()) void create()
        }}
      >
        <Field label="New key name" error={error ?? undefined}>
          <input className="input" value={name} onChange={(e) => setName(e.target.value)} maxLength={40} placeholder="e.g. claude, price-bot" />
        </Field>
        <Segmented label="Access" value={readOnly ? 'read' : 'write'} onChange={(v) => setReadOnly(v === 'read')} options={[{ value: 'read', label: 'Read only' }, { value: 'write', label: 'Read & write' }]} />
        <button type="submit" className="btn btn--primary" aria-busy={busy} disabled={!name.trim()}>
          Create key
        </button>
      </form>

      <ul className="rows">
        {(keys ?? []).map((k) => (
          <li key={k.id} className="row row--static">
            <span className="key-icon" aria-hidden="true">
              <Icon name="key" size={16} />
            </span>
            <span className="row-main">
              <span className="row-title">
                {k.name} <span className={`pill${k.readOnly ? '' : ' pill--agent'}`}>{k.readOnly ? 'read' : 'read & write'}</span>
              </span>
              <span className="row-sub">
                <code>{k.prefix}</code> · created {ago(k.createdAt)} · {k.lastUsedAt ? `used ${ago(k.lastUsedAt)}` : 'never used'}
              </span>
            </span>
            <button
              type="button"
              className="btn btn--sm btn--danger-text"
              onClick={() =>
                open({
                  kind: 'confirm',
                  title: `Revoke “${k.name}”?`,
                  body: 'Anything using this key stops working immediately.',
                  confirm: 'Revoke',
                  onConfirm: async () => {
                    await api.revokeKey(k.id)
                    toast('Key revoked')
                    void load()
                  },
                })
              }
            >
              Revoke
            </button>
          </li>
        ))}
        {keys?.length === 0 && <li className="muted small pad">No keys yet.</li>}
      </ul>
    </Card>
  )
}

function DataTools() {
  const { data, run, toast, open } = useApp()
  const file = useRef<HTMLInputElement>(null)
  const empty = data.holdings.length === 0 && data.budget.length === 0 && data.watchlist.length === 0 && data.valuation.netWorth === 0

  const exportJson = () => {
    const url = URL.createObjectURL(new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' }))
    Object.assign(document.createElement('a'), { href: url, download: `finance-os-${new Date().toISOString().slice(0, 10)}.json` }).click()
    URL.revokeObjectURL(url)
  }

  return (
    <Card title="Data">
      <div className="setting">
        <div>
          <div className="strong">Export</div>
          <div className="muted small">Download everything as JSON.</div>
        </div>
        <button type="button" className="btn" onClick={exportJson}>
          <Icon name="download" size={15} /> Export
        </button>
      </div>
      <div className="setting">
        <div>
          <div className="strong">Import from Finance OS v1</div>
          <div className="muted small">Open the old app’s <code>/api/state</code>, save it as a file, and pick it here. Only into an empty portfolio.</div>
        </div>
        <button type="button" className="btn" disabled={!empty} onClick={() => file.current?.click()}>
          <Icon name="upload" size={15} /> Import
        </button>
        <input
          ref={file}
          type="file"
          accept="application/json,.json"
          hidden
          onChange={async (e) => {
            const f = e.target.files?.[0]
            e.target.value = ''
            if (!f) return
            if (f.size > 2 * 1024 * 1024) return toast('File is larger than 2 MB', 'error')
            let state: unknown
            try {
              state = JSON.parse(await f.text())
            } catch {
              return toast('That file is not valid JSON', 'error')
            }
            if (await run(() => api.importLegacy(state))) toast('Imported your v1 data')
          }}
        />
      </div>
      <div className="setting">
        <div>
          <div className="strong">Sample portfolio</div>
          <div className="muted small">Fill an empty account with example data to explore.</div>
        </div>
        <button
          type="button"
          className="btn"
          disabled={!empty}
          onClick={() =>
            open({
              kind: 'confirm',
              title: 'Load sample data?',
              body: 'Adds example balances, positions, a budget and research cards.',
              confirm: 'Load sample',
              onConfirm: async () => {
                const ok = await run(() => api.loadSample())
                if (ok) toast('Sample loaded')
                return ok
              },
            })
          }
        >
          Load
        </button>
      </div>
    </Card>
  )
}
