import { useEffect } from 'react'
import { AlertTriangle, Inbox, Loader2, Search, X } from 'lucide-react'

export function Spinner({ className = 'h-5 w-5' }) {
  return <Loader2 className={`animate-spin ${className}`} />
}

export function PageLoader() {
  return (
    <div className="flex items-center justify-center py-20 text-neutral-900">
      <Spinner className="h-7 w-7" />
    </div>
  )
}

export function PageHeader({ title, subtitle, actions }) {
  return (
    <div className="mb-6 flex flex-col gap-3 border-b border-neutral-200 pb-5 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 className="text-2xl font-semibold text-neutral-900">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-neutral-500">{subtitle}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  )
}

/** A single figure on a dashboard. Compact label/value row on phones, a tile from the sm breakpoint. */
export function StatCard({ icon: Icon, label, value, hint }) {
  return (
    <div className="card flex items-center justify-between gap-3 px-4 py-3 sm:block sm:p-5">
      <div className="flex min-w-0 items-center justify-between gap-3">
        <p className="text-xs font-medium uppercase tracking-wider text-neutral-500">{label}</p>
        {Icon && <Icon className="hidden h-4 w-4 shrink-0 text-neutral-400 sm:block" />}
      </div>
      <div className="min-w-0 text-right sm:text-left">
        <p className="truncate text-lg font-semibold tabular-nums text-neutral-900 sm:mt-2 sm:text-2xl">{value}</p>
        {hint && <p className="mt-1 hidden text-xs text-neutral-500 sm:block">{hint}</p>}
      </div>
    </div>
  )
}

// Badges are neutral; colour appears only as a small status dot.
const DOTS = {
  gray: null,
  dark: null,
  green: 'bg-emerald-600',
  amber: 'bg-amber-500',
  red: 'bg-red-600',
}

export function Badge({ tone = 'gray', children }) {
  const dark = tone === 'dark'
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded border px-2 py-0.5 text-xs font-medium ${
        dark ? 'border-neutral-900 bg-neutral-900 text-white' : 'border-neutral-300 bg-white text-neutral-700'
      }`}
    >
      {DOTS[tone] && <span className={`h-1.5 w-1.5 rounded-full ${DOTS[tone]}`} />}
      {children}
    </span>
  )
}

export function EmptyState({ icon: Icon = Inbox, title, message, action }) {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-14 text-center">
      <Icon className="mb-3 h-8 w-8 text-neutral-300" strokeWidth={1.5} />
      <p className="font-medium text-neutral-800">{title}</p>
      {message && <p className="mt-1 max-w-sm text-sm text-neutral-500">{message}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  )
}

export function SearchInput({ value, onChange, placeholder = 'Search...' }) {
  return (
    <div className="relative w-full sm:w-64">
      <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
      <input className="input pl-9" value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} aria-label={placeholder} />
    </div>
  )
}

/** Label + control + error message. */
export function Field({ label, error, hint, required, children, htmlFor }) {
  return (
    <div>
      {label && (
        <label className="label" htmlFor={htmlFor}>
          {label} {required && <span className="text-red-600">*</span>}
        </label>
      )}
      {children}
      {error ? <p className="mt-1 text-xs text-red-600">{error}</p> : hint && <p className="mt-1 text-xs text-neutral-500">{hint}</p>}
    </div>
  )
}

export function Input({ error, className = '', ...props }) {
  return <input className={`input ${error ? 'input-error' : ''} ${className}`} aria-invalid={Boolean(error)} {...props} />
}

export function Select({ error, className = '', children, ...props }) {
  return (
    <select className={`input ${error ? 'input-error' : ''} ${className}`} aria-invalid={Boolean(error)} {...props}>
      {children}
    </select>
  )
}

export function Textarea({ error, className = '', ...props }) {
  return <textarea className={`input ${error ? 'input-error' : ''} ${className}`} rows={4} aria-invalid={Boolean(error)} {...props} />
}

export function Modal({ open, title, onClose, children, footer, size = 'md' }) {
  useEffect(() => {
    if (!open) return
    const onKey = (e) => e.key === 'Escape' && onClose()
    document.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [open, onClose])

  if (!open) return null
  const width = { sm: 'sm:max-w-md', md: 'sm:max-w-lg', lg: 'sm:max-w-2xl' }[size]
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div role="dialog" aria-modal="true" aria-label={title} className={`relative flex max-h-[92vh] w-full flex-col rounded-t-xl border border-neutral-200 bg-white sm:rounded-lg ${width}`}>
        <div className="flex items-center justify-between border-b border-neutral-200 px-5 py-3.5">
          <h2 className="text-base font-semibold text-neutral-900">{title}</h2>
          <button className="btn-ghost" onClick={onClose} aria-label="Close">
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="overflow-y-auto px-5 py-4">{children}</div>
        {footer && <div className="flex justify-end gap-2 border-t border-neutral-200 bg-neutral-50 px-5 py-3">{footer}</div>}
      </div>
    </div>
  )
}

export function ConfirmDialog({ open, title = 'Are you sure?', message, confirmLabel = 'Delete', busy, onConfirm, onClose }) {
  return (
    <Modal
      open={open}
      title={title}
      onClose={onClose}
      size="sm"
      footer={
        <>
          <button className="btn-secondary" onClick={onClose} disabled={busy}>
            Cancel
          </button>
          <button className="btn-danger" onClick={onConfirm} disabled={busy}>
            {busy && <Spinner className="h-4 w-4" />} {confirmLabel}
          </button>
        </>
      }
    >
      <div className="flex gap-3">
        <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-red-600" />
        <p className="text-sm text-neutral-700">{message}</p>
      </div>
    </Modal>
  )
}
