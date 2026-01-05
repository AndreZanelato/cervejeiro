import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import { doc, onSnapshot } from 'firebase/firestore'
import { db } from '../../lib/firebaseClient'
import { addLog } from '../../lib/sessionApi'
import { auth } from '../../lib/firebaseClient'

export default function SessionDetail () {
  const router = useRouter()
  const { id } = router.query
  const [session, setSession] = useState(null)
  const [temp, setTemp] = useState('')
  const [status, setStatus] = useState(null)

  useEffect(() => {
    if (!id) return
    const ref = doc(db, 'brewSessions', id)
    const unsub = onSnapshot(ref, snap => {
      if (!snap.exists()) {
        setSession(null)
        return
      }
      setSession({ id: snap.id, ...snap.data() })
    })
    return () => unsub()
  }, [id])

  async function handleAddLog () {
    if (!temp) return
    setStatus('sending')
    const res = await addLog(id, { stepId: 'default', temp: Number(temp) })
    if (res && res.ok) {
      setStatus('sent')
      setTemp('')
    } else {
      setStatus('error')
    }
  }

  async function handleStepAction (stepId, action) {
    setStatus(action + '...')
    const token = await auth.currentUser?.getIdToken()
    const res = await fetch(`/api/sessions/${id}/step/${stepId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ action }),
    })
    const j = await res.json()
    if (res.ok) setStatus('ok')
    else setStatus('error: ' + (j.error || res.status))
  }

  if (!session) return <div className="p-8">Carregando sessão...</div>

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Sessão {session.id}</h1>
      <div className="mb-3">Receita: {session.recipeId}</div>
      <div className="mb-3">Status: {session.status}</div>

      <h2 className="text-lg">Logs gerais</h2>
      <ul>
        {(session.logs || []).map((l, idx) => (
          <li key={idx}>{l.ts} - {l.stepId} - {l.temp}°C</li>
        ))}
      </ul>

      <h2 className="text-lg mt-4">Etapas</h2>
      <ul>
        {(session.steps || []).map((s) => (
          <li key={s.id} className="mb-3">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium">{s.title || s.id}</div>
                <div className="text-sm text-gray-600">Status: {s.status || 'pending'}</div>
              </div>
              <div className="space-x-2">
                <button className="bg-yellow-500 text-white px-3 py-1 rounded" onClick={() => handleStepAction(s.id, 'start')}>Start</button>
                <button className="bg-green-600 text-white px-3 py-1 rounded" onClick={() => handleStepAction(s.id, 'complete')}>Complete</button>
              </div>
            </div>
          </li>
        ))}
      </ul>

      <div className="mt-6 max-w-sm">
        <input className="p-2 border w-full mb-2" placeholder="Temperatura" value={temp} onChange={e => setTemp(e.target.value)} />
        <button className="bg-blue-600 text-white px-3 py-1 rounded" onClick={handleAddLog}>Adicionar Log</button>
        {status && <div className="mt-2">{status}</div>}
      </div>
    </div>
  )
}
