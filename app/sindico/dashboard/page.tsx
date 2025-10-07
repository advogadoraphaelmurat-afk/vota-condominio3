'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createSupabaseClient } from '@/lib/supabase'
import Link from 'next/link'

interface Usuario {
  id: string
  nome_completo: string
  email: string
  role: string
  ativo: boolean
}

interface Stats {
  total_moradores: number
  moradores_pendentes: number
  votacoes_ativas: number
  votacoes_total: number
  participacao_media: number
  avisos_ativos: number
  mensagens_nao_lidas: number
}

interface MoradorPendente {
  id: string
  nome_completo: string
  email: string
  created_at: string
}

interface VotacaoRecente {
  id: string
  titulo: string
  status: string
  data_fim: string
  total_votos: number
}

interface Mensagem {
  id: string
  titulo: string
  conteudo: string
  tipo: string
  prioridade: string
  enviado_por: string
  remetente?: {
    nome_completo: string
    email: string
  }
  data_envio: string
  lida?: boolean
}

export default function SindicoDashboardPage() {
  const router = useRouter()
  const [usuario, setUsuario] = useState<Usuario | null>(null)
  const [condominioId, setCondominioId] = useState<string>('')
  const [stats, setStats] = useState<Stats>({
    total_moradores: 0,
    moradores_pendentes: 0,
    votacoes_ativas: 0,
    votacoes_total: 0,
    participacao_media: 0,
    avisos_ativos: 0,
    mensagens_nao_lidas: 0
  })
  const [moradoresPendentes, setMoradoresPendentes] = useState<MoradorPendente[]>([])
  const [votacoesRecentes, setVotacoesRecentes] = useState<VotacaoRecente[]>([])
  const [mensagens, setMensagens] = useState<Mensagem[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createSupabaseClient()

  useEffect(() => {
    verificarPermissao()
  }, [])

  async function verificarPermissao() {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        router.push('/login')
        return
      }

      const { data: userData } = await supabase
        .from('usuarios')
        .select('*')
        .eq('auth_id', user.id)
        .single()

      if (!userData || !userData.ativo) {
        alert('Acesso negado')
        router.push('/dashboard')
        return
      }

      // Verificar se é síndico
      const { data: vinculo } = await supabase
        .from('usuarios_condominios')
        .select('*, condominio:condominios(*)')
        .eq('usuario_id', userData.id)
        .eq('status', 'ativo')
        .single()

      if (!vinculo || (vinculo.papel !== 'sindico' && userData.role !== 'admin')) {
        alert('Apenas síndicos podem acessar esta área')
        router.push('/dashboard')
        return
      }

      setUsuario(userData)
      setCondominioId(vinculo.condominio_id)
      await carregarDados(vinculo.condominio_id)
    } catch (error) {
      console.error('Erro:', error)
      router.push('/dashboard')
    } finally {
      setLoading(false)
    }
  }

  async function carregarDados(condId: string) {
    await carregarEstatisticas(condId)
    await carregarMoradoresPendentes(condId)
    await carregarVotacoesRecentes(condId)
    await carregarMensagens(condId)
  }

  async function carregarEstatisticas(condId: string) {
    // Total de moradores ativos
    const { count: totalMoradores } = await supabase
      .from('usuarios_condominios')
      .select('*', { count: 'exact', head: true })
      .eq('condominio_id', condId)
      .eq('status', 'ativo')

    // Moradores pendentes
    const { count: pendentes } = await supabase
      .from('usuarios')
      .select('*', { count: 'exact', head: true })
      .eq('ativo', false)

    // Votações ativas
    const { count: votacoesAtivas } = await supabase
      .from('votacoes')
      .select('*', { count: 'exact', head: true })
      .eq('condominio_id', condId)
      .eq('status', 'ativa')

    // Total de votações
    const { count: votacoesTotal } = await supabase
      .from('votacoes')
      .select('*', { count: 'exact', head: true })
      .eq('condominio_id', condId)

    // Avisos ativos
    const hoje = new Date().toISOString()
    const { count: avisosAtivos } = await supabase
      .from('avisos')
      .select('*', { count: 'exact', head: true })
      .eq('condominio_id', condId)
      .eq('visivel', true)
      .or(`data_expiracao.is.null,data_expiracao.gte.${hoje}`)

    // Mensagens não lidas (comunicações recebidas)
    const { count: mensagensNaoLidas } = await supabase
      .from('comunicacoes')
      .select('*', { count: 'exact', head: true })
      .eq('condominio_id', condId)
      .eq('status', 'enviado')

    setStats({
      total_moradores: totalMoradores || 0,
      moradores_pendentes: pendentes || 0,
      votacoes_ativas: votacoesAtivas || 0,
      votacoes_total: votacoesTotal || 0,
      participacao_media: 0,
      avisos_ativos: avisosAtivos || 0,
      mensagens_nao_lidas: mensagensNaoLidas || 0
    })
  }

  async function carregarMoradoresPendentes(condId: string) {
    const { data } = await supabase
      .from('usuarios')
      .select('id, nome_completo, email, created_at')
      .eq('ativo', false)
      .order('created_at', { ascending: false })
      .limit(5)

    if (data) {
      setMoradoresPendentes(data)
    }
  }

  async function carregarVotacoesRecentes(condId: string) {
    const { data } = await supabase
      .from('votacoes')
      .select('id, titulo, status, data_fim')
      .eq('condominio_id', condId)
      .order('created_at', { ascending: false })
      .limit(5)

    if (data) {
      setVotacoesRecentes(data.map(v => ({
        ...v,
        total_votos: 0
      })))
    }
  }

  async function carregarMensagens(condId: string) {
    const { data } = await supabase
      .from('comunicacoes')
      .select(`
        id,
        titulo,
        conteudo,
        tipo,
        prioridade,
        enviado_por,
        data_envio,
        status
      `)
      .eq('condominio_id', condId)
      .eq('status', 'enviado')
      .order('data_envio', { ascending: false })
      .limit(5)

    if (data) {
      setMensagens(data.map(m => ({
        ...m,
        lida: false
      })))
    }
  }

  async function aprovarMorador(moradorId: string) {
    const confirmacao = confirm('Aprovar este morador?')
    if (!confirmacao) return

    const { error } = await supabase
      .from('usuarios')
      .update({ ativo: true })
      .eq('id', moradorId)

    if (error) {
      alert('Erro ao aprovar morador')
      return
    }

    alert('Morador aprovado com sucesso!')
    carregarMoradoresPendentes(condominioId)
    carregarEstatisticas(condominioId)
  }

  async function rejeitarMorador(moradorId: string) {
    const confirmacao = confirm('Rejeitar este morador? Esta ação não pode ser desfeita.')
    if (!confirmacao) return

    const { error } = await supabase
      .from('usuarios')
      .delete()
      .eq('id', moradorId)

    if (error) {
      alert('Erro ao rejeitar morador')
      return
    }

    alert('Morador rejeitado')
    carregarMoradoresPendentes(condominioId)
    carregarEstatisticas(condominioId)
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Carregando painel do síndico...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex justify-between items-center">
            <div>
              <Link href="/dashboard" className="text-blue-100 hover:text-white text-sm mb-2 inline-block">
                ← Voltar ao Dashboard
              </Link>
              <h1 className="text-3xl font-bold flex items-center gap-2">
                👑 Painel do Síndico
              </h1>
              <p className="text-blue-100 mt-1">
                Gestão completa do condomínio
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm text-blue-100">Bem-vindo,</p>
              <p className="font-semibold">{usuario?.nome_completo}</p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Cards de Estatísticas */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Total Moradores */}
          <div className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total de Moradores</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">
                  {stats.total_moradores}
                </p>
              </div>
              <div className="text-4xl">👥</div>
            </div>
            <Link href="/moradores" className="text-sm text-blue-600 hover:text-blue-700 mt-4 inline-block">
              Gerenciar →
            </Link>
          </div>

          {/* Moradores Pendentes */}
          <div className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Aguardando Aprovação</p>
                <p className="text-3xl font-bold text-orange-600 mt-2">
                  {stats.moradores_pendentes}
                </p>
              </div>
              <div className="text-4xl">⏳</div>
            </div>
            {stats.moradores_pendentes > 0 && (
              <p className="text-sm text-orange-600 mt-4 font-medium">
                ⚠️ Requer atenção!
              </p>
            )}
          </div>

          {/* Votações Ativas */}
          <div className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Votações Ativas</p>
                <p className="text-3xl font-bold text-green-600 mt-2">
                  {stats.votacoes_ativas}
                </p>
              </div>
              <div className="text-4xl">🗳️</div>
            </div>
            <Link href="/votacoes" className="text-sm text-blue-600 hover:text-blue-700 mt-4 inline-block">
              Ver todas →
            </Link>
          </div>

          {/* Mensagens Não Lidas */}
          <div className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Mensagens Recebidas</p>
                <p className="text-3xl font-bold text-purple-600 mt-2">
                  {stats.mensagens_nao_lidas}
                </p>
              </div>
              <div className="text-4xl">💬</div>
            </div>
            <Link href="/comunicacoes" className="text-sm text-blue-600 hover:text-blue-700 mt-4 inline-block">
              Ver mensagens →
            </Link>
          </div>
        </div>

        {/* Ações Rápidas */}
        <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg shadow-lg p-6 mb-8">
          <h2 className="text-xl font-bold text-white mb-4">⚡ Ações Rápidas</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Link
              href="/votacoes/nova"
              className="bg-white text-gray-900 rounded-lg p-4 hover:shadow-lg transition text-center"
            >
              <div className="text-3xl mb-2">🗳️</div>
              <h3 className="font-semibold">Nova Votação</h3>
              <p className="text-sm text-gray-600 mt-1">Criar votação para moradores</p>
            </Link>

            <Link
              href="/avisos/novo"
              className="bg-white text-gray-900 rounded-lg p-4 hover:shadow-lg transition text-center"
            >
              <div className="text-3xl mb-2">📢</div>
              <h3 className="font-semibold">Novo Aviso</h3>
              <p className="text-sm text-gray-600 mt-1">Publicar aviso no mural</p>
            </Link>

            <Link
              href="/comunicacoes/nova"
              className="bg-white text-gray-900 rounded-lg p-4 hover:shadow-lg transition text-center"
            >
              <div className="text-3xl mb-2">✉️</div>
              <h3 className="font-semibold">Enviar Comunicado</h3>
              <p className="text-sm text-gray-600 mt-1">Comunicação direcionada</p>
            </Link>
          </div>
        </div>

        {/* Grid Principal */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Coluna Principal */}
          <div className="lg:col-span-2 space-y-6">
            {/* Moradores Pendentes */}
            {moradoresPendentes.length > 0 && (
              <div className="bg-white rounded-lg shadow">
                <div className="p-6 border-b bg-orange-50">
                  <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                    ⏳ Moradores Aguardando Aprovação
                  </h2>
                  <p className="text-sm text-gray-600 mt-1">
                    {moradoresPendentes.length} {moradoresPendentes.length === 1 ? 'pessoa aguardando' : 'pessoas aguardando'}
                  </p>
                </div>
                <div className="divide-y">
                  {moradoresPendentes.map((morador) => (
                    <div key={morador.id} className="p-6 hover:bg-gray-50 transition">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-900">
                            {morador.nome_completo}
                          </h3>
                          <p className="text-sm text-gray-600">{morador.email}</p>
                          <p className="text-xs text-gray-500 mt-1">
                            Cadastro: {new Date(morador.created_at).toLocaleDateString('pt-BR')}
                          </p>
                        </div>
                        <div className="flex gap-2 ml-4">
                          <button
                            onClick={() => aprovarMorador(morador.id)}
                            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm font-medium transition"
                          >
                            ✓ Aprovar
                          </button>
                          <button
                            onClick={() => rejeitarMorador(morador.id)}
                            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm font-medium transition"
                          >
                            ✗ Rejeitar
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="p-4 bg-gray-50 border-t">
                  <Link href="/moradores" className="text-sm text-blue-600 hover:text-blue-700 font-medium">
                    Ver todos os moradores →
                  </Link>
                </div>
              </div>
            )}

            {/* Mensagens Recebidas */}
            <div className="bg-white rounded-lg shadow">
              <div className="p-6 border-b">
                <div className="flex justify-between items-center">
                  <div>
                    <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                      💬 Mensagens de Moradores
                    </h2>
                    <p className="text-sm text-gray-600 mt-1">
                      Canal direto de comunicação
                    </p>
                  </div>
                  <Link
                    href="/comunicacoes"
                    className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                  >
                    Ver todas →
                  </Link>
                </div>
              </div>
              {mensagens.length === 0 ? (
                <div className="p-12 text-center">
                  <div className="text-5xl mb-4">✉️</div>
                  <p className="text-gray-600">Nenhuma mensagem recebida</p>
                  <p className="text-sm text-gray-500 mt-2">
                    As mensagens dos moradores aparecerão aqui
                  </p>
                </div>
              ) : (
                <div className="divide-y">
                  {mensagens.map((msg) => (
                    <div key={msg.id} className="p-4 hover:bg-gray-50 transition">
                      <div className="flex items-start gap-3">
                        <div className={`text-2xl ${
                          msg.prioridade === 'urgente' ? 'animate-pulse' : ''
                        }`}>
                          {msg.prioridade === 'urgente' && '🚨'}
                          {msg.prioridade === 'alta' && '⚠️'}
                          {msg.prioridade === 'media' && '📌'}
                          {msg.prioridade === 'baixa' && '💬'}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-start justify-between">
                            <h4 className="font-semibold text-gray-900">
                              {msg.titulo}
                            </h4>
                            <span className={`text-xs px-2 py-1 rounded ${
                              msg.prioridade === 'urgente' 
                                ? 'bg-red-100 text-red-700'
                                : msg.prioridade === 'alta'
                                ? 'bg-orange-100 text-orange-700'
                                : 'bg-blue-100 text-blue-700'
                            }`}>
                              {msg.tipo}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                            {msg.conteudo}
                          </p>
                          <div className="flex items-center justify-between mt-2">
                            <p className="text-xs text-gray-500">
                              {new Date(msg.data_envio).toLocaleString('pt-BR')}
                            </p>
                            <button className="text-xs text-blue-600 hover:text-blue-700 font-medium">
                              Responder →
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Votações Recentes */}
            <div className="bg-white rounded-lg shadow">
              <div className="p-6 border-b">
                <h2 className="text-xl font-bold text-gray-900">
                  🗳️ Votações Recentes
                </h2>
              </div>
              {votacoesRecentes.length === 0 ? (
                <div className="p-12 text-center">
                  <div className="text-5xl mb-4">🗳️</div>
                  <p className="text-gray-600">Nenhuma votação criada</p>
                  <Link
                    href="/votacoes/nova"
                    className="inline-block mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    Criar primeira votação
                  </Link>
                </div>
              ) : (
                <div className="divide-y">
                  {votacoesRecentes.map((votacao) => (
                    <Link
                      key={votacao.id}
                      href={`/votacoes/${votacao.id}`}
                      className="block p-4 hover:bg-gray-50 transition"
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <h4 className="font-semibold text-gray-900">
                            {votacao.titulo}
                          </h4>
                          <p className="text-sm text-gray-600 mt-1">
                            Encerra: {new Date(votacao.data_fim).toLocaleDateString('pt-BR')}
                          </p>
                        </div>
                        <span className={`text-xs px-3 py-1 rounded-full ${
                          votacao.status === 'ativa'
                            ? 'bg-green-100 text-green-700'
                            : votacao.status === 'encerrada'
                            ? 'bg-gray-100 text-gray-700'
                            : 'bg-yellow-100 text-yellow-700'
                        }`}>
                          {votacao.status}
                        </span>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1 space-y-6">
            {/* Menu Rápido */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="font-bold text-gray-900 mb-4">📋 Menu Rápido</h3>
              <div className="space-y-2">
                <Link
                  href="/moradores"
                  className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg transition"
                >
                  👥 Gerenciar Moradores
                </Link>
                <Link
                  href="/votacoes"
                  className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg transition"
                >
                  🗳️ Todas as Votações
                </Link>
                <Link
                  href="/avisos"
                  className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg transition"
                >
                  📢 Gerenciar Avisos
                </Link>
                <Link
                  href="/comunicacoes"
                  className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg transition"
                >
                  💬 Comunicações
                </Link>
                <Link
                  href="/relatorios"
                  className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg transition"
                >
                  📊 Relatórios
                </Link>
              </div>
            </div>

            {/* Estatísticas Extras */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="font-bold text-gray-900 mb-4">📈 Estatísticas</h3>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-600">Avisos Ativos</span>
                    <span className="font-semibold">{stats.avisos_ativos}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full" 
                      style={{ width: `${Math.min((stats.avisos_ativos / 10) * 100, 100)}%` }}
                    ></div>
                  </div>
                </div>
                
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-600">Total Votações</span>
                    <span className="font-semibold">{stats.votacoes_total}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-green-600 h-2 rounded-full" 
                      style={{ width: `${Math.min((stats.votacoes_total / 20) * 100, 100)}%` }}
                    ></div>
                  </div>
                </div>

                <div className="pt-4 border-t">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-blue-600">
                      {stats.participacao_media}%
                    </div>
                    <div className="text-xs text-gray-600 mt-1">
                      Participação Média
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Dicas */}
            <div className="bg-gradient-to-br from-purple-50 to-blue-50 rounded-lg shadow p-6">
              <h3 className="font-bold text-gray-900 mb-3">💡 Dicas</h3>
              <ul className="text-sm text-gray-700 space-y-2">
                <li>• Aprove moradores rapidamente</li>
                <li>• Crie votações com antecedência</li>
                <li>• Mantenha avisos atualizados</li>
                <li>• Responda mensagens em 24h</li>
              </ul>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}