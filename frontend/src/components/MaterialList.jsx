import { useState } from 'react'
import { ExternalLink, FileText, PlayCircle, Trash2, Video } from 'lucide-react'
import toast from 'react-hot-toast'
import { errorMessage, openPdf } from '../api/client'
import { Badge, EmptyState, Modal } from './ui'
import { formatDate, formatFileSize, toEmbedUrl } from '../utils/format'

/** List of PDFs and videos for a class. Pass onDelete to show delete buttons (teachers). */
export default function MaterialList({ items, onDelete, emptyMessage = 'No learning materials have been added yet.' }) {
  const [video, setVideo] = useState(null)

  const open = async (m) => {
    if (m.type === 'PDF') {
      try {
        await openPdf(m.id)
      } catch (e) {
        toast.error(errorMessage(e, 'Could not open the PDF'))
      }
    } else if (toEmbedUrl(m.videoUrl)) {
      setVideo(m)
    } else {
      window.open(m.videoUrl, '_blank', 'noopener,noreferrer')
    }
  }

  if (!items?.length) return <EmptyState icon={FileText} title="No materials" message={emptyMessage} />

  return (
    <>
      <ul className="divide-y divide-slate-100">
        {items.map((m) => {
          const isPdf = m.type === 'PDF'
          return (
            <li key={m.id} className="flex items-center gap-4 px-5 py-4">
              <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${isPdf ? 'bg-red-50 text-red-600' : 'bg-violet-50 text-violet-600'}`}>
                {isPdf ? <FileText className="h-5 w-5" /> : <Video className="h-5 w-5" />}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="truncate font-medium text-slate-900">{m.title}</p>
                  <Badge tone={isPdf ? 'red' : 'purple'}>{isPdf ? 'PDF' : 'Video'}</Badge>
                </div>
                {m.description && <p className="mt-0.5 line-clamp-2 text-sm text-slate-500">{m.description}</p>}
                <p className="mt-1 text-xs text-slate-400">
                  {isPdf && m.fileSize ? `${formatFileSize(m.fileSize)} · ` : ''}
                  {m.uploadedBy ? `${m.uploadedBy} · ` : ''}
                  {formatDate(m.createdAt)}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-1">
                <button className="btn-secondary px-3 py-1.5" onClick={() => open(m)}>
                  {isPdf ? <ExternalLink className="h-4 w-4" /> : <PlayCircle className="h-4 w-4" />}
                  <span className="hidden sm:inline">{isPdf ? 'Open' : 'Watch'}</span>
                </button>
                {onDelete && (
                  <button className="btn-ghost text-red-500 hover:bg-red-50 hover:text-red-600" onClick={() => onDelete(m)} aria-label="Delete material">
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </div>
            </li>
          )
        })}
      </ul>

      <Modal open={Boolean(video)} title={video?.title} onClose={() => setVideo(null)} size="lg">
        {video && (
          <>
            <div className="aspect-video w-full overflow-hidden rounded-lg bg-black">
              <iframe
                src={toEmbedUrl(video.videoUrl)}
                title={video.title}
                className="h-full w-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
            {video.description && <p className="mt-3 text-sm text-slate-600">{video.description}</p>}
            <a href={video.videoUrl} target="_blank" rel="noopener noreferrer" className="mt-2 inline-flex items-center gap-1 text-sm text-brand-600 hover:underline">
              Open in new tab <ExternalLink className="h-3.5 w-3.5" />
            </a>
          </>
        )}
      </Modal>
    </>
  )
}
