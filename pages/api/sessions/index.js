import { adminAuth, adminDb } from '../../../../lib/firebaseAdmin'

export default async function handler (req, res) {
  const authHeader = req.headers.authorization || ''
  const token = authHeader.split(' ')[1]
  if (!token) return res.status(401).json({ error: 'missing token' })

  try {
    const decoded = await adminAuth.verifyIdToken(token)
    const uid = decoded.uid

    if (req.method === 'GET') {
      // list sessions for user, or all if admin
      if (decoded.role === 'admin') {
        const snaps = await adminDb.collection('brewSessions').orderBy('createdAt', 'desc').get()
        const sessions = snaps.docs.map(d => ({ id: d.id, ...d.data() }))
        return res.status(200).json({ sessions })
      }
      const snaps = await adminDb.collection('brewSessions').where('userId', '==', uid).orderBy('createdAt', 'desc').get()
      const sessions = snaps.docs.map(d => ({ id: d.id, ...d.data() }))
      return res.status(200).json({ sessions })
    }

    if (req.method === 'POST') {
      const { recipeId, startAt, steps = [] } = req.body
      if (!recipeId) return res.status(400).json({ error: 'missing recipeId' })
      const docRef = await adminDb.collection('brewSessions').add({
        userId: uid,
        recipeId,
        status: 'planned',
        startAt: startAt ? new Date(startAt) : null,
        steps,
        notificationsSent: [],
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
