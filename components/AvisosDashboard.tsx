'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createSupabaseClient, getCondominioAtivo } from '@/lib/supabase'

interface Aviso {
  id: string
  titulo: string
  conteudo: string
  tipo: string
  prioridade: string
  fixado: boolean
  visivel: boolean
  created_at: string
  updated_at: string
}

interface AvisosDashboardProps {
  userId: string
}

export default function AvisosDashboard({ userId }: AvisosDashboardProps) {
  const router = useRouter()
  const [avisos, setAvisos] = useState<Aviso[]>([])
  const [loading, setLoading] = useState(true)
  const [expandido, setExpandido] = useState<string | null>(null)

  useEffect(() => {
    carregarAvisos()
  }, [userId])

  const carregarAvisos = async () => {
    try {
      const supabase = createSupabaseClient()
      const vinculo = await getCondominioAtivo(userId)

      if (!vinculo) {
        setLoading(false)
        return
      }

      const { data, error } = await supabase
        .from('avisos')
        .select('*')
        .eq('condominio_id', vinculo.condominio_id)
        .eq('visivel', true)
        .order('fixado', { ascending: false })
        .order('created_at', { ascending: false })
        .limit(5)

      if (error) throw error

      setAvisos(data || [])
    } catch (error) {
      console.error('Erro ao carregar avisos:', error)
    } finally {
      setLoading(false)
    }
  }

  const getPrioridadeIcon = (prioridade: string) => {
    switch (prioridade) {
      case 'alta':
        return '🔴'
      case 'media':
        return '🟡'
      case 'baixa':
        return '🟢'
      default:
        return '📌'
    }
  }

  const getTipoIcon = (tipo: string) => {
    switch (tipo) {
      case 'manutencao':
        return '🔧'
      case 'evento':
        return '🎉'
      case 'assembleia':
        return '👥'
      case 'cobranca':
        return '💰'
      case 'regulamento':
        return '📋'
      case 'seguranca':
        return '🚨'
      default:
        return '📢'
    }
  }

  const getPrioridadeColor = (prioridade: string) => {
    switch (prioridade) {
      case 'alta':
        return 'border-l-red-500 bg-red-50'
      case 'media':
        return 'border-l-yellow-500 bg-yellow-50'
      case 'baixa':
        return 'border-l-green-500 bg-green-50'
      default:
        return 'border-l-blue-500 bg-blue-50'
    }
  }

  const formatarData = (data: string) => {
    const dataAviso = new Date(data)
    const hoje = new Date()
    const diferenca = hoje.getTime() - dataAviso.getTime()
    const dias = Math.floor(diferenca / (1000 * 60 * 60 * 24))

    if (dias === 0) return 'Hoje'
    if (dias === 1) return 'Ontem'
    if (dias < 7) return `Há ${dias} dias`
    
    return dataAviso.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    })
  }

  const truncarTexto = (texto: string, limite: number = 150) => {
    if (texto.length <= limite) return texto
    return texto.substring(0, limite) + '...'
  }

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-900">📢 Avisos</h2>
        </div>
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="animate-pulse">
              <div className="h-24 bg-gray-200 rounded-lg"></div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (avisos.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-900">📢 Avisos</h2>
        </div>
        <div className="text-center py-8">
          <div className="text-gray-400 text-4xl mb-3">📭</div>
          <p className="text-gray-600">Nenhum aviso no momento</p>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-gray-900">📢 Avisos</h2>
        <button
          onClick={() => router.push('/avisos')}
          className="text-sm text-blue-600 hover:text-blue-700 font-medium"
        >
          Ver todos →
        </button>
      </div>

      {/* Lista de Avisos */}
      <div className="space-y-3">
        {avisos.map((aviso) => {
          const estaExpandido = expandido === aviso.id
          const textoCompleto = aviso.conteudo
          const textoTruncado = truncarTexto(aviso.conteudo)
          const precisaTruncar = textoCompleto.length > 150

          return (
            <div
              key={aviso.id}
              className={`border-l-4 rounded-lg p-4 transition-all ${getPrioridadeColor(
                aviso.prioridade
              )}`}
            >
              {/* Header do Aviso */}
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-start gap-2 flex-1">
                  <span className="text-xl">
                    {getTipoIcon(aviso.tipo)}
                  </span>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-gray-900">
                        {aviso.titulo}
                      </h3>
                      {aviso.fixado && (
                        <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
                          Fixado
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-500">
                      {formatarData(aviso.created_at)}
                    </p>
                  </div>
                </div>
                <span className="text-lg ml-2">
                  {getPrioridadeIcon(aviso.prioridade)}
                </span>
              </div>

              {/* Conteúdo do Aviso */}
              <div className="mt-2">
                <p className="text-sm text-gray-700 whitespace-pre-wrap">
                  {estaExpandido ? textoCompleto : textoTruncado}
                </p>
                
                {precisaTruncar && (
                  <button
                    onClick={() => setExpandido(estaExpandido ? null : aviso.id)}
                    className="text-xs text-blue-600 hover:text-blue-700 font-medium mt-2"
                  >
                    {estaExpandido ? 'Ver menos' : 'Ver mais'}
                  </button>
                )}
              </div>

              {/* Footer do Aviso */}
              <div className="mt-3 pt-3 border-t border-gray-200">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-500 capitalize">
                    {aviso.tipo.replace('_', ' ')}
                  </span>
                  <button
                    onClick={() => router.push(`/avisos/${aviso.id}`)}
                    className="text-blue-600 hover:text-blue-700 font-medium"
                  >
                    Ver detalhes →
                  </button>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Footer - Link para todos os avisos */}
      {avisos.length >= 5 && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <button
            onClick={() => router.push('/avisos')}
            className="w-full text-center text-sm text-gray-600 hover:text-gray-900 font-medium"
          >
            Ver todos os avisos ({avisos.length}+)
          </button>
        </div>
      )}
    </div>
  )
}