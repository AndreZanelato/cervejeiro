import { adminAuth, adminDb } from '../../../lib/firebaseAdmin'

export default async function handler (req, res) {
  if (req.method !== 'POST') return res.status(405).end()
  const authHeader = req.headers.authorization || ''
  const token = authHeader.split(' ')[1]
  if (!token) return res.status(401).json({ error: 'missing token' })

  try {
    const decoded = await adminAuth.verifyIdToken(token)
    const uid = decoded.uid

    const snaps = await adminDb.collection('notifications').where('userId', '==', uid).where('read', '==', false).get()
    const batch = adminDb.batch()
    snaps.forEach(doc => batch.update(doc.ref, { read: true, readAt: adminDb.FieldValue ? adminDb.FieldValue.serverTimestamp() : new Date() }))
    await batch.commit()
    return res.status(200).json({ ok: true, count: snaps.size })
  } catch (err) {
    console.error(err)
    return res.status(401).json({ error: 'invalid token or server error' })
  }
}
