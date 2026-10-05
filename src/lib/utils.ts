/** Small helpers shared across the app (ids, dates, names, styling). */

let seq = 0
export function uid(prefix = 'id'): string {
  seq += 1
  const rand = Math.random().toString(36).slice(2, 8)
  return `${prefix}_${Date.now().toString(36)}${seq.toString(36)}${rand}`
}

export function cx(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(' ')
}

export function initials(name: string): string {
  const clean = name.replace(/\((.*?)\)/g, ' ').replace(/[^A-Za-z\s'-]/g, ' ').trim()
  const words = clean.split(/\s+/).filter(Boolean)
  if (words.length === 0) return '?'
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase()
  return (words[0][0] + words[words.length - 1][0]).toUpperCase()
}

/* ------------------------------------------------------------------ dates */

const DATE_FMT = new Intl.DateTimeFormat('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
const DATE_LONG_FMT = new Intl.DateTimeFormat('en-GB', {
  weekday: 'short',
  day: '2-digit',
  month: 'short',
  year: 'numeric',
})
const TIME_FMT = new Intl.DateTimeFormat('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false })

export function formatDate(iso: string): string {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return '—'
  return DATE_FMT.format(d)
}

export function formatDateLong(iso: string): string {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return '—'
  return DATE_LONG_FMT.format(d)
}

export function formatTime(iso: string): string {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  return TIME_FMT.format(d)
}

export function formatDateTime(iso: string): string {
  if (!iso) return '—'
  return `${formatDate(iso)} · ${formatTime(iso)}`
}

export function dayKey(iso: string): string {
  const d = new Date(iso)
  return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`
}

export function isSameDay(a: string, b: string): boolean {
  return dayKey(a) === dayKey(b)
}

export function isToday(iso: string): boolean {
  return isSameDay(iso, new Date().toISOString())
}

export function dayLabel(iso: string): string {
  const now = new Date()
  const d = new Date(iso)
  const today = dayKey(now.toISOString())
  const yesterday = dayKey(new Date(now.getTime() - 86400000).toISOString())
  const key = dayKey(iso)
  if (key === today) return 'Today'
  if (key === yesterday) return 'Yesterday'
  return DATE_LONG_FMT.format(d).replace(/^\w{3}, /, '')
}

export function relativeTime(iso: string): string {
  const then = new Date(iso).getTime()
  if (Number.isNaN(then)) return ''
  const diff = Date.now() - then
  const mins = Math.round(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hours = Math.round(mins / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.round(hours / 24)
  if (days === 1) return 'yesterday'
  if (days < 7) return `${days}d ago`
  return formatDate(iso)
}

export function isPast(iso: string): boolean {
  return new Date(iso).getTime() < Date.now()
}

export function toDateInput(iso: string): string {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

export function termOptions(anchor = new Date()): string[] {
  const y = anchor.getFullYear()
  return [`Term 1 ${y}`, `Term 2 ${y}`, `Term 3 ${y}`, `Term 1 ${y + 1}`]
}

/* ---------------------------------------------------------------- avatars */

const AVATAR_TONES = [
  'bg-navy-700 text-white',
  'bg-brand-600 text-white',
  'bg-gold-500 text-white',
  'bg-violet-600 text-white',
  'bg-rose-500 text-white',
  'bg-cyan-600 text-white',
  'bg-navy-500 text-white',
  'bg-brand-700 text-white',
]

const AVATAR_SOFT_TONES = [
  'bg-navy-100 text-navy-800',
  'bg-brand-100 text-brand-800',
  'bg-gold-100 text-gold-700',
  'bg-violet-100 text-violet-700',
  'bg-rose-100 text-rose-700',
  'bg-cyan-100 text-cyan-800',
]

export function hashString(value: string): number {
  let h = 0
  for (let i = 0; i < value.length; i += 1) {
    h = (h << 5) - h + value.charCodeAt(i)
    h |= 0
  }
  return Math.abs(h)
}

export function avatarTone(seed: string): string {
  return AVATAR_TONES[hashString(seed) % AVATAR_TONES.length]
}

export function avatarSoftTone(seed: string): string {
  return AVATAR_SOFT_TONES[hashString(seed) % AVATAR_SOFT_TONES.length]
}

/* ------------------------------------------------------------------ roles */

export function roleLabel(role: string): string {
  if (role === 'admin') return 'Admin'
  if (role === 'teacher') return 'Teacher'
  return 'Parent'
}

export function roleChipClass(role: string): string {
  if (role === 'admin') return 'bg-gold-100 text-gold-700 ring-1 ring-gold-400/50'
  if (role === 'teacher') return 'bg-navy-100 text-navy-700 ring-1 ring-navy-300/60'
  return 'bg-brand-100 text-brand-800 ring-1 ring-brand-300/60'
}

/* --------------------------------------------------------------- academics */

export function assessmentTypeLabel(type: string): string {
  switch (type) {
    case 'exam':
      return 'Exam'
    case 'quiz':
      return 'Quiz'
    case 'test':
      return 'Test'
    case 'assignment':
      return 'Assignment'
    default:
      return type
  }
}

export function assessmentTypeClass(type: string): string {
  switch (type) {
    case 'exam':
      return 'bg-navy-900 text-white'
    case 'quiz':
      return 'bg-brand-600 text-white'
    case 'test':
      return 'bg-gold-500 text-white'
    default:
      return 'bg-violet-600 text-white'
  }
}

export const SUBJECT_ACCENTS: Record<string, { chip: string; bar: string; soft: string; dot: string }> = {
  navy: { chip: 'bg-navy-100 text-navy-800', bar: 'bg-navy-700', soft: 'bg-navy-50', dot: 'bg-navy-700' },
  emerald: {
    chip: 'bg-brand-100 text-brand-800',
    bar: 'bg-brand-600',
    soft: 'bg-brand-50',
    dot: 'bg-brand-600',
  },
  gold: { chip: 'bg-gold-100 text-gold-700', bar: 'bg-gold-500', soft: 'bg-gold-100', dot: 'bg-gold-500' },
  violet: {
    chip: 'bg-violet-100 text-violet-700',
    bar: 'bg-violet-600',
    soft: 'bg-violet-50',
    dot: 'bg-violet-600',
  },
  rose: { chip: 'bg-rose-100 text-rose-700', bar: 'bg-rose-500', soft: 'bg-rose-50', dot: 'bg-rose-500' },
  cyan: { chip: 'bg-cyan-100 text-cyan-800', bar: 'bg-cyan-600', soft: 'bg-cyan-50', dot: 'bg-cyan-600' },
}

export function accentOf(accent: string) {
  return SUBJECT_ACCENTS[accent] ?? SUBJECT_ACCENTS.navy
}

export function average(numbers: number[]): number {
  if (numbers.length === 0) return 0
  return numbers.reduce((a, b) => a + b, 0) / numbers.length
}

export function round(value: number, digits = 1): number {
  const f = 10 ** digits
  return Math.round(value * f) / f
}

export function download(filename: string, content: string, mime = 'text/csv;charset=utf-8') {
  const blob = new Blob([content], { type: mime })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  setTimeout(() => URL.revokeObjectURL(url), 1500)
}

export function toCsv(rows: Array<Array<string | number>>): string {
  return rows
    .map((row) =>
      row
        .map((cell) => {
          const value = String(cell ?? '')
          return /[",\n]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value
        })
        .join(','),
    )
    .join('\n')
}
