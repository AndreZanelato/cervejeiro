import { adminAuth, adminDb } from '../../../../../lib/firebaseAdmin'

export default async function handler (req, res) {
  const authHeader = req.headers.authorization || ''
  const token = authHeader.split(' ')[1]
  if (!token) return res.status(401).json({ error: 'missing token' })

  try {
    const decoded = await adminAuth.verifyIdToken(token)
    const uid = decoded.uid
    const { id } = req.query
    const ref = adminDb.collection('brewSessions').doc(id)
    const doc = await ref.get()
    if (!doc.exists) return res.status(404).json({ error: 'not found' })
    const data = doc.data()
    if (data.userId !== uid && decoded.role !== 'admin') return res.status(403).json({ error: 'forbidden' })

    if (req.method === 'POST') {
      const { stepId, temp } = req.body
      if (!stepId || typeof temp !== 'number') return res.status(400).json({ error: 'missing fields' })
      const log = { stepId, temp, ts: new Date().toISOString() }
      await ref.update({ logs: adminDb.FieldValue ? adminDb.FieldValue.arrayUnion(log) : adminDb.FieldValue })
      return res.status(201).json({ ok: true, log })
    }

    return res.status(405).end()
  } catch (err) {
    console.error(err)
    return res.status(401).json({ error: 'invalid token or server error' })
  }
}
