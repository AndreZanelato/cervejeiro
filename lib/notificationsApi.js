import { auth } from './firebaseClient'

async function getIdToken () {
  if (!auth.currentUser) return null
  return await auth.currentUser.getIdToken()
}

export async function markNotificationRead (id) {
  const token = await getIdToken()
  const res = await fetch(`/api/notifications/${id}/mark-read`, { method: 'POST', headers: { Authorization: `Bearer ${token}` } })
  return res.json()
}

export async function markAllNotificationsRead () {
  const token = await getIdToken()
  const res = await fetch('/api/notifications/mark-all-read', { method: 'POST', headers: { Authorization: `Bearer ${token}` } })
  return res.json()
}
