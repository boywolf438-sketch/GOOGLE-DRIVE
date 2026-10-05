import { useEffect, useId, useRef, useState } from 'react'
import type { ButtonHTMLAttributes, InputHTMLAttributes, ReactNode, SelectHTMLAttributes, TextareaHTMLAttributes } from 'react'
import { Loader2, Search, X } from 'lucide-react'
import { avatarSoftTone, avatarTone, cx, initials } from '../lib/utils'

/* ------------------------------------------------------------------- button */

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'success' | 'outline'
type ButtonSize = 'sm' | 'md' | 'lg' | 'icon'

const VARIANTS: Record<ButtonVariant, string> = {
  primary: 'bg-navy-900 text-white hover:bg-navy-800 active:bg-navy-950 shadow-sm',
  secondary: 'bg-navy-100 text-navy-800 hover:bg-navy-200 active:bg-navy-300',
  success: 'bg-brand-600 text-white hover:bg-brand-700 active:bg-brand-800 shadow-sm',
  outline: 'border border-navy-200 bg-white text-navy-800 hover:bg-navy-50 hover:border-navy-300',
  ghost: 'text-navy-700 hover:bg-navy-100 active:bg-navy-200',
  danger: 'bg-rose-600 text-white hover:bg-rose-700 active:bg-rose-800 shadow-sm',
}

const SIZES: Record<ButtonSize, string> = {
  sm: 'h-9 px-3 text-[13px] gap-1.5 rounded-lg',
  md: 'h-10 px-4 text-sm gap-2 rounded-xl',
  lg: 'h-12 px-5 text-[15px] gap-2 rounded-xl',
  icon: 'h-9 w-9 rounded-lg justify-center',
}

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  size?: ButtonSize
  loading?: boolean
  icon?: ReactNode
  block?: boolean
}

export function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  icon,
  block,
  className,
  children,
  disabled,
  ...rest
}: ButtonProps) {
  return (
    <button
      {...rest}
      disabled={disabled || loading}
      className={cx(
        'inline-flex shrink-0 items-center justify-center font-semibold whitespace-nowrap transition-colors select-none',
        'disabled:cursor-not-allowed disabled:opacity-55',
        VARIANTS[variant],
        SIZES[size],
        block && 'w-full',
        className,
      )}
    >
      {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : icon}
      {children}
    </button>
  )
}

/* -------------------------------------------------------------------- badge */

export function Badge({
  children,
  className,
  tone = 'navy',
}: {
  children: ReactNode
  className?: string
  tone?: 'navy' | 'brand' | 'gold' | 'rose' | 'violet' | 'slate'
}) {
  const tones = {
    navy: 'bg-navy-100 text-navy-800',
    brand: 'bg-brand-100 text-brand-800',
    gold: 'bg-gold-100 text-gold-700',
    rose: 'bg-rose-100 text-rose-700',
    violet: 'bg-violet-100 text-violet-700',
    slate: 'bg-slate-100 text-slate-700',
  }
  return (
    <span
      className={cx(
        'inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-bold tracking-wide uppercase',
        tones[tone],
        className,
      )}
    >
      {children}
    </span>
  )
}

/* --------------------------------------------------------------------- card */

export function Card({
  children,
  className,
  as: Tag = 'div',
}: {
  children: ReactNode
  className?: string
  as?: 'div' | 'section' | 'article' | 'li'
}) {
  return <Tag className={cx('rounded-2xl border border-navy-100 bg-white shadow-card', className)}>{children}</Tag>
}

export function SectionTitle({
  title,
  subtitle,
  action,
  icon,
}: {
  title: string
  subtitle?: string
  action?: ReactNode
  icon?: ReactNode
}) {
  return (
    <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
      <div className="flex items-center gap-3">
        {icon ? (
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-navy-900 text-white">{icon}</span>
        ) : null}
        <div>
          <h2 className="text-base font-bold text-navy-900 sm:text-lg">{title}</h2>
          {subtitle ? <p className="mt-0.5 text-[13px] text-navy-500">{subtitle}</p> : null}
        </div>
      </div>
      {action}
    </div>
  )
}

/* ------------------------------------------------------------------- avatar */

export function Avatar({
  name,
  size = 'md',
  seed,
  soft = false,
  className,
  ring = false,
}: {
  name: string
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
  seed?: string
  soft?: boolean
  className?: string
  ring?: boolean
}) {
  const sizes = {
    xs: 'h-6 w-6 text-[10px]',
    sm: 'h-8 w-8 text-xs',
    md: 'h-10 w-10 text-sm',
    lg: 'h-12 w-12 text-base',
    xl: 'h-16 w-16 text-xl',
  }
  return (
    <span
      aria-hidden="true"
      className={cx(
        'flex shrink-0 items-center justify-center rounded-full font-bold tracking-tight select-none',
        soft ? avatarSoftTone(seed ?? name) : avatarTone(seed ?? name),
        sizes[size],
        ring && 'ring-2 ring-white',
        className,
      )}
    >
      {initials(name)}
    </span>
  )
}

/* ------------------------------------------------------------------- fields */

export function Field({
  label,
  children,
  hint,
  error,
  required,
  className,
}: {
  label?: string
  children: ReactNode
  hint?: string
  error?: string
  required?: boolean
  className?: string
}) {
  return (
    <label className={cx('block', className)}>
      {label ? (
        <span className="mb-1.5 flex items-center gap-1 text-[13px] font-semibold text-navy-800">
          {label}
          {required ? <span className="text-rose-500">*</span> : null}
        </span>
      ) : null}
      {children}
      {error ? (
        <span className="mt-1 block text-xs font-medium text-rose-600">{error}</span>
      ) : hint ? (
        <span className="mt-1 block text-xs text-navy-500">{hint}</span>
      ) : null}
    </label>
  )
}

const CONTROL =
  'w-full rounded-xl border border-navy-200 bg-white px-3.5 py-2.5 text-sm text-navy-900 shadow-sm transition placeholder:text-navy-400 focus:border-navy-500 focus:ring-2 focus:ring-navy-500/20 focus:outline-none disabled:bg-navy-50 disabled:text-navy-400'

export function Input({ className, ...rest }: InputHTMLAttributes<HTMLInputElement>) {
  return <input {...rest} className={cx(CONTROL, className)} />
}

export function Textarea({ className, rows = 4, ...rest }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea rows={rows} {...rest} className={cx(CONTROL, 'resize-y leading-relaxed', className)} />
}

export function Select({ className, children, ...rest }: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      {...rest}
      className={cx(
        CONTROL,
        'cursor-pointer appearance-none bg-[length:16px] bg-[right_0.75rem_center] bg-no-repeat pr-10',
        className,
      )}
      style={{
        backgroundImage:
          "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%230e3260' stroke-width='2.5'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' d='M19 9l-7 7-7-7'/%3E%3C/svg%3E\")",
      }}
    >
      {children}
    </select>
  )
}

export function SearchInput({
  value,
  onChange,
  placeholder = 'Search…',
  className,
}: {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  className?: string
}) {
  return (
    <div className={cx('relative', className)}>
      <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-navy-400" />
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={cx(CONTROL, 'pl-9')}
        type="search"
      />
      {value ? (
        <button
          type="button"
          onClick={() => onChange('')}
          aria-label="Clear search"
          className="absolute top-1/2 right-2 -translate-y-1/2 rounded-md p-1 text-navy-400 hover:bg-navy-50 hover:text-navy-700"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      ) : null}
    </div>
  )
}

/* -------------------------------------------------------------------- modal */

export function Modal({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  size = 'md',
}: {
  open: boolean
  onClose: () => void
  title: string
  description?: string
  children: ReactNode
  footer?: ReactNode
  size?: 'sm' | 'md' | 'lg' | 'xl'
}) {
  const titleId = useId()
  const panelRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const timer = window.setTimeout(() => {
      const focusable = panelRef.current?.querySelector<HTMLElement>(
        'input,textarea,select,button:not([data-autofocus-skip])',
      )
      focusable?.focus()
    }, 60)
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = previous
      window.clearTimeout(timer)
    }
  }, [open, onClose])

  if (!open) return null

  const widths = { sm: 'max-w-sm', md: 'max-w-lg', lg: 'max-w-2xl', xl: 'max-w-4xl' }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center" role="dialog" aria-modal="true" aria-labelledby={titleId}>
      <div className="absolute inset-0 bg-navy-950/55 backdrop-blur-sm animate-fade-in" onClick={onClose} />
      <div
        ref={panelRef}
        className={cx(
          'relative z-10 flex max-h-[92vh] w-full flex-col overflow-hidden rounded-t-3xl border border-navy-100 bg-white shadow-pop animate-slide-up sm:rounded-2xl',
          widths[size],
        )}
      >
        <header className="flex items-start gap-3 border-b border-navy-100 px-5 py-4">
          <div className="min-w-0 flex-1">
            <h3 id={titleId} className="text-[15px] font-bold text-navy-900">
              {title}
            </h3>
            {description ? <p className="mt-0.5 text-[13px] text-navy-500">{description}</p> : null}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close dialog"
            className="rounded-lg p-1.5 text-navy-400 transition hover:bg-navy-100 hover:text-navy-800"
          >
            <X className="h-4.5 w-4.5" />
          </button>
        </header>
        <div className="scroll-slim flex-1 overflow-y-auto px-5 py-4">{children}</div>
        {footer ? (
          <footer className="flex flex-col-reverse gap-2 border-t border-navy-100 bg-navy-50/60 px-5 py-3.5 sm:flex-row sm:justify-end">
            {footer}
          </footer>
        ) : null}
      </div>
    </div>
  )
}

export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = 'Delete',
  onConfirm,
  onCancel,
  destructive = true,
}: {
  open: boolean
  title: string
  message: string
  confirmLabel?: string
  onConfirm: () => void
  onCancel: () => void
  destructive?: boolean
}) {
  return (
    <Modal
      open={open}
      onClose={onCancel}
      title={title}
      size="sm"
      footer={
        <>
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button variant={destructive ? 'danger' : 'primary'} onClick={onConfirm}>
            {confirmLabel}
          </Button>
        </>
      }
    >
      <p className="text-sm leading-relaxed text-navy-700">{message}</p>
    </Modal>
  )
}

/* -------------------------------------------------------------- misc pieces */

export function EmptyState({
  icon,
  title,
  message,
  action,
  className,
}: {
  icon?: ReactNode
  title: string
  message?: string
  action?: ReactNode
  className?: string
}) {
  return (
    <div className={cx('flex flex-col items-center justify-center px-6 py-12 text-center', className)}>
      {icon ? (
        <span className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-navy-50 text-navy-400">
          {icon}
        </span>
      ) : null}
      <h3 className="text-sm font-bold text-navy-900">{title}</h3>
      {message ? <p className="mt-1 max-w-sm text-[13px] leading-relaxed text-navy-500">{message}</p> : null}
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  )
}

export function ProgressBar({
  value,
  tone = 'brand',
  className,
  height = 'h-2',
}: {
  value: number
  tone?: 'brand' | 'navy' | 'gold' | 'rose'
  className?: string
  height?: string
}) {
  const tones = { brand: 'bg-brand-500', navy: 'bg-navy-600', gold: 'bg-gold-500', rose: 'bg-rose-500' }
  return (
    <div className={cx('w-full overflow-hidden rounded-full bg-navy-100', height, className)}>
      <div
        className={cx('h-full rounded-full transition-all duration-500', tones[tone])}
        style={{ width: `${Math.max(0, Math.min(100, value))}%` }}
      />
    </div>
  )
}

export function Ring({
  value,
  size = 104,
  stroke = 10,
  color = '#10b981',
  track = '#dbeafe',
  label,
  sublabel,
}: {
  value: number
  size?: number
  stroke?: number
  color?: string
  track?: string
  label?: string
  sublabel?: string
}) {
  const clamped = Math.max(0, Math.min(100, value))
  const radius = (size - stroke) / 2
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (clamped / 100) * circumference
  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke={track} strokeWidth={stroke} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{ transition: 'stroke-dashoffset 700ms cubic-bezier(0.16,1,0.3,1)' }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-lg font-extrabold text-navy-900">{label ?? `${Math.round(clamped)}%`}</span>
        {sublabel ? <span className="text-[10px] font-semibold tracking-wide text-navy-500 uppercase">{sublabel}</span> : null}
      </div>
    </div>
  )
}

export function Segmented<T extends string>({
  options,
  value,
  onChange,
  className,
  size = 'md',
}: {
  options: Array<{ value: T; label: string; icon?: ReactNode; count?: number }>
  value: T
  onChange: (value: T) => void
  className?: string
  size?: 'sm' | 'md'
}) {
  return (
    <div
      className={cx(
        'no-scrollbar flex gap-1 overflow-x-auto rounded-xl bg-navy-100/70 p-1',
        size === 'sm' ? 'text-xs' : 'text-[13px]',
        className,
      )}
      role="tablist"
    >
      {options.map((option) => {
        const active = option.value === value
        return (
          <button
            key={option.value}
            role="tab"
            aria-selected={active}
            type="button"
            onClick={() => onChange(option.value)}
            className={cx(
              'inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg px-3 font-semibold whitespace-nowrap transition',
              size === 'sm' ? 'h-8' : 'h-9',
              active ? 'bg-white text-navy-900 shadow-sm' : 'text-navy-600 hover:bg-white/60 hover:text-navy-800',
            )}
          >
            {option.icon}
            {option.label}
            {typeof option.count === 'number' ? (
              <span
                className={cx(
                  'rounded-full px-1.5 py-0.5 text-[10px] font-bold',
                  active ? 'bg-navy-900 text-white' : 'bg-navy-200 text-navy-700',
                )}
              >
                {option.count}
              </span>
            ) : null}
          </button>
        )
      })}
    </div>
  )
}

export function Spinner({ className }: { className?: string }) {
  return <Loader2 className={cx('h-5 w-5 animate-spin text-navy-400', className)} />
}

export function useDebounced<T>(value: T, delay = 250): T {
  const [debounced, setDebounced] = useState(value)
  useEffect(() => {
    const t = window.setTimeout(() => setDebounced(value), delay)
    return () => window.clearTimeout(t)
  }, [value, delay])
  return debounced
}
