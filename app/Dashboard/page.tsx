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
  auth_id?: string
}

interface CondominioVinculo {
  id: string
  condominio_id: string
  unidade_id: string | null
  papel: string
  status: string
  condominio: {
    id: string
    nome: string
  } | null
  unidade?: {
    numero: string
    bloco: string | null
  } | null
}

interface Votacao {
  id: string
  titulo: string
  descricao: string
  data_fim: string
  status: string
  tipo: string
}

interface Aviso {
  id: string
  titulo: string
  conteudo: string
  tipo: string
  prioridade: string
  data_publicacao: string
  fixado: boolean
}

export default function DashboardPage() {
  const router = useRouter()
  const [usuario, setUsuario] = useState<Usuario | null>(null)
  const [vinculo, setVinculo] = useState<CondominioVinculo | null>(null)
  const [votacoes, setVotacoes] = useState<Votacao[]>([])
  const [avisos, setAvisos] = useState<Aviso[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createSupabaseClient()

  useEffect(() => {
    verificarAutenticacao()
  }, [])

  async function verificarAutenticacao() {
    try {
      // Verificar autenticação do Supabase
      const { data: { user }, error: authError } = await supabase.auth.getUser()
      
      if (authError || !user) {
        console.log('Usuário não autenticado')
        router.push('/login')
        return
      }

      // Buscar dados do usuário usando auth_id
      const { data: userData, error: userError } = await supabase
        .from('usuarios')
        .select('*')
        .eq('auth_id', user.id)
        .single()

      if (userError || !userData) {
        console.error('Erro ao buscar usuário:', userError)
        
        // Tentar buscar por email se auth_id não funcionar
        const { data: userByEmail, error: emailError } = await supabase
          .from('usuarios')
          .select('*')
          .eq('email', user.email)
          .single()

        if (emailError || !userByEmail) {
          // Criar novo usuário se não existir
          const { data: novoUsuario, error: createError } = await supabase
            .from('usuarios')
            .insert({
              auth_id: user.id,
              email: user.email || '',
              nome_completo: user.user_metadata?.full_name || user.email?.split('@')[0] || 'Usuário',
              role: 'morador',
              ativo: false
            })
            .select()
            .single()

          if (createError || !novoUsuario) {
            console.error('Erro ao criar usuário:', createError)
            alert('Erro ao criar seu perfil. Entre em contato com o suporte.')
            router.push('/login')
            return
          }

          alert('Conta criada! Aguarde aprovação do síndico para acessar o sistema.')
          await supabase.auth.signOut()
          router.push('/login')
          return
        }

        // Se encontrou por email, atualizar auth_id
        if (userByEmail && !userByEmail.auth_id) {
          await supabase
            .from('usuarios')
            .update({ auth_id: user.id })
            .eq('id', userByEmail.id)
          
          setUsuario(userByEmail)
        }
      } else {
        setUsuario(userData)
      }

      // Verificar se está ativo
      const usuarioFinal = userData || usuario
      if (!usuarioFinal) {
        router.push('/login')
        return
      }

      if (!usuarioFinal.ativo) {
        alert('Sua conta está inativa. Entre em contato com o síndico.')
        await supabase.auth.signOut()
        router.push('/login')
        return
      }

      // Buscar condomínio ativo do usuário
      const { data: vinculoData, error: vinculoError } = await supabase
        .from('usuarios_condominios')
        .select(`
          *,
          condominio:condominios(*),
          unidade:unidades(*)
        `)
        .eq('usuario_id', usuarioFinal.id)
        .eq('status', 'ativo')
        .order('created_at', { ascending: false })
        .limit(1)
        .single()

      if (vinculoError || !vinculoData) {
        console.error('Nenhum vínculo ativo encontrado')
        alert('Você não está vinculado a nenhum condomínio. Entre em contato com o síndico.')
        setLoading(false)
        return
      }

      setVinculo(vinculoData)
      await carregarDados(vinculoData.condominio_id)
    } catch (error) {
      console.error('Erro geral:', error)
      alert('Erro ao carregar dashboard.')
    } finally {
      setLoading(false)
    }
  }

  async function carregarDados(condominioId: string) {
    // Carregar votações ativas
    const { data: votacoesData } = await supabase
      .from('votacoes')
      .select('*')
      .eq('condominio_id', condominioId)
      .eq('status', 'ativa')
      .order('data_fim', { ascending: true })
      .limit(5)

    if (votacoesData) {
      setVotacoes(votacoesData)
    }

    // Carregar avisos visíveis
    const hoje = new Date().toISOString()
    const { data: avisosData } = await supabase
      .from('avisos')
      .select('*')
      .eq('condominio_id', condominioId)
      .eq('visivel', true)
      .or(`data_expiracao.is.null,data_expiracao.gte.${hoje}`)
      .order('fixado', { ascending: false })
      .order('data_publicacao', { ascending: false })
      .limit(5)

    if (avisosData) {
      setAvisos(avisosData)
    }
  }

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/login')
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Carregando dashboard...</p>
        </div>
      </div>
    )
  }

  if (!usuario) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Erro ao carregar</h2>
          <p className="text-gray-600 mb-6">Não foi possível carregar seus dados.</p>
          <button
            onClick={() => router.push('/login')}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Voltar ao Login
          </button>
        </div>
      </div>
    )
  }

  if (!vinculo) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center max-w-md mx-auto p-6">
          <div className="text-6xl mb-4">🏢</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Sem Condomínio Vinculado</h2>
          <p className="text-gray-600 mb-6">
            Você não está vinculado a nenhum condomínio no momento. Entre em contato com o síndico para ser adicionado.
          </p>
          <div className="space-y-3">
            <p className="text-sm text-gray-500">
              <strong>Usuário:</strong> {usuario.nome_completo}<br/>
              <strong>Email:</strong> {usuario.email}
            </p>
            <button
              onClick={handleLogout}
              className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
            >
              Sair
            </button>
          </div>
        </div>
      </div>
    )
  }

  const isSindico = vinculo.papel === 'sindico' || usuario.role === 'admin'
  const unidadeTexto = vinculo.unidade 
    ? `${vinculo.unidade.bloco ? `Bloco ${vinculo.unidade.bloco} - ` : ''}Unidade ${vinculo.unidade.numero}`
    : ''

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                {vinculo.condominio?.nome || 'VotaCondomínios'}
              </h1>
              <p className="text-sm text-gray-600">
                {usuario.nome_completo}
                {unidadeTexto && ` • ${unidadeTexto}`}
                <span className="ml-2 px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded">
                  {vinculo.papel === 'sindico' && '👑 Síndico'}
                  {vinculo.papel === 'conselheiro' && '🏛️ Conselheiro'}
                  {vinculo.papel === 'morador' && '🏠 Morador'}
                  {vinculo.papel === 'proprietario' && '🔑 Proprietário'}
                </span>
              </p>
            </div>
            <div className="flex gap-3">
              {isSindico && (
                <Link
                  href="/sindico/dashboard"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                >
                  Painel do Síndico
                </Link>
              )}
              <button
                onClick={handleLogout}
                className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
              >
                Sair
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Menu de Navegação */}
        <nav className="flex gap-2 mb-8 border-b pb-4 overflow-x-auto">
          <Link 
            href="/dashboard" 
            className="px-4 py-2 bg-blue-100 text-blue-700 rounded-lg font-medium whitespace-nowrap"
          >
            🏠 Início
          </Link>
          <Link 
            href="/votacoes" 
            className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg whitespace-nowrap transition"
          >
            🗳️ Votações
          </Link>
          <Link 
            href="/avisos" 
            className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg whitespace-nowrap transition"
          >
            📢 Avisos
          </Link>
          <Link 
            href="/comunicacoes" 
            className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg whitespace-nowrap transition"
          >
            💬 Comunicações
          </Link>
          {isSindico && (
            <Link 
              href="/moradores" 
              className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg whitespace-nowrap transition"
            >
              👥 Moradores
            </Link>
          )}
        </nav>

        {/* Grid Principal */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Coluna Principal - Votações */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-gray-900">
                  🗳️ Votações em Andamento
                </h2>
                <Link
                  href="/votacoes"
                  className="text-blue-600 hover:text-blue-700 text-sm font-medium transition"
                >
                  Ver todas →
                </Link>
              </div>

              {votacoes.length === 0 ? (
                <div className="text-center py-16">
                  <div className="text-6xl mb-4">🗳️</div>
                  <p className="text-gray-600 text-lg font-medium">Nenhuma votação ativa</p>
                  <p className="text-gray-500 text-sm mt-2">
                    Quando houver votações disponíveis, elas aparecerão aqui
                  </p>
                  {isSindico && (
                    <Link
                      href="/votacoes/nova"
                      className="inline-block mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                    >
                      Criar Nova Votação
                    </Link>
                  )}
                </div>
              ) : (
                <div className="space-y-4">
                  {votacoes.map((votacao) => {
                    const diasRestantes = Math.ceil(
                      (new Date(votacao.data_fim).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
                    )
                    
                    return (
                      <div
                        key={votacao.id}
                        className="border rounded-lg p-4 hover:shadow-md transition"
                      >
                        <div className="flex justify-between items-start mb-3">
                          <div className="flex-1">
                            <h3 className="font-semibold text-gray-900 text-lg mb-1">
                              {votacao.titulo}
                            </h3>
                            <p className="text-sm text-gray-600 line-clamp-2">
                              {votacao.descricao}
                            </p>
                          </div>
                          <span className={`ml-3 text-xs px-3 py-1 rounded-full whitespace-nowrap ${
                            diasRestantes <= 1 
                              ? 'bg-red-100 text-red-700' 
                              : diasRestantes <= 3
                              ? 'bg-yellow-100 text-yellow-700'
                              : 'bg-green-100 text-green-700'
                          }`}>
                            {diasRestantes === 0 ? '⏰ Último dia' : `${diasRestantes} dias`}
                          </span>
                        </div>
                        
                        <div className="flex justify-between items-center mt-4 pt-3 border-t">
                          <div className="flex items-center gap-4 text-sm text-gray-500">
                            <span>
                              {votacao.tipo === 'simples' && '✓ Simples'}
                              {votacao.tipo === 'multipla' && '☑ Múltipla'}
                              {votacao.tipo === 'secreta' && '🔒 Secreta'}
                            </span>
                            <span>
                              Encerra: {new Date(votacao.data_fim).toLocaleDateString('pt-BR')}
                            </span>
                          </div>
                          <Link
                            href={`/votacoes/${votacao.id}`}
                            className="text-sm text-blue-600 hover:text-blue-700 font-medium transition"
                          >
                            Votar agora →
                          </Link>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Sidebar - Avisos */}
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-bold text-gray-900">
                  📢 Avisos
                </h2>
                <Link
                  href="/avisos"
                  className="text-blue-600 hover:text-blue-700 text-sm font-medium transition"
                >
                  Ver todos →
                </Link>
              </div>

              {avisos.length === 0 ? (
                <div className="text-center py-8">
                  <div className="text-4xl mb-2">📢</div>
                  <p className="text-sm text-gray-600">Nenhum aviso recente</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {avisos.map((aviso) => (
                    <div
                      key={aviso.id}
                      className={`border-l-4 pl-3 py-2 rounded-r ${
                        aviso.fixado ? 'bg-yellow-50' : ''
                      } ${
                        aviso.prioridade === 'alta' || aviso.prioridade === 'urgente'
                          ? 'border-red-500'
                          : aviso.prioridade === 'media'
                          ? 'border-yellow-500'
                          : 'border-blue-500'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <h4 className="font-medium text-sm text-gray-900">
                          {aviso.fixado && '📌 '}
                          {aviso.titulo}
                        </h4>
                        <span className="text-xs px-2 py-0.5 rounded bg-gray-100 text-gray-600 ml-2 whitespace-nowrap">
                          {aviso.tipo === 'manutencao' && '🔧'}
                          {aviso.tipo === 'evento' && '🎉'}
                          {aviso.tipo === 'assembleia' && '📋'}
                          {aviso.tipo === 'lembrete' && '⏰'}
                          {aviso.tipo === 'geral' && '📰'}
                        </span>
                      </div>
                      <p className="text-xs text-gray-600 mt-1 line-clamp-2">
                        {aviso.conteudo}
                      </p>
                      <span className="text-xs text-gray-400 mt-1 block">
                        {new Date(aviso.data_publicacao).toLocaleDateString('pt-BR')}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Quick Actions */}
            {isSindico && (
              <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg shadow p-6 text-white">
                <h3 className="font-bold mb-3">⚡ Ações Rápidas</h3>
                <div className="space-y-2">
                  <Link
                    href="/votacoes/nova"
                    className="block w-full px-4 py-2 bg-white text-blue-600 rounded-lg hover:bg-blue-50 transition text-center text-sm font-medium"
                  >
                    ➕ Nova Votação
                  </Link>
                  <Link
                    href="/avisos/novo"
                    className="block w-full px-4 py-2 bg-white text-blue-600 rounded-lg hover:bg-blue-50 transition text-center text-sm font-medium"
                  >
                    📝 Novo Aviso
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}