import { Library } from 'lucide-react'
import ClassCard from '../../components/ClassCard'
import { EmptyState, PageHeader, PageLoader } from '../../components/ui'
import { useApi } from '../../hooks/useApi'

export default function TeacherClasses() {
  const { data: classes, loading } = useApi('/teacher/classes', [])

  return (
    <>
      <PageHeader title="My Classes" subtitle="Classes you have been assigned to teach." />
      {loading ? (
        <PageLoader />
      ) : classes.length === 0 ? (
        <div className="card">
          <EmptyState icon={Library} title="No classes assigned yet" message="An administrator will assign classes to you." />
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {classes.map((c) => (
            <ClassCard key={c.id} cls={c} to={`/teacher/classes/${c.id}`} />
          ))}
        </div>
      )}
    </>
  )
}
