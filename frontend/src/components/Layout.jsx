import { useEffect, useState } from 'react'
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import {
  BookOpen,
  ClipboardList,
  CreditCard,
  GraduationCap,
  LayoutDashboard,
  Library,
  LogOut,
  Megaphone,
  Menu,
  Search,
  UserCheck,
  X,
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { initials } from '../utils/format'

const NAV = {
  ADMIN: [
    { to: '/admin', label: 'Dashboard', icon: LayoutDashboard, end: true },
    { to: '/admin/students', label: 'Students', icon: GraduationCap },
    { to: '/admin/teachers', label: 'Teachers', icon: UserCheck },
    { to: '/admin/classes', label: 'Classes', icon: Library },
    { to: '/admin/enrollments', label: 'Enrollments', icon: ClipboardList },
    { to: '/admin/payments', label: 'Payments', icon: CreditCard },
    { to: '/admin/announcements', label: 'Announcements', icon: Megaphone },
  ],
  TEACHER: [
    { to: '/teacher', label: 'Dashboard', icon: LayoutDashboard, end: true },
    { to: '/teacher/classes', label: 'My Classes', icon: Library },
    { to: '/teacher/announcements', label: 'Announcements', icon: Megaphone },
  ],
  STUDENT: [
    { to: '/student', label: 'Dashboard', icon: LayoutDashboard, end: true },
    { to: '/student/browse', label: 'Browse Classes', icon: Search },
    { to: '/student/classes', label: 'My Classes', icon: BookOpen },
    { to: '/student/announcements', label: 'Announcements', icon: Megaphone },
    { to: '/student/payments', label: 'Payments', icon: CreditCard },
  ],
}

const ROLE_LABEL = { ADMIN: 'Administrator', TEACHER: 'Teacher', STUDENT: 'Student' }

/** NEXZORA wordmark with the "N" monogram (same mark as the favicon). */
export function Logo({ light = false }) {
  return (
    <div className="flex items-center gap-2.5">
      <svg viewBox="0 0 32 32" className="h-8 w-8 shrink-0" aria-hidden="true">
        <rect width="32" height="32" rx="6" fill={light ? '#ffffff' : '#0a0a0a'} />
        <path d="M9 23V9h2.6l7.6 9.6V9H22v14h-2.6l-7.6-9.6V23z" fill={light ? '#0a0a0a' : '#ffffff'} />
      </svg>
      <div className="leading-none">
        <p className={`text-[15px] font-bold tracking-[0.18em] ${light ? 'text-white' : 'text-neutral-900'}`}>NEXZORA</p>
        <p className={`mt-1 text-[10px] font-medium uppercase tracking-[0.2em] ${light ? 'text-neutral-400' : 'text-neutral-500'}`}>
          Learning Management
        </p>
      </div>
    </div>
  )
}

export default function Layout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [open, setOpen] = useState(false)

  // Close the mobile drawer on navigation.
  useEffect(() => setOpen(false), [location.pathname])

  const handleLogout = () => {
    logout()
    navigate('/login', { replace: true })
  }

  const links = NAV[user.role] || []

  const sidebar = (
    <div className="flex h-full flex-col bg-neutral-950">
      <div className="flex h-16 items-center justify-between border-b border-neutral-800 px-5">
        <Logo light />
        <button className="rounded-md p-1.5 text-neutral-400 hover:bg-neutral-800 hover:text-white lg:hidden" onClick={() => setOpen(false)} aria-label="Close menu">
          <X className="h-5 w-5" />
        </button>
      </div>
      <p className="px-5 pb-2 pt-5 text-[11px] font-medium uppercase tracking-wider text-neutral-500">{ROLE_LABEL[user.role]} menu</p>
      <nav className="flex-1 space-y-0.5 overflow-y-auto px-3">
        {links.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              `relative flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-neutral-800 text-white before:absolute before:inset-y-1.5 before:left-0 before:w-0.5 before:rounded-full before:bg-accent-400'
                  : 'text-neutral-400 hover:bg-neutral-900 hover:text-white'
              }`
            }
          >
            <Icon className="h-[18px] w-[18px] shrink-0" />
            {label}
          </NavLink>
        ))}
      </nav>
      <div className="border-t border-neutral-800 p-3">
        <div className="mb-2 flex items-center gap-3 px-3 py-2">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white text-xs font-semibold text-neutral-900">
            {initials(user.fullName)}
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-white">{user.fullName}</p>
            <p className="truncate text-xs text-neutral-500">{user.email}</p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-neutral-400 transition-colors hover:bg-neutral-900 hover:text-white"
        >
          <LogOut className="h-[18px] w-[18px]" /> Sign out
        </button>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen">
      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 lg:block">{sidebar}</aside>

      {/* Mobile drawer */}
      {open && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-black/60" onClick={() => setOpen(false)} />
          <aside className="absolute inset-y-0 left-0 w-72 max-w-[85%]">{sidebar}</aside>
        </div>
      )}

      <div className="lg:pl-64">
        {/* Mobile top bar (the desktop sidebar already shows the logo and user) */}
        <header className="sticky top-0 z-20 flex h-14 items-center gap-3 border-b border-neutral-200 bg-white px-4 lg:hidden">
          <button className="rounded-md p-2 text-neutral-700 hover:bg-neutral-100" onClick={() => setOpen(true)} aria-label="Open menu">
            <Menu className="h-5 w-5" />
          </button>
          <Logo />
          <div className="ml-auto flex h-8 w-8 items-center justify-center rounded-full bg-neutral-900 text-xs font-semibold text-white" title={user.fullName}>
            {initials(user.fullName)}
          </div>
        </header>
        <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
