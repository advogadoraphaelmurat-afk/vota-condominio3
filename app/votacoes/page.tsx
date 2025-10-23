// app/votacoes/page.tsx - COM ATUALIZAÇÃO AUTOMÁTICA DE STATUS

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
  const [isSindico, setIsSindico] = useState(false)

  useEffect(() => {
    carregarDados()
  }, [])

  // ✅ FUNÇÃO PARA ATUALIZAR STATUS DE TODAS AS VOTAÇÕES
  async function atualizarStatusVotacoes(condId: string) {
    const supabase = createSupabaseClient()
    const agora = new Date()

    console.log('🔄 Atualizando status de todas as votações...')
    console.log('⏰ Data/hora atual:', agora.toISOString())

    // Buscar TODAS as votações (agendadas e ativas)
    const { data: todasVotacoes, error } = await supabase
      .from('votacoes')
      .select('*')
      .eq('condominio_id', condId)
      .in('status', ['agendada', 'ativa'])

    if (error || !todasVotacoes) {
      console.error('❌ Erro ao buscar votações:', error)
      return
    }

    console.log(`📋 Verificando ${todasVotacoes.length} votações...`)

    // Processar cada votação
    for (const votacao of todasVotacoes) {
      const dataInicio = new Date(votacao.data_inicio)
      const dataFim = new Date(votacao.data_fim)
      let novoStatus = votacao.status

      console.log(`\n🔍 Votação: "${votacao.titulo}"`)
      console.log(`   Status atual: ${votacao.status}`)
      console.log(`   Início: ${dataInicio.toLocaleString('pt-BR')}`)
      console.log(`   Fim: ${dataFim.toLocaleString('pt-BR')}`)

      // Regra 1: Se está AGENDADA e já passou do início e ainda não passou do fim → ATIVAR
      if (votacao.status === 'agendada' && agora >= dataInicio && agora <= dataFim) {
        novoStatus = 'ativa'
        console.log(`   ✅ ATIVANDO: Passou do início e ainda não acabou`)
      }
      // Regra 2: Se está AGENDADA e já passou do fim → ENCERRAR
      else if (votacao.status === 'agendada' && agora > dataFim) {
        novoStatus = 'encerrada'
        console.log(`   🔴 ENCERRANDO: Passou do prazo sem ser ativada`)
      }
      // Regra 3: Se está ATIVA e já passou do fim → ENCERRAR
      else if (votacao.status === 'ativa' && agora > dataFim) {
        novoStatus = 'encerrada'
        console.log(`   🔴 ENCERRANDO: Votação vencida`)
      }
      else {
        console.log(`   ⏸️ Mantendo status atual`)
      }

      // Atualizar se mudou
      if (novoStatus !== votacao.status) {
        const { error: updateError } = await supabase
          .from('votacoes')
          .update({ status: novoStatus })
          .eq('id', votacao.id)

        if (updateError) {
          console.error(`   ❌ Erro ao atualizar: ${updateError.message}`)
        } else {
          console.log(`   ✅ Atualizado: ${votacao.status} → ${novoStatus}`)
        }
      }
    }

    console.log('\n✅ Atualização de status concluída!')
  }

  async function carregarDados() {
    try {
      const user = await getCurrentUser()
      if (!user) {
        router.push('/login')
        return
      }

      setUsuario(user)

      const supabase = createSupabaseClient()
      const { data: userData } = await supabase
        .from('usuarios')
        .select('role')
        .eq('id', user.id)
        .single()

      const ehSindico = userData?.role === 'sindico' || userData?.role === 'admin'
      setIsSindico(ehSindico)

      const vinculo = await getCondominioAtivo(user.id)
      if (!vinculo) {
        alert('Nenhum condomínio encontrado')
        return
      }

      setCondominioId(vinculo.condominio_id)

      // ✅ PRIMEIRO: Atualizar status de todas as votações
      await atualizarStatusVotacoes(vinculo.condominio_id)

      // DEPOIS: Carregar votações já com status correto
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

    if (filtro !== 'todas') {
      query = query.eq('status', filtro)
    }

    const { data, error } = await query

    if (error) {
      console.error('Erro ao carregar votações:', error)
      return
    }

    console.log(`📊 ${data?.length || 0} votações carregadas`)
    setVotacoes(data || [])
  }

  useEffect(() => {
    if (condominioId) {
      // Atualizar status e recarregar quando trocar de filtro
      atualizarStatusVotacoes(condominioId).then(() => {
        carregarVotacoes(condominioId)
      })
    }
  }, [filtro, condominioId])

  // Função para ativar manualmente
  async function ativarVotacao(votacaoId: string, titulo: string) {
    if (!confirm(`Ativar a votação "${titulo}"?\n\nIsso permitirá que moradores comecem a votar.`)) return

    try {
      const supabase = createSupabaseClient()
      const { error } = await supabase
        .from('votacoes')
        .update({ status: 'ativa' })
        .eq('id', votacaoId)

      if (error) throw error

      alert('✅ Votação ativada com sucesso!')
      await atualizarStatusVotacoes(condominioId)
      await carregarVotacoes(condominioId)
    } catch (error: any) {
      alert('❌ Erro ao ativar votação: ' + error.message)
    }
  }

  // Função para encerrar manualmente
  async function encerrarVotacao(votacaoId: string, titulo: string) {
    if (!confirm(`Encerrar a votação "${titulo}"?\n\nEsta ação não pode ser desfeita.`)) return

    try {
      const supabase = createSupabaseClient()
      const { error } = await supabase
        .from('votacoes')
        .update({ status: 'encerrada' })
        .eq('id', votacaoId)

      if (error) throw error

      alert('✅ Votação encerrada!')
      await carregarVotacoes(condominioId)
    } catch (error: any) {
      alert('❌ Erro ao encerrar votação: ' + error.message)
    }
  }

  const votacoesFiltradas = votacoes.filter(v =>
    v.titulo.toLowerCase().includes(busca.toLowerCase()) ||
    v.descricao.toLowerCase().includes(busca.toLowerCase())
  )

  const contadores = {
    todas: votacoes.length,
    ativa: votacoes.filter(v => v.status === 'ativa').length,
    agendada: votacoes.filter(v => v.status === 'agendada').length,
    encerrada: votacoes.filter(v => v.status === 'encerrada').length,
    rascunho: votacoes.filter(v => v.status === 'rascunho').length,
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Carregando votações...</p>
          <p className="text-xs text-gray-400 mt-2">Verificando status...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
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
            {isSindico && (
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
        <div className="bg-white rounded-lg shadow p-4 mb-6">
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
              onClick={() => setFiltro('agendada')}
              className={`px-4 py-2 rounded-lg whitespace-nowrap transition ${
                filtro === 'agendada'
                  ? 'bg-yellow-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              📅 Agendadas ({contadores.agendada})
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
            {isSindico && (
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
                : `Não há votações ${filtro === 'ativa' ? 'ativas' : filtro === 'encerrada' ? 'encerradas' : filtro === 'agendada' ? 'agendadas' : 'em rascunho'}`
              }
            </p>
            {isSindico && !busca && (
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

              const dentroDosPrazos = (
                new Date(votacao.data_inicio) <= new Date() &&
                new Date(votacao.data_fim) >= new Date()
              )

              return (
                <div
                  key={votacao.id}
                  className="bg-white rounded-lg shadow hover:shadow-lg transition p-6"
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
                            : votacao.status === 'agendada'
                            ? 'bg-yellow-100 text-yellow-700'
                            : 'bg-blue-100 text-blue-700'
                        }`}>
                          {votacao.status === 'ativa' && '🟢 Ativa'}
                          {votacao.status === 'encerrada' && '🔴 Encerrada'}
                          {votacao.status === 'rascunho' && '📝 Rascunho'}
                          {votacao.status === 'agendada' && '📅 Agendada'}
                          {votacao.status === 'cancelada' && '❌ Cancelada'}
                        </span>

                        {votacao.status === 'agendada' && dentroDosPrazos && isSindico && (
                          <span className="text-xs px-3 py-1 rounded-full bg-orange-100 text-orange-700 animate-pulse">
                            ⚡ Pode ativar agora
                          </span>
                        )}
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

                  <div className="mt-4 pt-4 border-t border-gray-200 flex gap-3">
                    <Link
                      href={`/votacoes/${votacao.id}`}
                      className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-center font-medium"
                    >
                      {votacao.status === 'ativa' ? '🗳️ Votar' : '👁️ Ver Detalhes'}
                    </Link>

                    {isSindico && votacao.status === 'agendada' && (
                      <button
                        onClick={() => ativarVotacao(votacao.id, votacao.titulo)}
                        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition font-medium"
                      >
                        ▶️ Ativar
                      </button>
                    )}

                    {isSindico && votacao.status === 'ativa' && (
                      <button
                        onClick={() => encerrarVotacao(votacao.id, votacao.titulo)}
                        className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition font-medium"
                      >
                        ⏹️ Encerrar
                      </button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </main>
    </div>
  )
}