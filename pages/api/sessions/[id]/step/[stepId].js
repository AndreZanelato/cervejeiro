import nodemailer from 'nodemailer'
import admin, { adminAuth, adminDb } from '../../../../../lib/firebaseAdmin'

export default async function handler (req, res) {
  const authHeader = req.headers.authorization || ''
  const token = authHeader.split(' ')[1]
  if (!token) return res.status(401).json({ error: 'missing token' })

  try {
    const decoded = await adminAuth.verifyIdToken(token)
    const uid = decoded.uid
    const { id, stepId } = req.query
    const ref = adminDb.collection('brewSessions').doc(id)
    const doc = await ref.get()
    if (!doc.exists) return res.status(404).json({ error: 'not found' })
    const data = doc.data()
    if (data.userId !== uid && decoded.role !== 'admin') return res.status(403).json({ error: 'forbidden' })

    if (req.method === 'POST') {
      const { action, note } = req.body
      if (!action) return res.status(400).json({ error: 'missing action' })

      const steps = data.steps || []
      const stepIndex = steps.findIndex(s => s.id === stepId)
      if (stepIndex === -1) return res.status(404).json({ error: 'step not found' })

      // mutate local copy
      const nowIso = new Date().toISOString()
      if (action === 'start') {
        steps[stepIndex].status = 'in_progress'
        steps[stepIndex].startedAt = nowIso
      } else if (action === 'complete') {
        steps[stepIndex].status = 'completed'
        steps[stepIndex].endedAt = nowIso
      } else {
        return res.status(400).json({ error: 'invalid action' })
      }

      // update session doc
      await ref.update({ steps, updatedAt: adminDb.FieldValue ? adminDb.FieldValue.serverTimestamp() : new Date() })

      // create a notification (admin SDK bypasses rules)
      const notif = {
        userId: data.userId,
        title: `Etapa ${action === 'start' ? 'iniciada' : 'concluída'}: ${steps[stepIndex].title || stepId}`,
        body: note || (action === 'start' ? 'A etapa foi iniciada.' : 'A etapa foi concluída.'),
        type: 'in-app',
        data: { sessionId: id, stepId, action },
        read: false,
        createdAt: adminDb.FieldValue ? adminDb.FieldValue.serverTimestamp() : new Date(),
      }

      await adminDb.collection('notifications').add(notif)

      // send email notification to the user (if email available) and log result
      try {
        const userRecord = await adminAuth.getUser(data.userId)
        const userEmail = userRecord.email
        let emailSent = false
        if (userEmail) {
          const transporter = nodemailer.createTransport({
            host: process.env.SMTP_HOST,
            port: Number(process.env.SMTP_PORT || 587),
            secure: false,
            auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
          })

          try {
            await transporter.sendMail({
              from: process.env.SMTP_FROM,
              to: userEmail,
              subject: `Cervejeiro — Etapa ${action === 'start' ? 'iniciada' : 'concluída'}`,
              text: `${notif.title}\n\n${notif.body}`,
            })
            emailSent = true
          } catch (err) {
            console.error('Failed to send email notification', err)
            emailSent = false
          }

          // log email send result on session
          try {
            await ref.update({ notificationsSent: admin.firestore.FieldValue.arrayUnion({ type: 'email', ts: admin.firestore.FieldValue.serverTimestamp(), target: userEmail, delivered: emailSent }) })
          } catch (err) {
            console.error('Failed to log email send', err)
          }
        }
      } catch (err) {
        console.error('Failed to lookup user for email', err)
      }

      // push via FCM (if any tokens registered) with cleanup of invalid tokens and logging
      try {
        const snaps = await adminDb.collection('fcmTokens').where('userId', '==', data.userId).get()
        const tokens = snaps.docs.map(d => d.id)
        if (tokens.length > 0) {
          const payload = {
            notification: {
              title: notif.title,
              body: notif.body,
            },
            data: { sessionId: id, stepId, action }
          }

          const resFCM = await admin.messaging().sendToDevice(tokens, payload)

          const failed = []
          // resFCM.results corresponds to tokens order
          resFCM.results.forEach((r, idx) => {
            if (r.error) {
              const t = tokens[idx]
              failed.push({ token: t, code: r.error.code, message: r.error.message })
              // Remove token doc if not registered / invalid
              if (r.error.code === 'messaging/registration-token-not-registered' || r.error.code === 'messaging/invalid-registration-token') {
                adminDb.collection('fcmTokens').doc(t).delete().catch(() => {})
              }
            }
          })

          // log fcm result on session
          try {
            await ref.update({ notificationsSent: admin.firestore.FieldValue.arrayUnion({ type: 'fcm', ts: admin.firestore.FieldValue.serverTimestamp(), successCount: resFCM.successCount || 0, total: tokens.length, failed }) })
          } catch (err) {
            console.error('Failed to log fcm send', err)
          }

          console.log('FCM send result:', resFCM.successCount, 'success,', failed.length, 'failures')
        }
      } catch (err) {
        console.error('Failed to send FCM push', err)
      }

      return res.status(200).json({ ok: true, step: steps[stepIndex] })
    }

    return res.status(405).end()
  } catch (err) {
    console.error(err)
    return res.status(401).json({ error: 'invalid token or server error' })
  }
}
