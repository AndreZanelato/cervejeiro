import { useEffect, useState } from 'react'
import { onSnapshot, query, collection, where, orderBy, limit } from 'firebase/firestore'
import { db } from '../lib/firebaseClient'
import { onAuthStateChanged } from 'firebase/auth'
import { auth } from '../lib/firebaseClient'

export default function Notifications () {
  const [notifs, setNotifs] = useState([])
  const [open, setOpen] = useState(false)

  useEffect(() => {
    let unsubAuth = onAuthStateChanged(auth, user => {
      if (!user) {
        setNotifs([])
        return
      }
      const q = query(collection(db, 'notifications'), where('userId', '==', user.uid), orderBy('createdAt', 'desc'), limit(10))
      const unsub = onSnapshot(q, snap => {
        setNotifs(snap.docs.map(d => ({ id: d.id, ...d.data() })))
      })
      // replace unsubAuth to cleanup both
      unsubAuth = () => { unsub(); }
    })
    return () => unsubAuth && unsubAuth()
  }, [])

  const unread = notifs.filter(n => !n.read).length

  async function handleMarkRead (id) {
    try {
      await fetch(`/api/notifications/${id}/mark-read`, { method: 'POST', headers: { Authorization: `Bearer ${await auth.currentUser?.getIdToken()}` } })
    } catch (err) {
      console.error('failed mark read', err)
    }
  }

  async function handleMarkAll () {
    try {
      await fetch('/api/notifications/mark-all-read', { method: 'POST', headers: { Authorization: `Bearer ${await auth.currentUser?.getIdToken()}` } })
    } catch (err) {
      console.error('failed mark all', err)
    }
  }

  const [pushEnabled, setPushEnabled] = useState(false)

  async function handleEnablePush () {
    try {
      const { requestAndRegisterPush } = await import('../lib/fcm')
      const r = await requestAndRegisterPush()
      if (r.ok) setPushEnabled(true)
      else alert('Falha ao ativar push: ' + (r.error || 'unknown'))
    } catch (err) {
      console.error(err)
      alert('Falha ao ativar push')
    }
  }

  return (
    <div style={{ position: 'fixed', right: 20, top: 20, zIndex: 50 }}>
      <button onClick={() => setOpen(!open)} className="p-2 bg-gray-100 rounded">
        🔔 {unread > 0 && <span className="ml-2 text-sm">{unread}</span>}
      </button>
      {open && (
        <div className="mt-2 w-80 bg-white shadow rounded p-3">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-semibold">Notificações</h3>
            <button className="text-xs text-blue-600" onClick={handleMarkAll}>Marcar todas</button>
          </div>
          {!pushEnabled && typeof Notification !== 'undefined' && Notification.permission !== 'granted' && (
            <div className="mb-2">
              <button className="bg-green-600 text-white px-3 py-1 rounded text-sm" onClick={handleEnablePush}>Ativar push</button>
            </div>
          )}
          {notifs.length === 0 && <div>Nenhuma notificação</div>}
          <ul>
            {notifs.map(n => (
              <li key={n.id} className="mb-2 border-b pb-1">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="text-sm font-medium">{n.title}</div>
                    <div className="text-xs text-gray-600">{n.body}</div>
                  </div>
                  <div className="ml-2">
                    {!n.read && <button className="text-xs text-blue-600" onClick={() => handleMarkRead(n.id)}>Marcar lida</button>}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
