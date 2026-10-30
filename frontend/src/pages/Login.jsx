import { useEffect, useState } from 'react'
import { Link, Navigate, useNavigate, useSearchParams } from 'react-router-dom'
import toast from 'react-hot-toast'
import { errorMessage } from '../api/client'
import { Field, Input, Spinner } from '../components/ui'
import { homePath, useAuth } from '../context/AuthContext'
import { rules, validate } from '../utils/validate'
import AuthShell from './AuthShell'

const schema = {
  email: [rules.required('Email'), rules.email()],
  password: [rules.required('Password')],
}

export default function Login() {
  const { user, login } = useAuth()
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const [values, setValues] = useState({ email: '', password: '' })
  const [errors, setErrors] = useState({})
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (params.get('expired')) toast.error('Your session has expired. Please log in again.', { id: 'expired' })
  }, [params])

  if (user) return <Navigate to={homePath(user.role)} replace />

  const set = (field) => (e) => setValues((v) => ({ ...v, [field]: e.target.value }))

  const onSubmit = async (e) => {
    e.preventDefault()
    const errs = validate(values, schema)
    setErrors(errs)
    if (Object.keys(errs).length) return
    setBusy(true)
    try {
      const u = await login(values.email.trim(), values.password)
      toast.success(`Welcome back, ${u.fullName.split(' ')[0]}!`)
      navigate(homePath(u.role), { replace: true })
    } catch (err) {
      toast.error(errorMessage(err, 'Login failed'))
    } finally {
      setBusy(false)
    }
  }

  return (
    <AuthShell title="Sign in to your account" subtitle="Welcome back! Please enter your details.">
      <form onSubmit={onSubmit} className="space-y-5" noValidate>
        <Field label="Email address" error={errors.email} htmlFor="email">
          <Input id="email" type="email" autoComplete="email" value={values.email} onChange={set('email')} error={errors.email} placeholder="you@university.edu" />
        </Field>
        <Field label="Password" error={errors.password} htmlFor="password">
          <Input id="password" type="password" autoComplete="current-password" value={values.password} onChange={set('password')} error={errors.password} placeholder="••••••••" />
        </Field>
        <button type="submit" className="btn-primary w-full py-2.5" disabled={busy}>
          {busy && <Spinner className="h-4 w-4" />} Sign in
        </button>
      </form>
      <p className="mt-6 text-center text-sm text-slate-500">
        New student?{' '}
        <Link to="/register" className="font-medium text-brand-600 hover:text-brand-700">
          Create an account
        </Link>
      </p>
    </AuthShell>
  )
}
