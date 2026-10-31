import { Link } from 'react-router-dom'

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4 text-center">
      <p className="font-mono text-5xl font-semibold text-neutral-900">404</p>
      <h1 className="mt-4 text-xl font-semibold text-neutral-900">Page not found</h1>
      <p className="mt-2 text-sm text-neutral-500">The page you are looking for does not exist.</p>
      <Link to="/" className="btn-primary mt-6">
        Go to dashboard
      </Link>
    </div>
  )
}
