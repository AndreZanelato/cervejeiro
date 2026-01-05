import useRequireAdmin from '../../../../lib/useRequireAdmin'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import { getRecipe, updateRecipe } from '../../../../lib/adminApi'

export default function EditRecipe () {
  const { loading } = useRequireAdmin()
  const router = useRouter()
  const { id } = router.query
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [status, setStatus] = useState(null)

  useEffect(() => {
    if (loading || !id) return
    async function load () {
      const res = await getRecipe(id)
      if (res && res.id) {
        setTitle(res.title || '')
        setDescription(res.description || '')
      }
    }
    load()
  }, [loading, id])

  if (loading) return <div className="p-8">Verificando permissão...</div>

  async function handleSubmit (e) {
    e.preventDefault()
    setStatus('saving')
    const res = await updateRecipe(id, { title, description })
    if (res && res.ok) {
      setStatus('saved')
      router.push('/admin/recipes')
    } else {
      setStatus('error')
    }
  }

  return (
    <div className="p-8 max-w-lg">
      <h1 className="text-2xl font-bold mb-4">Editar receita</h1>
      <form onSubmit={handleSubmit} className="space-y-3">
        <input className="w-full p-2 border" placeholder="Título" value={title} onChange={e => setTitle(e.target.value)} />
        <textarea className="w-full p-2 border" placeholder="Descrição" value={description} onChange={e => setDescription(e.target.value)} />
        <div>
          <button className="bg-blue-600 text-white px-4 py-2 rounded">Salvar</button>
          {status && <span className="ml-3">{status}</span>}
        </div>
      </form>
    </div>
  )
}
