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
      <Link to="/student/classes" className="mb-4 inline-flex items-center gap-1 text-sm text-neutral-500 hover:text-neutral-700">
        <ArrowLeft className="h-4 w-4" /> My classes
      </Link>

      <div className="mb-6 border-b border-neutral-200 pb-5">
        <p className="font-mono text-sm font-medium text-neutral-500">{cls.courseCode}</p>
        <h1 className="mt-1 text-2xl font-semibold text-neutral-900">{cls.name}</h1>
        <div className="mt-3 flex flex-wrap gap-x-6 gap-y-1 text-sm text-neutral-600">
          <span className="flex items-center gap-1.5">
            <User className="h-4 w-4 text-neutral-400" /> {cls.teacherName || 'Teacher not assigned'}
          </span>
          {cls.schedule && (
            <span className="flex items-center gap-1.5">
              <Clock className="h-4 w-4 text-neutral-400" /> {cls.schedule}
            </span>
          )}
        </div>
        {cls.description && <p className="mt-3 max-w-3xl text-sm text-neutral-600">{cls.description}</p>}
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        <section className="card xl:col-span-2">
          <div className="flex flex-col gap-3 border-b border-neutral-200 px-5 py-3.5 sm:flex-row sm:items-center sm:justify-between">
            <h2 className="card-title">Learning materials</h2>
            <div className="segmented">
              {FILTERS.map(([key, label]) => (
                <button
                  key={key}
                  onClick={() => setFilter(key)}
                  className={`segmented-item text-xs ${filter === key ? 'segmented-item-active' : ''}`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
          <MaterialList items={shown} emptyMessage="Your teacher hasn't added materials of this type yet." />
        </section>
        <section className="card self-start">
          <div className="card-header">
            <h2 className="card-title">Class announcements</h2>
          </div>
          <AnnouncementList items={classAnnouncements} compact />
        </section>
      </div>
    </>
  )
}
