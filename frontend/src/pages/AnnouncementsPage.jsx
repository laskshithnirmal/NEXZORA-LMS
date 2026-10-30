import { useState } from 'react'
import { Plus } from 'lucide-react'
import toast from 'react-hot-toast'
import api, { errorMessage, fieldErrors } from '../api/client'
import AnnouncementList from '../components/AnnouncementList'
import { ConfirmDialog, Field, Input, Modal, PageHeader, PageLoader, Select, Spinner, Textarea } from '../components/ui'
import { useAuth } from '../context/AuthContext'
import { useApi } from '../hooks/useApi'
import { rules, validate } from '../utils/validate'

/**
 * Announcements for all three roles.
 * scope = 'admin' | 'teacher' (can publish) | 'student' (read-only).
 */
export default function AnnouncementsPage({ scope }) {
  const { user } = useAuth()
  const canPost = scope !== 'student'
  const { data: items, loading, reload } = useApi(`/${scope}/announcements`, [])
  const { data: classes } = useApi(canPost ? `/${scope}/classes` : null, [])
  const [formOpen, setFormOpen] = useState(false)
  const [toDelete, setToDelete] = useState(null)
  const [deleting, setDeleting] = useState(false)

  const canDelete = (a) => scope === 'admin' || a.authorId === user.id

  const confirmDelete = async () => {
    setDeleting(true)
    try {
      await api.delete(`/${scope}/announcements/${toDelete.id}`)
      toast.success('Announcement deleted')
      setToDelete(null)
      reload()
    } catch (e) {
      toast.error(errorMessage(e))
    } finally {
      setDeleting(false)
    }
  }

  return (
    <>
      <PageHeader
        title="Announcements"
        subtitle={canPost ? 'Publish news and updates for students.' : 'News and updates from your university and teachers.'}
        actions={
          canPost && (
            <button className="btn-primary" onClick={() => setFormOpen(true)}>
              <Plus className="h-4 w-4" /> New announcement
            </button>
          )
        }
      />
      <div className="card">{loading ? <PageLoader /> : <AnnouncementList items={items} onDelete={canPost ? setToDelete : null} canDelete={canDelete} />}</div>

      {canPost && (
        <AnnouncementForm
          open={formOpen}
          scope={scope}
          classes={classes}
          onClose={() => setFormOpen(false)}
          onSaved={() => {
            setFormOpen(false)
            reload()
          }}
        />
      )}
      <ConfirmDialog
        open={Boolean(toDelete)}
        message={`Delete the announcement "${toDelete?.title}"? This cannot be undone.`}
        busy={deleting}
        onConfirm={confirmDelete}
        onClose={() => setToDelete(null)}
      />
    </>
  )
}

function AnnouncementForm({ open, scope, classes, onClose, onSaved }) {
  const empty = { title: '', content: '', classId: '' }
  const [values, setValues] = useState(empty)
  const [errors, setErrors] = useState({})
  const [busy, setBusy] = useState(false)

  const schema = {
    title: [rules.required('Title'), rules.maxLength(150, 'Title')],
    content: [rules.required('Content'), rules.maxLength(3000, 'Content')],
    ...(scope === 'teacher' ? { classId: [rules.required('Class')] } : {}),
  }

  const set = (f) => (e) => setValues((v) => ({ ...v, [f]: e.target.value }))
  const close = () => {
    setValues(empty)
    setErrors({})
    onClose()
  }

  const submit = async (e) => {
    e.preventDefault()
    const errs = validate(values, schema)
    setErrors(errs)
    if (Object.keys(errs).length) return
    setBusy(true)
    try {
      await api.post(`/${scope}/announcements`, {
        title: values.title.trim(),
        content: values.content.trim(),
        classId: values.classId ? Number(values.classId) : null,
      })
      toast.success('Announcement published')
      setValues(empty)
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
      open={open}
      title="New announcement"
      onClose={close}
      footer={
        <>
          <button className="btn-secondary" onClick={close} disabled={busy}>
            Cancel
          </button>
          <button className="btn-primary" onClick={submit} disabled={busy}>
            {busy && <Spinner className="h-4 w-4" />} Publish
          </button>
        </>
      }
    >
      <form onSubmit={submit} className="space-y-4" noValidate>
        <Field label="Audience" required={scope === 'teacher'} error={errors.classId}>
          <Select value={values.classId} onChange={set('classId')} error={errors.classId}>
            <option value="">{scope === 'admin' ? 'Everyone (all users)' : 'Select a class'}</option>
            {classes.map((c) => (
              <option key={c.id} value={c.id}>
                {c.courseCode} — {c.name}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Title" required error={errors.title}>
          <Input value={values.title} onChange={set('title')} error={errors.title} placeholder="e.g. Mid-semester exam schedule" />
        </Field>
        <Field label="Content" required error={errors.content}>
          <Textarea value={values.content} onChange={set('content')} error={errors.content} rows={6} />
        </Field>
      </form>
    </Modal>
  )
}
