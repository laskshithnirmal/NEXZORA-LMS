import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { CheckCircle2, Library } from 'lucide-react'
import ClassCard from '../../components/ClassCard'
import { EmptyState, PageHeader, PageLoader, SearchInput } from '../../components/ui'
import { useApi } from '../../hooks/useApi'
import { formatMoney, plural } from '../../utils/format'
import JoinClassForm from './JoinClassForm'

export default function BrowseClasses() {
  const { data: classes, loading, reload } = useApi('/student/classes/available', [])
  const [query, setQuery] = useState('')

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return classes
    return classes.filter((c) => [c.name, c.courseCode, c.teacherName, c.description].some((v) => v?.toLowerCase().includes(q)))
  }, [classes, query])

  return (
    <>
      <PageHeader title="Browse Classes" subtitle="Classes currently open for enrollment. Ask your teacher for the enrollment code to join." />

      <JoinClassForm onJoined={reload} />

      <div className="mb-4 mt-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-neutral-500">{plural(filtered.length, 'class', 'classes')} available</p>
        <SearchInput value={query} onChange={setQuery} placeholder="Search classes..." />
      </div>

      {loading ? (
        <PageLoader />
      ) : filtered.length === 0 ? (
        <div className="card">
          <EmptyState icon={Library} title="No classes found" message={query ? 'Try a different search.' : 'No classes are open for enrollment right now.'} />
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map((c) => (
            <ClassCard
              key={c.id}
              cls={c}
              footer={
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium tabular-nums text-neutral-900">{formatMoney(c.fee)}</span>
                  {c.enrolled ? (
                    <Link to={`/student/classes/${c.id}`} className="link inline-flex items-center gap-1">
                      <CheckCircle2 className="h-4 w-4" /> Enrolled · Open
                    </Link>
                  ) : (
                    <span className="text-xs text-neutral-500">Enrollment code required</span>
                  )}
                </div>
              }
            />
          ))}
        </div>
      )}
    </>
  )
}
