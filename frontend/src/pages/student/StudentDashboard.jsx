import { Link, useNavigate } from 'react-router-dom'
import { BookOpen, CreditCard, Wallet } from 'lucide-react'
import AnnouncementList from '../../components/AnnouncementList'
import ClassCard from '../../components/ClassCard'
import { EmptyState, PageHeader, PageLoader, StatCard } from '../../components/ui'
import { useAuth } from '../../context/AuthContext'
import { useApi } from '../../hooks/useApi'
import { formatMoney } from '../../utils/format'
import JoinClassForm from './JoinClassForm'

export default function StudentDashboard() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const { data, loading } = useApi('/student/dashboard')

  if (loading || !data) return <PageLoader />

  return (
    <>
      <PageHeader title={`Hello, ${user.fullName.split(' ')[0]} 👋`} subtitle="Continue learning where you left off." />

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard icon={BookOpen} label="Enrolled classes" value={data.enrolledClasses} tone="blue" />
        <StatCard icon={Wallet} label="Total paid" value={formatMoney(data.totalPaid)} tone="green" />
        <StatCard icon={CreditCard} label="Outstanding" value={formatMoney(data.totalPending)} tone="amber" />
      </div>

      <div className="mt-6">
        <JoinClassForm onJoined={(c) => navigate(`/student/classes/${c.id}`)} />
      </div>

      <div className="mt-8 grid gap-6 xl:grid-cols-3">
        <section className="xl:col-span-2">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-semibold text-slate-900">My classes</h2>
            <Link to="/student/classes" className="text-sm font-medium text-brand-600 hover:text-brand-700">
              View all
            </Link>
          </div>
          {data.myClasses.length ? (
            <div className="grid gap-4 sm:grid-cols-2">
              {data.myClasses.slice(0, 4).map((c) => (
                <ClassCard key={c.id} cls={c} to={`/student/classes/${c.id}`} showStudents={false} />
              ))}
            </div>
          ) : (
            <div className="card">
              <EmptyState
                icon={BookOpen}
                title="You haven't joined any classes yet"
                message="Use an enrollment code above, or browse the available classes."
                action={
                  <Link to="/student/browse" className="btn-secondary">
                    Browse classes
                  </Link>
                }
              />
            </div>
          )}
        </section>
        <section className="card self-start">
          <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
            <h2 className="font-semibold text-slate-900">Announcements</h2>
            <Link to="/student/announcements" className="text-sm font-medium text-brand-600 hover:text-brand-700">
              View all
            </Link>
          </div>
          <AnnouncementList items={data.recentAnnouncements} compact />
        </section>
      </div>
    </>
  )
}
