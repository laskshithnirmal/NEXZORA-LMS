import { Badge } from './ui'

const MAP = {
  PAID: { tone: 'green', label: 'Paid' },
  PENDING: { tone: 'amber', label: 'Pending' },
  OVERDUE: { tone: 'red', label: 'Overdue' },
}

export default function PaymentStatusBadge({ status }) {
  const s = MAP[status] || { tone: 'gray', label: status }
  return <Badge tone={s.tone}>{s.label}</Badge>
}
