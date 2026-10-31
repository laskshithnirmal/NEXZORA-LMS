import { Link } from 'react-router-dom'
import { FileText, Library, Users } from 'lucide-react'
import AnnouncementList from '../../components/AnnouncementList'
import ClassCard from '../../components/ClassCard'
import { EmptyState, PageHeader, PageLoader, StatCard } from '../../components/ui'
import { useAuth } from '../../context/AuthContext'
import { useApi } from '../../hooks/useApi'

export default function TeacherDashboard() {
  const { user } = useAuth()
  const { data, loading } = useApi('/teacher/dashboard')

  if (loading || !data) return <PageLoader />

  return (
    <>
      <PageHeader title={`Welcome, ${user.fullName}`} subtitle="Manage your classes and learning materials." />

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard icon={Library} label="Assigned classes" value={data.classes} />
        <StatCard icon={Users} label="Students" value={data.students} />
        <StatCard icon={FileText} label="Materials uploaded" value={data.materials} />
      </div>

      <div className="mt-8 grid gap-6 xl:grid-cols-3">
        <section className="xl:col-span-2">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-neutral-500">My classes</h2>
            <Link to="/teacher/classes" className="link text-sm">
              View all
            </Link>
          </div>
          {data.myClasses.length ? (
            <div className="grid gap-4 sm:grid-cols-2">
              {data.myClasses.slice(0, 4).map((c) => (
                <ClassCard key={c.id} cls={c} to={`/teacher/classes/${c.id}`} />
              ))}
            </div>
          ) : (
            <div className="card">
              <EmptyState icon={Library} title="No classes assigned yet" message="An administrator will assign classes to you." />
            </div>
          )}
        </section>
        <section className="card self-start">
          <div className="card-header">
            <h2 className="card-title">Announcements</h2>
            <Link to="/teacher/announcements" className="link text-sm">
              Manage
            </Link>
          </div>
          <AnnouncementList items={data.recentAnnouncements} compact />
        </section>
      </div>
    </>
  )
}
