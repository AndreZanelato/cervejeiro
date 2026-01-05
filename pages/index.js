import Head from 'next/head'
import { useEffect, useState } from 'react'
import { collection, getDocs, query, orderBy } from 'firebase/firestore'
import { db } from '../lib/firebaseClient'

export default function Home() {
  const [recipes, setRecipes] = useState([])

  useEffect(() => {
    async function load() {
      const q = query(collection(db, 'recipes'), orderBy('createdAt', 'desc'))
      const snaps = await getDocs(q)
      setRecipes(snaps.docs.map(d => ({ id: d.id, ...d.data() })))
    }
    load()
  }, [])

  // minimal client-side search
  const [q, setQ] = useState('')
  const filtered = recipes.filter(r => r.title.toLowerCase().includes(q.toLowerCase()))

  return (
    <div className="p-8">
      <Head>
        <title>Cervejeiro</title>
      </Head>
      <h1 className="text-2xl font-bold mb-4">Receitas</h1>
      <div className="mb-4">
        <input placeholder="Buscar" className="p-2 border w-full" value={q} onChange={e => setQ(e.target.value)} />
      </div>
      <ul>
        {filtered.map(r => (
          <li key={r.id} className="mb-3">
            <h2 className="text-lg font-semibold">{r.title}</h2>
            <p className="text-sm text-gray-600">{r.description}</p>
          </li>
        ))}
      </ul>
    </div>
  )
}
