import { getMessaging, getToken, onMessage } from 'firebase/messaging'
import { auth } from './firebaseClient'
import { saveTokenToServer, removeTokenFromServer } from './fcmApi'

export async function requestAndRegisterPush () {
  if (!('Notification' in window)) return { ok: false, error: 'no-notifications' }

  const permission = await Notification.requestPermission()
  if (permission !== 'granted') return { ok: false, error: 'denied' }

  // register service worker (served by pages/firebase-messaging-sw.js)
  const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js')
  const messaging = getMessaging()
  const vapidKey = process.env.NEXT_PUBLIC_FCM_VAPID_KEY || ''
  const token = await getToken(messaging, { vapidKey, serviceWorkerRegistration: registration })
  if (token) {
    const idToken = await auth.currentUser?.getIdToken()
    await saveTokenToServer(token, idToken)
    return { ok: true, token }
  }
  return { ok: false, error: 'no-token' }
}

export async function unregisterPush (token) {
  await removeTokenFromServer(token, await auth.currentUser?.getIdToken())
}

export function onForegroundMessage (callback) {
  const messaging = getMessaging()
  onMessage(messaging, payload => {
    callback(payload)
  })
}
