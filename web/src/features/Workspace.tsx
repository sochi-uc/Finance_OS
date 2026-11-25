import { useCallback, useMemo, useState } from 'react'
import type { User } from '../api/types'
import { ngn } from '../lib/format'
import { ActionsProvider, type AppActions, type DialogSpec } from '../state/actions'
import { useHotkeys, useView, type Theme, type View } from '../state/prefs'
import { usePortfolio } from '../state/usePortfolio'
import { Money, Spinner } from '../ui/Bits'
import Icon, { BrandMark } from '../ui/Icon'
import { ToastRegion, useToasts } from '../ui/Toasts'
import Budget from './Budget'
import Cash from './Cash'
import CommandPalette from './CommandPalette'
import { DialogHost } from './dialogs'
import Investments from './Investments'
import Journal from './Journal'
import Overview from './Overview'
import Research from './Research'
import Settings from './Settings'

const NAV: { view: View; label: string; icon: string; key: string }[] = [
  { view: 'overview', label: 'Overview', icon: 'overview', key: '1' },
  { view: 'investments', label: 'Investments', icon: 'investments', key: '2' },
  { view: 'cash', label: 'Cash', icon: 'cash', key: '3' },
  { view: 'budget', label: 'Budget', icon: 'budget', key: '4' },
  { view: 'research', label: 'Research', icon: 'research', key: '5' },
  { view: 'journal', label: 'Journal', icon: 'journal', key: '6' },
]

export default function Workspace({ user, theme, onTheme, privacy, onPrivacy, onSignOut }: {
  user: User
  theme: Theme
  onTheme: (t: Theme) => void
  privacy: boolean
  onPrivacy: () => void
  onSignOut: () => void
}) {
  const { toasts, push, dismiss } = useToasts()
  const onError = useCallback((m: string) => push(m, 'error'), [push])
  const { data, error, live, reload, run } = usePortfolio(onError)
  const [view, go] = useView()
  const [dialog, setDialog] = useState<DialogSpec | null>(null)
  const [palette, setPalette] = useState(false)

  const actions = useMemo<AppActions | null>(() => (data ? { data, run, toast: push, open: setDialog } : null), [data, run, push])

  useHotkeys({
    'mod+k': () => setPalette((p) => !p),
    h: onPrivacy,
    b: () => data && setDialog({ kind: 'trade', side: 'buy' }),
    ...Object.fromEntries(NAV.map((n) => [n.key, () => go(n.view)])),
  })

  if (!actions) {
    return (
      <div className="splash">
        <div className="wallpaper" aria-hidden="true" />
        {error ? (
          <div className="splash-card glass" role="alert">
            <Icon name="alert" size={22} />
            <p>{error}</p>
            <button type="button" className="btn btn--primary" onClick={() => reload()}>
              Try again
            </button>
          </div>
        ) : (
          <Spinner label="Loading your portfolio" />
        )}
      </div>
    )
  }

  const current = NAV.find((n) => n.view === view)

  return (
    <ActionsProvider value={actions}>
      <div className="shell">
        <div className="wallpaper" aria-hidden="true" />
        <a href="#main" className="skip-link">
          Skip to content
        </a>

        <nav className="sidebar glass" aria-label="Main">
          <div className="brand">
            <BrandMark size={30} />
            <span className="brand-name">Finance OS</span>
          </div>
          <button type="button" className="search-btn" onClick={() => setPalette(true)}>
            <Icon name="search" size={16} />
            <span>Search or act…</span>
            <kbd>⌘K</kbd>
          </button>
          <ul className="nav">
            {NAV.map((n) => (
              <li key={n.view}>
                <a href={`#/${n.view}`} className={`nav-item${view === n.view ? ' is-active' : ''}`} aria-current={view === n.view ? 'page' : undefined}>
                  <Icon name={n.icon} size={19} />
                  <span>{n.label}</span>
                  <kbd className="nav-key">{n.key}</kbd>
                </a>
              </li>
            ))}
          </ul>
          <div className="sidebar-worth">
            <span className="label">Net worth</span>
            <Money className="sidebar-worth-value">{ngn(data!.valuation.netWorth)}</Money>
          </div>
          <div className="sidebar-foot">
            <a href="#/settings" className={`nav-item${view === 'settings' ? ' is-active' : ''}`} aria-current={view === 'settings' ? 'page' : undefined}>
              <span className="avatar" aria-hidden="true">
                {user.displayName.slice(0, 1).toUpperCase()}
              </span>
              <span className="nav-user">
                <span>{user.displayName}</span>
                <span className="muted small">Settings</span>
              </span>
            </a>
          </div>
        </nav>

        <div className="main-col">
          <header className="topbar glass">
            <div className="topbar-title">
              <BrandMark size={26} />
              <span>{current?.label ?? 'Settings'}</span>
            </div>
            <div className="topbar-actions">
              <span className={`live live--${live}`} title={live === 'live' ? 'Live — syncing across devices' : live === 'connecting' ? 'Reconnecting…' : 'Offline'}>
                <span className="live-dot" aria-hidden="true" />
                <span className="live-label">{live === 'live' ? 'Live' : live === 'connecting' ? 'Syncing' : 'Offline'}</span>
              </span>
              <button type="button" className="icon-btn" onClick={onPrivacy} aria-pressed={privacy} aria-label={privacy ? 'Show amounts (H)' : 'Hide amounts (H)'} title={privacy ? 'Show amounts (H)' : 'Hide amounts (H)'}>
                <Icon name={privacy ? 'eyeOff' : 'eye'} size={18} />
              </button>
              <button type="button" className="icon-btn" onClick={() => setPalette(true)} aria-label="Command menu (⌘K)" title="Command menu (⌘K)">
                <Icon name="command" size={18} />
              </button>
              <button type="button" className="btn btn--primary btn--sm topbar-buy" onClick={() => setDialog({ kind: 'trade', side: 'buy' })}>
                <Icon name="plus" size={15} stroke={2} /> Trade
              </button>
            </div>
          </header>

          <main id="main" className="content" tabIndex={-1}>
            {view === 'overview' && <Overview go={go} />}
            {view === 'investments' && <Investments />}
            {view === 'cash' && <Cash />}
            {view === 'budget' && <Budget />}
            {view === 'research' && <Research />}
            {view === 'journal' && <Journal />}
            {view === 'settings' && <Settings user={user} theme={theme} onTheme={onTheme} privacy={privacy} onPrivacy={onPrivacy} onSignOut={onSignOut} />}
          </main>
        </div>

        <nav className="tabbar glass" aria-label="Main">
          {NAV.filter((n) => n.view !== 'journal').map((n) => (
            <a key={n.view} href={`#/${n.view}`} className={`tab${view === n.view ? ' is-active' : ''}`} aria-current={view === n.view ? 'page' : undefined}>
              <Icon name={n.icon} size={22} />
              <span>{n.label}</span>
            </a>
          ))}
          <a href="#/settings" className={`tab${view === 'settings' || view === 'journal' ? ' is-active' : ''}`}>
            <Icon name="menu" size={22} />
            <span>More</span>
          </a>
        </nav>

        <DialogHost spec={dialog} onClose={() => setDialog(null)} />
        <CommandPalette open={palette} onClose={() => setPalette(false)} go={go} act={setDialog} onPrivacy={onPrivacy} />
        <ToastRegion toasts={toasts} onDismiss={dismiss} />
      </div>
    </ActionsProvider>
  )
}
