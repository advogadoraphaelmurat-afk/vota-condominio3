'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createSupabaseClient, getCurrentUser, getCondominioAtivo } from '@/lib/supabase'
import Link from 'next/link'

interface Comunicacao {
  id: string
  titulo: string
  conteudo: string
  tipo: string
  prioridade: string
  lida: boolean
  data_envio: string
  remetente: {
    id: string
    nome_completo: string
    email: string
    role: string
  }
}

export default function SindicoComunicacoesPage() {
  const router = useRouter()
  const [usuario, setUsuario] = useState<any>(null)
  const [comunicacoes, setComunicacoes] = useState<Comunicacao[]>([])
  const [filtro, setFiltro] = useState<string>('todas')
  const [busca, setBusca] = useState('')
  const [loading, setLoading] = useState(true)
  const [mostrarModal, setMostrarModal] = useState(false)
  const [comunicacaoSelecionada, setComunicacaoSelecionada] = useState<Comunicacao | null>(null)
  const [resposta, setResposta] = useState('')
  const [enviandoResposta, setEnviandoResposta] = useState(false)

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

      // Verificar se é síndico
      const supabase = createSupabaseClient()
      const { data: userData } = await supabase
        .from('usuarios')
        .select('role')
        .eq('id', user.id)
        .single()

      if (userData?.role !== 'sindico' && userData?.role !== 'admin') {
        alert('Acesso restrito a síndicos')
        router.push('/dashboard')
        return
      }

      const vinculo = await getCondominioAtivo(user.id)
      if (!vinculo) {
        alert('Nenhum condomínio encontrado')
        return
      }

      await carregarComunicacoes(vinculo.condominio_id)
    } catch (error) {
      console.error('Erro ao carregar dados:', error)
    } finally {
      setLoading(false)
    }
  }

  async function carregarComunicacoes(condominioId: string) {
    const supabase = createSupabaseClient()

    console.log('🔍 Síndico buscando comunicações...')
    console.log('   Condomínio ID:', condominioId)
    console.log('   Filtro:', filtro)

    let query = supabase
      .from('comunicacoes')
      .select(`
        *,
        remetente:usuarios!comunicacoes_remetente_id_fkey(
          id,
          nome_completo,
          email,
          role
        )
      `)
      .eq('condominio_id', condominioId)
      .order('data_envio', { ascending: false })

    if (filtro === 'nao_lidas') {
      query = query.eq('lida', false)
    } else if (filtro === 'lidas') {
      query = query.eq('lida', true)
    }

    const { data, error } = await query

    if (error) {
      console.error('❌ Erro ao carregar comunicações:', error)
      return
    }

    console.log('✅ Comunicações encontradas:', data?.length || 0)
    console.log('📊 Dados:', data)

    setComunicacoes(data || [])
  }

  useEffect(() => {
    if (usuario) {
      getCondominioAtivo(usuario.id).then(vinculo => {
        if (vinculo) carregarComunicacoes(vinculo.condominio_id)
      })
    }
  }, [filtro])

  async function marcarComoLida(comunicacaoId: string) {
    const supabase = createSupabaseClient()
    
    await supabase
      .from('comunicacoes')
      .update({ lida: true, data_leitura: new Date().toISOString() })
      .eq('id', comunicacaoId)

    setComunicacoes(prev =>
      prev.map(c => c.id === comunicacaoId ? { ...c, lida: true } : c)
    )
  }

  async function abrirModal(comunicacao: Comunicacao) {
    setComunicacaoSelecionada(comunicacao)
    setMostrarModal(true)
    
    if (!comunicacao.lida) {
      await marcarComoLida(comunicacao.id)
    }
  }

  async function enviarResposta() {
    if (!resposta.trim() || !comunicacaoSelecionada) {
      alert('Digite uma resposta')
      return
    }

    setEnviandoResposta(true)

    try {
      const supabase = createSupabaseClient()
      
      // Criar nova comunicação como resposta
      const { error } = await supabase
        .from('comunicacoes')
        .insert({
          condominio_id: comunicacaoSelecionada.remetente.id, // Enviar para o remetente
          remetente_id: usuario.id,
          titulo: `Re: ${comunicacaoSelecionada.titulo}`,
          conteudo: resposta,
          tipo: 'resposta',
          prioridade: comunicacaoSelecionada.prioridade,
          destinatarios: [comunicacaoSelecionada.remetente.id],
          lida: false
        })

      if (error) throw error

      alert('✅ Resposta enviada com sucesso!')
      setResposta('')
      setMostrarModal(false)
      setComunicacaoSelecionada(null)
    } catch (error: any) {
      alert('❌ Erro ao enviar resposta: ' + error.message)
    } finally {
      setEnviandoResposta(false)
    }
  }

  const comunicacoesFiltradas = comunicacoes.filter(c =>
    c.titulo.toLowerCase().includes(busca.toLowerCase()) ||
    c.conteudo.toLowerCase().includes(busca.toLowerCase()) ||
    c.remetente.nome_completo.toLowerCase().includes(busca.toLowerCase())
  )

  const contadores = {
    todas: comunicacoes.length,
    nao_lidas: comunicacoes.filter(c => !c.lida).length,
    lidas: comunicacoes.filter(c => c.lida).length,
  }

  const getTipoIcon = (tipo: string) => {
    switch (tipo) {
      case 'informativo': return '📋'
      case 'urgente': return '🚨'
      case 'denuncia': return '⚠️'
      case 'pedido': return '🙏'
      case 'reclamacao': return '😠'
      case 'elogio': return '👏'
      default: return '💬'
    }
  }

  const getPrioridadeColor = (prioridade: string, lida: boolean) => {
    if (lida) return 'border-l-gray-400 bg-gray-50'
    
    switch (prioridade) {
      case 'alta': return 'border-l-red-500 bg-red-50'
      case 'media': return 'border-l-yellow-500 bg-yellow-50'
      case 'baixa': return 'border-l-blue-500 bg-blue-50'
      default: return 'border-l-gray-400 bg-gray-50'
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Carregando comunicações...</p>
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
              <Link href="/sindico/dashboard" className="text-blue-600 hover:text-blue-700 text-sm mb-2 inline-block">
                ← Voltar ao Painel do Síndico
              </Link>
              <h1 className="text-2xl font-bold text-gray-900">
                💬 Comunicações Recebidas
              </h1>
              <p className="text-sm text-gray-600">
                Mensagens dos moradores
              </p>
            </div>
            {contadores.nao_lidas > 0 && (
              <div className="text-right">
                <span className="text-3xl font-bold text-orange-600">{contadores.nao_lidas}</span>
                <p className="text-sm text-gray-600">não lidas</p>
              </div>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Filtros */}
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
              onClick={() => setFiltro('nao_lidas')}
              className={`px-4 py-2 rounded-lg whitespace-nowrap transition ${
                filtro === 'nao_lidas'
                  ? 'bg-orange-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              📩 Não Lidas ({contadores.nao_lidas})
            </button>
            <button
              onClick={() => setFiltro('lidas')}
              className={`px-4 py-2 rounded-lg whitespace-nowrap transition ${
                filtro === 'lidas'
                  ? 'bg-green-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              ✓ Lidas ({contadores.lidas})
            </button>
          </div>

          <div className="relative">
            <input
              type="text"
              placeholder="Buscar comunicação..."
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              className="w-full px-4 py-2 pl-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <span className="absolute left-3 top-2.5 text-gray-400">🔍</span>
          </div>
        </div>

        {/* Lista de Comunicações */}
        {comunicacoesFiltradas.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <div className="text-6xl mb-4">💬</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              {busca ? 'Nenhuma comunicação encontrada' : 'Nenhuma comunicação'}
            </h3>
            <p className="text-gray-600">
              {busca ? 'Tente buscar com outros termos' : 'Ainda não há comunicações dos moradores'}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {comunicacoesFiltradas.map((com) => (
              <div
                key={com.id}
                onClick={() => abrirModal(com)}
                className={`border-l-4 rounded-lg p-6 cursor-pointer transition-all hover:shadow-lg ${getPrioridadeColor(
                  com.prioridade,
                  com.lida
                )}`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-start gap-3 flex-1">
                    <span className="text-2xl">{getTipoIcon(com.tipo)}</span>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className={`text-lg font-semibold text-gray-900 ${!com.lida ? 'font-bold' : ''}`}>
                          {com.titulo}
                        </h3>
                        {!com.lida && (
                          <span className="flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-2 w-2 rounded-full bg-orange-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-orange-500"></span>
                          </span>
                        )}
                      </div>
                      
                      <p className="text-sm text-gray-700 mb-3 line-clamp-2">
                        {com.conteudo}
                      </p>

                      <div className="flex items-center gap-4 text-sm text-gray-500">
                        <span>👤 {com.remetente.nome_completo}</span>
                        <span>📧 {com.remetente.email}</span>
                        <span>📅 {new Date(com.data_envio).toLocaleDateString('pt-BR')}</span>
                      </div>
                    </div>
                  </div>
                  <div className="ml-4">
                    {com.lida ? (
                      <span className="text-green-600 text-sm">✓ Lida</span>
                    ) : (
                      <span className="text-orange-600 text-sm font-bold">Nova</span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Modal de Detalhes e Resposta */}
      {mostrarModal && comunicacaoSelecionada && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-3xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-start mb-4">
              <h2 className="text-2xl font-bold text-gray-900">
                {getTipoIcon(comunicacaoSelecionada.tipo)} {comunicacaoSelecionada.titulo}
              </h2>
              <button
                onClick={() => setMostrarModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>

            <div className="mb-6">
              <div className="bg-gray-50 rounded-lg p-4 mb-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">De:</span>
                    <p className="font-medium">{comunicacaoSelecionada.remetente.nome_completo}</p>
                    <p className="text-gray-600">{comunicacaoSelecionada.remetente.email}</p>
                  </div>
                  <div>
                    <span className="text-gray-600">Data:</span>
                    <p className="font-medium">
                      {new Date(comunicacaoSelecionada.data_envio).toLocaleDateString('pt-BR')} às{' '}
                      {new Date(comunicacaoSelecionada.data_envio).toLocaleTimeString('pt-BR', {
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-blue-50 rounded-lg p-4">
                <h3 className="font-semibold mb-2">Mensagem:</h3>
                <p className="text-gray-800 whitespace-pre-wrap">{comunicacaoSelecionada.conteudo}</p>
              </div>
            </div>

            <div className="border-t pt-4">
              <h3 className="font-semibold mb-3">✉️ Enviar Resposta:</h3>
              <textarea
                value={resposta}
                onChange={(e) => setResposta(e.target.value)}
                placeholder="Digite sua resposta..."
                rows={6}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none mb-4"
              />
              <div className="flex gap-3">
                <button
                  onClick={enviarResposta}
                  disabled={enviandoResposta || !resposta.trim()}
                  className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition font-medium"
                >
                  {enviandoResposta ? 'Enviando...' : '📨 Enviar Resposta'}
                </button>
                <button
                  onClick={() => setMostrarModal(false)}
                  className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition font-medium"
                >
                  Fechar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}