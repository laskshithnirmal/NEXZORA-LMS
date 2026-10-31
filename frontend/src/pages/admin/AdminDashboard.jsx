import { Link } from 'react-router-dom'
import { ClipboardList, CreditCard, GraduationCap, Library, UserCheck, Wallet } from 'lucide-react'
import AnnouncementList from '../../components/AnnouncementList'
import { EmptyState, PageHeader, PageLoader, StatCard } from '../../components/ui'
import { useAuth } from '../../context/AuthContext'
import { useApi } from '../../hooks/useApi'
import { formatDate, formatMoney } from '../../utils/format'

export default function AdminDashboard() {
  const { user } = useAuth()
  const { data, loading } = useApi('/admin/dashboard')

  if (loading || !data) return <PageLoader />

  return (
    <>
      <PageHeader title="Dashboard" subtitle={`Signed in as ${user.fullName}. An overview of users, classes and fees.`} />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <StatCard icon={GraduationCap} label="Students" value={data.students} />
        <StatCard icon={UserCheck} label="Teachers" value={data.teachers} />
        <StatCard icon={Library} label="Classes" value={data.classes} />
        <StatCard icon={ClipboardList} label="Enrollments" value={data.enrollments} />
        <StatCard icon={Wallet} label="Payments received" value={formatMoney(data.totalPaid)} />
        <StatCard icon={CreditCard} label="Pending / overdue" value={formatMoney(data.totalPending)} />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <section className="card">
          <div className="card-header">
            <h2 className="card-title">Recent enrollments</h2>
            <Link to="/admin/enrollments" className="link text-sm">
              View all
            </Link>
          </div>
          {data.recentEnrollments.length ? (
            <ul className="divide-y divide-neutral-200">
              {data.recentEnrollments.map((e) => (
                <li key={e.id} className="flex items-center justify-between gap-3 px-5 py-3 text-sm">
                  <div className="min-w-0">
                    <p className="truncate font-medium text-neutral-800">{e.studentName}</p>
                    <p className="truncate text-neutral-500">
                      {e.courseCode} · {e.className}
                    </p>
                  </div>
                  <span className="shrink-0 text-xs text-neutral-400">{formatDate(e.enrolledAt)}</span>
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState icon={ClipboardList} title="No enrollments yet" />
          )}
        </section>

        <section className="card">
          <div className="card-header">
            <h2 className="card-title">Latest announcements</h2>
            <Link to="/admin/announcements" className="link text-sm">
              Manage
            </Link>
          </div>
          <AnnouncementList items={data.recentAnnouncements} compact />
        </section>
      </div>
    </>
  )
}
