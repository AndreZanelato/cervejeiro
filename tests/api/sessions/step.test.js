import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mocks
const sendMailMock = vi.fn().mockResolvedValue(true)
vi.mock('nodemailer', () => ({ createTransport: () => ({ sendMail: sendMailMock }) }))

let verifyIdTokenMock
let adminDbMock
let messagingSendMock

vi.mock('../../../lib/firebaseAdmin', () => {
  verifyIdTokenMock = vi.fn()

  // placeholders that will be replaced in tests
  adminDbMock = {
    FieldValue: {
      serverTimestamp: () => 'TS',
      arrayUnion: (v) => v,
    },
    collection: vi.fn(() => ({ /* overridden in tests */ }))
  }

  messagingSendMock = vi.fn()
  const adminDefault = {
    messaging: () => ({ sendToDevice: messagingSendMock }),
    firestore: { FieldValue: adminDbMock.FieldValue }
  }

  return { adminAuth: { verifyIdToken: verifyIdTokenMock }, adminDb: adminDbMock, default: adminDefault }
})

const handlerModule = await import('../../../pages/api/sessions/[id]/step/[stepId].js')
const handler = handlerModule.default

function mockRes () {
  const res = {}
  res.status = vi.fn(() => res)
  res.json = vi.fn(() => res)
  res.end = vi.fn()
  return res
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe('POST /api/sessions/:id/step/:stepId', () => {
  it('start action should set step to in_progress and create notification', async () => {
    const sessionData = {
      userId: 'user1',
      steps: [{ id: 'mash-1', title: 'Mash', status: 'pending' }],
      logs: [],
      notificationsSent: []
    }

    // Setup adminDb collection behaviors
    const updateMock = vi.fn().mockResolvedValue(true)
    const getMock = vi.fn().mockResolvedValue({ exists: true, data: () => sessionData })
    const addNotifMock = vi.fn().mockResolvedValue(true)
    const fcmWhereGet = vi.fn().mockResolvedValue({ docs: [] })

    // adminDb.collection should return different behaviors per collection name
    const collection = (name) => {
      if (name === 'brewSessions') return { doc: (id) => ({ get: getMock, update: updateMock }) }
      if (name === 'notifications') return { add: addNotifMock }
      if (name === 'fcmTokens') return { where: () => ({ get: fcmWhereGet }), doc: (t) => ({ delete: vi.fn() }) }
      return { }
    }

    // replace mock implementation
    const { adminDb } = await import('../../../lib/firebaseAdmin')
    adminDb.collection = collection

    // verify token
    const { adminAuth } = await import('../../../lib/firebaseAdmin')
    adminAuth.verifyIdToken = vi.fn().mockResolvedValue({ uid: 'user1', role: 'user' })

    const req = { method: 'POST', headers: { authorization: 'Bearer tok' }, query: { id: 'sess1', stepId: 'mash-1' }, body: { action: 'start' } }
    const res = mockRes()

    await handler(req, res)

    expect(updateMock).toHaveBeenCalled()
    expect(addNotifMock).toHaveBeenCalled()
    expect(res.status).toHaveBeenCalledWith(200)
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ ok: true }))
  })

  it('complete action should send FCM, remove invalid tokens and log notificationsSent', async () => {
    const sessionData = {
      userId: 'user1',
      steps: [{ id: 'mash-1', title: 'Mash', status: 'in_progress' }],
      logs: [],
      notificationsSent: []
    }

    const updateMock = vi.fn().mockResolvedValue(true)
    const getMock = vi.fn().mockResolvedValue({ exists: true, data: () => sessionData })
    const addNotifMock = vi.fn().mockResolvedValue(true)

    // fcm tokens present
    const fcmDocs = [{ id: 't1' }, { id: 't2' }]

    const deleteMock = vi.fn().mockResolvedValue(true)
    const collection = (name) => {
      if (name === 'brewSessions') return { doc: (id) => ({ get: getMock, update: updateMock }) }
      if (name === 'notifications') return { add: addNotifMock }
      if (name === 'fcmTokens') return { where: () => ({ get: async () => ({ docs: fcmDocs }) }), doc: (t) => ({ delete: deleteMock }) }
      return { }
    }

    const { adminDb } = await import('../../../lib/firebaseAdmin')
    adminDb.collection = collection

    const { adminAuth, default: adminDefault } = await import('../../../lib/firebaseAdmin')
    adminAuth.verifyIdToken = vi.fn().mockResolvedValue({ uid: 'user1', role: 'user' })

    // mock messaging sendToDevice - second token fails with registration-token-not-registered
    const result = { successCount: 1, results: [{}, { error: { code: 'messaging/registration-token-not-registered', message: 'not registered' } }] }
    adminDefault.messaging = () => ({ sendToDevice: vi.fn().mockResolvedValue(result) })

    const req = { method: 'POST', headers: { authorization: 'Bearer tok' }, query: { id: 'sess1', stepId: 'mash-1' }, body: { action: 'complete' } }
    const res = mockRes()

    await handler(req, res)

    // expect FCM deletion attempted for t2
    expect(deleteMock).toHaveBeenCalled()
    // notificationsSent was logged via update calls (at least once)
    expect(updateMock).toHaveBeenCalled()
    expect(addNotifMock).toHaveBeenCalled()
    expect(res.status).toHaveBeenCalledWith(200)
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ ok: true }))
  })
})
