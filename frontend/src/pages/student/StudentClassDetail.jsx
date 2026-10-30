import { useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, Clock, User } from 'lucide-react'
import AnnouncementList from '../../components/AnnouncementList'
import MaterialList from '../../components/MaterialList'
import { EmptyState, PageLoader } from '../../components/ui'
import { useApi } from '../../hooks/useApi'

const FILTERS = [
  ['ALL', 'All'],
  ['PDF', 'PDFs'],
  ['VIDEO', 'Videos'],
]

export default function StudentClassDetail() {
  const { id } = useParams()
  const { data: cls, loading } = useApi(`/student/classes/${id}`)
  const { data: materials } = useApi(`/student/classes/${id}/materials`, [])
  const { data: announcements } = useApi('/student/announcements', [])
  const [filter, setFilter] = useState('ALL')

  const shown = useMemo(() => (filter === 'ALL' ? materials : materials.filter((m) => m.type === filter)), [materials, filter])
  const classAnnouncements = useMemo(() => announcements.filter((a) => String(a.classId) === String(id)), [announcements, id])

  if (loading) return <PageLoader />
  if (!cls) {
    return (
      <div className="card">
        <EmptyState title="Class not available" message="You may not be enrolled in this class." action={<Link to="/student/classes" className="btn-secondary">Back to my classes</Link>} />
      </div>
    )
  }

  return (
    <>
      <Link to="/student/classes" className="mb-4 inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700">
        <ArrowLeft className="h-4 w-4" /> My classes
      </Link>

      <div className="card mb-6 overflow-hidden">
        <div className="bg-gradient-to-r from-brand-600 to-brand-800 px-6 py-6 text-white">
          <p className="text-sm font-medium uppercase tracking-wide text-brand-100">{cls.courseCode}</p>
          <h1 className="mt-1 text-2xl font-semibold">{cls.name}</h1>
          <div className="mt-3 flex flex-wrap gap-x-6 gap-y-1 text-sm text-brand-100">
            <span className="flex items-center gap-1.5">
              <User className="h-4 w-4" /> {cls.teacherName || 'Teacher not assigned'}
            </span>
            {cls.schedule && (
              <span className="flex items-center gap-1.5">
                <Clock className="h-4 w-4" /> {cls.schedule}
              </span>
            )}
          </div>
        </div>
        {cls.description && <p className="px-6 py-4 text-sm text-slate-600">{cls.description}</p>}
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        <section className="card xl:col-span-2">
          <div className="flex flex-col gap-3 border-b border-slate-100 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
            <h2 className="font-semibold text-slate-900">Learning materials</h2>
            <div className="inline-flex rounded-lg border border-slate-200 bg-white p-1">
              {FILTERS.map(([key, label]) => (
                <button
                  key={key}
                  onClick={() => setFilter(key)}
                  className={`rounded-md px-3 py-1 text-xs font-medium transition ${filter === key ? 'bg-brand-600 text-white' : 'text-slate-600 hover:text-slate-900'}`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
          <MaterialList items={shown} emptyMessage="Your teacher hasn't added materials of this type yet." />
        </section>
        <section className="card self-start">
          <div className="border-b border-slate-100 px-5 py-4">
            <h2 className="font-semibold text-slate-900">Class announcements</h2>
          </div>
          <AnnouncementList items={classAnnouncements} compact />
        </section>
      </div>
    </>
  )
}
