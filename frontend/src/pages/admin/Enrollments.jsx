import { useMemo, useState } from 'react'
import { ClipboardList, Trash2 } from 'lucide-react'
import toast from 'react-hot-toast'
import api, { errorMessage } from '../../api/client'
import { ConfirmDialog, EmptyState, PageHeader, PageLoader, SearchInput } from '../../components/ui'
import { useApi } from '../../hooks/useApi'
import { formatDateTime, plural } from '../../utils/format'

export default function Enrollments() {
  const { data: enrollments, loading, reload } = useApi('/admin/enrollments', [])
  const [query, setQuery] = useState('')
  const [classFilter, setClassFilter] = useState('')
  const [toDelete, setToDelete] = useState(null)
  const [deleting, setDeleting] = useState(false)

  const classes = useMemo(() => {
    const map = new Map()
    enrollments.forEach((e) => map.set(e.classId, `${e.courseCode} — ${e.className}`))
    return [...map.entries()]
  }, [enrollments])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return enrollments.filter(
      (e) =>
        (!classFilter || String(e.classId) === classFilter) &&
        (!q || [e.studentName, e.studentEmail, e.className, e.courseCode].some((v) => v?.toLowerCase().includes(q))),
    )
  }, [enrollments, query, classFilter])

  const confirmDelete = async () => {
    setDeleting(true)
    try {
      await api.delete(`/admin/enrollments/${toDelete.id}`)
      toast.success('Enrollment removed')
      setToDelete(null)
      reload()
    } catch (e) {
      toast.error(errorMessage(e))
    } finally {
      setDeleting(false)
    }
  }

  return (
    <>
      <PageHeader title="Enrollments" subtitle="All student enrollments across classes." />
      <div className="card">
        <div className="flex flex-col gap-3 border-b border-neutral-200 px-5 py-3.5 md:flex-row md:items-center md:justify-between">
          <p className="text-sm text-neutral-500">{plural(filtered.length, 'enrollment')}</p>
          <div className="flex flex-col gap-2 sm:flex-row">
            <select className="input sm:w-64" value={classFilter} onChange={(e) => setClassFilter(e.target.value)} aria-label="Filter by class">
              <option value="">All classes</option>
              {classes.map(([id, name]) => (
                <option key={id} value={id}>
                  {name}
                </option>
              ))}
            </select>
            <SearchInput value={query} onChange={setQuery} placeholder="Search student or class..." />
          </div>
        </div>
        {loading ? (
          <PageLoader />
        ) : filtered.length === 0 ? (
          <EmptyState icon={ClipboardList} title="No enrollments found" message="Students appear here after joining a class with its enrollment code." />
        ) : (
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Student</th>
                  <th>Class</th>
                  <th>Enrolled on</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-200">
                {filtered.map((e) => (
                  <tr key={e.id}>
                    <td>
                      <p className="font-medium text-neutral-900">{e.studentName}</p>
                      <p className="text-xs text-neutral-500">{e.studentEmail}</p>
                    </td>
                    <td>
                      <p className="text-neutral-800">{e.className}</p>
                      <p className="text-xs text-neutral-500">{e.courseCode}</p>
                    </td>
                    <td>{formatDateTime(e.enrolledAt)}</td>
                    <td className="text-right">
                      <button className="btn-icon-danger" onClick={() => setToDelete(e)} aria-label="Remove enrollment">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      <ConfirmDialog
        open={Boolean(toDelete)}
        title="Remove enrollment?"
        message={`Remove ${toDelete?.studentName} from ${toDelete?.className}? They will lose access to the class materials.`}
        confirmLabel="Remove"
        busy={deleting}
        onConfirm={confirmDelete}
        onClose={() => setToDelete(null)}
      />
    </>
  )
}
