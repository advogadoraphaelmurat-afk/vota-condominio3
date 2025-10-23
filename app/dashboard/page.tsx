// app/comunicacoes/page.tsx - SISTEMA PARA MORADORES (Enviar para Síndico)

'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createSupabaseClient, getCurrentUser, getCondominioAtivo } from '@/lib/supabase'
import Link from 'next/link'

interface Comunicacao {
  id: string
  titulo: string
  conteudo: string
  tipo: string
  prioridade: string
  anonimo: boolean
  data_envio: string
  lida: boolean
  data_leitura?: string
  resposta_sindico?: string
  data_resposta?: string
}

export default function ComunicacoesPage() {
  const router = useRouter()
  const [usuario, setUsuario] = useState<any>(null)
  const [condominioId, setCondominioId] = useState<string>('')
  const [comunicacoes, setComunicacoes] = useState<Comunicacao[]>([])
  const [loading, setLoading] = useState(true)
  const [mostrarForm, setMostrarForm] = useState(false)
  const [enviando, setEnviando] = useState(false)

  const [novaComunicacao, setNovaComunicacao] = useState({
    tipo: 'pedido' as string,
    titulo: '',
    conteudo: '',
    prioridade: 'media' as string,
    anonimo: false
  })

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

      const vinculo = await getCondominioAtivo(user.id)
      if (!vinculo) {
        alert('Nenhum condomínio encontrado')
        return
      }

      setCondominioId(vinculo.condominio_id)
      await carregarComunicacoes(user.id, vinculo.condominio_id)
    } catch (error) {
      console.error('Erro ao carregar dados:', error)
    } finally {
      setLoading(false)
    }
  }

  async function carregarComunicacoes(userId: string, condId: string) {
    const supabase = createSupabaseClient()

    console.log('🔍 Buscando comunicações...')
    console.log('   User ID:', userId)
    console.log('   Condomínio ID:', condId)

    // Buscar comunicações ENVIADAS pelo morador
    const { data, error } = await supabase
      .from('comunicacoes')
      .select('*')
      .eq('remetente_id', userId)
      .eq('condominio_id', condId)
      .order('data_envio', { ascending: false })

    if (error) {
      console.error('❌ Erro ao buscar comunicações:', error)
      return
    }

    console.log('✅ Comunicações encontradas:', data?.length || 0)
    setComunicacoes(data || [])
  }

  async function handleEnviar(e: React.FormEvent) {
    e.preventDefault()

    if (!novaComunicacao.titulo.trim() || !novaComunicacao.conteudo.trim()) {
      alert('⚠️ Preencha título e conteúdo')
      return
    }

    setEnviando(true)

    try {
      const supabase = createSupabaseClient()

      console.log('📤 Enviando comunicação...')
      console.log('   De:', usuario.id)
      console.log('   Condomínio:', condominioId)

      const { error } = await supabase
        .from('comunicacoes')
        .insert({
          remetente_id: usuario.id,
          condominio_id: condominioId,
          titulo: novaComunicacao.titulo,
          conteudo: novaComunicacao.conteudo,
          tipo: novaComunicacao.tipo,
          prioridade: novaComunicacao.prioridade,
          anonimo: novaComunicacao.anonimo,
          lida: false,
          data_envio: new Date().toISOString()
        })

      if (error) {
        console.error('❌ Erro ao enviar:', error)
        throw error
      }

      console.log('✅ Comunicação enviada!')
      alert('✅ Mensagem enviada ao síndico com sucesso!')

      // Resetar formulário
      setNovaComunicacao({
        tipo: 'pedido',
        titulo: '',
        conteudo: '',
        prioridade: 'media',
        anonimo: false
      })

      setMostrarForm(false)

      // Recarregar lista
      await carregarComunicacoes(usuario.id, condominioId)

    } catch (error: any) {
      alert('❌ Erro ao enviar mensagem: ' + error.message)
    } finally {
      setEnviando(false)
    }
  }

  const getTipoIcon = (tipo: string) => {
    switch (tipo) {
      case 'pedido': return '🙏'
      case 'denuncia': return '⚠️'
      case 'reclamacao': return '😠'
      case 'elogio': return '👏'
      case 'ideia': return '💡'
      case 'outro': return '💬'
      default: return '📝'
    }
  }

  const getPrioridadeColor = (prioridade: string) => {
    switch (prioridade) {
      case 'alta': return 'border-l-red-500 bg-red-50'
      case 'media': return 'border-l-yellow-500 bg-yellow-50'
      case 'baixa': return 'border-l-blue-500 bg-blue-50'
      default: return 'border-l-gray-500 bg-gray-50'
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Carregando...</p>
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
                💬 Comunicação com o Síndico
              </h1>
              <p className="text-sm text-gray-600">
                Envie mensagens diretamente para o síndico
              </p>
            </div>
            <button
              onClick={() => setMostrarForm(!mostrarForm)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
            >
              {mostrarForm ? '✕ Cancelar' : '➕ Nova Mensagem'}
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Formulário */}
        {mostrarForm && (
          <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4">Nova Mensagem</h2>
            <form onSubmit={handleEnviar} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tipo de Comunicação *
                  </label>
                  <select
                    value={novaComunicacao.tipo}
                    onChange={(e) => setNovaComunicacao({...novaComunicacao, tipo: e.target.value})}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="pedido">🙏 Pedido</option>
                    <option value="denuncia">⚠️ Denúncia</option>
                    <option value="reclamacao">😠 Reclamação</option>
                    <option value="elogio">👏 Elogio</option>
                    <option value="ideia">💡 Sugestão/Ideia</option>
                    <option value="outro">💬 Outro</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Prioridade *
                  </label>
                  <select
                    value={novaComunicacao.prioridade}
                    onChange={(e) => setNovaComunicacao({...novaComunicacao, prioridade: e.target.value})}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="baixa">🟢 Baixa</option>
                    <option value="media">🟡 Média</option>
                    <option value="alta">🔴 Alta</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Assunto *
                </label>
                <input
                  type="text"
                  value={novaComunicacao.titulo}
                  onChange={(e) => setNovaComunicacao({...novaComunicacao, titulo: e.target.value})}
                  placeholder="Digite o assunto..."
                  required
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Mensagem *
                </label>
                <textarea
                  value={novaComunicacao.conteudo}
                  onChange={(e) => setNovaComunicacao({...novaComunicacao, conteudo: e.target.value})}
                  placeholder="Descreva sua comunicação..."
                  rows={5}
                  required
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 resize-none"
                />
              </div>

              <div className="flex items-center">
                <input
                  id="anonimo"
                  type="checkbox"
                  checked={novaComunicacao.anonimo}
                  onChange={(e) => setNovaComunicacao({...novaComunicacao, anonimo: e.target.checked})}
                  className="w-4 h-4 border-gray-300 rounded"
                />
                <label htmlFor="anonimo" className="ml-2 text-sm text-gray-700">
                  Enviar como anônimo
                </label>
              </div>

              <button
                type="submit"
                disabled={enviando}
                className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition font-medium"
              >
                {enviando ? '📤 Enviando...' : '✉️ Enviar Mensagem'}
              </button>
            </form>
          </div>
        )}

        {/* Lista de Mensagens Enviadas */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-xl font-semibold mb-4">
            📬 Minhas Mensagens ({comunicacoes.length})
          </h2>

          {comunicacoes.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">💬</div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Nenhuma mensagem enviada
              </h3>
              <p className="text-gray-500 mb-6">
                Clique em "Nova Mensagem" para enviar uma comunicação ao síndico
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {comunicacoes.map((com) => (
                <div
                  key={com.id}
                  className={`border-l-4 rounded-lg p-4 ${getPrioridadeColor(com.prioridade)}`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">{getTipoIcon(com.tipo)}</span>
                      <div>
                        <h3 className="font-semibold text-gray-900">{com.titulo}</h3>
                        <p className="text-xs text-gray-500">
                          Enviada em {new Date(com.data_envio).toLocaleDateString('pt-BR')} às{' '}
                          {new Date(com.data_envio).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    </div>
                    <div>
                      {com.lida ? (
                        <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">
                          ✓ Lida {com.data_leitura && `em ${new Date(com.data_leitura).toLocaleDateString('pt-BR')}`}
                        </span>
                      ) : (
                        <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-1 rounded-full">
                          ⏳ Aguardando leitura
                        </span>
                      )}
                    </div>
                  </div>

                  <p className="text-gray-700 mb-3">{com.conteudo}</p>

                  {com.resposta_sindico && (
                    <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-lg">👔</span>
                        <h4 className="font-semibold text-blue-900">Resposta do Síndico:</h4>
                      </div>
                      <p className="text-blue-800">{com.resposta_sindico}</p>
                      {com.data_resposta && (
                        <p className="text-xs text-blue-600 mt-2">
                          Respondido em {new Date(com.data_resposta).toLocaleString('pt-BR')}
                        </p>
                      )}
                    </div>
                  )}

                  <div className="mt-3 flex items-center gap-3 text-xs text-gray-500">
                    <span className="capitalize">{com.tipo}</span>
                    <span>•</span>
                    <span className="capitalize">Prioridade: {com.prioridade}</span>
                    {com.anonimo && (
                      <>
                        <span>•</span>
                        <span className="text-orange-600">Anônimo</span>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}