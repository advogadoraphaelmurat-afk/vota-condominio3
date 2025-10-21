'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createSupabaseClient, getCondominioAtivo } from '@/lib/supabase'

interface Comunicacao {
  id: string
  titulo: string
  conteudo: string
  tipo: string
  prioridade: string
  destinatarios: string[]
  lida: boolean
  created_at: string
  remetente?: {
    nome_completo: string
    role: string
  }
}

interface ComunicacoesDashboardProps {
  userId: string
}

export default function ComunicacoesDashboard({ userId }: ComunicacoesDashboardProps) {
  const router = useRouter()
  const [comunicacoes, setComunicacoes] = useState<Comunicacao[]>([])
  const [loading, setLoading] = useState(true)
  const [naoLidas, setNaoLidas] = useState(0)

  useEffect(() => {
    carregarComunicacoes()
  }, [userId])

  const carregarComunicacoes = async () => {
    try {
      const supabase = createSupabaseClient()
      const vinculo = await getCondominioAtivo(userId)

      if (!vinculo) {
        setLoading(false)
        return
      }

      // ✅ CORREÇÃO: Usar vinculo.condominio_id ao invés de vinculo.id
      const { data, error } = await supabase
        .from('comunicacoes')
        .select(`
          *,
          remetente:usuarios!comunicacoes_remetente_id_fkey(
            nome_completo,
            role
          )
        `)
        .eq('condominio_id', vinculo.condominio_id)
        .contains('destinatarios', [userId])
        .order('created_at', { ascending: false })
        .limit(4)

      if (error) throw error

      const comunicacoesData = data || []
      setComunicacoes(comunicacoesData)
      
      // Contar não lidas
      const countNaoLidas = comunicacoesData.filter(c => !c.lida).length
      setNaoLidas(countNaoLidas)
    } catch (error) {
      console.error('Erro ao carregar comunicações:', error)
    } finally {
      setLoading(false)
    }
  }

  const marcarComoLida = async (comunicacaoId: string) => {
    try {
      const supabase = createSupabaseClient()
      
      await supabase
        .from('comunicacoes')
        .update({ lida: true })
        .eq('id', comunicacaoId)

      // Atualizar estado local
      setComunicacoes(prev =>
        prev.map(c => c.id === comunicacaoId ? { ...c, lida: true } : c)
      )
      setNaoLidas(prev => Math.max(0, prev - 1))
    } catch (error) {
      console.error('Erro ao marcar como lida:', error)
    }
  }

  const getTipoIcon = (tipo: string) => {
    switch (tipo) {
      case 'informativo':
        return '📋'
      case 'urgente':
        return '🚨'
      case 'cobranca':
        return '💰'
      case 'manutencao':
        return '🔧'
      case 'evento':
        return '🎉'
      default:
        return '💬'
    }
  }

  const getPrioridadeColor = (prioridade: string, lida: boolean) => {
    if (lida) return 'border-l-gray-400 bg-gray-50'
    
    switch (prioridade) {
      case 'alta':
        return 'border-l-red-500 bg-red-50'
      case 'media':
        return 'border-l-yellow-500 bg-yellow-50'
      case 'baixa':
        return 'border-l-blue-500 bg-blue-50'
      default:
        return 'border-l-gray-400 bg-gray-50'
    }
  }

  const getRemetenteLabel = (role: string) => {
    switch (role) {
      case 'sindico':
        return '👔 Síndico'
      case 'administradora':
        return '🏢 Administradora'
      case 'zelador':
        return '🔑 Zelador'
      default:
        return '👤 Condomínio'
    }
  }

  const formatarData = (data: string) => {
    const dataCom = new Date(data)
    const hoje = new Date()
    const diferenca = hoje.getTime() - dataCom.getTime()
    const horas = Math.floor(diferenca / (1000 * 60 * 60))
    const dias = Math.floor(horas / 24)

    if (horas < 1) return 'Agora mesmo'
    if (horas < 24) return `Há ${horas}h`
    if (dias === 1) return 'Ontem'
    if (dias < 7) return `Há ${dias} dias`
    
    return dataCom.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit'
    })
  }

  const truncarTexto = (texto: string, limite: number = 100) => {
    if (texto.length <= limite) return texto
    return texto.substring(0, limite) + '...'
  }

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-900">💬 Comunicações</h2>
        </div>
        <div className="space-y-3">
          {[1, 2].map((i) => (
            <div key={i} className="animate-pulse">
              <div className="h-24 bg-gray-200 rounded-lg"></div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (comunicacoes.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-900">💬 Comunicações</h2>
        </div>
        <div className="text-center py-8">
          <div className="text-gray-400 text-4xl mb-3">📭</div>
          <p className="text-gray-600">Nenhuma comunicação no momento</p>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <h2 className="text-xl font-bold text-gray-900">💬 Comunicações</h2>
          {naoLidas > 0 && (
            <span className="bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full">
              {naoLidas}
            </span>
          )}
        </div>
        <button
          onClick={() => router.push('/comunicacoes')}
          className="text-sm text-blue-600 hover:text-blue-700 font-medium"
        >
          Ver todas →
        </button>
      </div>

      {/* Lista de Comunicações */}
      <div className="space-y-3">
        {comunicacoes.map((com) => {
          return (
            <div
              key={com.id}
              className={`border-l-4 rounded-lg p-4 transition-all cursor-pointer hover:shadow-md ${getPrioridadeColor(
                com.prioridade,
                com.lida
              )}`}
              onClick={() => {
                if (!com.lida) marcarComoLida(com.id)
                router.push(`/comunicacoes/${com.id}`)
              }}
            >
              {/* Header */}
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-start gap-2 flex-1">
                  <span className="text-xl">
                    {getTipoIcon(com.tipo)}
                  </span>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className={`font-semibold text-gray-900 ${!com.lida ? 'font-bold' : ''}`}>
                        {com.titulo}
                      </h3>
                      {!com.lida && (
                        <span className="flex h-2 w-2">
                          <span className="animate-ping absolute inline-flex h-2 w-2 rounded-full bg-blue-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
                        </span>
                      )}
                    </div>
                    
                    {/* Remetente */}
                    {com.remetente && (
                      <p className="text-xs text-gray-500 mb-2">
                        De: {getRemetenteLabel(com.remetente.role)} • {formatarData(com.created_at)}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Conteúdo */}
              <p className={`text-sm text-gray-700 ${!com.lida ? 'font-medium' : ''}`}>
                {truncarTexto(com.conteudo)}
              </p>

              {/* Footer */}
              <div className="mt-3 flex items-center justify-between text-xs">
                <span className="text-gray-500 capitalize">
                  {com.tipo.replace('_', ' ')}
                </span>
                <span className="text-blue-600 font-medium">
                  Clique para ler →
                </span>
              </div>
            </div>
          )
        })}
      </div>

      {/* Footer */}
      {comunicacoes.length >= 4 && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <button
            onClick={() => router.push('/comunicacoes')}
            className="w-full text-center text-sm text-gray-600 hover:text-gray-900 font-medium"
          >
            Ver todas as comunicações →
          </button>
        </div>
      )}
    </div>
  )
}