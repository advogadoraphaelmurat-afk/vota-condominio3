'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { createSupabaseClient, getCurrentUser } from '@/lib/supabase'
import Link from 'next/link'

interface Comunicacao {
  id: string
  titulo: string
  conteudo: string
  tipo: string
  prioridade: string
  lida: boolean
  data_envio: string
  remetente?: {
    nome_completo: string
    role: string
  }
}

export default function ComunicacaoDetalhesPage() {
  const router = useRouter()
  const params = useParams()
  const comunicacaoId = params.id as string

  const [comunicacao, setComunicacao] = useState<Comunicacao | null>(null)
  const [loading, setLoading] = useState(true)
  const [respondendo, setRespondendo] = useState(false)
  const [resposta, setResposta] = useState('')

  useEffect(() => {
    carregarComunicacao()
  }, [comunicacaoId])

  async function carregarComunicacao() {
    try {
      const user = await getCurrentUser()
      if (!user) {
        router.push('/login')
        return
      }

      const supabase = createSupabaseClient()

      const { data, error } = await supabase
        .from('comunicacoes')
        .select(`
          *,
          remetente:usuarios!comunicacoes_remetente_id_fkey(
            nome_completo,
            role
          )
        `)
        .eq('id', comunicacaoId)
        .single()

      if (error || !data) {
        alert('Comunicação não encontrada')
        router.push('/comunicacoes')
        return
      }

      setComunicacao(data)

      // Marcar como lida
      if (!data.lida) {
        await supabase
          .from('comunicacoes')
          .update({ 
            lida: true,
            data_leitura: new Date().toISOString()
          })
          .eq('id', comunicacaoId)
      }
    } catch (error) {
      console.error('Erro ao carregar comunicação:', error)
    } finally {
      setLoading(false)
    }
  }

  async function handleResponder() {
    if (!resposta.trim()) {
      alert('Digite uma resposta')
      return
    }

    // TODO: Implementar sistema de resposta
    alert('Sistema de resposta será implementado em breve')
    setRespondendo(false)
    setResposta('')
  }

  const getTipoIcon = (tipo: string) => {
    switch (tipo) {
      case 'informativo': return '📋'
      case 'urgente': return '🚨'
      case 'cobranca': return '💰'
      case 'manutencao': return '🔧'
      case 'evento': return '🎉'
      default: return '💬'
    }
  }

  const getTipoLabel = (tipo: string) => {
    const labels: Record<string, string> = {
      informativo: 'Informativo',
      urgente: 'Urgente',
      cobranca: 'Cobrança',
      manutencao: 'Manutenção',
      evento: 'Evento'
    }
    return labels[tipo] || tipo
  }

  const getPrioridadeColor = (prioridade: string) => {
    switch (prioridade) {
      case 'alta': return 'bg-red-100 text-red-700 border-red-300'
      case 'media': return 'bg-yellow-100 text-yellow-700 border-yellow-300'
      case 'baixa': return 'bg-blue-100 text-blue-700 border-blue-300'
      default: return 'bg-gray-100 text-gray-700 border-gray-300'
    }
  }

  const getPrioridadeLabel = (prioridade: string) => {
    const labels: Record<string, string> = {
      alta: '🔴 Alta Prioridade',
      media: '🟡 Média Prioridade',
      baixa: '🟢 Baixa Prioridade'
    }
    return labels[prioridade] || prioridade
  }

  const getRemetenteLabel = (role: string) => {
    switch (role) {
      case 'sindico': return '👔 Síndico'
      case 'administradora': return '🏢 Administradora'
      case 'zelador': return '🔑 Zelador'
      default: return '👤 Condomínio'
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Carregando mensagem...</p>
        </div>
      </div>
    )
  }

  if (!comunicacao) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <p className="text-xl text-gray-600">Mensagem não encontrada</p>
          <Link href="/comunicacoes" className="text-blue-600 hover:underline mt-4 inline-block">
            ← Voltar para comunicações
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <Link href="/comunicacoes" className="text-blue-600 hover:text-blue-700 text-sm mb-2 inline-block">
            ← Voltar para comunicações
          </Link>
          <div className="flex items-center gap-3 mb-2">
            <span className="text-3xl">{getTipoIcon(comunicacao.tipo)}</span>
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-gray-900">
                {comunicacao.titulo}
              </h1>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Metadados */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Remetente */}
            <div className="flex items-center gap-3">
              <div className="text-3xl">👤</div>
              <div>
                <p className="text-xs text-gray-500">De</p>
                {comunicacao.remetente ? (
                  <>
                    <p className="font-medium text-gray-900">
                      {getRemetenteLabel(comunicacao.remetente.role)}
                    </p>
                    <p className="text-sm text-gray-600">
                      {comunicacao.remetente.nome_completo}
                    </p>
                  </>
                ) : (
                  <p className="font-medium text-gray-900">Sistema</p>
                )}
              </div>
            </div>

            {/* Data */}
            <div className="flex items-center gap-3">
              <div className="text-3xl">📅</div>
              <div>
                <p className="text-xs text-gray-500">Enviado em</p>
                <p className="font-medium text-gray-900">
                  {new Date(comunicacao.data_envio).toLocaleDateString('pt-BR', {
                    day: '2-digit',
                    month: 'long',
                    year: 'numeric'
                  })}
                </p>
                <p className="text-sm text-gray-600">
                  às {new Date(comunicacao.data_envio).toLocaleTimeString('pt-BR', {
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </p>
              </div>
            </div>
          </div>

          {/* Tags */}
          <div className="flex gap-2 mt-4 pt-4 border-t border-gray-200">
            <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold border ${getPrioridadeColor(comunicacao.prioridade)}`}>
              {getPrioridadeLabel(comunicacao.prioridade)}
            </span>
            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-700 border border-blue-300">
              {getTipoIcon(comunicacao.tipo)} {getTipoLabel(comunicacao.tipo)}
            </span>
          </div>
        </div>

        {/* Conteúdo da Mensagem */}
        <div className={`rounded-lg shadow-sm p-6 border-l-4 ${
          comunicacao.prioridade === 'alta'
            ? 'bg-red-50 border-red-500'
            : comunicacao.prioridade === 'media'
            ? 'bg-yellow-50 border-yellow-500'
            : 'bg-white border-blue-500'
        }`}>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">💬 Mensagem</h2>
          <div className="prose max-w-none">
            <p className="text-gray-800 whitespace-pre-wrap leading-relaxed text-base">
              {comunicacao.conteudo}
            </p>
          </div>
        </div>

        {/* Área de Resposta */}
        <div className="bg-white rounded-lg shadow-sm p-6 mt-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">↩️ Responder</h2>
          
          {!respondendo ? (
            <button
              onClick={() => setRespondendo(true)}
              className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium"
            >
              ✉️ Enviar Resposta
            </button>
          ) : (
            <div className="space-y-4">
              <textarea
                value={resposta}
                onChange={(e) => setResposta(e.target.value)}
                placeholder="Digite sua resposta..."
                rows={6}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              />
              <div className="flex gap-3">
                <button
                  onClick={handleResponder}
                  className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium"
                >
                  ✓ Enviar Resposta
                </button>
                <button
                  onClick={() => {
                    setRespondendo(false)
                    setResposta('')
                  }}
                  className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition font-medium"
                >
                  Cancelar
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Botão Voltar */}
        <div className="mt-8 text-center">
          <Link
            href="/comunicacoes"
            className="inline-block px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition"
          >
            ← Voltar para Comunicações
          </Link>
        </div>
      </main>
    </div>
  )
}