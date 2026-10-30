import { BookOpen, ShieldCheck, Users } from 'lucide-react'
import { Logo } from '../components/Layout'

/** Two-column layout shared by the login and register pages. */
export default function AuthShell({ title, subtitle, children }) {
  return (
    <div className="flex min-h-screen">
      <div className="relative hidden w-1/2 flex-col justify-between overflow-hidden bg-gradient-to-br from-brand-700 via-brand-800 to-brand-950 p-12 text-white lg:flex">
        <div className="absolute -right-24 -top-24 h-96 w-96 rounded-full bg-white/5" />
        <div className="absolute -bottom-32 -left-16 h-[28rem] w-[28rem] rounded-full bg-white/5" />
        <Logo light />
        <div className="relative max-w-md">
          <h2 className="text-4xl font-bold leading-tight">Learn, teach and manage — all in one place.</h2>
          <p className="mt-4 text-brand-100">
            NEXZORA LMS brings classes, learning materials, announcements and payments together for your university.
          </p>
          <ul className="mt-8 space-y-4 text-sm text-brand-100">
            <li className="flex items-center gap-3">
              <BookOpen className="h-5 w-5 text-brand-300" /> PDF materials and lesson videos for every class
            </li>
            <li className="flex items-center gap-3">
              <Users className="h-5 w-5 text-brand-300" /> Join classes instantly with an enrollment code
            </li>
            <li className="flex items-center gap-3">
              <ShieldCheck className="h-5 w-5 text-brand-300" /> Secure role-based access for admins, teachers and students
            </li>
          </ul>
        </div>
        <p className="relative text-xs text-brand-200">© {new Date().getFullYear()} NEXZORA LMS</p>
      </div>

      <div className="flex w-full items-center justify-center px-4 py-10 sm:px-6 lg:w-1/2">
        <div className="w-full max-w-md">
          <div className="mb-8 lg:hidden">
            <Logo />
          </div>
          <h1 className="text-2xl font-semibold text-slate-900">{title}</h1>
          <p className="mt-1 text-sm text-slate-500">{subtitle}</p>
          <div className="mt-8">{children}</div>
        </div>
      </div>
    </div>
  )
}
