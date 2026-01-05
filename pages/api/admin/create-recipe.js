import admin, { adminAuth, adminDb } from '../../../lib/firebaseAdmin'

export default async function handler (req, res) {
  if (req.method !== 'POST') return res.status(405).end()

  const authHeader = req.headers.authorization || ''
  const token = authHeader.split(' ')[1]
  if (!token) return res.status(401).json({ error: 'missing token' })

  try {
    const decoded = await adminAuth.verifyIdToken(token)
    if (decoded.role !== 'admin') return res.status(403).json({ error: 'not admin' })

    const { title, description } = req.body
    if (!title) return res.status(400).json({ error: 'missing title' })

    const docRef = await adminDb.collection('recipes').add({
      title,
      description: description || '',
      authorId: decoded.uid,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    })

    return res.status(201).json({ id: docRef.id })
  } catch (err) {
    console.error(err)
    return res.status(400).json({ error: 'invalid token or server error' })
  }
}
