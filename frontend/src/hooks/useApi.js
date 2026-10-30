import { useCallback, useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import api, { errorMessage } from '../api/client'

/** Loads data from a GET endpoint. Returns { data, loading, reload, setData }. */
export function useApi(url, initial = null) {
  const [data, setData] = useState(initial)
  const [loading, setLoading] = useState(true)

  const reload = useCallback(async () => {
    if (!url) return
    try {
      const res = await api.get(url)
      setData(res.data)
    } catch (e) {
      if (e.response?.status !== 401) toast.error(errorMessage(e, 'Failed to load data'))
    } finally {
      setLoading(false)
    }
  }, [url])

  useEffect(() => {
    setLoading(true)
    reload()
  }, [reload])

  return { data, loading, reload, setData }
}
