import { useEffect, useState } from 'react'
import { onAuthStateChanged, getIdTokenResult } from 'firebase/auth'
import { auth } from './firebaseClient'
import { useRouter } from 'next/router'

export default function useRequireAdmin () {
  const router = useRouter()
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async user => {
      if (!user) {
        router.replace('/admin/login')
        return
      }

      try {
        // Force token refresh to get latest claims
        const idTokenResult = await getIdTokenResult(user, true)
        if (!idTokenResult.claims || idTokenResult.claims.role !== 'admin') {
          router.replace('/admin/login?error=no-admin')
          return
        }
        setLoading(false)
      } catch (err) {
        console.error('Failed to verify admin token', err)
        router.replace('/admin/login')
      }
    })

    return () => unsub()
  }, [router])

  return { loading }
}
