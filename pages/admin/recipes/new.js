import useRequireAdmin from '../../../lib/useRequireAdmin'
import { useState } from 'react'
import { useRouter } from 'next/router'
import { createRecipe } from '../../../lib/adminApi'

export default function NewRecipe () {
  const { loading } = useRequireAdmin()
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [status, setStatus] = useState(null)
  const router = useRouter()

  if (loading) return <div className="p-8">Verificando permissão...</div>

  async function handleSubmit (e) {
    e.preventDefault()
    setStatus('creating')
    const res = await createRecipe({ title, description })
    if (res && res.id) {
      setStatus('created')
      router.push('/admin/recipes')
    } else {
      setStatus('error')
    }
  }

  return (
    <div className="p-8 max-w-lg">
      <h1 className="text-2xl font-bold mb-4">Criar receita</h1>
      <form onSubmit={handleSubmit} className="space-y-3">
        <input className="w-full p-2 border" placeholder="Título" value={title} onChange={e => setTitle(e.target.value)} />
        <textarea className="w-full p-2 border" placeholder="Descrição" value={description} onChange={e => setDescription(e.target.value)} />
        <div>
          <button className="bg-blue-600 text-white px-4 py-2 rounded">Criar</button>
          {status && <span className="ml-3">{status}</span>}
        </div>
      </form>
    </div>
  )
}
