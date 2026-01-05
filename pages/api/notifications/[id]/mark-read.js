import { adminAuth, adminDb } from '../../../../lib/firebaseAdmin'

export default async function handler (req, res) {
  if (req.method !== 'POST') return res.status(405).end()
  const authHeader = req.headers.authorization || ''
  const token = authHeader.split(' ')[1]
  if (!token) return res.status(401).json({ error: 'missing token' })

  try {
    const decoded = await adminAuth.verifyIdToken(token)
    const uid = decoded.uid
    const { id } = req.query
    const ref = adminDb.collection('notifications').doc(id)
    const doc = await ref.get()
    if (!doc.exists) return res.status(404).json({ error: 'not found' })
    const data = doc.data()
    if (data.userId !== uid && decoded.role !== 'admin') return res.status(403).json({ error: 'forbidden' })

    await ref.update({ read: true, readAt: adminDb.FieldValue ? adminDb.FieldValue.serverTimestamp() : new Date() })
    return res.status(200).json({ ok: true })
  } catch (err) {
    console.error(err)
    return res.status(401).json({ error: 'invalid token or server error' })
  }
}
