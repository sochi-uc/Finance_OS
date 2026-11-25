import { useCallback, useEffect, useId, useLayoutEffect, useRef, useState, type ReactNode } from 'react'
import Icon from './Icon'

export interface Option<T extends string | number> {
  value: T
  label: string
  hint?: string
  icon?: ReactNode
}

/**
 * Glass listbox dropdown (replaces native <select>, which can't show icons and renders an OS menu).
 * WAI-ARIA select-only combobox: ↑/↓/Home/End move, Enter/Space choose, Esc closes (without closing
 * the parent dialog), type-ahead jumps. Rendered in the top layer via the `popover` API so it works
 * inside modal dialogs; positioned with CSSOM (CSP-safe) and flips above when there's no room.
 */
export default function Select<T extends string | number>({
  value,
  onChange,
  options,
  label,
  className = '',
}: {
  value: T
  onChange: (v: T) => void
  options: Option<T>[]
  label: string
  className?: string
}) {
  const id = useId()
  const triggerRef = useRef<HTMLButtonElement>(null)
  const listRef = useRef<HTMLDivElement>(null)
  const ta = useRef({ text: '', timer: 0 as unknown as ReturnType<typeof setTimeout> })
  const [open, setOpen] = useState(false)
  const selectedIndex = Math.max(0, options.findIndex((o) => o.value === value))
  const [active, setActive] = useState(selectedIndex)
  const selected = options.find((o) => o.value === value)

  const hide = useCallback((refocus = true) => {
    listRef.current?.hidePopover()
    if (refocus) triggerRef.current?.focus()
  }, [])

  const show = () => {
    setActive(selectedIndex)
    listRef.current?.showPopover()
  }

  const choose = (i: number) => {
    const o = options[i]
    if (!o) return
    hide()
    if (o.value !== value) onChange(o.value)
  }

  useEffect(() => {
    const el = listRef.current
    if (!el) return
    const on = (e: Event) => setOpen((e as ToggleEvent).newState === 'open')
    el.addEventListener('toggle', on)
    return () => el.removeEventListener('toggle', on)
  }, [])

  useLayoutEffect(() => {
    if (!open) return
    const place = () => {
      const t = triggerRef.current!.getBoundingClientRect()
      const list = listRef.current!
      const width = Math.max(t.width, 200)
      const h = Math.min(list.scrollHeight, 320)
      const below = window.innerHeight - t.bottom - 6
      const top = below >= h || below >= t.top ? t.bottom + 6 : Math.max(8, t.top - 6 - h)
      list.style.top = `${top}px`
      list.style.left = `${Math.min(Math.max(8, t.left), window.innerWidth - width - 8)}px`
      list.style.minWidth = `${width}px`
    }
    place()
    const onScroll = (e: Event) => {
      if (!listRef.current?.contains(e.target as Node)) hide(false)
    }
    window.addEventListener('resize', place)
    window.addEventListener('scroll', onScroll, true)
    listRef.current?.focus({ preventScroll: true })
    return () => {
      window.removeEventListener('resize', place)
      window.removeEventListener('scroll', onScroll, true)
    }
  }, [open, hide])

  useEffect(() => {
    if (open) document.getElementById(`${id}-${active}`)?.scrollIntoView({ block: 'nearest' })
  }, [open, active, id])

  const typeahead = (key: string) => {
    clearTimeout(ta.current.timer)
    ta.current.text += key.toLowerCase()
    ta.current.timer = setTimeout(() => (ta.current.text = ''), 600)
    const start = (open ? active : selectedIndex) + 1
    for (let k = 0; k < options.length; k++) {
      const i = (start + k) % options.length
      if (options[i]!.label.toLowerCase().startsWith(ta.current.text)) {
        if (open) setActive(i)
        else if (options[i]!.value !== value) onChange(options[i]!.value)
        return
      }
    }
  }

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        role="combobox"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={`${id}-list`}
        aria-label={label}
        className={`dd${open ? ' is-open' : ''} ${className}`}
        onClick={() => (open ? hide() : show())}
        onKeyDown={(e) => {
          if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
            e.preventDefault()
            show()
          } else if (e.key.length === 1 && e.key !== ' ' && !e.metaKey && !e.ctrlKey && !e.altKey) typeahead(e.key)
        }}
      >
        {selected?.icon && <span className="dd-icon">{selected.icon}</span>}
        <span className="dd-value">{selected?.label ?? 'Select…'}</span>
        <Icon name="chevrons" size={14} className="dd-chevron" />
      </button>
      <div
        ref={listRef}
        id={`${id}-list`}
        popover="auto"
        role="listbox"
        aria-label={label}
        tabIndex={-1}
        aria-activedescendant={open ? `${id}-${active}` : undefined}
        className="dd-list glass"
        onKeyDown={(e) => {
          const last = options.length - 1
          if (e.key === 'ArrowDown') (e.preventDefault(), setActive((a) => Math.min(last, a + 1)))
          else if (e.key === 'ArrowUp') (e.preventDefault(), setActive((a) => Math.max(0, a - 1)))
          else if (e.key === 'Home') (e.preventDefault(), setActive(0))
          else if (e.key === 'End') (e.preventDefault(), setActive(last))
          else if (e.key === 'Enter' || e.key === ' ') (e.preventDefault(), choose(active))
          else if (e.key === 'Escape') (e.preventDefault(), e.stopPropagation(), hide())
          else if (e.key === 'Tab') hide(false)
          else if (e.key.length === 1 && !e.metaKey && !e.ctrlKey) typeahead(e.key)
        }}
      >
        {options.map((o, i) => (
          <div
            key={String(o.value)}
            id={`${id}-${i}`}
            role="option"
            aria-selected={o.value === value}
            className={`dd-opt${i === active ? ' is-active' : ''}${o.value === value ? ' is-selected' : ''}`}
            onPointerMove={() => i !== active && setActive(i)}
            onClick={() => choose(i)}
          >
            {o.icon && <span className="dd-icon">{o.icon}</span>}
            <span className="dd-label">{o.label}</span>
            {o.hint && <span className="dd-hint">{o.hint}</span>}
            <Icon name="check" size={14} stroke={2.2} className="dd-check" />
          </div>
        ))}
      </div>
    </>
  )
}
