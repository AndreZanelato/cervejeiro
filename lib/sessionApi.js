import { auth } from './firebaseClient'

async function getIdToken () {
  if (!auth.currentUser) return null
  return await auth.currentUser.getIdToken()
}

export async function listSessions () {
  const token = await getIdToken()
  const res = await fetch('/api/sessions', { headers: { Authorization: `Bearer ${token}` } })
  return res.json()
}

export async function createSession (payload) {
  const token = await getIdToken()
  const res = await fetch('/api/sessions', {
    method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify(payload)
  })
  return res.json()
}

export async function addLog (sessionId, payload) {
  const token = await getIdToken()
  const res = await fetch(`/api/sessions/${sessionId}/logs`, {
    method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify(payload)
  })
  return res.json()
}
