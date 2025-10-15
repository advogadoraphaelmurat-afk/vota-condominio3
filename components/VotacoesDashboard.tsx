'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createSupabaseClient, getCondominioAtivo } from '@/lib/supabase'

interface Votacao {
  id: string
  titulo: string
  descricao: string
  tipo: string
  status: string
  data_inicio: string
  data_fim: string
  created_at: string
  opcoes_votacao: Array<{
    id: string
    texto: string
    votos: Array<{ id: string }>
  }>
  votos: Array<{ id: string; usuario_id: string }>
}

interface VotacoesDashboardProps {
  userId: string
}

export default function VotacoesDashboard({ userId }: VotacoesDashboardProps) {
  const router = useRouter()
  const [votacoes, setVotacoes] = useState<Votacao[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    carregarVotacoes()
  }, [userId])

  const carregarVotacoes = async () => {
    try {
      const supabase = createSupabaseClient()
      const vinculo = await getCondominioAtivo(userId)

      if (!vinculo) {
        setLoading(false)
        return
      }

      const { data, error } = await supabase
        .from('votacoes')
        .select(`
          *,
          opcoes_votacao(
            id,
            texto,
            votos:votos(id)
          ),
          votos(id, usuario_id)
        `)
        .eq('condominio_id', vinculo.condominio_id)
        .eq('status', 'ativa')
        .order('created_at', { ascending: false })
        .limit(3)

      if (error) throw error

      setVotacoes(data || [])
    } catch (error) {
      console.error('Erro ao carregar votações:', error)
    } finally {
      setLoading(false)
    }
  }

  const jaVotou = (votacao: Votacao) => {
    return votacao.votos.some(v => v.usuario_id === userId)
  }

  const calcularProgresso = (votacao: Votacao) => {
    const totalVotos = votacao.opcoes_votacao.reduce(
      (acc, opcao) => acc + opcao.votos.length,
      0
    )
    return totalVotos
  }

  const getTipoIcon = (tipo: string) => {
    switch (tipo) {
      case 'simples':
        return '✅'
      case 'multipla':
        return '☑️'
      case 'assembleia':
        return '🏛️'
      default:
        return '🗳️'
    }
  }

  const getStatusBadge = (votacao: Votacao) => {
    const votou = jaVotou(votacao)
    
    if (votou) {
      return (
        <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full font-medium">
          ✓ Você já votou
        </span>
      )
    }
    
    return (
      <span className="text-xs bg-orange-100 text-orange-700 px-2 py-1 rounded-full font-medium">
        ⏳ Aguardando seu voto
        </span>
    )
  }

  const calcularTempoRestante = (dataFim: string) => {
    const fim = new Date(dataFim)
    const agora = new Date()
    const diferenca = fim.getTime() - agora.getTime()
    const dias = Math.ceil(diferenca / (1000 * 60 * 60 * 24))

    if (dias < 0) return 'Encerrada'
    if (dias === 0) return 'Encerra hoje'
    if (dias === 1) return 'Encerra amanhã'
    return `${dias} dias restantes`
  }

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-900">🗳️ Votações Ativas</h2>
        </div>
        <div className="space-y-3">
          {[1, 2].map((i) => (
            <div key={i} className="animate-pulse">
              <div className="h-32 bg-gray-200 rounded-lg"></div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (votacoes.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-900">🗳️ Votações Ativas</h2>
        </div>
        <div className="text-center py-8">
          <div className="text-gray-400 text-4xl mb-3">🔭</div>
          <p className="text-gray-600">Nenhuma votação ativa no momento</p>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <h2 className="text-xl font-bold text-gray-900">🗳️ Votações Ativas</h2>
          <span className="bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full">
            {votacoes.filter(v => !jaVotou(v)).length}
          </span>
        </div>
        <button
          onClick={() => router.push('/votacoes')}
          className="text-sm text-blue-600 hover:text-blue-700 font-medium"
        >
          Ver todas →
        </button>
      </div>

      {/* Lista de Votações */}
      <div className="space-y-4">
        {votacoes.map((votacao) => {
          const votou = jaVotou(votacao)
          const totalVotos = calcularProgresso(votacao)
          const tempoRestante = calcularTempoRestante(votacao.data_fim)

          return (
            <div
              key={votacao.id}
              className={`border rounded-lg p-4 transition-all hover:shadow-md ${
                votou ? 'border-green-300 bg-green-50' : 'border-orange-300 bg-orange-50'
              }`}
            >
              {/* Header */}
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-start gap-2 flex-1">
                  <span className="text-2xl">
                    {getTipoIcon(votacao.tipo)}
                  </span>
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900 mb-1">
                      {votacao.titulo}
                    </h3>
                    {votacao.descricao && (
                      <p className="text-sm text-gray-600 line-clamp-2">
                        {votacao.descricao}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Status Badge */}
              <div className="mb-3">
                {getStatusBadge(votacao)}
              </div>

              {/* Info Row */}
              <div className="flex items-center justify-between text-sm mb-3">
                <span className="text-gray-600">
                  👥 {totalVotos} {totalVotos === 1 ? 'voto' : 'votos'}
                </span>
                <span className="text-gray-600">
                  ⏰ {tempoRestante}
                </span>
              </div>

              {/* Preview das Opções */}
              {!votou && votacao.opcoes_votacao.length > 0 && (
                <div className="bg-white rounded-lg p-3 mb-3">
                  <p className="text-xs text-gray-500 mb-2">Opções disponíveis:</p>
                  <div className="space-y-1">
                    {votacao.opcoes_votacao.slice(0, 2).map((opcao) => (
                      <div key={opcao.id} className="text-sm text-gray-700 flex items-center gap-2">
                        <span className="text-gray-400">•</span>
                        {opcao.texto}
                      </div>
                    ))}
                    {votacao.opcoes_votacao.length > 2 && (
                      <div className="text-xs text-gray-500">
                        +{votacao.opcoes_votacao.length - 2} opções
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Botão de Ação */}
              <button
                onClick={() => router.push(`/votacoes/${votacao.id}`)}
                className={`w-full py-2 rounded-lg font-medium transition-colors ${
                  votou
                    ? 'bg-green-600 text-white hover:bg-green-700'
                    : 'bg-orange-600 text-white hover:bg-orange-700'
                }`}
              >
                {votou ? 'Ver resultado' : 'Votar agora'}
              </button>
            </div>
          )
        })}
      </div>

      {/* Footer */}
      {votacoes.length >= 3 && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <button
            onClick={() => router.push('/votacoes')}
            className="w-full text-center text-sm text-gray-600 hover:text-gray-900 font-medium"
          >
            Ver todas as votações →
          </button>
        </div>
      )}
    </div>
  )
}