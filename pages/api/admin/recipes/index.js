import { adminAuth, adminDb } from '../../../../lib/firebaseAdmin'

export default async function handler (req, res) {
  const authHeader = req.headers.authorization || ''
  const token = authHeader.split(' ')[1]
  if (!token) return res.status(401).json({ error: 'missing token' })

  try {
    const decoded = await adminAuth.verifyIdToken(token)
    if (decoded.role !== 'admin') return res.status(403).json({ error: 'not admin' })

    if (req.method === 'GET') {
      const snaps = await adminDb.collection('recipes').orderBy('createdAt', 'desc').get()
      const recipes = snaps.docs.map(d => ({ id: d.id, ...d.data() }))
      return res.status(200).json({ recipes })
    }

    if (req.method === 'POST') {
      const { title, description, ingredients = [], steps = [], visibility = 'public' } = req.body
      if (!title) return res.status(400).json({ error: 'missing title' })
      const docRef = await adminDb.collection('recipes').add({
        title,
        description: description || '',
        ingredients,
        steps,
        visibility,
        authorId: decoded.uid,
        createdAt: adminDb.FieldValue ? adminDb.FieldValue.serverTimestamp() : new Date(),
      })
      return res.status(201).json({ id: docRef.id })
    }

    return res.status(405).end()
  } catch (err) {
    console.error(err)
    return res.status(401).json({ error: 'invalid token or server error' })
  }
}
