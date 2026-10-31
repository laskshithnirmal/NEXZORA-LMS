import { Logo } from '../components/Layout'

const ROLES = [
  ['Administrators', 'manage students, teachers, classes, enrollments, payments and announcements.'],
  ['Teachers', 'share PDF notes and lesson videos with the students in their classes.'],
  ['Students', 'join classes with an enrollment code and follow their materials and fees.'],
]

/** Two-column layout shared by the login and register pages. */
export default function AuthShell({ title, subtitle, children }) {
  return (
    <div className="flex min-h-screen bg-white">
      <div className="hidden w-[44%] flex-col justify-between bg-neutral-950 p-12 text-white lg:flex">
        <Logo light />
        <div className="max-w-md">
          <h2 className="text-3xl font-semibold leading-tight">One place for classes, materials and fees.</h2>
          <dl className="mt-10 space-y-6 border-l border-neutral-800 pl-6">
            {ROLES.map(([role, text]) => (
              <div key={role}>
                <dt className="text-sm font-semibold text-white">{role}</dt>
                <dd className="mt-1 text-sm leading-relaxed text-neutral-400">{text}</dd>
              </div>
            ))}
          </dl>
        </div>
        <p className="text-xs text-neutral-500">NEXZORA LMS · EC4307 Web Application Development mini project</p>
      </div>

      <div className="flex w-full items-center justify-center px-4 py-10 sm:px-6 lg:w-[56%]">
        <div className="w-full max-w-sm">
          <div className="mb-10 lg:hidden">
            <Logo />
          </div>
          <h1 className="text-2xl font-semibold text-neutral-900">{title}</h1>
          <p className="mt-1 text-sm text-neutral-500">{subtitle}</p>
          <div className="mt-8">{children}</div>
        </div>
      </div>
    </div>
  )
}
