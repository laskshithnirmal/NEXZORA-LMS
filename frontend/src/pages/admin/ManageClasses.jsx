import { useMemo, useState } from 'react'
import { Copy, Library, Pencil, Plus, Trash2, Users } from 'lucide-react'
import toast from 'react-hot-toast'
import api, { errorMessage, fieldErrors } from '../../api/client'
import { Badge, ConfirmDialog, EmptyState, Field, Input, Modal, PageHeader, PageLoader, SearchInput, Select, Spinner, Textarea } from '../../components/ui'
import { useApi } from '../../hooks/useApi'
import { formatDate, formatMoney, plural } from '../../utils/format'
import { rules, validate } from '../../utils/validate'

export default function ManageClasses() {
  const { data: classes, loading, reload, setData } = useApi('/admin/classes', [])
  const { data: teachers } = useApi('/admin/users?role=TEACHER', [])
  const [query, setQuery] = useState('')
  const [editing, setEditing] = useState(null)
  const [toDelete, setToDelete] = useState(null)
  const [deleting, setDeleting] = useState(false)
  const [rosterFor, setRosterFor] = useState(null)

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return classes
    return classes.filter((c) => [c.name, c.courseCode, c.teacherName, c.enrollmentCode].some((v) => v?.toLowerCase().includes(q)))
  }, [classes, query])

  const assignTeacher = async (cls, teacherId) => {
    try {
      const res = await api.put(`/admin/classes/${cls.id}/teacher`, { teacherId: teacherId ? Number(teacherId) : null })
      setData((list) => list.map((c) => (c.id === cls.id ? res.data : c)))
      toast.success(teacherId ? `Teacher assigned to ${cls.courseCode}` : `Teacher removed from ${cls.courseCode}`)
    } catch (e) {
      toast.error(errorMessage(e))
    }
  }

  const copyCode = async (code) => {
    try {
      await navigator.clipboard.writeText(code)
      toast.success('Enrollment code copied')
    } catch {
      toast(code)
    }
  }

  const confirmDelete = async () => {
    setDeleting(true)
    try {
      await api.delete(`/admin/classes/${toDelete.id}`)
      toast.success('Class deleted')
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
        title="Classes"
        subtitle="Create classes, assign teachers and share enrollment codes with students."
        actions={
          <button className="btn-primary" onClick={() => setEditing({})}>
            <Plus className="h-4 w-4" /> New class
          </button>
        }
      />

      <div className="card">
        <div className="flex flex-col gap-3 border-b border-neutral-200 px-5 py-3.5 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-neutral-500">{plural(filtered.length, 'class', 'classes')}</p>
          <SearchInput value={query} onChange={setQuery} placeholder="Search classes..." />
        </div>
        {loading ? (
          <PageLoader />
        ) : filtered.length === 0 ? (
          <EmptyState icon={Library} title="No classes found" message={query ? 'Try a different search.' : 'Create your first class.'} />
        ) : (
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Class</th>
                  <th>Enrollment code</th>
                  <th>Teacher</th>
                  <th>Students</th>
                  <th>Fee</th>
                  <th>Status</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-200">
                {filtered.map((c) => (
                  <tr key={c.id}>
                    <td>
                      <p className="font-medium text-neutral-900">{c.name}</p>
                      <p className="text-xs text-neutral-500">
                        {c.courseCode}
                        {c.schedule ? ` · ${c.schedule}` : ''}
                      </p>
                    </td>
                    <td>
                      <button onClick={() => copyCode(c.enrollmentCode)} className="code-chip" title="Copy code">
                        {c.enrollmentCode} <Copy className="h-3 w-3" />
                      </button>
                    </td>
                    <td>
                      <select className="input w-40 py-1.5" value={c.teacherId || ''} onChange={(e) => assignTeacher(c, e.target.value)} aria-label="Assign teacher">
                        <option value="">— Unassigned —</option>
                        {teachers.map((t) => (
                          <option key={t.id} value={t.id}>
                            {t.fullName}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td>
                      <button className="link inline-flex items-center gap-1" onClick={() => setRosterFor(c)}>
                        <Users className="h-4 w-4" /> {c.studentCount}
                      </button>
                    </td>
                    <td>{formatMoney(c.fee)}</td>
                    <td>{c.active ? <Badge tone="green">Active</Badge> : <Badge tone="gray">Closed</Badge>}</td>
                    <td className="text-right">
                      <button className="btn-ghost" onClick={() => setEditing(c)} aria-label="Edit">
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button className="btn-icon-danger" onClick={() => setToDelete(c)} aria-label="Delete">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {editing && (
        <ClassForm
          cls={editing}
          teachers={teachers}
          onClose={() => setEditing(null)}
          onSaved={() => {
            setEditing(null)
            reload()
          }}
        />
      )}
      {rosterFor && <RosterModal cls={rosterFor} onClose={() => setRosterFor(null)} />}
      <ConfirmDialog
        open={Boolean(toDelete)}
        title="Delete class?"
        message={`"${toDelete?.name}" and all its materials, enrollments and class announcements will be deleted. This cannot be undone.`}
        busy={deleting}
        onConfirm={confirmDelete}
        onClose={() => setToDelete(null)}
      />
    </>
  )
}

function ClassForm({ cls, teachers, onClose, onSaved }) {
  const isEdit = Boolean(cls.id)
  const [values, setValues] = useState({
    name: cls.name || '',
    courseCode: cls.courseCode || '',
    description: cls.description || '',
    schedule: cls.schedule || '',
    fee: cls.fee ?? '0',
    teacherId: cls.teacherId || '',
    enrollmentCode: cls.enrollmentCode || '',
    active: cls.active ?? true,
  })
  const [errors, setErrors] = useState({})
  const [busy, setBusy] = useState(false)

  const schema = {
    name: [rules.required('Class name'), rules.maxLength(120, 'Class name')],
    courseCode: [rules.required('Course code'), rules.maxLength(20, 'Course code')],
    description: [rules.maxLength(1000, 'Description')],
    schedule: [rules.maxLength(100, 'Schedule')],
    fee: [rules.required('Fee'), rules.number('Fee', { min: 0, max: 99999999 })],
    enrollmentCode: [rules.pattern(/^[A-Za-z0-9-]{4,20}$/, 'Use 4-20 letters, digits or dashes')],
  }

  const set = (f) => (e) => setValues((v) => ({ ...v, [f]: e.target.type === 'checkbox' ? e.target.checked : e.target.value }))

  const submit = async (e) => {
    e.preventDefault()
    const errs = validate(values, schema)
    setErrors(errs)
    if (Object.keys(errs).length) return
    setBusy(true)
    const payload = {
      ...values,
      fee: Number(values.fee),
      teacherId: values.teacherId ? Number(values.teacherId) : null,
      enrollmentCode: values.enrollmentCode.trim() || null,
    }
    try {
      if (isEdit) await api.put(`/admin/classes/${cls.id}`, payload)
      else await api.post('/admin/classes', payload)
      toast.success(`Class ${isEdit ? 'updated' : 'created'}`)
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
      size="lg"
      title={isEdit ? 'Edit class' : 'New class'}
      onClose={onClose}
      footer={
        <>
          <button className="btn-secondary" onClick={onClose} disabled={busy}>
            Cancel
          </button>
          <button className="btn-primary" onClick={submit} disabled={busy}>
            {busy && <Spinner className="h-4 w-4" />} {isEdit ? 'Save changes' : 'Create class'}
          </button>
        </>
      }
    >
      <form onSubmit={submit} className="grid gap-4 sm:grid-cols-2" noValidate>
        <div className="sm:col-span-2">
          <Field label="Class name" required error={errors.name}>
            <Input value={values.name} onChange={set('name')} error={errors.name} placeholder="e.g. Software Engineering" />
          </Field>
        </div>
        <Field label="Course code" required error={errors.courseCode}>
          <Input value={values.courseCode} onChange={set('courseCode')} error={errors.courseCode} placeholder="e.g. SE2012" />
        </Field>
        <Field label="Fee (LKR)" required error={errors.fee}>
          <Input type="number" min="0" step="0.01" value={values.fee} onChange={set('fee')} error={errors.fee} />
        </Field>
        <Field label="Schedule" error={errors.schedule}>
          <Input value={values.schedule} onChange={set('schedule')} error={errors.schedule} placeholder="e.g. Mon & Wed 9:00-11:00" />
        </Field>
        <Field label="Teacher" error={errors.teacherId}>
          <Select value={values.teacherId} onChange={set('teacherId')}>
            <option value="">— Unassigned —</option>
            {teachers.map((t) => (
              <option key={t.id} value={t.id}>
                {t.fullName}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Enrollment code" error={errors.enrollmentCode} hint={isEdit ? 'Change to issue a new code' : 'Leave blank to generate one automatically'}>
          <Input value={values.enrollmentCode} onChange={set('enrollmentCode')} error={errors.enrollmentCode} className="font-mono uppercase" />
        </Field>
        <div className="flex items-end pb-2">
          <label className="flex items-center gap-2 text-sm text-neutral-700">
            <input type="checkbox" className="checkbox" checked={values.active} onChange={set('active')} />
            Open for enrollment
          </label>
        </div>
        <div className="sm:col-span-2">
          <Field label="Description" error={errors.description}>
            <Textarea value={values.description} onChange={set('description')} error={errors.description} rows={3} />
          </Field>
        </div>
      </form>
    </Modal>
  )
}

function RosterModal({ cls, onClose }) {
  const { data: students, loading } = useApi(`/admin/classes/${cls.id}/students`, [])
  return (
    <Modal open size="lg" title={`Students in ${cls.courseCode} — ${cls.name}`} onClose={onClose}>
      {loading ? (
        <PageLoader />
      ) : students.length === 0 ? (
        <EmptyState icon={Users} title="No students enrolled yet" message={`Share the code ${cls.enrollmentCode} with students.`} />
      ) : (
        <div className="table-wrap -mx-5">
          <table className="table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Enrolled</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-200">
              {students.map((s) => (
                <tr key={s.id}>
                  <td className="font-medium text-neutral-900">{s.studentName}</td>
                  <td>{s.studentEmail}</td>
                  <td>{formatDate(s.enrolledAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Modal>
  )
}
