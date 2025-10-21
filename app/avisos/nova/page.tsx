'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createSupabaseClient, getCurrentUser, getCondominioAtivo } from '@/lib/supabase'

export default function NovoAvisoPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [titulo, setTitulo] = useState('')
  const [conteudo, setConteudo] = useState('')
  const [tipo, setTipo] = useState('geral')
  const [prioridade, setPrioridade] = useState('media')
  const [fixado, setFixado] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const user = await getCurrentUser()
      if (!user) return

      const condominio = await getCondominioAtivo(user.id)
      if (!condominio) {
        alert('Condomínio não encontrado')
        return
      }

      const supabase = createSupabaseClient()
      const { error } = await supabase
        .from('avisos')
        .insert({
          condominio_id: condominio.id,
          titulo,
          conteudo,
          tipo,
          prioridade,
          fixado,
          visivel: true,
          criado_por: user.id
        })

      if (error) throw error

      alert('✅ Aviso publicado!')
      router.push('/avisos')
    } catch (error: any) {
      alert('❌ Erro: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">📢 Novo Aviso</h1>
        
        <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-6 space-y-4">
          <input
            type="text"
            placeholder="Título *"
            value={titulo}
            onChange={(e) => setTitulo(e.target.value)}
            required
            className="w-full px-4 py-2 border rounded-lg"
          />
          
          <textarea
            placeholder="Conteúdo *"
            value={conteudo}
            onChange={(e) => setConteudo(e.target.value)}
            required
            rows={6}
            className="w-full px-4 py-2 border rounded-lg"
          />

          <select
            value={tipo}
            onChange={(e) => setTipo(e.target.value)}
            className="w-full px-4 py-2 border rounded-lg"
          >
            <option value="geral">Geral</option>
            <option value="manutencao">Manutenção</option>
            <option value="evento">Evento</option>
            <option value="assembleia">Assembleia</option>
          </select>

          <select
            value={prioridade}
            onChange={(e) => setPrioridade(e.target.value)}
            className="w-full px-4 py-2 border rounded-lg"
          >
            <option value="baixa">🟢 Baixa</option>
            <option value="media">🟡 Média</option>
            <option value="alta">🔴 Alta</option>
          </select>

          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={fixado}
              onChange={(e) => setFixado(e.target.checked)}
            />
            <span>📌 Fixar no topo</span>
          </label>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700"
          >
            {loading ? 'Publicando...' : 'Publicar Aviso'}
          </button>
        </form>
      </div>
    </div>
  )
}