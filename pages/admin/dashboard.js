import { useEffect, useState } from 'react'
import { collection, getDocs, query, orderBy } from 'firebase/firestore'
import { db } from '../../lib/firebaseClient'

import useRequireAdmin from '../../lib/useRequireAdmin'
import { useEffect, useState } from 'react'
import { collection, getDocs, query, orderBy } from 'firebase/firestore'
import { db } from '../../lib/firebaseClient'
import { createRecipe } from '../../lib/adminApi'

export default function Dashboard() {
  const { loading } = useRequireAdmin()
  const [recipes, setRecipes] = useState([])
  const [status, setStatus] = useState(null)

  useEffect(() => {
    if (loading) return
    async function load () {
      const q = query(collection(db, 'recipes'), orderBy('createdAt', 'desc'))
      const snaps = await getDocs(q)
      setRecipes(snaps.docs.map(d => ({ id: d.id, ...d.data() })))
    }
    load()
  }, [loading])

  async function handleCreateTest () {
    setStatus('creating')
    const res = await createRecipe({ title: 'Teste protegido', description: 'Criada via endpoint protegido' })
    if (res && res.id) {
      setStatus('created: ' + res.id)
    } else {
      setStatus('error: ' + (res.error || 'unknown'))
    }
  }

  if (loading) return <div className="p-8">Verificando permissão...</div>

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Admin Dashboard</h1>
      <p className="mb-6">Aqui você vai gerenciar receitas (CRUD) — função admin necessária.</p>
      <button className="bg-green-600 text-white px-3 py-1 rounded mb-4" onClick={handleCreateTest}>Criar receita de teste</button>
      {status && <div className="mb-4">{status}</div>}
      <ul>
        {recipes.map(r => (
          <li key={r.id} className="mb-3">
            <h2 className="text-lg font-semibold">{r.title}</h2>
            <p className="text-sm text-gray-600">{r.description}</p>
          </li>
        ))}
      </ul>
    </div>
  )
}
