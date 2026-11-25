import { type ReactNode } from 'react'
import { pct, tone } from '../lib/format'
import Icon from './Icon'

/** An amount that blurs in privacy mode. */
export function Money({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <span className={`money num ${className}`}>{children}</span>
}

/** Gain/loss pill: arrow + signed percentage, coloured by sign — never colour alone. */
export function Delta({ value, suffix, size = 'md' }: { value: number; suffix?: ReactNode; size?: 'sm' | 'md' }) {
  const t = tone(value)
  return (
    <span className={`delta delta--${t} delta--${size}`}>
      {t !== 'flat' && <Icon name={t === 'gain' ? 'arrowUp' : 'arrowDown'} size={size === 'sm' ? 11 : 13} stroke={2.2} />}
      <span className="num">{pct(value)}</span>
      {suffix}
    </span>
  )
}

export function Segmented<T extends string>({
  value,
  options,
  onChange,
  label,
}: {
  value: T
  options: { value: T; label: string }[]
  onChange: (v: T) => void
  label: string
}) {
  const index = Math.max(0, options.findIndex((o) => o.value === value))
  return (
    <div className="seg" role="radiogroup" aria-label={label} style={{ '--i': index, '--n': options.length } as React.CSSProperties}>
      <span className="seg-lens" aria-hidden="true" />
      {options.map((o) => (
        <button key={o.value} type="button" role="radio" aria-checked={o.value === value} className="seg-item" onClick={() => onChange(o.value)}>
          {o.label}
        </button>
      ))}
    </div>
  )
}

export function Field({ label, hint, error, children }: { label: string; hint?: string; error?: string; children: ReactNode }) {
  return (
    <label className={`field${error ? ' has-error' : ''}`}>
      <span className="field-label">{label}</span>
      {children}
      {error ? (
        <span className="field-error" role="alert">
          {error}
        </span>
      ) : (
        hint && <span className="field-hint">{hint}</span>
      )}
    </label>
  )
}

export function Spinner({ label = 'Loading' }: { label?: string }) {
  return <span className="spinner" role="progressbar" aria-label={label} />
}

export function Empty({ icon, title, body, action }: { icon: string; title: string; body: string; action?: ReactNode }) {
  return (
    <div className="empty">
      <span className="empty-icon" aria-hidden="true">
        <Icon name={icon} size={24} />
      </span>
      <h3>{title}</h3>
      <p>{body}</p>
      {action}
    </div>
  )
}

export function Card({ title, action, children, className = '' }: { title?: ReactNode; action?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <section className={`card ${className}`}>
      {(title || action) && (
        <header className="card-head">
          {title && <h2 className="card-title">{title}</h2>}
          {action}
        </header>
      )}
      {children}
    </section>
  )
}
