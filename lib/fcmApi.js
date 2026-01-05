import { auth } from './firebaseClient'

async function getIdToken () {
  if (!auth.currentUser) return null
  return await auth.currentUser.getIdToken()
}

export async function saveTokenToServer (token, idToken) {
  const t = idToken || await getIdToken()
  return fetch('/api/fcm/register', {
    method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${t}` }, body: JSON.stringify({ token })
  })
}

export async function removeTokenFromServer (token, idToken) {
  const t = idToken || await getIdToken()
  return fetch('/api/fcm/unregister', {
    method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${t}` }, body: JSON.stringify({ token })
  })
}