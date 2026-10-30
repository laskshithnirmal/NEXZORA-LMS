import { useMemo, useState } from 'react'
import { Pencil, Plus, Trash2, Users } from 'lucide-react'
import toast from 'react-hot-toast'
import api, { errorMessage, fieldErrors } from '../../api/client'
import { Badge, ConfirmDialog, EmptyState, Field, Input, Modal, PageHeader, PageLoader, SearchInput, Spinner } from '../../components/ui'
import { useApi } from '../../hooks/useApi'
import { formatDate } from '../../utils/format'
import { rules, validate } from '../../utils/validate'

/** Admin CRUD for students (role="STUDENT") or teachers (role="TEACHER"). */
export default function ManageUsers({ role }) {
  const label = role === 'STUDENT' ? 'Student' : 'Teacher'
  const { data: users, loading, reload } = useApi(`/admin/users?role=${role}`, [])
  const [query, setQuery] = useState('')
  const [editing, setEditing] = useState(null) // null = closed, {} = new, user = edit
  const [toDelete, setToDelete] = useState(null)
  const [deleting, setDeleting] = useState(false)

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return users
    return users.filter((u) => [u.fullName, u.email, u.phone].some((v) => v?.toLowerCase().includes(q)))
  }, [users, query])

  const confirmDelete = async () => {
    setDeleting(true)
    try {
      await api.delete(`/admin/users/${toDelete.id}`)
      toast.success(`${label} deleted`)
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
        title={`${label}s`}
        subtitle={`Create, edit and remove ${label.toLowerCase()} accounts.`}
        actions={
          <button className="btn-primary" onClick={() => setEditing({})}>
            <Plus className="h-4 w-4" /> Add {label.toLowerCase()}
          </button>
        }
      />

      <div className="card">
        <div className="flex flex-col gap-3 border-b border-slate-100 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-slate-500">
            {filtered.length} {label.toLowerCase()}
            {filtered.length === 1 ? '' : 's'}
          </p>
          <SearchInput value={query} onChange={setQuery} placeholder={`Search ${label.toLowerCase()}s...`} />
        </div>
        {loading ? (
          <PageLoader />
        ) : filtered.length === 0 ? (
          <EmptyState icon={Users} title={`No ${label.toLowerCase()}s found`} message={query ? 'Try a different search.' : `Add your first ${label.toLowerCase()}.`} />
        ) : (
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Phone</th>
                  <th>Status</th>
                  <th>Joined</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((u) => (
                  <tr key={u.id}>
                    <td className="font-medium text-slate-900">{u.fullName}</td>
                    <td>{u.email}</td>
                    <td>{u.phone || '-'}</td>
                    <td>{u.active ? <Badge tone="green">Active</Badge> : <Badge tone="red">Inactive</Badge>}</td>
                    <td>{formatDate(u.createdAt)}</td>
                    <td className="text-right">
                      <button className="btn-ghost" onClick={() => setEditing(u)} aria-label="Edit">
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button className="btn-ghost text-red-500 hover:bg-red-50 hover:text-red-600" onClick={() => setToDelete(u)} aria-label="Delete">
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
        <UserForm
          user={editing}
          role={role}
          label={label}
          onClose={() => setEditing(null)}
          onSaved={() => {
            setEditing(null)
            reload()
          }}
        />
      )}
      <ConfirmDialog
        open={Boolean(toDelete)}
        title={`Delete ${label.toLowerCase()}?`}
        message={`"${toDelete?.fullName}" will be removed${role === 'STUDENT' ? ' along with their enrollments and payment records' : ' and unassigned from their classes'}. This cannot be undone.`}
        busy={deleting}
        onConfirm={confirmDelete}
        onClose={() => setToDelete(null)}
      />
    </>
  )
}

function UserForm({ user, role, label, onClose, onSaved }) {
  const isEdit = Boolean(user.id)
  const [values, setValues] = useState({
    fullName: user.fullName || '',
    email: user.email || '',
    phone: user.phone || '',
    password: '',
    active: user.active ?? true,
  })
  const [errors, setErrors] = useState({})
  const [busy, setBusy] = useState(false)

  const schema = {
    fullName: [rules.required('Full name'), rules.minLength(2, 'Full name'), rules.maxLength(100, 'Full name')],
    email: [rules.required('Email'), rules.email()],
    phone: [rules.phone()],
    password: isEdit ? [rules.minLength(6, 'Password')] : [rules.required('Password'), rules.minLength(6, 'Password')],
  }

  const set = (f) => (e) => setValues((v) => ({ ...v, [f]: e.target.type === 'checkbox' ? e.target.checked : e.target.value }))

  const submit = async (e) => {
    e.preventDefault()
    const errs = validate(values, schema)
    setErrors(errs)
    if (Object.keys(errs).length) return
    setBusy(true)
    const payload = { ...values, role, fullName: values.fullName.trim(), email: values.email.trim() }
    try {
      if (isEdit) await api.put(`/admin/users/${user.id}`, payload)
      else await api.post('/admin/users', payload)
      toast.success(`${label} ${isEdit ? 'updated' : 'created'}`)
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
      title={isEdit ? `Edit ${label.toLowerCase()}` : `Add ${label.toLowerCase()}`}
      onClose={onClose}
      footer={
        <>
          <button className="btn-secondary" onClick={onClose} disabled={busy}>
            Cancel
          </button>
          <button className="btn-primary" onClick={submit} disabled={busy}>
            {busy && <Spinner className="h-4 w-4" />} {isEdit ? 'Save changes' : 'Create'}
          </button>
        </>
      }
    >
      <form onSubmit={submit} className="space-y-4" noValidate>
        <Field label="Full name" required error={errors.fullName}>
          <Input value={values.fullName} onChange={set('fullName')} error={errors.fullName} />
        </Field>
        <Field label="Email" required error={errors.email}>
          <Input type="email" value={values.email} onChange={set('email')} error={errors.email} />
        </Field>
        <Field label="Phone" error={errors.phone}>
          <Input type="tel" value={values.phone} onChange={set('phone')} error={errors.phone} />
        </Field>
        <Field label={isEdit ? 'New password' : 'Password'} required={!isEdit} error={errors.password} hint={isEdit ? 'Leave blank to keep the current password' : 'At least 6 characters'}>
          <Input type="password" autoComplete="new-password" value={values.password} onChange={set('password')} error={errors.password} />
        </Field>
        <label className="flex items-center gap-2 text-sm text-slate-700">
          <input type="checkbox" className="h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500" checked={values.active} onChange={set('active')} />
          Account is active (can log in)
        </label>
      </form>
    </Modal>
  )
}
