'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createSupabaseClient, getCurrentUser, getCondominioAtivo } from '@/lib/supabase'
import Link from 'next/link'

interface Votacao {
  id: string
  titulo: string
  descricao: string
  tipo: 'simples' | 'multipla' | 'secreta'
  status: 'rascunho' | 'agendada' | 'ativa' | 'encerrada' | 'cancelada'
  data_inicio: string
  data_fim: string
  quorum_minimo: number
  created_at: string
}

export default function VotacoesPage() {
  const router = useRouter()
  const [usuario, setUsuario] = useState<any>(null)
  const [condominioId, setCondominioId] = useState<string>('')
  const [votacoes, setVotacoes] = useState<Votacao[]>([])
  const [filtro, setFiltro] = useState<string>('todas')
  const [busca, setBusca] = useState('')
  const [loading, setLoading] = useState(true)
  const [isSindico, setIsSindico] = useState(false) // ✅ ADICIONADO: estado para verificar se é síndico

  useEffect(() => {
    carregarDados()
  }, [])

  async function carregarDados() {
    try {
      const user = await getCurrentUser()
      if (!user) {
        router.push('/login')
        return
      }

      setUsuario(user)

      // ✅ CORREÇÃO: Buscar a role do usuário para verificar se é síndico
      const supabase = createSupabaseClient()
      const { data: userData } = await supabase
        .from('usuarios')
        .select('role')
        .eq('id', user.id)
        .single()

      // ✅ CORREÇÃO: Verificar se é síndico ou admin
      const ehSindico = userData?.role === 'sindico' || userData?.role === 'admin'
      setIsSindico(ehSindico)

      const vinculo = await getCondominioAtivo(user.id)
      if (!vinculo) {
        alert('Nenhum condomínio encontrado')
        return
      }

      setCondominioId(vinculo.condominio_id)
      await carregarVotacoes(vinculo.condominio_id)
    } catch (error) {
      console.error('Erro ao carregar dados:', error)
    } finally {
      setLoading(false)
    }
  }

  async function carregarVotacoes(condId: string) {
    const supabase = createSupabaseClient()

    let query = supabase
      .from('votacoes')
      .select('*')
      .eq('condominio_id', condId)
      .order('created_at', { ascending: false })

    // Aplicar filtro
    if (filtro !== 'todas') {
      query = query.eq('status', filtro)
    }

    const { data, error } = await query

    if (error) {
      console.error('Erro ao carregar votações:', error)
      return
    }

    setVotacoes(data || [])
  }

  useEffect(() => {
    if (condominioId) {
      carregarVotacoes(condominioId)
    }
  }, [filtro, condominioId])

  const votacoesFiltradas = votacoes.filter(v =>
    v.titulo.toLowerCase().includes(busca.toLowerCase()) ||
    v.descricao.toLowerCase().includes(busca.toLowerCase())
  )

  const contadores = {
    todas: votacoes.length,
    ativa: votacoes.filter(v => v.status === 'ativa').length,
    encerrada: votacoes.filter(v => v.status === 'encerrada').length,
    rascunho: votacoes.filter(v => v.status === 'rascunho').length,
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Carregando votações...</p>
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
                🗳️ Votações
              </h1>
              <p className="text-sm text-gray-600">
                Gerencie e participe das votações do condomínio
              </p>
            </div>
            {isSindico && ( // ✅ CORREÇÃO: Agora usando o estado isSindico corretamente
              <Link
                href="/votacoes/nova"
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
              >
                ➕ Nova Votação
              </Link>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Filtros e Busca */}
        <div className="bg-white rounded-lg shadow p-4 mb-6">
          {/* Tabs de Filtro */}
          <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
            <button
              onClick={() => setFiltro('todas')}
              className={`px-4 py-2 rounded-lg whitespace-nowrap transition ${
                filtro === 'todas'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Todas ({contadores.todas})
            </button>
            <button
              onClick={() => setFiltro('ativa')}
              className={`px-4 py-2 rounded-lg whitespace-nowrap transition ${
                filtro === 'ativa'
                  ? 'bg-green-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              🟢 Ativas ({contadores.ativa})
            </button>
            <button
              onClick={() => setFiltro('encerrada')}
              className={`px-4 py-2 rounded-lg whitespace-nowrap transition ${
                filtro === 'encerrada'
                  ? 'bg-gray-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              🔴 Encerradas ({contadores.encerrada})
            </button>
            {isSindico && ( // ✅ CORREÇÃO: Também usando isSindico para mostrar a tab de rascunhos
              <button
                onClick={() => setFiltro('rascunho')}
                className={`px-4 py-2 rounded-lg whitespace-nowrap transition ${
                  filtro === 'rascunho'
                    ? 'bg-yellow-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                📝 Rascunhos ({contadores.rascunho})
              </button>
            )}
          </div>

          {/* Campo de Busca */}
          <div className="relative">
            <input
              type="text"
              placeholder="Buscar votação..."
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              className="w-full px-4 py-2 pl-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <span className="absolute left-3 top-2.5 text-gray-400">🔍</span>
          </div>
        </div>

        {/* Lista de Votações */}
        {votacoesFiltradas.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <div className="text-6xl mb-4">🗳️</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              {busca ? 'Nenhuma votação encontrada' : 'Nenhuma votação disponível'}
            </h3>
            <p className="text-gray-600 mb-6">
              {busca
                ? 'Tente buscar com outros termos'
                : filtro === 'todas'
                ? 'Ainda não há votações criadas'
                : `Não há votações ${filtro === 'ativa' ? 'ativas' : filtro === 'encerrada' ? 'encerradas' : 'em rascunho'}`
              }
            </p>
            {isSindico && !busca && ( // ✅ CORREÇÃO: Usando isSindico para mostrar o botão de criar primeira votação
              <Link
                href="/votacoes/nova"
                className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
              >
                Criar Primeira Votação
              </Link>
            )}
          </div>
        ) : (
          <div className="grid gap-4">
            {votacoesFiltradas.map((votacao) => {
              const diasRestantes = Math.ceil(
                (new Date(votacao.data_fim).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
              )

              return (
                <Link
                  key={votacao.id}
                  href={`/votacoes/${votacao.id}`}
                  className="block bg-white rounded-lg shadow hover:shadow-lg transition p-6"
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-xl font-semibold text-gray-900">
                          {votacao.titulo}
                        </h3>
                        <span className={`text-xs px-3 py-1 rounded-full whitespace-nowrap ${
                          votacao.status === 'ativa'
                            ? 'bg-green-100 text-green-700'
                            : votacao.status === 'encerrada'
                            ? 'bg-gray-100 text-gray-700'
                            : votacao.status === 'rascunho'
                            ? 'bg-yellow-100 text-yellow-700'
                            : 'bg-blue-100 text-blue-700'
                        }`}>
                          {votacao.status === 'ativa' && '🟢 Ativa'}
                          {votacao.status === 'encerrada' && '🔴 Encerrada'}
                          {votacao.status === 'rascunho' && '📝 Rascunho'}
                          {votacao.status === 'agendada' && '📅 Agendada'}
                          {votacao.status === 'cancelada' && '❌ Cancelada'}
                        </span>
                      </div>
                      <p className="text-gray-600 mb-4 line-clamp-2">
                        {votacao.descricao}
                      </p>
                      <div className="flex flex-wrap gap-4 text-sm text-gray-500">
                        <span>
                          {votacao.tipo === 'simples' && '✓ Simples'}
                          {votacao.tipo === 'multipla' && '☑ Múltipla'}
                          {votacao.tipo === 'secreta' && '🔒 Secreta'}
                        </span>
                        <span>
                          Início: {new Date(votacao.data_inicio).toLocaleDateString('pt-BR')}
                        </span>
                        <span>
                          Término: {new Date(votacao.data_fim).toLocaleDateString('pt-BR')}
                        </span>
                        <span>
                          Quorum: {votacao.quorum_minimo}%
                        </span>
                      </div>
                    </div>
                    {votacao.status === 'ativa' && diasRestantes >= 0 && (
                      <div className={`ml-4 text-center px-4 py-2 rounded-lg ${
                        diasRestantes <= 1
                          ? 'bg-red-100 text-red-700'
                          : diasRestantes <= 3
                          ? 'bg-yellow-100 text-yellow-700'
                          : 'bg-green-100 text-green-700'
                      }`}>
                        <div className="text-2xl font-bold">{diasRestantes}</div>
                        <div className="text-xs">
                          {diasRestantes === 0 ? 'Último dia' : diasRestantes === 1 ? 'dia' : 'dias'}
                        </div>
                      </div>
                    )}
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </main>
    </div>
  )
}