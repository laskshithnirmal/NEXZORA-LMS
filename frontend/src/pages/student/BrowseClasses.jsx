import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { CheckCircle2, Library } from 'lucide-react'
import ClassCard from '../../components/ClassCard'
import { EmptyState, PageHeader, PageLoader, SearchInput } from '../../components/ui'
import { useApi } from '../../hooks/useApi'
import { formatMoney } from '../../utils/format'
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
        <p className="text-sm text-slate-500">{filtered.length} classes available</p>
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
                  <span className="font-medium text-slate-700">{formatMoney(c.fee)}</span>
                  {c.enrolled ? (
                    <Link to={`/student/classes/${c.id}`} className="inline-flex items-center gap-1 font-medium text-emerald-600 hover:underline">
                      <CheckCircle2 className="h-4 w-4" /> Enrolled — open
                    </Link>
                  ) : (
                    <span className="text-xs text-slate-400">Requires enrollment code</span>
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
