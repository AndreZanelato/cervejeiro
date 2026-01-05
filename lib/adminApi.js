import { auth } from './firebaseClient'

export async function getIdToken () {
  if (!auth.currentUser) return null
  return await auth.currentUser.getIdToken()
}

export async function checkAdmin () {
  const token = await getIdToken()
  const res = await fetch('/api/admin/check', {
    headers: { Authorization: `Bearer ${token}` },
  })
  return res.json()
}

export async function createRecipe (payload) {
  const token = await getIdToken()
  const res = await fetch('/api/admin/recipes', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify(payload),
  })
  return res.json()
}

export async function listRecipes () {
  const token = await getIdToken()
  const res = await fetch('/api/admin/recipes', {
    headers: { Authorization: `Bearer ${token}` },
  })
  return res.json()
}

export async function getRecipe (id) {
  const token = await getIdToken()
  const res = await fetch(`/api/admin/recipes/${id}`, {
    headers: { Authorization: `Bearer ${token}` },
  })
  return res.json()
}

export async function updateRecipe (id, payload) {
  const token = await getIdToken()
  const res = await fetch(`/api/admin/recipes/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify(payload),
  })
  return res.json()
}

export async function deleteRecipe (id) {
  const token = await getIdToken()
  const res = await fetch(`/api/admin/recipes/${id}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  })
  return res.json()
}
