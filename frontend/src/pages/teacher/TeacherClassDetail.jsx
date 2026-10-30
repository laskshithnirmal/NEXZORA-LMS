import { useRef, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, Copy, FileUp, Users, Video } from 'lucide-react'
import toast from 'react-hot-toast'
import api, { errorMessage, fieldErrors } from '../../api/client'
import MaterialList from '../../components/MaterialList'
import { ConfirmDialog, EmptyState, Field, Input, Modal, PageLoader, Spinner, Textarea } from '../../components/ui'
import { useApi } from '../../hooks/useApi'
import { formatDate, formatFileSize } from '../../utils/format'
import { rules, validate } from '../../utils/validate'

const MAX_PDF_BYTES = 20 * 1024 * 1024

export default function TeacherClassDetail() {
  const { id } = useParams()
  const { data: cls, loading } = useApi(`/teacher/classes/${id}`)
  const { data: materials, reload: reloadMaterials } = useApi(`/teacher/classes/${id}/materials`, [])
  const { data: students } = useApi(`/teacher/classes/${id}/students`, [])
  const [tab, setTab] = useState('materials')
  const [modal, setModal] = useState(null) // 'pdf' | 'video'
  const [toDelete, setToDelete] = useState(null)
  const [deleting, setDeleting] = useState(false)

  if (loading) return <PageLoader />
  if (!cls) return <EmptyState title="Class not found" action={<Link to="/teacher/classes" className="btn-secondary">Back to classes</Link>} />

  const copyCode = async () => {
    try {
      await navigator.clipboard.writeText(cls.enrollmentCode)
      toast.success('Enrollment code copied')
    } catch {
      toast(cls.enrollmentCode)
    }
  }

  const confirmDelete = async () => {
    setDeleting(true)
    try {
      await api.delete(`/teacher/materials/${toDelete.id}`)
      toast.success('Material deleted')
      setToDelete(null)
      reloadMaterials()
    } catch (e) {
      toast.error(errorMessage(e))
    } finally {
      setDeleting(false)
    }
  }

  const onSaved = () => {
    setModal(null)
    reloadMaterials()
  }

  return (
    <>
      <Link to="/teacher/classes" className="mb-4 inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700">
        <ArrowLeft className="h-4 w-4" /> My classes
      </Link>

      <div className="card mb-6 overflow-hidden">
        <div className="bg-gradient-to-r from-brand-600 to-brand-800 px-6 py-6 text-white">
          <p className="text-sm font-medium uppercase tracking-wide text-brand-100">{cls.courseCode}</p>
          <h1 className="mt-1 text-2xl font-semibold">{cls.name}</h1>
          {cls.schedule && <p className="mt-1 text-sm text-brand-100">{cls.schedule}</p>}
        </div>
        <div className="flex flex-col gap-4 px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-slate-600">{cls.description || 'No description.'}</p>
          <div className="flex shrink-0 items-center gap-2 text-sm">
            <span className="text-slate-500">Enrollment code:</span>
            <button onClick={copyCode} className="inline-flex items-center gap-1.5 rounded-md bg-brand-50 px-2.5 py-1 font-mono font-semibold text-brand-700 hover:bg-brand-100">
              {cls.enrollmentCode} <Copy className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>

      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="inline-flex rounded-lg border border-slate-200 bg-white p-1">
          {[
            ['materials', `Materials (${materials.length})`],
            ['students', `Students (${students.length})`],
          ].map(([key, label]) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={`rounded-md px-4 py-1.5 text-sm font-medium transition ${tab === key ? 'bg-brand-600 text-white' : 'text-slate-600 hover:text-slate-900'}`}
            >
              {label}
            </button>
          ))}
        </div>
        {tab === 'materials' && (
          <div className="flex gap-2">
            <button className="btn-primary" onClick={() => setModal('pdf')}>
              <FileUp className="h-4 w-4" /> Upload PDF
            </button>
            <button className="btn-secondary" onClick={() => setModal('video')}>
              <Video className="h-4 w-4" /> Add video
            </button>
          </div>
        )}
      </div>

      <div className="card">
        {tab === 'materials' ? (
          <MaterialList items={materials} onDelete={setToDelete} emptyMessage="Upload a PDF or add a lesson video to get started." />
        ) : students.length === 0 ? (
          <EmptyState icon={Users} title="No students yet" message={`Share the enrollment code ${cls.enrollmentCode} with your students.`} />
        ) : (
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Enrolled</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {students.map((s, i) => (
                  <tr key={s.id}>
                    <td className="text-slate-400">{i + 1}</td>
                    <td className="font-medium text-slate-900">{s.studentName}</td>
                    <td>{s.studentEmail}</td>
                    <td>{formatDate(s.enrolledAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {modal === 'pdf' && <PdfUploadModal classId={id} onClose={() => setModal(null)} onSaved={onSaved} />}
      {modal === 'video' && <VideoModal classId={id} onClose={() => setModal(null)} onSaved={onSaved} />}
      <ConfirmDialog
        open={Boolean(toDelete)}
        title="Delete material?"
        message={`"${toDelete?.title}" will be removed for all students.`}
        busy={deleting}
        onConfirm={confirmDelete}
        onClose={() => setToDelete(null)}
      />
    </>
  )
}

function PdfUploadModal({ classId, onClose, onSaved }) {
  const fileRef = useRef(null)
  const [values, setValues] = useState({ title: '', description: '' })
  const [file, setFile] = useState(null)
  const [errors, setErrors] = useState({})
  const [progress, setProgress] = useState(null)

  const set = (f) => (e) => setValues((v) => ({ ...v, [f]: e.target.value }))

  const pickFile = (e) => {
    const f = e.target.files?.[0] || null
    setFile(f)
    if (f && !values.title) setValues((v) => ({ ...v, title: f.name.replace(/\.pdf$/i, '') }))
  }

  const submit = async (e) => {
    e.preventDefault()
    const errs = validate(values, {
      title: [rules.required('Title'), rules.maxLength(150, 'Title')],
      description: [rules.maxLength(1000, 'Description')],
    })
    if (!file) errs.file = 'Please choose a PDF file'
    else if (!file.name.toLowerCase().endsWith('.pdf')) errs.file = 'Only PDF files are allowed'
    else if (file.size > MAX_PDF_BYTES) errs.file = 'File is too large (max 20 MB)'
    setErrors(errs)
    if (Object.keys(errs).length) return

    const form = new FormData()
    form.append('title', values.title.trim())
    form.append('description', values.description.trim())
    form.append('file', file)
    setProgress(0)
    try {
      await api.post(`/teacher/classes/${classId}/materials/pdf`, form, {
        onUploadProgress: (ev) => ev.total && setProgress(Math.round((ev.loaded / ev.total) * 100)),
      })
      toast.success('PDF uploaded')
      onSaved()
    } catch (err) {
      setErrors(fieldErrors(err))
      toast.error(errorMessage(err, 'Upload failed'))
      setProgress(null)
    }
  }

  const busy = progress !== null
  return (
    <Modal
      open
      title="Upload PDF material"
      onClose={busy ? () => {} : onClose}
      footer={
        <>
          <button className="btn-secondary" onClick={onClose} disabled={busy}>
            Cancel
          </button>
          <button className="btn-primary" onClick={submit} disabled={busy}>
            {busy && <Spinner className="h-4 w-4" />} {busy ? `Uploading ${progress}%` : 'Upload'}
          </button>
        </>
      }
    >
      <form onSubmit={submit} className="space-y-4" noValidate>
        <Field label="PDF file" required error={errors.file}>
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className={`flex w-full flex-col items-center justify-center rounded-lg border-2 border-dashed px-4 py-6 text-center transition hover:border-brand-400 hover:bg-brand-50/40 ${errors.file ? 'border-red-300' : 'border-slate-300'}`}
          >
            <FileUp className="h-8 w-8 text-slate-400" />
            {file ? (
              <span className="mt-2 text-sm font-medium text-slate-700">
                {file.name} <span className="font-normal text-slate-400">({formatFileSize(file.size)})</span>
              </span>
            ) : (
              <span className="mt-2 text-sm text-slate-500">Click to choose a PDF (max 20 MB)</span>
            )}
          </button>
          <input ref={fileRef} type="file" accept="application/pdf,.pdf" className="hidden" onChange={pickFile} />
        </Field>
        <Field label="Title" required error={errors.title}>
          <Input value={values.title} onChange={set('title')} error={errors.title} placeholder="e.g. Week 1 — Introduction" />
        </Field>
        <Field label="Description" error={errors.description}>
          <Textarea value={values.description} onChange={set('description')} error={errors.description} rows={3} />
        </Field>
      </form>
    </Modal>
  )
}

function VideoModal({ classId, onClose, onSaved }) {
  const [values, setValues] = useState({ title: '', description: '', videoUrl: '' })
  const [errors, setErrors] = useState({})
  const [busy, setBusy] = useState(false)

  const set = (f) => (e) => setValues((v) => ({ ...v, [f]: e.target.value }))

  const submit = async (e) => {
    e.preventDefault()
    const errs = validate(values, {
      title: [rules.required('Title'), rules.maxLength(150, 'Title')],
      videoUrl: [rules.required('Video URL'), rules.url(), rules.maxLength(500, 'Video URL')],
      description: [rules.maxLength(1000, 'Description')],
    })
    setErrors(errs)
    if (Object.keys(errs).length) return
    setBusy(true)
    try {
      await api.post(`/teacher/classes/${classId}/materials/video`, {
        title: values.title.trim(),
        description: values.description.trim(),
        videoUrl: values.videoUrl.trim(),
      })
      toast.success('Video lesson added')
      onSaved()
    } catch (err) {
      setErrors(fieldErrors(err))
      toast.error(errorMessage(err))
    } finally {
      setBusy(false)
    }
  }

  return (
    <Modal
      open
      title="Add lesson video"
      onClose={onClose}
      footer={
        <>
          <button className="btn-secondary" onClick={onClose} disabled={busy}>
            Cancel
          </button>
          <button className="btn-primary" onClick={submit} disabled={busy}>
            {busy && <Spinner className="h-4 w-4" />} Add video
          </button>
        </>
      }
    >
      <form onSubmit={submit} className="space-y-4" noValidate>
        <Field label="Video URL" required error={errors.videoUrl} hint="YouTube and Vimeo links play inside the LMS; other links open in a new tab.">
          <Input type="url" value={values.videoUrl} onChange={set('videoUrl')} error={errors.videoUrl} placeholder="https://www.youtube.com/watch?v=..." />
        </Field>
        <Field label="Title" required error={errors.title}>
          <Input value={values.title} onChange={set('title')} error={errors.title} placeholder="e.g. Lecture 3 — UML diagrams" />
        </Field>
        <Field label="Description" error={errors.description}>
          <Textarea value={values.description} onChange={set('description')} error={errors.description} rows={3} />
        </Field>
      </form>
    </Modal>
  )
}
