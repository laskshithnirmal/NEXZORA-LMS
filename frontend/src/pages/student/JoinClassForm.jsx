import { useState } from 'react'
import { KeyRound } from 'lucide-react'
import toast from 'react-hot-toast'
import api, { errorMessage } from '../../api/client'
import { Spinner } from '../../components/ui'

/** Enrollment-code form. Calls onJoined(class) after a successful join. */
export default function JoinClassForm({ onJoined }) {
  const [code, setCode] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  const submit = async (e) => {
    e.preventDefault()
    const value = code.trim()
    if (!value) return setError('Enter the enrollment code from your teacher')
    if (!/^[A-Za-z0-9-]{4,20}$/.test(value)) return setError('Codes are 4-20 letters, digits or dashes')
    setError('')
    setBusy(true)
    try {
      const res = await api.post('/student/enroll', { enrollmentCode: value })
      toast.success(`You joined ${res.data.name}!`)
      setCode('')
      onJoined?.(res.data)
    } catch (err) {
      setError(errorMessage(err, 'Could not join the class'))
    } finally {
      setBusy(false)
    }
  }

  return (
    <form onSubmit={submit} noValidate className="card p-5">
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-600">
          <KeyRound className="h-5 w-5" />
        </div>
        <div>
          <h2 className="font-semibold text-slate-900">Join a class</h2>
          <p className="text-sm text-slate-500">Enter the enrollment code given by your teacher or the administration.</p>
        </div>
      </div>
      <div className="mt-4 flex flex-col gap-2 sm:flex-row">
        <input
          className={`input font-mono uppercase tracking-wider ${error ? 'input-error' : ''}`}
          value={code}
          onChange={(e) => setCode(e.target.value)}
          placeholder="e.g. SE2026A"
          maxLength={20}
          aria-label="Enrollment code"
        />
        <button type="submit" className="btn-primary shrink-0" disabled={busy}>
          {busy && <Spinner className="h-4 w-4" />} Join class
        </button>
      </div>
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
    </form>
  )
}
