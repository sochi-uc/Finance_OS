import { useEffect, useMemo, useRef, useState } from 'react'
import type { DialogSpec } from '../state/actions'
import type { View } from '../state/prefs'
import Icon from '../ui/Icon'

interface Command {
  id: string
  label: string
  group: 'Actions' | 'Go to'
  icon: string
  hint?: string
  run: () => void
}

/** ⌘K launcher: every page and action, fuzzy-filtered, fully keyboard driven. */
export default function CommandPalette({ open, onClose, go, act, onPrivacy }: {
  open: boolean
  onClose: () => void
  go: (v: View) => void
  act: (d: DialogSpec) => void
  onPrivacy: () => void
}) {
  const ref = useRef<HTMLDialogElement>(null)
  const input = useRef<HTMLInputElement>(null)
  const [q, setQ] = useState('')
  const [active, setActive] = useState(0)

  const commands = useMemo<Command[]>(
    () => [
      { id: 'buy', label: 'Buy', group: 'Actions', icon: 'plus', hint: 'B', run: () => act({ kind: 'trade', side: 'buy' }) },
      { id: 'sell', label: 'Sell', group: 'Actions', icon: 'arrowDown', run: () => act({ kind: 'trade', side: 'sell' }) },
      { id: 'prices', label: 'Update prices', group: 'Actions', icon: 'swap', run: () => act({ kind: 'prices' }) },
      { id: 'fund', label: 'Buy dollars', group: 'Actions', icon: 'cash', run: () => act({ kind: 'fund' }) },
      { id: 'convert', label: 'Convert dollars to Naira', group: 'Actions', icon: 'swap', run: () => act({ kind: 'convert' }) },
      { id: 'fx', label: 'Update exchange rate', group: 'Actions', icon: 'globe', run: () => act({ kind: 'fx' }) },
      { id: 'balances', label: 'Set balances', group: 'Actions', icon: 'pencil', run: () => act({ kind: 'balances' }) },
      { id: 'budget', label: 'Add budget line', group: 'Actions', icon: 'budget', run: () => act({ kind: 'budget' }) },
      { id: 'research', label: 'New research card', group: 'Actions', icon: 'research', run: () => act({ kind: 'watch' }) },
      { id: 'privacy', label: 'Toggle privacy mode', group: 'Actions', icon: 'eyeOff', hint: 'H', run: onPrivacy },
      { id: 'g-o', label: 'Overview', group: 'Go to', icon: 'overview', hint: '1', run: () => go('overview') },
      { id: 'g-i', label: 'Investments', group: 'Go to', icon: 'investments', hint: '2', run: () => go('investments') },
      { id: 'g-c', label: 'Cash', group: 'Go to', icon: 'cash', hint: '3', run: () => go('cash') },
      { id: 'g-b', label: 'Budget', group: 'Go to', icon: 'budget', hint: '4', run: () => go('budget') },
      { id: 'g-r', label: 'Research', group: 'Go to', icon: 'research', hint: '5', run: () => go('research') },
      { id: 'g-j', label: 'Journal', group: 'Go to', icon: 'journal', hint: '6', run: () => go('journal') },
      { id: 'g-s', label: 'Settings', group: 'Go to', icon: 'settings', run: () => go('settings') },
    ],
    [act, go, onPrivacy],
  )

  const results = useMemo(() => {
    const t = q.trim().toLowerCase()
    if (!t) return commands
    return commands.filter((c) => {
      let i = 0
      for (const ch of c.label.toLowerCase()) if (ch === t[i]) i++
      return i === t.length
    })
  }, [q, commands])

  useEffect(() => {
    const el = ref.current
    if (!el) return
    if (open && !el.open) {
      setQ('')
      setActive(0)
      el.showModal()
      input.current?.focus()
    } else if (!open && el.open) el.close()
  }, [open])

  const exec = (c?: Command) => {
    if (!c) return
    onClose()
    requestAnimationFrame(c.run)
  }

  return (
    <dialog
      ref={ref}
      className="palette glass"
      aria-label="Command menu"
      onCancel={(e) => {
        e.preventDefault()
        onClose()
      }}
      onClick={(e) => e.target === ref.current && onClose()}
    >
      <div className="palette-search">
        <Icon name="search" size={18} />
        <input
          ref={input}
          value={q}
          onChange={(e) => {
            setQ(e.target.value)
            setActive(0)
          }}
          placeholder="Search actions and pages"
          role="combobox"
          aria-expanded="true"
          aria-controls="palette-list"
          aria-activedescendant={results[active] ? `cmd-${results[active].id}` : undefined}
          onKeyDown={(e) => {
            if (e.key === 'ArrowDown') (e.preventDefault(), setActive((a) => Math.min(results.length - 1, a + 1)))
            else if (e.key === 'ArrowUp') (e.preventDefault(), setActive((a) => Math.max(0, a - 1)))
            else if (e.key === 'Enter') (e.preventDefault(), exec(results[active]))
          }}
        />
        <kbd>esc</kbd>
      </div>
      <ul id="palette-list" role="listbox" className="palette-list">
        {results.length === 0 && <li className="muted pad">No matches</li>}
        {results.map((c, i) => (
          <li
            key={c.id}
            id={`cmd-${c.id}`}
            role="option"
            aria-selected={i === active}
            className={`palette-item${i === active ? ' is-active' : ''}`}
            onPointerMove={() => setActive(i)}
            onClick={() => exec(c)}
          >
            <Icon name={c.icon} size={17} />
            <span>{c.label}</span>
            <span className="palette-group">{c.group}</span>
            {c.hint && <kbd>{c.hint}</kbd>}
          </li>
        ))}
      </ul>
    </dialog>
  )
}
