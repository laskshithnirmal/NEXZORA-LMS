import { useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { errorMessage, fieldErrors } from '../api/client'
import { Field, Input, Spinner } from '../components/ui'
import { homePath, useAuth } from '../context/AuthContext'
import { rules, validate } from '../utils/validate'
import AuthShell from './AuthShell'

const schema = {
  fullName: [rules.required('Full name'), rules.minLength(2, 'Full name'), rules.maxLength(100, 'Full name')],
  email: [rules.required('Email'), rules.email()],
  phone: [rules.phone()],
  password: [rules.required('Password'), rules.minLength(6, 'Password'), rules.maxLength(64, 'Password')],
  confirmPassword: [rules.required('Confirm password'), rules.matches('password', 'Passwords do not match')],
}

export default function Register() {
  const { user, register } = useAuth()
  const navigate = useNavigate()
  const [values, setValues] = useState({ fullName: '', email: '', phone: '', password: '', confirmPassword: '' })
  const [errors, setErrors] = useState({})
  const [busy, setBusy] = useState(false)

  if (user) return <Navigate to={homePath(user.role)} replace />

  const set = (field) => (e) => setValues((v) => ({ ...v, [field]: e.target.value }))

  const onSubmit = async (e) => {
    e.preventDefault()
    const errs = validate(values, schema)
    setErrors(errs)
    if (Object.keys(errs).length) return
    setBusy(true)
    try {
      const { confirmPassword, ...payload } = values
      await register({ ...payload, fullName: payload.fullName.trim(), email: payload.email.trim() })
      toast.success('Account created. Welcome to NEXZORA!')
      navigate('/student', { replace: true })
    } catch (err) {
      setErrors(fieldErrors(err))
      toast.error(errorMessage(err, 'Registration failed'))
    } finally {
      setBusy(false)
    }
  }

  return (
    <AuthShell title="Create your student account" subtitle="Register to join classes and access learning materials.">
      <form onSubmit={onSubmit} className="space-y-4" noValidate>
        <Field label="Full name" required error={errors.fullName} htmlFor="fullName">
          <Input id="fullName" autoComplete="name" value={values.fullName} onChange={set('fullName')} error={errors.fullName} placeholder="e.g. Nethmi Silva" />
        </Field>
        <Field label="Email address" required error={errors.email} htmlFor="email">
          <Input id="email" type="email" autoComplete="email" value={values.email} onChange={set('email')} error={errors.email} placeholder="you@university.edu" />
        </Field>
        <Field label="Phone" error={errors.phone} htmlFor="phone" hint="Optional">
          <Input id="phone" type="tel" autoComplete="tel" value={values.phone} onChange={set('phone')} error={errors.phone} placeholder="+94 77 123 4567" />
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Password" required error={errors.password} htmlFor="password">
            <Input id="password" type="password" autoComplete="new-password" value={values.password} onChange={set('password')} error={errors.password} />
          </Field>
          <Field label="Confirm password" required error={errors.confirmPassword} htmlFor="confirmPassword">
            <Input id="confirmPassword" type="password" autoComplete="new-password" value={values.confirmPassword} onChange={set('confirmPassword')} error={errors.confirmPassword} />
          </Field>
        </div>
        <button type="submit" className="btn-primary w-full py-2.5" disabled={busy}>
          {busy && <Spinner className="h-4 w-4" />} Create account
        </button>
      </form>
      <p className="mt-6 text-center text-sm text-slate-500">
        Already have an account?{' '}
        <Link to="/login" className="font-medium text-brand-600 hover:text-brand-700">
          Sign in
        </Link>
      </p>
    </AuthShell>
  )
}
