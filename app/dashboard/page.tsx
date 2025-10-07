// ============================================
// ARQUIVO: app/dashboard/page.tsx
// ============================================

'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createSupabaseClient, getCurrentUser, getCondominioAtivo } from '@/lib/supabase'
import AvisosDashboard from '@/components/AvisosDashboard'
import VotacoesDashboard from '@/components/VotacoesDashboard'
import ComunicacoesDashboard from '@/components/ComunicacoesDashboard'

interface Usuario {
  id: string
  email: string
  nome_completo: string
  role: string
}

interface Condominio {
  id: string
  nome: string
  cnpj?: string
  endereco?: string
}

export default function DashboardPage() {
  const router = useRouter()
  const [usuario, setUsuario] = useState<Usuario | null>(null)
  const [condominio, setCondominio] = useState<Condominio | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    checkAuth()
  }, [])

  const checkAuth = async () => {
    try {
      const user = await getCurrentUser()
      
      if (!user) {
        router.push('/login')
        return
      }

      setUsuario(user)

      // Buscar condomínio ativo
      const vinculo = await getCondominioAtivo(user.id)
      
      if (!vinculo) {
        alert('Você não está vinculado a nenhum condomínio. Aguarde aprovação do síndico.')
        return
      }

      // Buscar dados do condomínio
      const supabase = createSupabaseClient()
      const { data: condData } = await supabase
        .from('condominios')
        .select('*')
        .eq('id', vinculo.condominio_id)
        .single()

      if (condData) {
        setCondominio(condData)
      }
    } catch (error) {
      console.error('Erro ao verificar autenticação:', error)
      router.push('/login')
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = async () => {
    try {
      const supabase = createSupabaseClient()
      await supabase.auth.signOut()
      router.push('/login')
    } catch (error) {
      console.error('Erro ao fazer logout:', error)
    }
  }

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'sindico':
        return '👔 Síndico'
      case 'morador':
        return '🏠 Morador'
      case 'administradora':
        return '🏢 Administradora'
      default:
        return '👤 Usuário'
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 text-lg">Carregando dashboard...</p>
        </div>
      </div>
    )
  }

  if (!usuario || !condominio) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md text-center">
          <div className="text-yellow-500 text-5xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Acesso Pendente
          </h2>
          <p className="text-gray-600 mb-6">
            Você não está vinculado a nenhum condomínio. Entre em contato com o síndico para aprovar seu acesso.
          </p>
          <button
            onClick={handleLogout}
            className="w-full px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
          >
            Sair
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="text-3xl">🏢</div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  {condominio.nome}
                </h1>
                <p className="text-sm text-gray-600">
                  {getRoleLabel(usuario.role)} • {usuario.nome_completo}
                </p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            >
              Sair
            </button>
          </div>
        </div>
      </header>

      {/* Menu Lateral + Conteúdo */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex gap-6">
          {/* Sidebar - Menu de Navegação */}
          <aside className="w-64 flex-shrink-0">
            <nav className="bg-white rounded-lg shadow-sm p-4 space-y-2 sticky top-8">
              <button
                onClick={() => router.push('/dashboard')}
                className="w-full flex items-center gap-3 px-4 py-3 text-gray-900 bg-blue-50 rounded-lg font-medium"
              >
                <span>🏠</span>
                <span>Início</span>
              </button>
              
              <button
                onClick={() => router.push('/votacoes')}
                className="w-full flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-gray-50 rounded-lg font-medium"
              >
                <span>🗳️</span>
                <span>Votações</span>
                <span className="ml-auto bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                  3
                </span>
              </button>
              
              <button
                onClick={() => router.push('/avisos')}
                className="w-full flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-gray-50 rounded-lg font-medium"
              >
                <span>📢</span>
                <span>Avisos</span>
                <span className="ml-auto bg-blue-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                  5
                </span>
              </button>
              
              <button
                onClick={() => router.push('/comunicacoes')}
                className="w-full flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-gray-50 rounded-lg font-medium"
              >
                <span>💬</span>
                <span>Falar com Síndico</span>
                <span className="ml-auto bg-orange-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                  2
                </span>
              </button>

              {usuario.role === 'sindico' && (
                <>
                  <div className="border-t border-gray-200 my-2"></div>
                  <button
                    onClick={() => router.push('/sindico/dashboard')}
                    className="w-full flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-gray-50 rounded-lg font-medium"
                  >
                    <span>👔</span>
                    <span>Painel do Síndico</span>
                  </button>
                </>
              )}
            </nav>
          </aside>

          {/* Conteúdo Principal */}
          <main className="flex-1 space-y-6">
            {/* Cards de Estatísticas */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white rounded-lg shadow-sm p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-600 text-sm">Votações Ativas</p>
                    <p className="text-3xl font-bold text-gray-900 mt-1">3</p>
                  </div>
                  <div className="text-4xl">🗳️</div>
                </div>
                <p className="text-xs text-orange-600 mt-2">
                  ⚠️ Você tem votações pendentes
                </p>
              </div>

              <div className="bg-white rounded-lg shadow-sm p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-600 text-sm">Avisos Novos</p>
                    <p className="text-3xl font-bold text-gray-900 mt-1">5</p>
                  </div>
                  <div className="text-4xl">📢</div>
                </div>
                <p className="text-xs text-blue-600 mt-2">
                  ℹ️ 2 avisos fixados
                </p>
              </div>

              <div className="bg-white rounded-lg shadow-sm p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-600 text-sm">Mensagens</p>
                    <p className="text-3xl font-bold text-gray-900 mt-1">2</p>
                  </div>
                  <div className="text-4xl">💬</div>
                </div>
                <p className="text-xs text-green-600 mt-2">
                  ✓ Não lidas
                </p>
              </div>
            </div>

            {/* Componente de Votações */}
            <VotacoesDashboard userId={usuario.id} />

            {/* Grid de Avisos e Comunicações */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Componente de Avisos */}
              <AvisosDashboard userId={usuario.id} />

              {/* Componente de Comunicações */}
              <ComunicacoesDashboard userId={usuario.id} />
            </div>

            {/* Acesso Rápido */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">
                ⚡ Acesso Rápido
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <button
                  onClick={() => router.push('/votacoes')}
                  className="p-4 text-center hover:bg-gray-50 rounded-lg transition-colors"
                >
                  <div className="text-3xl mb-2">🗳️</div>
                  <p className="text-sm font-medium text-gray-900">Votar</p>
                </button>
                <button
                  onClick={() => router.push('/avisos')}
                  className="p-4 text-center hover:bg-gray-50 rounded-lg transition-colors"
                >
                  <div className="text-3xl mb-2">📢</div>
                  <p className="text-sm font-medium text-gray-900">Avisos</p>
                </button>
                <button
                  onClick={() => router.push('/comunicacoes')}
                  className="p-4 text-center hover:bg-gray-50 rounded-lg transition-colors"
                >
                  <div className="text-3xl mb-2">💬</div>
                  <p className="text-sm font-medium text-gray-900">Mensagens</p>
                </button>
                <button
                  onClick={() => router.push('/relatorios')}
                  className="p-4 text-center hover:bg-gray-50 rounded-lg transition-colors"
                >
                  <div className="text-3xl mb-2">📊</div>
                  <p className="text-sm font-medium text-gray-900">Relatórios</p>
                </button>
              </div>
            </div>
          </main>
        </div>
      </div>
    </div>
  )
}