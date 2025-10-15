'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createSupabaseClient, getCurrentUser, getCondominioAtivo } from '@/lib/supabase'
import Link from 'next/link'

interface Aviso {
  id: string
  titulo: string
  conteudo: string
  tipo: string
  prioridade: string
  fixado: boolean
  visivel: boolean
  created_at: string
}

export default function AvisosPage() {
  const router = useRouter()
  const [avisos, setAvisos] = useState<Aviso[]>([])
  const [filtro, setFiltro] = useState<string>('todos')
  const [busca, setBusca] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    carregarAvisos()
  }, [])

  async function carregarAvisos() {
    try {
      const user = await getCurrentUser()
      if (!user) {
        router.push('/login')
        return
      }

      const vinculo = await getCondominioAtivo(user.id)
      if (!vinculo) {
        alert('Nenhum condomínio encontrado')
        return
      }

      const supabase = createSupabaseClient()

      let query = supabase
        .from('avisos')
        .select('*')
        .eq('condominio_id', vinculo.condominio_id)
        .eq('visivel', true)
        .order('fixado', { ascending: false })
        .order('created_at', { ascending: false })

      if (filtro !== 'todos') {
        query = query.eq('tipo', filtro)
      }

      const { data, error } = await query

      if (error) {
        console.error('Erro ao carregar avisos:', error)
        return
      }

      setAvisos(data || [])
    } catch (error) {
      console.error('Erro:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    carregarAvisos()
  }, [filtro])

  const avisosFiltrados = avisos.filter(a =>
    a.titulo.toLowerCase().includes(busca.toLowerCase()) ||
    a.conteudo.toLowerCase().includes(busca.toLowerCase())
  )

  const getTipoIcon = (tipo: string) => {
    switch (tipo) {
      case 'manutencao': return '🔧'
      case 'evento': return '🎉'
      case 'assembleia': return '👥'
      case 'cobranca': return '💰'
      case 'regulamento': return '📋'
      case 'seguranca': return '🚨'
      default: return '📢'
    }
  }

  const getPrioridadeColor = (prioridade: string) => {
    switch (prioridade) {
      case 'alta': return 'border-l-red-500 bg-red-50'
      case 'media': return 'border-l-yellow-500 bg-yellow-50'
      case 'baixa': return 'border-l-green-500 bg-green-50'
      default: return 'border-l-blue-500 bg-blue-50'
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Carregando avisos...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div>
              <Link href="/dashboard" className="text-blue-600 hover:text-blue-700 text-sm mb-2 inline-block">
                ← Voltar ao Dashboard
              </Link>
              <h1 className="text-2xl font-bold text-gray-900">
                📢 Quadro de Avisos
              </h1>
              <p className="text-sm text-gray-600">
                Fique informado sobre o condomínio
              </p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Filtros */}
        <div className="bg-white rounded-lg shadow p-4 mb-6">
          <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
            <button
              onClick={() => setFiltro('todos')}
              className={`px-4 py-2 rounded-lg whitespace-nowrap transition ${
                filtro === 'todos'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Todos
            </button>
            <button
              onClick={() => setFiltro('manutencao')}
              className={`px-4 py-2 rounded-lg whitespace-nowrap transition ${
                filtro === 'manutencao'
                  ? 'bg-orange-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              🔧 Manutenção
            </button>
            <button
              onClick={() => setFiltro('evento')}
              className={`px-4 py-2 rounded-lg whitespace-nowrap transition ${
                filtro === 'evento'
                  ? 'bg-green-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              🎉 Eventos
            </button>
            <button
              onClick={() => setFiltro('assembleia')}
              className={`px-4 py-2 rounded-lg whitespace-nowrap transition ${
                filtro === 'assembleia'
                  ? 'bg-purple-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              👥 Assembleias
            </button>
          </div>

          <div className="relative">
            <input
              type="text"
              placeholder="Buscar aviso..."
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              className="w-full px-4 py-2 pl-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <span className="absolute left-3 top-2.5 text-gray-400">🔍</span>
          </div>
        </div>

        {/* Lista de Avisos */}
        {avisosFiltrados.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <div className="text-6xl mb-4">📢</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              {busca ? 'Nenhum aviso encontrado' : 'Nenhum aviso disponível'}
            </h3>
            <p className="text-gray-600">
              {busca ? 'Tente buscar com outros termos' : 'Ainda não há avisos publicados'}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {avisosFiltrados.map((aviso) => (
              <Link
                key={aviso.id}
                href={`/avisos/${aviso.id}`}
                className={`block bg-white rounded-lg shadow hover:shadow-lg transition p-6 border-l-4 ${getPrioridadeColor(aviso.prioridade)}`}
              >
                <div className="flex items-start gap-4">
                  <div className="text-3xl">{getTipoIcon(aviso.tipo)}</div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="text-xl font-semibold text-gray-900">
                        {aviso.titulo}
                      </h3>
                      {aviso.fixado && (
                        <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">
                          📌 Fixado
                        </span>
                      )}
                    </div>
                    <p className="text-gray-600 line-clamp-2 mb-3">
                      {aviso.conteudo}
                    </p>
                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      <span>
                        {new Date(aviso.created_at).toLocaleDateString('pt-BR')}
                      </span>
                      <span className="capitalize">
                        {aviso.tipo.replace('_', ' ')}
                      </span>
                      <span className="capitalize">
                        Prioridade: {aviso.prioridade}
                      </span>
                    </div>
                  </div>
                  <div className="text-blue-600 font-medium text-sm">
                    Ver detalhes →
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}