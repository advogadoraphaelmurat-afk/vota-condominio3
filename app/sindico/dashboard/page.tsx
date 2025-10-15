'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createSupabaseClient, getCurrentUser, getCondominioAtivo } from '@/lib/supabase'
import Link from 'next/link'

export default function SindicoDashboard() {
  const router = useRouter()
  const [usuario, setUsuario] = useState<any>(null)
  const [condominio, setCondominio] = useState<any>(null)
  const [estatisticas, setEstatisticas] = useState({
    totalMoradores: 0,
    pendentes: 0,
    votacoesAtivas: 0,
    avisosAtivos: 0
  })
  const [loading, setLoading] = useState(true)

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
      if (user.role !== 'sindico' && user.role !== 'admin') {
        alert('Acesso restrito a síndicos')
        router.push('/dashboard')
        return
      }

      const condominioAtivo = await getCondominioAtivo(user.id)
      if (!condominioAtivo) {
        alert('Nenhum condomínio encontrado')
        return
      }

      setCondominio(condominioAtivo)
      await carregarEstatisticas(condominioAtivo.id)
    } catch (error) {
      console.error('Erro ao carregar dados:', error)
    } finally {
      setLoading(false)
    }
  }

  async function carregarEstatisticas(condominioId: string) {
    const supabase = createSupabaseClient()
    
    try {
      // Buscar moradores
      const { data: moradores, error: moradoresError } = await supabase
        .from('usuarios_condominios')
        .select('status')
        .eq('condominio_id', condominioId)

      if (moradoresError) console.error('Erro ao buscar moradores:', moradoresError)

      // Buscar votações ativas
      const { data: votacoes, error: votacoesError } = await supabase
        .from('votacoes')
        .select('id')
        .eq('condominio_id', condominioId)
        .eq('status', 'ativa')

      if (votacoesError) console.error('Erro ao buscar votações:', votacoesError)

      // Buscar avisos ativos
      const { data: avisos, error: avisosError } = await supabase
        .from('avisos')
        .select('id')
        .eq('condominio_id', condominioId)
        .eq('visivel', true)

      if (avisosError) console.error('Erro ao buscar avisos:', avisosError)

      setEstatisticas({
        totalMoradores: moradores?.length || 0,
        pendentes: moradores?.filter(m => m.status === 'pendente').length || 0,
        votacoesAtivas: votacoes?.length || 0,
        avisosAtivos: avisos?.length || 0
      })
    } catch (error) {
      console.error('Erro ao carregar estatísticas:', error)
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
              <h1 className="text-2xl font-bold text-gray-900">👔 Painel do Síndico</h1>
              <p className="text-sm text-gray-600">
                {condominio?.nome || 'Condomínio'} - Gerencie seu condomínio
              </p>
            </div>
            <div className="text-right">
              <div className="text-sm text-gray-600">Logado como: <strong>{usuario?.nome_completo}</strong></div>
              <div className="text-xs text-green-600 font-semibold">Síndico</div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Estatísticas */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-3 bg-blue-100 rounded-lg"><span className="text-2xl">👥</span></div>
              <div className="ml-4">
                <p className="text-sm text-gray-600">Total de Moradores</p>
                <p className="text-2xl font-bold text-gray-900">{estatisticas.totalMoradores}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-3 bg-yellow-100 rounded-lg"><span className="text-2xl">⏳</span></div>
              <div className="ml-4">
                <p className="text-sm text-gray-600">Pendentes</p>
                <p className="text-2xl font-bold text-yellow-600">{estatisticas.pendentes}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-3 bg-green-100 rounded-lg"><span className="text-2xl">🗳️</span></div>
              <div className="ml-4">
                <p className="text-sm text-gray-600">Votações Ativas</p>
                <p className="text-2xl font-bold text-green-600">{estatisticas.votacoesAtivas}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-3 bg-purple-100 rounded-lg"><span className="text-2xl">📢</span></div>
              <div className="ml-4">
                <p className="text-sm text-gray-600">Avisos Ativos</p>
                <p className="text-2xl font-bold text-purple-600">{estatisticas.avisosAtivos}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Ações Rápidas */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Link href="/moradores" className="bg-white rounded-lg shadow p-6 hover:shadow-md transition-shadow block">
            <h3 className="font-semibold mb-4">👥 Gerenciar Moradores</h3>
            <p className="text-gray-600">Aprove ou remova moradores do condomínio</p>
            {estatisticas.pendentes > 0 && (
              <div className="mt-2">
                <span className="inline-block bg-red-100 text-red-600 text-xs px-2 py-1 rounded-full">
                  {estatisticas.pendentes} aguardando aprovação
                </span>
              </div>
            )}
          </Link>

          <Link href="/votacoes" className="bg-white rounded-lg shadow p-6 hover:shadow-md transition-shadow block">
            <h3 className="font-semibold mb-4">🗳️ Gerenciar Votações</h3>
            <p className="text-gray-600">Crie e acompanhe votações do condomínio</p>
          </Link>

          <Link href="/avisos" className="bg-white rounded-lg shadow p-6 hover:shadow-md transition-shadow block">
            <h3 className="font-semibold mb-4">📢 Gerenciar Avisos</h3>
            <p className="text-gray-600">Crie e gerencie avisos para os moradores</p>
          </Link>
        </div>
      </main>
    </div>
  )
}