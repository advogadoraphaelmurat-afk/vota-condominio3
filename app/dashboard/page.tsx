'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createSupabaseClient } from '@/lib/supabase'
import AvisosDashboard from '@/components/AvisosDashboard'
import VotacoesDashboard from '@/components/VotacoesDashboard'
import ComunicacoesDashboard from '@/components/ComunicacoesDashboard'

interface Usuario {
  id: string
  email: string
  nome_completo: string
  role: string
  ativo: boolean
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
  const [isAdmin, setIsAdmin] = useState(false)

  useEffect(() => {
    checkAuth()
  }, [])

  useEffect(() => {
    if (isAdmin && usuario) {
      router.push('/admin/dashboard')
    }
  }, [isAdmin, usuario, router])

  const checkAuth = async () => {
    try {
      const supabase = createSupabaseClient()
      
      const { data: { user }, error: authError } = await supabase.auth.getUser()
      
      if (authError || !user) {
        router.push('/login')
        return
      }

      const { data: userData, error: userError } = await supabase
        .from('usuarios')
        .select('*')
        .eq('auth_id', user.id)
        .single()

      if (userError || !userData) {
        console.error('Erro ao buscar usuário:', userError)
        router.push('/login')
        return
      }

      setUsuario(userData)

      if (userData.role === 'admin') {
        setIsAdmin(true)
        setLoading(false)
        return
      }

      const { data: vinculo, error: vinculoError } = await supabase
        .from('usuarios_condominios')
        .select(`*, condominio:condominios(*)`)
        .eq('usuario_id', userData.id)
        .eq('status', 'aprovado')
        .single()

      if (vinculoError || !vinculo) {
        console.error('Erro ao buscar vínculo:', vinculoError)
        setLoading(false)
        return
      }

      if (!vinculo.condominio?.ativo) {
        router.push('/condominio-desativado')
        return
      }

      setCondominio(vinculo.condominio)

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
      case 'admin':
        return '👑 Super Administrador'
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

  if (isAdmin && usuario) {
    return null
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
            Você não está vinculado a nenhum condomínio ativo. Entre em contato com o síndico para aprovar seu acesso.
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

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex gap-6">
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
              </button>
              
              <button
                onClick={() => router.push('/avisos')}
                className="w-full flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-gray-50 rounded-lg font-medium"
              >
                <span>📢</span>
                <span>Avisos</span>
              </button>
              
              <button
                onClick={() => router.push('/comunicacoes')}
                className="w-full flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-gray-50 rounded-lg font-medium"
              >
                <span>💬</span>
                <span>Falar com Síndico</span>
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

          <main className="flex-1 space-y-6">
            <VotacoesDashboard userId={usuario.id} />

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <AvisosDashboard userId={usuario.id} />
              <ComunicacoesDashboard userId={usuario.id} />
            </div>

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