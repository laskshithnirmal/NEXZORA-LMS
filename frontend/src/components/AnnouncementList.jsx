import { Megaphone, Trash2 } from 'lucide-react'
import { Badge, EmptyState } from './ui'
import { formatDateTime } from '../utils/format'

const ROLE_TONE = { ADMIN: 'purple', TEACHER: 'blue' }

export default function AnnouncementList({ items, onDelete, canDelete = () => false, compact = false }) {
  if (!items?.length) {
    return <EmptyState icon={Megaphone} title="No announcements yet" message="New announcements will appear here." />
  }
  return (
    <ul className="divide-y divide-slate-100">
      {items.map((a) => (
        <li key={a.id} className="flex gap-4 px-5 py-4">
          <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-50 text-brand-600">
            <Megaphone className="h-4 w-4" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <p className="font-medium text-slate-900">{a.title}</p>
              {a.className ? <Badge tone="blue">{a.className}</Badge> : <Badge tone="green">All users</Badge>}
            </div>
            <p className={`mt-1 whitespace-pre-line text-sm text-slate-600 ${compact ? 'line-clamp-2' : ''}`}>{a.content}</p>
            <p className="mt-2 flex flex-wrap items-center gap-2 text-xs text-slate-400">
              <span>{a.authorName}</span>
              {a.authorRole && <Badge tone={ROLE_TONE[a.authorRole] || 'gray'}>{a.authorRole.toLowerCase()}</Badge>}
              <span>· {formatDateTime(a.createdAt)}</span>
            </p>
          </div>
          {onDelete && canDelete(a) && (
            <button className="btn-ghost h-9 self-start text-red-500 hover:bg-red-50 hover:text-red-600" onClick={() => onDelete(a)} aria-label="Delete announcement">
              <Trash2 className="h-4 w-4" />
            </button>
          )}
        </li>
      ))}
    </ul>
  )
}
