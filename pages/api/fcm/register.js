import { adminAuth, adminDb } from '../../../lib/firebaseAdmin'

export default async function handler (req, res) {
  if (req.method !== 'POST') return res.status(405).end()
  const authHeader = req.headers.authorization || ''
  const token = authHeader.split(' ')[1]
  if (!token) return res.status(401).json({ error: 'missing token' })

  try {
    const decoded = await adminAuth.verifyIdToken(token)
    const uid = decoded.uid
    const { token: fcmToken } = req.body
    if (!fcmToken) return res.status(400).json({ error: 'missing fcm token' })

    const ref = adminDb.collection('fcmTokens').doc(fcmToken)
    await ref.set({ token: fcmToken, userId: uid, createdAt: adminDb.FieldValue ? adminDb.FieldValue.serverTimestamp() : new Date() })
    return res.status(200).json({ ok: true })
  } catch (err) {
    console.error(err)
    return res.status(401).json({ error: 'invalid token or server error' })
  }
}
