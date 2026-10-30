import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import api, { TOKEN_KEY, USER_KEY } from '../api/client'

const AuthContext = createContext(null)

function readStoredUser() {
  try {
    return JSON.parse(localStorage.getItem(USER_KEY))
  } catch {
    return null
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => (localStorage.getItem(TOKEN_KEY) ? readStoredUser() : null))
  const [checking, setChecking] = useState(Boolean(localStorage.getItem(TOKEN_KEY)))

  const saveSession = useCallback(({ token, user }) => {
    localStorage.setItem(TOKEN_KEY, token)
    localStorage.setItem(USER_KEY, JSON.stringify(user))
    setUser(user)
  }, [])

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY)
    localStorage.removeItem(USER_KEY)
    setUser(null)
  }, [])

  // Verify a stored token is still valid on page load.
  useEffect(() => {
    if (!localStorage.getItem(TOKEN_KEY)) return
    api
      .get('/auth/me')
      .then((res) => {
        localStorage.setItem(USER_KEY, JSON.stringify(res.data))
        setUser(res.data)
      })
      .catch(() => logout())
      .finally(() => setChecking(false))
  }, [logout])

  const login = useCallback(
    async (email, password) => {
      const res = await api.post('/auth/login', { email, password })
      saveSession(res.data)
      return res.data.user
    },
    [saveSession],
  )

  const register = useCallback(
    async (data) => {
      const res = await api.post('/auth/register', data)
      saveSession(res.data)
      return res.data.user
    },
    [saveSession],
  )

  const value = useMemo(() => ({ user, checking, login, register, logout }), [user, checking, login, register, logout])
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  return useContext(AuthContext)
}

/** Landing page for each role after login. */
export function homePath(role) {
  return { ADMIN: '/admin', TEACHER: '/teacher', STUDENT: '/student' }[role] || '/login'
}
