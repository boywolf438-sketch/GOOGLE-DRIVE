import { useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import {
  ArrowRight,
  BookOpenCheck,
  Building2,
  CheckCircle2,
  Eye,
  EyeOff,
  GraduationCap,
  KeyRound,
  Lock,
  Mail,
  MessageSquare,
  Phone,
  ShieldCheck,
  Sparkles,
  User as UserIcon,
  Users,
} from 'lucide-react'
import type { Role } from '../types'
import { useAuth } from '../context/AuthContext'
import { useData } from '../context/DataContext'
import { useToast } from '../components/Toast'
import { Button, Field, Input, Select } from '../components/ui'
import { Logo } from '../components/Layout'
import { cx, roleLabel } from '../lib/utils'

const ROLE_CARDS: Array<{ role: Role; title: string; blurb: string; icon: typeof Users }> = [
  {
    role: 'parent',
    title: 'Parent',
    blurb: 'Track your child’s exams, quizzes and class messages.',
    icon: Users,
  },
  {
    role: 'teacher',
    title: 'Teacher',
    blurb: 'Create subjects, set exams and post results.',
    icon: GraduationCap,
  },
  {
    role: 'admin',
    title: 'Admin',
    blurb: 'Manage people, classes and school announcements.',
    icon: ShieldCheck,
  },
]

function AuthShell({ children, title, subtitle }: { children: React.ReactNode; title: string; subtitle: string }) {
  return (
    <div className="flex min-h-screen bg-[#f4f7fb]">
      {/* brand panel */}
      <div className="relative hidden w-[46%] flex-col justify-between overflow-hidden bg-gradient-to-br from-navy-950 via-navy-900 to-navy-700 p-10 text-white lg:flex xl:w-[48%]">
        <div className="absolute -top-24 -right-24 h-72 w-72 rounded-full bg-brand-500/20 blur-3xl" />
        <div className="absolute -bottom-32 -left-20 h-80 w-80 rounded-full bg-navy-400/20 blur-3xl" />
        <div className="relative">
          <Logo light />
        </div>
        <div className="relative max-w-md">
          <h1 className="text-4xl leading-tight font-extrabold tracking-tight">
            One place for exams, results and school conversation.
          </h1>
          <p className="mt-4 text-[15px] leading-relaxed text-navy-200">
            MADRASAT IBNUHAJAR connects teachers, parents and administration — exam records, quizzes, results and class
            announcements, all in a single secure platform.
          </p>
          <ul className="mt-8 space-y-3 text-sm">
            {[
              'Group chats that feel like Telegram — with roles & timestamps',
              'Post and edit exam or quiz results in seconds',
              'Parents see their child’s latest scores instantly',
              'Announcements reach the right class every time',
            ].map((line) => (
              <li key={line} className="flex items-start gap-3">
                <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-brand-400" />
                <span className="text-navy-100">{line}</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="relative flex items-center gap-4 text-xs text-navy-300">
          <span className="flex items-center gap-2">
            <Lock className="h-3.5 w-3.5" /> Session kept on this device
          </span>
          <span className="flex items-center gap-2">
            <Sparkles className="h-3.5 w-3.5" /> Demo data included
          </span>
        </div>
      </div>

      {/* form panel */}
      <div className="flex flex-1 flex-col">
        <div className="flex items-center justify-between px-5 py-5 lg:hidden">
          <Logo />
        </div>
        <div className="flex flex-1 items-center justify-center px-4 pb-10 sm:px-8">
          <div className="w-full max-w-md">
            <h2 className="text-2xl font-extrabold tracking-tight text-navy-900">{title}</h2>
            <p className="mt-1.5 text-sm text-navy-500">{subtitle}</p>
            <div className="mt-6">{children}</div>
          </div>
        </div>
      </div>
    </div>
  )
}

function PasswordInput({
  value,
  onChange,
  placeholder = '••••••••',
  autoComplete,
  id,
}: {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  autoComplete?: string
  id?: string
}) {
  const [visible, setVisible] = useState(false)
  return (
    <div className="relative">
      <Input
        id={id}
        type={visible ? 'text' : 'password'}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        autoComplete={autoComplete}
        className="pr-11"
      />
      <button
        type="button"
        onClick={() => setVisible((v) => !v)}
        aria-label={visible ? 'Hide password' : 'Show password'}
        className="absolute top-1/2 right-2 -translate-y-1/2 rounded-lg p-1.5 text-navy-400 transition hover:bg-navy-50 hover:text-navy-700"
      >
        {visible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
      </button>
    </div>
  )
}

const DEMO_ACCOUNTS = [
  { role: 'Admin' as const, email: 'admin@ibnuhajar.ac.ke', password: 'admin123', name: 'Ustadh Ibrahim Yusuf' },
  { role: 'Teacher' as const, email: 'teacher@ibnuhajar.ac.ke', password: 'teacher123', name: 'Ustadha Amina Hassan' },
  { role: 'Parent' as const, email: 'parent@ibnuhajar.ac.ke', password: 'parent123', name: 'Bilal Omar' },
]

export function SignInPage() {
  const { user, signIn } = useAuth()
  const { db } = useData()
  const { success, error: errorToast } = useToast()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  if (user) return <Navigate to="/" replace />

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    const result = signIn(email, password)
    setLoading(false)
    if (!result.ok) {
      setError(result.error ?? 'Unable to sign in.')
      return
    }
    success(`Karibu, ${result.user?.name.split(' ')[0]}!`)
    navigate('/', { replace: true })
  }

  const quickFill = (account: (typeof DEMO_ACCOUNTS)[number]) => {
    setEmail(account.email)
    setPassword(account.password)
    setError('')
    const result = signIn(account.email, account.password)
    if (!result.ok) {
      errorToast(result.error ?? 'Unable to sign in.')
      return
    }
    success(`Signed in as ${roleLabel(result.user?.role ?? 'parent')}.`)
    navigate('/', { replace: true })
  }

  return (
    <AuthShell title="Welcome back" subtitle={`Sign in to continue to ${db.school.name}.`}>
      <form onSubmit={submit} className="space-y-4">
        <Field label="Email address" required>
          <div className="relative">
            <Mail className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-navy-400" />
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@ibnuhajar.ac.ke"
              autoComplete="email"
              required
              className="pl-9"
            />
          </div>
        </Field>
        <Field label="Password" required>
          <PasswordInput value={password} onChange={setPassword} autoComplete="current-password" />
        </Field>

        {error ? (
          <p className="rounded-xl border border-rose-200 bg-rose-50 px-3.5 py-2.5 text-[13px] font-medium text-rose-700">
            {error}
          </p>
        ) : null}

        <Button type="submit" size="lg" block loading={loading} icon={<ArrowRight className="h-4 w-4" />}>
          Sign in
        </Button>
      </form>

      <div className="my-6 flex items-center gap-3">
        <span className="h-px flex-1 bg-navy-100" />
        <span className="text-[11px] font-bold tracking-wider text-navy-400 uppercase">Demo accounts</span>
        <span className="h-px flex-1 bg-navy-100" />
      </div>

      <div className="grid gap-2">
        {DEMO_ACCOUNTS.map((account) => (
          <button
            key={account.email}
            type="button"
            onClick={() => quickFill(account)}
            className="flex items-center gap-3 rounded-xl border border-navy-100 bg-white px-3.5 py-3 text-left transition hover:border-navy-300 hover:bg-navy-50"
          >
            <span
              className={cx(
                'flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-white',
                account.role === 'Admin' ? 'bg-gold-500' : account.role === 'Teacher' ? 'bg-navy-700' : 'bg-brand-600',
              )}
            >
              {account.role === 'Admin' ? (
                <ShieldCheck className="h-4 w-4" />
              ) : account.role === 'Teacher' ? (
                <GraduationCap className="h-4 w-4" />
              ) : (
                <Users className="h-4 w-4" />
              )}
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-[13px] font-bold text-navy-900">
                {account.role} · {account.name}
              </span>
              <span className="block truncate text-xs text-navy-500">
                {account.email} · {account.password}
              </span>
            </span>
            <ArrowRight className="h-4 w-4 shrink-0 text-navy-400" />
          </button>
        ))}
      </div>

      <p className="mt-6 text-center text-sm text-navy-600">
        New to the madrasa?{' '}
        <Link to="/signup" className="font-bold text-navy-900 underline decoration-brand-400 decoration-2 underline-offset-2">
          Create an account
        </Link>
      </p>
    </AuthShell>
  )
}

export function SignUpPage() {
  const { user, signUp } = useAuth()
  const { db } = useData()
  const { success } = useToast()
  const navigate = useNavigate()
  const [role, setRole] = useState<Role>('parent')
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    confirm: '',
    phone: '',
    title: '',
    adminCode: '',
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  if (user) return <Navigate to="/" replace />

  const set = (key: keyof typeof form) => (value: string) => setForm((f) => ({ ...f, [key]: value }))

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (form.password !== form.confirm) {
      setError('Passwords do not match.')
      return
    }
    setLoading(true)
    const result = signUp({
      name: form.name,
      email: form.email,
      password: form.password,
      role,
      phone: form.phone,
      title: form.title,
      adminCode: form.adminCode,
    })
    setLoading(false)
    if (!result.ok) {
      setError(result.error ?? 'Unable to create the account.')
      return
    }
    success(`Account created. Karibu ${result.user?.name.split(' ')[0]}!`)
    navigate('/', { replace: true })
  }

  return (
    <AuthShell title="Create your account" subtitle={`Join ${db.school.name} as a parent, teacher or administrator.`}>
      <div className="grid gap-2 sm:grid-cols-3">
        {ROLE_CARDS.map((card) => {
          const active = card.role === role
          return (
            <button
              key={card.role}
              type="button"
              onClick={() => setRole(card.role)}
              className={cx(
                'rounded-xl border p-3 text-left transition',
                active
                  ? 'border-navy-900 bg-navy-900 text-white shadow-sm'
                  : 'border-navy-100 bg-white hover:border-navy-300 hover:bg-navy-50',
              )}
            >
              <card.icon className={cx('h-5 w-5', active ? 'text-brand-400' : 'text-navy-500')} />
              <span className="mt-2 block text-[13px] font-bold">{card.title}</span>
              <span className={cx('mt-0.5 block text-[11px] leading-snug', active ? 'text-navy-200' : 'text-navy-500')}>
                {card.blurb}
              </span>
            </button>
          )
        })}
      </div>

      <form onSubmit={submit} className="mt-5 space-y-4">
        <Field label="Full name" required>
          <div className="relative">
            <UserIcon className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-navy-400" />
            <Input
              value={form.name}
              onChange={(e) => set('name')(e.target.value)}
              placeholder={role === 'parent' ? 'e.g. Bilal Omar' : 'e.g. Ustadha Amina Hassan'}
              autoComplete="name"
              required
              className="pl-9"
            />
          </div>
        </Field>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Email address" required>
            <div className="relative">
              <Mail className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-navy-400" />
              <Input
                type="email"
                value={form.email}
                onChange={(e) => set('email')(e.target.value)}
                placeholder="you@example.com"
                autoComplete="email"
                required
                className="pl-9"
              />
            </div>
          </Field>
          <Field label="Phone (optional)">
            <div className="relative">
              <Phone className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-navy-400" />
              <Input
                value={form.phone}
                onChange={(e) => set('phone')(e.target.value)}
                placeholder="+254 7xx xxx xxx"
                className="pl-9"
              />
            </div>
          </Field>
        </div>

        <Field
          label={role === 'teacher' ? 'Subject / department (optional)' : 'Title (optional)'}
          hint={role === 'parent' ? 'Example: Parent — Zainab' : 'Shown next to your name in chats.'}
        >
          <Input
            value={form.title}
            onChange={(e) => set('title')(e.target.value)}
            placeholder={role === 'parent' ? 'Parent — Zainab' : role === 'teacher' ? 'Arabic & Fiqh' : 'School Admin'}
          />
        </Field>

        {role === 'admin' ? (
          <Field label="Admin access code" required hint={`Demo code: ${db.school.adminCode}`}>
            <div className="relative">
              <KeyRound className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-navy-400" />
              <Input
                value={form.adminCode}
                onChange={(e) => set('adminCode')(e.target.value)}
                placeholder="IBNUHAJAR-ADMIN"
                required
                className="pl-9"
              />
            </div>
          </Field>
        ) : null}

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Password" required hint="At least 6 characters.">
            <PasswordInput value={form.password} onChange={set('password')} autoComplete="new-password" />
          </Field>
          <Field label="Confirm password" required>
            <PasswordInput value={form.confirm} onChange={set('confirm')} autoComplete="new-password" />
          </Field>
        </div>

        {error ? (
          <p className="rounded-xl border border-rose-200 bg-rose-50 px-3.5 py-2.5 text-[13px] font-medium text-rose-700">
            {error}
          </p>
        ) : null}

        <Button type="submit" size="lg" block loading={loading} icon={<ArrowRight className="h-4 w-4" />}>
          Create account
        </Button>

        {role === 'parent' ? (
          <p className="flex items-start gap-2 rounded-xl bg-brand-50 px-3.5 py-2.5 text-[13px] leading-relaxed text-brand-800">
            <MessageSquare className="mt-0.5 h-4 w-4 shrink-0" />
            After registering, the school office links your account to your child’s record so results appear on your
            dashboard automatically.
          </p>
        ) : (
          <p className="flex items-start gap-2 rounded-xl bg-navy-50 px-3.5 py-2.5 text-[13px] leading-relaxed text-navy-700">
            <Building2 className="mt-0.5 h-4 w-4 shrink-0" />
            Staff accounts can create subjects, examinations and post results immediately after signing in.
          </p>
        )}
      </form>

      <p className="mt-6 text-center text-sm text-navy-600">
        Already have an account?{' '}
        <Link to="/signin" className="font-bold text-navy-900 underline decoration-brand-400 decoration-2 underline-offset-2">
          Sign in
        </Link>
      </p>
    </AuthShell>
  )
}
