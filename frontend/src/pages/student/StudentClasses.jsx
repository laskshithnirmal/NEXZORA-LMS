import { Link } from 'react-router-dom'
import { BookOpen } from 'lucide-react'
import ClassCard from '../../components/ClassCard'
import { EmptyState, PageHeader, PageLoader } from '../../components/ui'
import { useApi } from '../../hooks/useApi'

export default function StudentClasses() {
  const { data: classes, loading } = useApi('/student/classes', [])

  return (
    <>
      <PageHeader title="My Classes" subtitle="Classes you are enrolled in." />
      {loading ? (
        <PageLoader />
      ) : classes.length === 0 ? (
        <div className="card">
          <EmptyState
            icon={BookOpen}
            title="No enrolled classes"
            message="Join a class using the enrollment code from your teacher."
            action={
              <Link to="/student/browse" className="btn-primary">
                Join a class
              </Link>
            }
          />
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {classes.map((c) => (
            <ClassCard key={c.id} cls={c} to={`/student/classes/${c.id}`} showStudents={false} />
          ))}
        </div>
      )}
    </>
  )
}
