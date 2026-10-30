import { Link } from 'react-router-dom'
import { BookOpen, Clock, FileText, User, Users } from 'lucide-react'

const ACCENTS = ['from-brand-500 to-brand-700', 'from-violet-500 to-violet-700', 'from-emerald-500 to-emerald-700', 'from-amber-500 to-orange-600', 'from-rose-500 to-rose-700', 'from-cyan-500 to-sky-700']

/** Card summarizing a class. `to` makes the whole card a link; `footer` renders extra actions. */
export default function ClassCard({ cls, to, footer, showStudents = true }) {
  const accent = ACCENTS[cls.id % ACCENTS.length]
  const body = (
    <>
      <div className={`h-2 rounded-t-xl bg-gradient-to-r ${accent}`} />
      <div className="flex flex-1 flex-col p-5">
        <div className="flex items-start gap-3">
          <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br text-white ${accent}`}>
            <BookOpen className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{cls.courseCode}</p>
            <h3 className="truncate font-semibold text-slate-900">{cls.name}</h3>
          </div>
        </div>
        {cls.description && <p className="mt-3 line-clamp-2 text-sm text-slate-600">{cls.description}</p>}
        <div className="mt-4 space-y-1.5 text-sm text-slate-500">
          <p className="flex items-center gap-2">
            <User className="h-4 w-4 shrink-0" /> {cls.teacherName || 'Teacher not assigned'}
          </p>
          {cls.schedule && (
            <p className="flex items-center gap-2">
              <Clock className="h-4 w-4 shrink-0" /> {cls.schedule}
            </p>
          )}
        </div>
        <div className="mt-auto flex items-center gap-4 pt-4 text-xs text-slate-500">
          {showStudents && (
            <span className="flex items-center gap-1">
              <Users className="h-3.5 w-3.5" /> {cls.studentCount} students
            </span>
          )}
          <span className="flex items-center gap-1">
            <FileText className="h-3.5 w-3.5" /> {cls.materialCount} materials
          </span>
        </div>
        {footer && <div className="mt-4 border-t border-slate-100 pt-4">{footer}</div>}
      </div>
    </>
  )

  return to ? (
    <Link to={to} className="card flex flex-col transition hover:-translate-y-0.5 hover:shadow-md">
      {body}
    </Link>
  ) : (
    <div className="card flex flex-col">{body}</div>
  )
}
