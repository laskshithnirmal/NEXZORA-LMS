import { useMemo } from 'react'
import { CreditCard } from 'lucide-react'
import PaymentStatusBadge from '../../components/PaymentStatusBadge'
import { EmptyState, PageHeader, PageLoader, StatCard } from '../../components/ui'
import { useApi } from '../../hooks/useApi'
import { formatDate, formatMoney } from '../../utils/format'

export default function StudentPayments() {
  const { data: payments, loading } = useApi('/student/payments', [])

  const totals = useMemo(() => {
    const sum = (pred) => payments.filter(pred).reduce((t, p) => t + Number(p.amount), 0)
    return { paid: sum((p) => p.status === 'PAID'), due: sum((p) => p.status !== 'PAID') }
  }, [payments])

  return (
    <>
      <PageHeader title="Payments" subtitle="Your fee payment history. Contact the administration if something looks wrong." />

      <div className="mb-6 grid gap-4 sm:grid-cols-2">
        <StatCard label="Total paid" value={formatMoney(totals.paid)} />
        <StatCard label="Outstanding" value={formatMoney(totals.due)} hint="Pending and overdue payments" />
      </div>

      <div className="card">
        {loading ? (
          <PageLoader />
        ) : payments.length === 0 ? (
          <EmptyState icon={CreditCard} title="No payment records" message="Your payments will appear here once recorded by the administration." />
        ) : (
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Class</th>
                  <th>Description</th>
                  <th>Method</th>
                  <th>Reference</th>
                  <th>Status</th>
                  <th className="text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-200">
                {payments.map((p) => (
                  <tr key={p.id}>
                    <td>{formatDate(p.paymentDate)}</td>
                    <td>{p.className || <span className="text-neutral-400">General</span>}</td>
                    <td>{p.description || '-'}</td>
                    <td>{p.method || '-'}</td>
                    <td className="font-mono text-xs">{p.reference || '-'}</td>
                    <td>
                      <PaymentStatusBadge status={p.status} />
                    </td>
                    <td className="text-right font-medium">{formatMoney(p.amount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  )
}
