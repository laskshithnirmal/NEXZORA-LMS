import { useMemo, useState } from 'react'
import { CreditCard, Pencil, Plus, Trash2 } from 'lucide-react'
import toast from 'react-hot-toast'
import api, { errorMessage, fieldErrors } from '../../api/client'
import { ConfirmDialog, EmptyState, Field, Input, Modal, PageHeader, PageLoader, SearchInput, Select, Spinner, StatCard } from '../../components/ui'
import PaymentStatusBadge from '../../components/PaymentStatusBadge'
import { useApi } from '../../hooks/useApi'
import { formatDate, formatMoney, plural, todayIso } from '../../utils/format'
import { rules, validate } from '../../utils/validate'

const METHODS = ['Cash', 'Bank Transfer', 'Card', 'Online', 'Cheque']

export default function Payments() {
  const { data: payments, loading, reload } = useApi('/admin/payments', [])
  const { data: students } = useApi('/admin/users?role=STUDENT', [])
  const { data: classes } = useApi('/admin/classes', [])
  const { data: enrollments } = useApi('/admin/enrollments', [])
  const [query, setQuery] = useState('')
  const [status, setStatus] = useState('')
  const [editing, setEditing] = useState(null)
  const [toDelete, setToDelete] = useState(null)
  const [deleting, setDeleting] = useState(false)

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return payments.filter(
      (p) =>
        (!status || p.status === status) &&
        (!q || [p.studentName, p.studentEmail, p.className, p.reference].some((v) => v?.toLowerCase().includes(q))),
    )
  }, [payments, query, status])

  const totals = useMemo(() => {
    const sum = (s) => payments.filter((p) => p.status === s).reduce((t, p) => t + Number(p.amount), 0)
    return { paid: sum('PAID'), pending: sum('PENDING'), overdue: sum('OVERDUE') }
  }, [payments])

  const confirmDelete = async () => {
    setDeleting(true)
    try {
      await api.delete(`/admin/payments/${toDelete.id}`)
      toast.success('Payment record deleted')
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
        title="Payments"
        subtitle="Record and track student fee payments."
        actions={
          <button className="btn-primary" onClick={() => setEditing({})}>
            <Plus className="h-4 w-4" /> Record payment
          </button>
        }
      />

      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <StatCard label="Paid" value={formatMoney(totals.paid)} />
        <StatCard label="Pending" value={formatMoney(totals.pending)} />
        <StatCard label="Overdue" value={formatMoney(totals.overdue)} />
      </div>

      <div className="card">
        <div className="flex flex-col gap-3 border-b border-neutral-200 px-5 py-3.5 md:flex-row md:items-center md:justify-between">
          <p className="text-sm text-neutral-500">{plural(filtered.length, 'record')}</p>
          <div className="flex flex-col gap-2 sm:flex-row">
            <select className="input sm:w-40" value={status} onChange={(e) => setStatus(e.target.value)} aria-label="Filter by status">
              <option value="">All statuses</option>
              <option value="PAID">Paid</option>
              <option value="PENDING">Pending</option>
              <option value="OVERDUE">Overdue</option>
            </select>
            <SearchInput value={query} onChange={setQuery} placeholder="Search student, class, ref..." />
          </div>
        </div>
        {loading ? (
          <PageLoader />
        ) : filtered.length === 0 ? (
          <EmptyState icon={CreditCard} title="No payment records" message="Record a payment to get started." />
        ) : (
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Student</th>
                  <th>Class</th>
                  <th>Amount</th>
                  <th>Status</th>
                  <th>Method / Ref</th>
                  <th>Date</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-200">
                {filtered.map((p) => (
                  <tr key={p.id}>
                    <td>
                      <p className="font-medium text-neutral-900">{p.studentName}</p>
                      <p className="text-xs text-neutral-500">{p.studentEmail}</p>
                    </td>
                    <td>{p.className || <span className="text-neutral-400">General</span>}</td>
                    <td className="font-medium">{formatMoney(p.amount)}</td>
                    <td>
                      <PaymentStatusBadge status={p.status} />
                    </td>
                    <td>
                      <p>{p.method || '-'}</p>
                      {p.reference && <p className="text-xs text-neutral-500">{p.reference}</p>}
                    </td>
                    <td>{formatDate(p.paymentDate)}</td>
                    <td className="text-right">
                      <button className="btn-ghost" onClick={() => setEditing(p)} aria-label="Edit">
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button className="btn-icon-danger" onClick={() => setToDelete(p)} aria-label="Delete">
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
        <PaymentForm
          payment={editing}
          students={students}
          classes={classes}
          enrollments={enrollments}
          onClose={() => setEditing(null)}
          onSaved={() => {
            setEditing(null)
            reload()
          }}
        />
      )}
      <ConfirmDialog
        open={Boolean(toDelete)}
        title="Delete payment record?"
        message={`Delete the ${formatMoney(toDelete?.amount)} payment for ${toDelete?.studentName}?`}
        busy={deleting}
        onConfirm={confirmDelete}
        onClose={() => setToDelete(null)}
      />
    </>
  )
}

function PaymentForm({ payment, students, classes, enrollments, onClose, onSaved }) {
  const isEdit = Boolean(payment.id)
  const [values, setValues] = useState({
    studentId: payment.studentId || '',
    classId: payment.classId || '',
    amount: payment.amount ?? '',
    status: payment.status || 'PAID',
    method: payment.method || 'Cash',
    reference: payment.reference || '',
    description: payment.description || '',
    paymentDate: payment.paymentDate || todayIso(),
  })
  const [errors, setErrors] = useState({})
  const [busy, setBusy] = useState(false)

  const schema = {
    studentId: [rules.required('Student')],
    amount: [rules.required('Amount'), rules.number('Amount', { min: 0.01, max: 99999999 })],
    status: [rules.required('Status')],
    paymentDate: [rules.required('Payment date')],
    reference: [rules.maxLength(60, 'Reference')],
    description: [rules.maxLength(255, 'Description')],
  }

  const set = (f) => (e) => setValues((v) => ({ ...v, [f]: e.target.value }))

  // A class-linked payment needs an enrollment (enforced by the backend), so only offer the
  // selected student's classes. The class already saved on an existing record stays selectable.
  const classOptions = useMemo(() => {
    const allowed = new Set(enrollments.filter((e) => String(e.studentId) === String(values.studentId)).map((e) => e.classId))
    if (isEdit && payment.classId && String(payment.studentId) === String(values.studentId)) allowed.add(payment.classId)
    return classes.filter((c) => allowed.has(c.id))
  }, [classes, enrollments, values.studentId, isEdit, payment])

  const onStudentChange = (e) => {
    const studentId = e.target.value
    const stillEnrolled = enrollments.some((en) => String(en.studentId) === studentId && String(en.classId) === String(values.classId))
    setValues((v) => ({ ...v, studentId, classId: stillEnrolled ? v.classId : '' }))
  }

  // Pre-fill the amount with the class fee when a class is chosen for a new record.
  const onClassChange = (e) => {
    const classId = e.target.value
    const cls = classes.find((c) => String(c.id) === classId)
    setValues((v) => ({ ...v, classId, amount: !isEdit && cls && !v.amount ? cls.fee : v.amount }))
  }

  const submit = async (e) => {
    e.preventDefault()
    const errs = validate(values, schema)
    setErrors(errs)
    if (Object.keys(errs).length) return
    setBusy(true)
    const payload = {
      ...values,
      studentId: Number(values.studentId),
      classId: values.classId ? Number(values.classId) : null,
      amount: Number(values.amount),
    }
    try {
      if (isEdit) await api.put(`/admin/payments/${payment.id}`, payload)
      else await api.post('/admin/payments', payload)
      toast.success(`Payment ${isEdit ? 'updated' : 'recorded'}`)
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
      title={isEdit ? 'Edit payment' : 'Record payment'}
      onClose={onClose}
      footer={
        <>
          <button className="btn-secondary" onClick={onClose} disabled={busy}>
            Cancel
          </button>
          <button className="btn-primary" onClick={submit} disabled={busy}>
            {busy && <Spinner className="h-4 w-4" />} {isEdit ? 'Save changes' : 'Save payment'}
          </button>
        </>
      }
    >
      <form onSubmit={submit} className="grid gap-4 sm:grid-cols-2" noValidate>
        <Field label="Student" required error={errors.studentId}>
          <Select value={values.studentId} onChange={onStudentChange} error={errors.studentId}>
            <option value="">Select a student</option>
            {students.map((s) => (
              <option key={s.id} value={s.id}>
                {s.fullName} ({s.email})
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Class" error={errors.classId} hint={values.studentId ? "Optional. Lists the student's enrolled classes." : 'Select a student first'}>
          <Select value={values.classId} onChange={onClassChange} disabled={!values.studentId}>
            <option value="">General / not class-specific</option>
            {classOptions.map((c) => (
              <option key={c.id} value={c.id}>
                {c.courseCode} — {c.name}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Amount (LKR)" required error={errors.amount}>
          <Input type="number" min="0.01" step="0.01" value={values.amount} onChange={set('amount')} error={errors.amount} />
        </Field>
        <Field label="Status" required error={errors.status}>
          <Select value={values.status} onChange={set('status')} error={errors.status}>
            <option value="PAID">Paid</option>
            <option value="PENDING">Pending</option>
            <option value="OVERDUE">Overdue</option>
          </Select>
        </Field>
        <Field label="Method" error={errors.method}>
          <Select value={values.method} onChange={set('method')}>
            {METHODS.map((m) => (
              <option key={m}>{m}</option>
            ))}
          </Select>
        </Field>
        <Field label="Payment date" required error={errors.paymentDate}>
          <Input type="date" value={values.paymentDate} onChange={set('paymentDate')} error={errors.paymentDate} />
        </Field>
        <Field label="Reference" error={errors.reference}>
          <Input value={values.reference} onChange={set('reference')} error={errors.reference} placeholder="Receipt / transaction no." />
        </Field>
        <Field label="Description" error={errors.description}>
          <Input value={values.description} onChange={set('description')} error={errors.description} placeholder="e.g. Semester 1 fee" />
        </Field>
      </form>
    </Modal>
  )
}
