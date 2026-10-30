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
      <PageHeader title={`Welcome, ${user.fullName.split(' ')[0]}`} subtitle="Here is an overview of your institution." />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <StatCard icon={GraduationCap} label="Students" value={data.students} tone="blue" />
        <StatCard icon={UserCheck} label="Teachers" value={data.teachers} tone="purple" />
        <StatCard icon={Library} label="Classes" value={data.classes} tone="amber" />
        <StatCard icon={ClipboardList} label="Enrollments" value={data.enrollments} tone="green" />
        <StatCard icon={Wallet} label="Payments received" value={formatMoney(data.totalPaid)} tone="green" />
        <StatCard icon={CreditCard} label="Pending / overdue" value={formatMoney(data.totalPending)} tone="rose" />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <section className="card">
          <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
            <h2 className="font-semibold text-slate-900">Recent enrollments</h2>
            <Link to="/admin/enrollments" className="text-sm font-medium text-brand-600 hover:text-brand-700">
              View all
            </Link>
          </div>
          {data.recentEnrollments.length ? (
            <ul className="divide-y divide-slate-100">
              {data.recentEnrollments.map((e) => (
                <li key={e.id} className="flex items-center justify-between gap-3 px-5 py-3 text-sm">
                  <div className="min-w-0">
                    <p className="truncate font-medium text-slate-800">{e.studentName}</p>
                    <p className="truncate text-slate-500">
                      {e.courseCode} · {e.className}
                    </p>
                  </div>
                  <span className="shrink-0 text-xs text-slate-400">{formatDate(e.enrolledAt)}</span>
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState icon={ClipboardList} title="No enrollments yet" />
          )}
        </section>

        <section className="card">
          <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
            <h2 className="font-semibold text-slate-900">Latest announcements</h2>
            <Link to="/admin/announcements" className="text-sm font-medium text-brand-600 hover:text-brand-700">
              Manage
            </Link>
          </div>
          <AnnouncementList items={data.recentAnnouncements} compact />
        </section>
      </div>
    </>
  )
}
