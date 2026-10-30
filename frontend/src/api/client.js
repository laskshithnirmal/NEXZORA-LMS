import axios from 'axios'

export const TOKEN_KEY = 'nexzora_token'
export const USER_KEY = 'nexzora_user'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
})

// Attach the JWT to every request.
api.interceptors.request.use((config) => {
  const token = localStorage.getItem(TOKEN_KEY)
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// An expired or invalid token logs the user out.
api.interceptors.response.use(
  (res) => res,
  (error) => {
    const isAuthCall = error.config?.url?.startsWith('/auth/')
    if (error.response?.status === 401 && !isAuthCall) {
      localStorage.removeItem(TOKEN_KEY)
      localStorage.removeItem(USER_KEY)
      if (window.location.pathname !== '/login') window.location.assign('/login?expired=1')
    }
    return Promise.reject(error)
  },
)

/** Human-readable message from an API error. */
export function errorMessage(error, fallback = 'Something went wrong') {
  if (!error.response) return 'Cannot reach the server. Is the backend running?'
  return error.response.data?.message || fallback
}

/** Field-level validation errors returned by the backend, if any. */
export function fieldErrors(error) {
  return error.response?.data?.errors || {}
}

/** Opens a protected PDF in a new tab (the token can't be sent by a plain link). */
export async function openPdf(materialId) {
  // Open the tab synchronously so pop-up blockers allow it.
  const tab = window.open('', '_blank')
  try {
    const res = await api.get(`/materials/${materialId}/file`, { responseType: 'blob' })
    const url = URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }))
    if (tab) tab.location.href = url
    else window.location.assign(url)
    setTimeout(() => URL.revokeObjectURL(url), 60_000)
  } catch (e) {
    tab?.close()
    throw e
  }
}

export default api
