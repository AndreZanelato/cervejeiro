import { adminAuth, adminDb } from '../../../../lib/firebaseAdmin'

export default async function handler (req, res) {
  const authHeader = req.headers.authorization || ''
  const token = authHeader.split(' ')[1]
  if (!token) return res.status(401).json({ error: 'missing token' })

  try {
    const decoded = await adminAuth.verifyIdToken(token)
    if (decoded.role !== 'admin') return res.status(403).json({ error: 'not admin' })

    const { id } = req.query
    const ref = adminDb.collection('recipes').doc(id)

    if (req.method === 'GET') {
      const doc = await ref.get()
      if (!doc.exists) return res.status(404).json({ error: 'not found' })
      return res.status(200).json({ id: doc.id, ...doc.data() })
    }

    if (req.method === 'PUT') {
      const data = req.body
      await ref.update({ ...data, updatedAt: adminDb.FieldValue ? adminDb.FieldValue.serverTimestamp() : new Date() })
      return res.status(200).json({ ok: true })
    }

    if (req.method === 'DELETE') {
      await ref.delete()
      return res.status(200).json({ ok: true })
    }

    return res.status(405).end()
  } catch (err) {
    console.error(err)
    return res.status(401).json({ error: 'invalid token or server error' })
  }
}
