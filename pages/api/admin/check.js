import { adminAuth } from '../../../lib/firebaseAdmin'

export default async function handler (req, res) {
  const authHeader = req.headers.authorization || ''
  const token = authHeader.split(' ')[1]
  if (!token) return res.status(401).json({ error: 'missing token' })
  try {
    const decoded = await adminAuth.verifyIdToken(token)
    if (decoded.role === 'admin') return res.status(200).json({ ok: true, uid: decoded.uid })
    return res.status(403).json({ error: 'not admin' })
  } catch (err) {
    console.error(err)
    return res.status(401).json({ error: 'invalid token' })
  }
}
