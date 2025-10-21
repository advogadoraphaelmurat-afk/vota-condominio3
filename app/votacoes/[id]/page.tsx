// app/votacoes/[id]/page.tsx - ATIVAÇÃO AUTOMÁTICA

'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { createSupabaseClient, getCurrentUser } from '@/lib/supabase'
import Link from 'next/link'

interface Votacao {
  id: string
  titulo: string
  descricao: string
  tipo: 'simples' | 'multipla' | 'secreta'
  status: string
  data_inicio: string
  data_fim: string
  quorum_minimo: number
  resultado_publico: boolean
  permite_mudanca_voto: boolean
  condominio_id: string
}

interface Opcao {
  id: string
  texto: string
  ordem: number
  votos_count?: number
}

interface MeuVoto {
  id: string
  opcao_id: string
}

export default function VotacaoDetalhesPage() {
  const router = useRouter()
  const params = useParams()
  const votacaoId = params.id as string

  const [votacao, setVotacao] = useState<Votacao | null>(null)
  const [opcoes, setOpcoes] = useState<Opcao[]>([])
  const [meuVoto, setMeuVoto] = useState<MeuVoto | null>(null)
  const [opcaoSelecionada, setOpcaoSelecionada] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const [votando, setVotando] = useState(false)
  const [totalVotos, setTotalVotos] = useState(0)
  const [userId, setUserId] = useState<string>('')

  useEffect(() => {
    carregarDados()
  }, [votacaoId])

  // ✅ FUNÇÃO PARA ATIVAR VOTAÇÃO AUTOMATICAMENTE
  async function verificarEAtivarVotacao(votacaoData: Votacao) {
    const agora = new Date()
    const dataInicio = new Date(votacaoData.data_inicio)
    const dataFim = new Date(votacaoData.data_fim)

    console.log('🔍 Verificando status automático:')
    console.log('   Agora:', agora.toISOString())
    console.log('   Início:', dataInicio.toISOString())
    console.log('   Fim:', dataFim.toISOString())
    console.log('   Status atual:', votacaoData.status)

    let novoStatus = votacaoData.status

    // Se está agendada e já passou da data de início
    if (votacaoData.status === 'agendada' && agora >= dataInicio && agora <= dataFim) {
      novoStatus = 'ativa'
      console.log('✅ Ativando votação automaticamente!')
    }
    // Se está ativa mas já passou da data de fim
    else if (votacaoData.status === 'ativa' && agora > dataFim) {
      novoStatus = 'encerrada'
      console.log('🔴 Encerrando votação automaticamente!')
    }

    // Atualizar status se necessário
    if (novoStatus !== votacaoData.status) {
      const supabase = createSupabaseClient()
      const { error } = await supabase
        .from('votacoes')
        .update({ status: novoStatus })
        .eq('id', votacaoData.id)

      if (error) {
        console.error('❌ Erro ao atualizar status:', error)
      } else {
        console.log(`✅ Status atualizado: ${votacaoData.status} → ${novoStatus}`)
        votacaoData.status = novoStatus
      }
    }

    return votacaoData
  }

  async function carregarDados() {
    try {
      const user = await getCurrentUser()
      if (!user) {
        router.push('/login')
        return
      }

      setUserId(user.id)

      const supabase = createSupabaseClient()

      // Buscar votação
      const { data: votacaoData, error: votacaoError } = await supabase
        .from('votacoes')
        .select('*')
        .eq('id', votacaoId)
        .single()

      if (votacaoError || !votacaoData) {
        console.error('❌ Erro ao buscar votação:', votacaoError)
        alert('Votação não encontrada')
        router.push('/votacoes')
        return
      }

      // ✅ VERIFICAR E ATIVAR AUTOMATICAMENTE
      const votacaoAtualizada = await verificarEAtivarVotacao(votacaoData)
      setVotacao(votacaoAtualizada)

      console.log('📊 Votação carregada:', votacaoAtualizada)
      console.log('🔍 Status final:', votacaoAtualizada.status)

      // Buscar opções
      const { data: opcoesData, error: opcoesError } = await supabase
        .from('opcoes_votacao')
        .select('*')
        .eq('votacao_id', votacaoId)
        .order('ordem')

      if (opcoesError) throw opcoesError
      setOpcoes(opcoesData || [])

      // Verificar se já votou
      const { data: votoData } = await supabase
        .from('votos')
        .select('*')
        .eq('votacao_id', votacaoId)
        .eq('usuario_id', user.id)
        .maybeSingle()

      if (votoData) {
        setMeuVoto(votoData)
        setOpcaoSelecionada(votoData.opcao_id)
      }

      // Buscar resultados se permitido
      if (votacaoAtualizada.resultado_publico || votacaoAtualizada.status === 'encerrada') {
        await carregarResultados()
      }

    } catch (error) {
      console.error('💥 Erro ao carregar dados:', error)
    } finally {
      setLoading(false)
    }
  }

  async function carregarResultados() {
    const supabase = createSupabaseClient()

    const { data: votosData } = await supabase
      .from('votos')
      .select('opcao_id')
      .eq('votacao_id', votacaoId)

    if (votosData) {
      const contagemVotos: Record<string, number> = {}
      votosData.forEach(voto => {
        contagemVotos[voto.opcao_id] = (contagemVotos[voto.opcao_id] || 0) + 1
      })

      setTotalVotos(votosData.length)

      setOpcoes(prev => prev.map(opcao => ({
        ...opcao,
        votos_count: contagemVotos[opcao.id] || 0
      })))
    }
  }

  async function handleVotar() {
    if (!opcaoSelecionada) {
      alert('⚠️ Selecione uma opção para votar')
      return
    }

    if (!confirm('✅ Confirmar seu voto?')) return

    setVotando(true)

    try {
      const supabase = createSupabaseClient()

      if (meuVoto && votacao?.permite_mudanca_voto) {
        const { error } = await supabase
          .from('votos')
          .update({ opcao_id: opcaoSelecionada })
          .eq('id', meuVoto.id)

        if (error) throw error
        alert('✅ Voto alterado com sucesso!')
      } else {
        const { error } = await supabase
          .from('votos')
          .insert({
            votacao_id: votacaoId,
            usuario_id: userId,
            opcao_id: opcaoSelecionada
          })

        if (error) throw error
        alert('✅ Voto registrado com sucesso!')
      }

      await carregarDados()

    } catch (error: any) {
      console.error('💥 Erro ao votar:', error)
      alert('❌ Erro ao registrar voto: ' + error.message)
    } finally {
      setVotando(false)
    }
  }

  const jaVotou = !!meuVoto
  const votacaoAtiva = votacao?.status === 'ativa'
  const dentroDosPrazos = votacao ? (
    new Date(votacao.data_inicio) <= new Date() &&
    new Date(votacao.data_fim) >= new Date()
  ) : false
  
  const podeVotar = votacaoAtiva && dentroDosPrazos && (!jaVotou || votacao?.permite_mudanca_voto)
  const mostrarResultados = votacao?.resultado_publico || votacao?.status === 'encerrada' || jaVotou

  const calcularPercentual = (votos: number) => {
    if (totalVotos === 0) return 0
    return Math.round((votos / totalVotos) * 100)
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Carregando votação...</p>
        </div>
      </div>
    )
  }

  if (!votacao) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <p className="text-xl text-gray-600">Votação não encontrada</p>
          <Link href="/votacoes" className="text-blue-600 hover:underline mt-4 inline-block">
            ← Voltar para votações
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <Link href="/votacoes" className="text-blue-600 hover:text-blue-700 text-sm mb-2 inline-block">
            ← Voltar para votações
          </Link>
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-2xl font-bold text-gray-900">
              {votacao.titulo}
            </h1>
            <span className={`text-xs px-3 py-1 rounded-full ${
              votacao.status === 'ativa'
                ? 'bg-green-100 text-green-700'
                : votacao.status === 'encerrada'
                ? 'bg-gray-100 text-gray-700'
                : 'bg-yellow-100 text-yellow-700'
            }`}>
              {votacao.status === 'ativa' && '🟢 Ativa'}
              {votacao.status === 'encerrada' && '🔴 Encerrada'}
              {votacao.status === 'agendada' && '📅 Agendada'}
            </span>
          </div>
          <p className="text-sm text-gray-600">
            {new Date(votacao.data_inicio).toLocaleDateString('pt-BR')} até {new Date(votacao.data_fim).toLocaleDateString('pt-BR')}
          </p>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {votacao.descricao && (
          <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-2">📋 Descrição</h2>
            <p className="text-gray-700 whitespace-pre-wrap">{votacao.descricao}</p>
          </div>
        )}

        {!votacaoAtiva && votacao.status === 'agendada' && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
            <p className="text-yellow-800">
              📅 Esta votação está agendada e será ativada automaticamente em: <strong>{new Date(votacao.data_inicio).toLocaleString('pt-BR')}</strong>
            </p>
          </div>
        )}

        {jaVotou && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
            <div className="flex items-center gap-2">
              <span className="text-2xl">✓</span>
              <div>
                <p className="font-semibold text-green-900">Você já votou nesta votação</p>
                {votacao.permite_mudanca_voto && podeVotar && (
                  <p className="text-sm text-green-700">Você pode alterar seu voto até o encerramento</p>
                )}
              </div>
            </div>
          </div>
        )}

        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            {podeVotar ? '🗳️ Escolha sua opção' : '📊 Opções'}
          </h2>

          <div className="space-y-3">
            {opcoes.map((opcao) => {
              const votos = opcao.votos_count || 0
              const percentual = calcularPercentual(votos)

              return (
                <div key={opcao.id} className="relative">
                  {podeVotar ? (
                    <label
                      className={`flex items-center p-4 border-2 rounded-lg cursor-pointer transition ${
                        opcaoSelecionada === opcao.id
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-blue-300 hover:bg-gray-50'
                      }`}
                    >
                      <input
                        type="radio"
                        name="opcao"
                        value={opcao.id}
                        checked={opcaoSelecionada === opcao.id}
                        onChange={(e) => setOpcaoSelecionada(e.target.value)}
                        className="mr-3 w-4 h-4"
                      />
                      <span className="font-medium text-gray-900">{opcao.texto}</span>
                    </label>
                  ) : (
                    <div className="p-4 border-2 border-gray-200 rounded-lg">
                      <div className="flex justify-between items-center mb-2">
                        <span className="font-medium text-gray-900">{opcao.texto}</span>
                        {mostrarResultados && (
                          <span className="text-sm font-semibold text-gray-700">
                            {votos} votos ({percentual}%)
                          </span>
                        )}
                      </div>
                      {mostrarResultados && (
                        <div className="w-full bg-gray-200 rounded-full h-3">
                          <div
                            className="bg-blue-600 h-3 rounded-full transition-all"
                            style={{ width: `${percentual}%` }}
                          ></div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </div>

          {podeVotar && (
            <button
              onClick={handleVotar}
              disabled={votando || !opcaoSelecionada}
              className="w-full mt-6 px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition"
            >
              {votando ? '📤 Registrando voto...' : jaVotou ? '🔄 Alterar Voto' : '✓ Confirmar Voto'}
            </button>
          )}
        </div>

        {mostrarResultados && (
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">📊 Resultados</h2>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div className="p-4 bg-blue-50 rounded-lg">
                <div className="text-3xl font-bold text-blue-600">{totalVotos}</div>
                <div className="text-sm text-gray-600">Total de Votos</div>
              </div>
              <div className="p-4 bg-green-50 rounded-lg">
                <div className="text-3xl font-bold text-green-600">{votacao.quorum_minimo}%</div>
                <div className="text-sm text-gray-600">Quorum Mínimo</div>
              </div>
              <div className="p-4 bg-purple-50 rounded-lg">
                <div className="text-3xl font-bold text-purple-600">
                  {votacao.tipo === 'simples' ? '✓' : votacao.tipo === 'multipla' ? '☑' : '🔒'}
                </div>
                <div className="text-sm text-gray-600 capitalize">{votacao.tipo}</div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}