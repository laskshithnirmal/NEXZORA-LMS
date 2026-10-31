import { Megaphone, Trash2 } from 'lucide-react'
import { Badge, EmptyState } from './ui'
import { formatDateTime } from '../utils/format'

const ROLE_LABEL = { ADMIN: 'Administrator', TEACHER: 'Teacher' }

export default function AnnouncementList({ items, onDelete, canDelete = () => false, compact = false }) {
  if (!items?.length) {
    return <EmptyState icon={Megaphone} title="No announcements yet" message="New announcements will appear here." />
  }
  return (
    <ul className="divide-y divide-neutral-200">
      {items.map((a) => (
        <li key={a.id} className="flex gap-4 px-5 py-4">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <p className="font-medium text-neutral-900">{a.title}</p>
              {a.className ? <Badge>{a.className}</Badge> : <Badge tone="dark">All users</Badge>}
            </div>
            <p className={`mt-1 whitespace-pre-line text-sm text-neutral-600 ${compact ? 'line-clamp-2' : ''}`}>{a.content}</p>
            <p className="mt-2 text-xs text-neutral-500">
              {a.authorName}
              {a.authorRole && ` (${ROLE_LABEL[a.authorRole] || a.authorRole.toLowerCase()})`} · {formatDateTime(a.createdAt)}
            </p>
          </div>
          {onDelete && canDelete(a) && (
            <button className="btn-icon-danger h-9 self-start" onClick={() => onDelete(a)} aria-label="Delete announcement">
              <Trash2 className="h-4 w-4" />
            </button>
          )}
        </li>
      ))}
    </ul>
  )
}
