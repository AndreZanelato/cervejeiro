import { useEffect, useState } from 'react'
import { listSessions, createSession } from '../../lib/sessionApi'
import { collection, getDocs, orderBy, query } from 'firebase/firestore'
import { db } from '../../lib/firebaseClient'

export default function SessionsPage () {
  const [sessions, setSessions] = useState([])
  const [recipes, setRecipes] = useState([])
  const [selectedRecipe, setSelectedRecipe] = useState('')
  const [status, setStatus] = useState(null)

  useEffect(() => {
    async function load () {
      const r = await listSessions()
      if (r && r.sessions) setSessions(r.sessions)

      const q = query(collection(db, 'recipes'), orderBy('createdAt', 'desc'))
      const snaps = await getDocs(q)
      setRecipes(snaps.docs.map(d => ({ id: d.id, ...d.data() })))
    }
    load()
  }, [])

  async function handleCreate () {
    if (!selectedRecipe) return alert('Escolha uma receita')
    setStatus('creating')
    const res = await createSession({ recipeId: selectedRecipe })
    if (res && res.id) {
      setStatus('created')
      setSessions([{ id: res.id, recipeId: selectedRecipe, status: 'planned' }, ...sessions])
    } else setStatus('error')
  }

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Minhas Sessions</h1>
      <div className="mb-4 max-w-md">
        <select className="w-full p-2 border mb-2" value={selectedRecipe} onChange={e => setSelectedRecipe(e.target.value)}>
          <option value="">-- selecione receita --</option>
          {recipes.map(r => <option value={r.id} key={r.id}>{r.title}</option>)}
        </select>
        <button className="bg-blue-600 text-white px-4 py-2 rounded" onClick={handleCreate}>Criar sessão</button>
        {status && <div className="mt-2">{status}</div>}
      </div>

      <h2 className="text-xl mb-2">Sessões</h2>
      {sessions.length === 0 && <div>Nenhuma sessão</div>}
      <ul>
        {sessions.map(s => (
          <li key={s.id} className="mb-3">
            <a href={`/sessions/${s.id}`} className="text-blue-600">{s.id} — {s.recipeId} — {s.status}</a>
          </li>
        ))}
      </ul>
    </div>
  )
}
