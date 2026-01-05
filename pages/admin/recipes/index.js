import useRequireAdmin from '../../../lib/useRequireAdmin'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { listRecipes, deleteRecipe } from '../../../lib/adminApi'

export default function RecipesList () {
  const { loading } = useRequireAdmin()
  const [recipes, setRecipes] = useState([])
  const [status, setStatus] = useState(null)

  useEffect(() => {
    if (loading) return
    async function load () {
      const res = await listRecipes()
      if (res && res.recipes) setRecipes(res.recipes)
    }
    load()
  }, [loading])

  async function handleDelete (id) {
    if (!confirm('Confirma exclusão da receita?')) return
    const res = await deleteRecipe(id)
    if (res && res.ok) setRecipes(recipes.filter(r => r.id !== id))
    else alert('Erro ao deletar')
  }

  if (loading) return <div className="p-8">Verificando permissão...</div>

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Receitas (Admin)</h1>
      <div className="mb-4">
        <Link href="/admin/recipes/new"><a className="bg-blue-600 text-white px-3 py-1 rounded">Criar nova</a></Link>
      </div>
      {recipes.length === 0 && <div>Nenhuma receita</div>}
      <ul>
        {recipes.map(r => (
          <li key={r.id} className="mb-3">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold">{r.title}</h2>
                <p className="text-sm text-gray-600">{r.description}</p>
              </div>
              <div className="space-x-2">
                <Link href={`/admin/recipes/${r.id}/edit`}><a className="text-blue-600">Editar</a></Link>
                <button className="text-red-600 ml-2" onClick={() => handleDelete(r.id)}>Excluir</button>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}
