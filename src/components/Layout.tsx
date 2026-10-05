import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, NavLink, Navigate, Outlet, useLocation, useNavigate } from 'react-router-dom'
import {
  BookOpenCheck,
  ClipboardList,
  GraduationCap,
  LayoutDashboard,
  LogOut,
  Megaphone,
  Menu,
  MessageSquare,
  RotateCcw,
  Settings as SettingsIcon,
  ShieldCheck,
  UserCircle,
  Users,
  X,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useData } from '../context/DataContext'
import { useToast } from './Toast'
import { ErrorBoundary } from './ErrorBoundary'
import { totalUnread } from '../lib/selectors'
import { cx, roleChipClass, roleLabel } from '../lib/utils'
import { Avatar, Button } from './ui'

interface NavItem {
  to: string
  label: string
  short: string
  icon: LucideIcon
  roles: Array<'admin' | 'teacher' | 'parent'>
  bottom?: boolean
  badge?: number
}

export function Logo({ compact = false, light = false }: { compact?: boolean; light?: boolean }) {
  return (
    <div className="flex items-center gap-2.5">
      <span className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-navy-900 shadow-sm">
        <BookOpenCheck className="h-5 w-5 text-brand-400" />
        <span className="absolute -right-0.5 -bottom-0.5 h-2.5 w-2.5 rounded-full bg-brand-500 ring-2 ring-white" />
      </span>
      {!compact ? (
        <span className="min-w-0 leading-tight">
          <span
            className={cx(
              'block truncate text-[13px] font-extrabold tracking-[0.14em] uppercase',
              light ? 'text-white' : 'text-navy-900',
            )}
          >
            Madrasat
          </span>
          <span
            className={cx(
              'block truncate text-[15px] font-extrabold tracking-[0.08em] uppercase',
              light ? 'text-brand-300' : 'text-brand-600',
            )}
          >
            IbnuHajar
          </span>
        </span>
      ) : null}
    </div>
  )
}

function NavItems({ items, onNavigate }: { items: NavItem[]; onNavigate?: () => void }) {
  return (
    <nav className="flex flex-col gap-1">
      {items.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          end={item.to === '/'}
          onClick={onNavigate}
          className={({ isActive }) =>
            cx(
              'group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition',
              isActive
                ? 'bg-navy-900 text-white shadow-sm'
                : 'text-navy-700 hover:bg-navy-100 hover:text-navy-900',
            )
          }
        >
          {({ isActive }) => (
            <>
              <item.icon className={cx('h-[18px] w-[18px] shrink-0', isActive ? 'text-brand-400' : 'text-navy-500')} />
              <span className="flex-1 truncate">{item.label}</span>
              {item.badge ? (
                <span
                  className={cx(
                    'min-w-5 rounded-full px-1.5 py-0.5 text-center text-[10px] font-bold',
                    isActive ? 'bg-brand-500 text-white' : 'bg-rose-500 text-white',
                  )}
                >
                  {item.badge > 99 ? '99+' : item.badge}
                </span>
              ) : null}
            </>
          )}
        </NavLink>
      ))}
    </nav>
  )
}

export function AppLayout() {
  const { user, signOut } = useAuth()
  const { db, resetDemoData } = useData()
  const { info } = useToast()
  const navigate = useNavigate()
  const location = useLocation()
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  const unread = useMemo(() => (user ? totalUnread(db, user) : 0), [db, user])

  useEffect(() => {
    setDrawerOpen(false)
    setMenuOpen(false)
  }, [location.pathname])

  useEffect(() => {
    const onClick = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) setMenuOpen(false)
    }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [])

  if (!user) return <Navigate to="/signin" replace />

  const allItems: NavItem[] = [
    { to: '/', label: 'Dashboard', short: 'Home', icon: LayoutDashboard, roles: ['admin', 'teacher', 'parent'], bottom: true },
    {
      to: '/chat',
      label: 'Messages',
      short: 'Chat',
      icon: MessageSquare,
      roles: ['admin', 'teacher', 'parent'],
      bottom: true,
      badge: unread,
    },
    {
      to: '/academics',
      label: 'Academics & Exams',
      short: 'Exams',
      icon: GraduationCap,
      roles: ['admin', 'teacher'],
      bottom: true,
    },
    {
      to: '/results',
      label: 'Results',
      short: 'Results',
      icon: ClipboardList,
      roles: ['admin', 'parent'],
      bottom: true,
    },
    {
      to: '/assessments',
      label: 'Assessments',
      short: 'Tests',
      icon: ClipboardList,
      roles: ['teacher'],
      bottom: false,
    },
    {
      to: '/announcements',
      label: 'Announcements',
      short: 'Notices',
      icon: Megaphone,
      roles: ['admin', 'teacher', 'parent'],
      bottom: true,
    },
    {
      to: '/people',
      label: user.role === 'teacher' ? 'Students & Parents' : 'People & Classes',
      short: 'People',
      icon: Users,
      roles: ['admin', 'teacher'],
    },
    { to: '/settings', label: 'Settings', short: 'More', icon: SettingsIcon, roles: ['admin', 'teacher', 'parent'], bottom: true },
  ]

  const items = allItems.filter((item) => item.roles.includes(user.role))
  const bottomItems = items.filter((item) => item.bottom).slice(0, 5)
  const isChat = location.pathname.startsWith('/chat')

  return (
    <div className="flex min-h-screen flex-col bg-[#f4f7fb] lg:flex-row">
      {/* -------------------------------------------------- desktop sidebar */}
      <aside className="sticky top-0 hidden h-screen w-72 shrink-0 flex-col border-r border-navy-100 bg-white lg:flex">
        <div className="px-5 py-5">
          <Link to="/" className="block">
            <Logo />
          </Link>
          <p className="mt-2 text-[11px] font-semibold tracking-wide text-navy-500 uppercase">{db.school.term}</p>
        </div>
        <div className="scroll-slim flex-1 overflow-y-auto px-3 pb-4">
          <NavItems items={items} />
          <div className="mt-6 rounded-2xl bg-gradient-to-br from-navy-900 to-navy-700 p-4 text-white">
            <p className="flex items-center gap-2 text-[11px] font-bold tracking-wider text-brand-300 uppercase">
              <ShieldCheck className="h-3.5 w-3.5" /> Signed in as
            </p>
            <p className="mt-1.5 truncate text-sm font-bold">{user.name}</p>
            <p className="mt-1 text-xs text-navy-200">{user.title ?? roleLabel(user.role)}</p>
          </div>
        </div>
        <div className="border-t border-navy-100 p-3">
          <button
            type="button"
            onClick={() => {
              resetDemoData()
              info('Demo data restored to its original state.')
            }}
            className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-navy-600 transition hover:bg-navy-100 hover:text-navy-900"
          >
            <RotateCcw className="h-[18px] w-[18px] text-navy-400" />
            Reset demo data
          </button>
          <button
            type="button"
            onClick={() => {
              signOut()
              navigate('/signin')
            }}
            className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-rose-600 transition hover:bg-rose-50"
          >
            <LogOut className="h-[18px] w-[18px]" />
            Sign out
          </button>
        </div>
      </aside>

      {/* --------------------------------------------------------- main area */}
      <div className="flex min-h-screen min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 border-b border-navy-100 bg-white/95 backdrop-blur">
          <div className="flex h-14 items-center gap-2 px-3 sm:px-5">
            <button
              type="button"
              onClick={() => setDrawerOpen(true)}
              className="rounded-xl p-2 text-navy-700 transition hover:bg-navy-100 lg:hidden"
              aria-label="Open navigation"
            >
              <Menu className="h-5 w-5" />
            </button>
            <Link to="/" className="lg:hidden">
              <Logo compact={false} />
            </Link>
            <div className="hidden min-w-0 flex-1 lg:block">
              <h1 className="truncate text-sm font-bold text-navy-900">
                {items.find((i) => (i.to === '/' ? location.pathname === '/' : location.pathname.startsWith(i.to)))?.label ??
                  'Dashboard'}
              </h1>
              <p className="truncate text-xs text-navy-500">{db.school.motto}</p>
            </div>
            <div className="flex flex-1 items-center justify-end gap-1.5">
              <Link
                to="/chat"
                className="relative rounded-xl p-2 text-navy-700 transition hover:bg-navy-100"
                aria-label="Open messages"
              >
                <MessageSquare className="h-5 w-5" />
                {unread > 0 ? (
                  <span className="absolute -top-0.5 -right-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-bold text-white">
                    {unread > 99 ? '99+' : unread}
                  </span>
                ) : null}
              </Link>
              <div className="relative" ref={menuRef}>
                <button
                  type="button"
                  onClick={() => setMenuOpen((open) => !open)}
                  className="flex items-center gap-2 rounded-xl p-1 transition hover:bg-navy-100"
                  aria-label="Account menu"
                >
                  <Avatar name={user.name} size="sm" seed={user.id} />
                  <span className="hidden text-left sm:block">
                    <span className="block max-w-[9rem] truncate text-[13px] font-bold text-navy-900">{user.name}</span>
                    <span className="block text-[10px] font-semibold tracking-wide text-navy-500 uppercase">
                      {roleLabel(user.role)}
                    </span>
                  </span>
                </button>
                {menuOpen ? (
                  <div className="absolute right-0 z-40 mt-2 w-64 overflow-hidden rounded-2xl border border-navy-100 bg-white shadow-pop animate-pop">
                    <div className="border-b border-navy-100 bg-navy-50/60 px-4 py-3">
                      <p className="truncate text-sm font-bold text-navy-900">{user.name}</p>
                      <p className="truncate text-xs text-navy-500">{user.email}</p>
                      <span
                        className={cx(
                          'mt-2 inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold uppercase',
                          roleChipClass(user.role),
                        )}
                      >
                        {roleLabel(user.role)}
                      </span>
                    </div>
                    <Link
                      to="/settings"
                      className="flex items-center gap-3 px-4 py-2.5 text-sm font-semibold text-navy-700 transition hover:bg-navy-50"
                    >
                      <UserCircle className="h-4 w-4 text-navy-500" /> Profile & settings
                    </Link>
                    <button
                      type="button"
                      onClick={() => {
                        resetDemoData()
                        info('Demo data restored.')
                        setMenuOpen(false)
                      }}
                      className="flex w-full items-center gap-3 px-4 py-2.5 text-sm font-semibold text-navy-700 transition hover:bg-navy-50"
                    >
                      <RotateCcw className="h-4 w-4 text-navy-500" /> Reset demo data
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        signOut()
                        navigate('/signin')
                      }}
                      className="flex w-full items-center gap-3 border-t border-navy-100 px-4 py-2.5 text-sm font-semibold text-rose-600 transition hover:bg-rose-50"
                    >
                      <LogOut className="h-4 w-4" /> Sign out
                    </button>
                  </div>
                ) : null}
              </div>
            </div>
          </div>
        </header>

        <main className={cx('min-h-0 flex-1', isChat ? 'flex flex-col' : '')}>
          <div
            className={cx(
              isChat ? 'flex min-h-0 flex-1 flex-col' : 'mx-auto w-full max-w-7xl px-3 pt-4 pb-28 sm:px-5 lg:pb-10',
            )}
          >
            <ErrorBoundary>
              <Outlet />
            </ErrorBoundary>
          </div>
        </main>

        {/* ----------------------------------------------------- bottom nav */}
        <nav className="pb-safe fixed inset-x-0 bottom-0 z-30 border-t border-navy-100 bg-white/97 backdrop-blur lg:hidden">
          <div className="mx-auto flex max-w-lg items-stretch justify-between px-1.5 py-1.5">
            {bottomItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/'}
                className={({ isActive }) =>
                  cx(
                    'relative flex flex-1 flex-col items-center gap-0.5 rounded-xl px-1 py-1.5 text-[10px] font-bold transition',
                    isActive ? 'text-navy-900' : 'text-navy-500',
                  )
                }
              >
                {({ isActive }) => (
                  <>
                    <span className={cx('relative rounded-lg p-1.5', isActive && 'bg-navy-100')}>
                      <item.icon className={cx('h-5 w-5', isActive && 'text-navy-900')} />
                      {item.badge ? (
                        <span className="absolute -top-1 -right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-500 px-1 text-[9px] font-bold text-white">
                          {item.badge > 9 ? '9+' : item.badge}
                        </span>
                      ) : null}
                    </span>
                    <span className="truncate">{item.short}</span>
                  </>
                )}
              </NavLink>
            ))}
          </div>
        </nav>
      </div>

      {/* ----------------------------------------------------- mobile drawer */}
      {drawerOpen ? (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-navy-950/50 backdrop-blur-sm animate-fade-in" onClick={() => setDrawerOpen(false)} />
          <div className="relative flex h-full w-[82%] max-w-xs flex-col bg-white shadow-pop animate-slide-up">
            <div className="flex items-center justify-between border-b border-navy-100 px-4 py-4">
              <Logo />
              <button
                type="button"
                onClick={() => setDrawerOpen(false)}
                className="rounded-xl p-2 text-navy-500 hover:bg-navy-100"
                aria-label="Close navigation"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="scroll-slim flex-1 overflow-y-auto p-3">
              <NavItems items={items} onNavigate={() => setDrawerOpen(false)} />
            </div>
            <div className="border-t border-navy-100 p-4">
              <div className="mb-3 flex items-center gap-3">
                <Avatar name={user.name} seed={user.id} />
                <div className="min-w-0">
                  <p className="truncate text-sm font-bold text-navy-900">{user.name}</p>
                  <p className="truncate text-xs text-navy-500">{roleLabel(user.role)}</p>
                </div>
              </div>
              <Button
                variant="outline"
                block
                icon={<LogOut className="h-4 w-4" />}
                onClick={() => {
                  signOut()
                  navigate('/signin')
                }}
              >
                Sign out
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}

export default AppLayout
