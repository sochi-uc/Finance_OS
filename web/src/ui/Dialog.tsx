import { useEffect, useId, useRef, type FormEvent, type ReactNode, type RefObject } from 'react'
import Icon from './Icon'

interface DialogProps {
  open: boolean
  onClose: () => void
  title: string
  subtitle?: string
  children: ReactNode
  footer?: ReactNode
  size?: 'sm' | 'md' | 'lg'
  initialFocus?: RefObject<HTMLElement | null>
}

/**
 * Native <dialog>: the browser provides the top layer, inert background, focus trap, Esc and focus
 * restoration. Renders as a bottom sheet on phones (CSS), a centred glass panel elsewhere.
 */
export default function Dialog({ open, onClose, title, subtitle, children, footer, size = 'md', initialFocus }: DialogProps) {
  const ref = useRef<HTMLDialogElement>(null)
  const titleId = useId()

  useEffect(() => {
    const el = ref.current
    if (!el) return
    if (open && !el.open) {
      el.showModal()
      initialFocus?.current?.focus()
    } else if (!open && el.open) {
      el.close()
    }
  }, [open, initialFocus])

  return (
    <dialog
      ref={ref}
      className={`dialog dialog--${size} glass`}
      aria-labelledby={titleId}
      onCancel={(e) => {
        e.preventDefault()
        onClose()
      }}
      onClick={(e) => {
        if (e.target === ref.current) onClose()
      }}
    >
      {open && (
        <div className="dialog-inner">
          <header className="dialog-head">
            <div>
              <h2 id={titleId} className="dialog-title">
                {title}
              </h2>
              {subtitle && <p className="dialog-sub">{subtitle}</p>}
            </div>
            <button type="button" className="icon-btn" onClick={onClose} aria-label="Close">
              <Icon name="close" size={16} />
            </button>
          </header>
          <div className="dialog-body">{children}</div>
          {footer && <footer className="dialog-foot">{footer}</footer>}
        </div>
      )}
    </dialog>
  )
}

/** A dialog whose body is a form; Enter submits, the primary button shows a spinner while busy. */
export function FormDialog({
  open,
  onClose,
  title,
  subtitle,
  submitLabel,
  busy,
  danger,
  canSubmit = true,
  onSubmit,
  children,
  size,
  initialFocus,
}: Omit<DialogProps, 'footer'> & {
  submitLabel: string
  busy: boolean
  danger?: boolean
  canSubmit?: boolean
  onSubmit: () => void
}) {
  const formId = useId()
  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={title}
      subtitle={subtitle}
      size={size}
      initialFocus={initialFocus}
      footer={
        <>
          <button type="button" className="btn btn--ghost" onClick={onClose}>
            Cancel
          </button>
          <button
            type="submit"
            form={formId}
            className={`btn ${danger ? 'btn--danger' : 'btn--primary'}`}
            aria-busy={busy}
            disabled={!canSubmit}
          >
            {submitLabel}
          </button>
        </>
      }
    >
      <form
        id={formId}
        className="form"
        noValidate
        onSubmit={(e: FormEvent) => {
          e.preventDefault()
          if (canSubmit && !busy) onSubmit()
        }}
      >
        {children}
      </form>
    </Dialog>
  )
}
