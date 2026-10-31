import { Link } from 'react-router-dom'
import { ArrowUpRight, Clock, FileText, User, Users } from 'lucide-react'

/** Card summarizing a class. `to` makes the whole card a link; `footer` renders extra actions. */
export default function ClassCard({ cls, to, footer, showStudents = true }) {
  const body = (
    <div className="flex flex-1 flex-col p-5">
      <div className="flex items-start justify-between gap-3">
        <span className="font-mono text-xs font-medium text-neutral-500">{cls.courseCode}</span>
        {to && <ArrowUpRight className="h-4 w-4 shrink-0 text-neutral-300 transition-colors group-hover:text-neutral-900" />}
      </div>
      <h3 className="mt-1.5 line-clamp-2 font-semibold text-neutral-900">{cls.name}</h3>
      {cls.description && <p className="mt-2 line-clamp-2 text-sm text-neutral-500">{cls.description}</p>}
      <div className="mt-4 space-y-1.5 text-sm text-neutral-600">
        <p className="flex items-center gap-2">
          <User className="h-4 w-4 shrink-0 text-neutral-400" /> {cls.teacherName || 'Teacher not assigned'}
        </p>
        {cls.schedule && (
          <p className="flex items-center gap-2">
            <Clock className="h-4 w-4 shrink-0 text-neutral-400" /> {cls.schedule}
          </p>
        )}
      </div>
      <div className="mt-auto pt-4">
        <div className="flex items-center gap-4 border-t border-neutral-100 pt-3 text-xs text-neutral-500">
          {showStudents && (
            <span className="flex items-center gap-1.5">
              <Users className="h-3.5 w-3.5" /> {cls.studentCount} {cls.studentCount === 1 ? 'student' : 'students'}
            </span>
          )}
          <span className="flex items-center gap-1.5">
            <FileText className="h-3.5 w-3.5" /> {cls.materialCount} {cls.materialCount === 1 ? 'material' : 'materials'}
          </span>
        </div>
      </div>
      {footer && <div className="mt-3 border-t border-neutral-100 pt-3">{footer}</div>}
    </div>
  )

  return to ? (
    <Link to={to} className="card group flex flex-col transition-colors hover:border-neutral-900">
      {body}
    </Link>
  ) : (
    <div className="card flex flex-col">{body}</div>
  )
}
