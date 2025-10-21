'use client'

import { useState, useEffect } from 'react'
import { createSupabaseClient } from '@/lib/supabase'

interface Morador {
  id: string
  nome_completo: string
  email: string
  telefone?: string
  cpf?: string
  role: string
  ativo: boolean
  created_at: string
  vinculo?: {
    status: string
    papel: string
    data_aprovacao?: string
    aprovado_por?: string
    unidade?: {
      numero: string
      bloco?: string
    }
  }
}

interface GestaoMoradoresProps {
  condominioId: string
  usuario: any
}

export default function GestaoMoradores({ condominioId, usuario }: GestaoMoradoresProps) {
  const [moradores, setMoradores] = useState<Morador[]>([])
  const [filtro, setFiltro] = useState<string>('todos')
  const [busca, setBusca] = useState('')
  const [loading, setLoading] = useState(true)
  const [erro, setErro] = useState('')

  useEffect(() => {
    if (condominioId) {
      carregarMoradores(condominioId)
    }
  }, [condominioId])

  async function carregarMoradores(condId: string) {
    try {
      console.log('🔄 Carregando moradores para condomínio:', condId)
      setLoading(true)
      setErro('')

      const supabase = createSupabaseClient()

      // Primeiro: buscar os vínculos
      const { data: vinculosData, error: vinculosError } = await supabase
        .from('usuarios_condominios')
        .select('*')
        .eq('condominio_id', condId)
        .order('created_at', { ascending: false })

      if (vinculosError) {
        console.error('❌ Erro ao carregar vínculos:', vinculosError)
        setErro('Erro ao carregar lista de moradores: ' + vinculosError.message)
        return
      }

      console.log('📊 Vínculos encontrados:', vinculosData?.length || 0)

      if (!vinculosData || vinculosData.length === 0) {
        setMoradores([])
        return
      }

      // Buscar dados dos usuários
      const usuarioIds = vinculosData.map(v => v.usuario_id).filter(Boolean)
      const { data: usuariosData, error: usuariosError } = await supabase
        .from('usuarios')
        .select('*')
        .in('id', usuarioIds)

      if (usuariosError) {
        console.error('❌ Erro ao carregar usuários:', usuariosError)
        setErro('Erro ao carregar dados dos usuários: ' + usuariosError.message)
        return
      }

      // Buscar dados das unidades
      const unidadeIds = vinculosData.map(v => v.unidade_id).filter(Boolean)
      let unidadesData: any[] = []

      if (unidadeIds.length > 0) {
        const { data: unidades, error: unidadesError } = await supabase
          .from('unidades')
          .select('*')
          .in('id', unidadeIds)

        if (unidadesError) {
          console.warn('⚠️ Erro ao carregar unidades:', unidadesError)
        } else {
          unidadesData = unidades || []
        }
      }

      // Combinar os dados
      const moradoresData = vinculosData.map(vinculo => {
        const usuario = usuariosData?.find(u => u.id === vinculo.usuario_id)
        const unidade = unidadesData.find(u => u.id === vinculo.unidade_id)

        return {
          id: usuario?.id || vinculo.usuario_id,
          nome_completo: usuario?.nome_completo || 'Usuário não encontrado',
          email: usuario?.email || 'Email não disponível',
          telefone: usuario?.telefone,
          cpf: usuario?.cpf,
          role: usuario?.role || 'morador',
          ativo: usuario?.ativo !== undefined ? usuario.ativo : true,
          created_at: usuario?.created_at || vinculo.created_at,
          vinculo: {
            status: vinculo.status || 'pendente',
            papel: vinculo.papel || 'morador',
            data_aprovacao: vinculo.data_aprovacao,
            aprovado_por: vinculo.aprovado_por,
            unidade: unidade ? {
              numero: unidade.numero,
              bloco: unidade.bloco
            } : undefined
          }
        }
      })

      console.log('✅ Moradores carregados:', moradoresData.length)
      setMoradores(moradoresData)

    } catch (error: any) {
      console.error('💥 Erro inesperado:', error)
      setErro('Erro inesperado: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  async function aprovarMorador(moradorId: string) {
    const supabase = createSupabaseClient()
    
    // Verificar se é síndico tentando aprovar outro síndico
    const { data: morador } = await supabase
      .from('usuarios')
      .select('role')
      .eq('id', moradorId)
      .single()

    if (morador?.role === 'sindico') {
      alert('Síndicos devem ser aprovados pelo Super Administrador')
      return
    }

    if (!confirm('Aprovar este morador?')) return

    const { error: vinculoError } = await supabase
      .from('usuarios_condominios')
      .update({ 
        status: 'aprovado',
        data_aprovacao: new Date().toISOString(),
        aprovado_por: usuario.id
      })
      .eq('usuario_id', moradorId)
      .eq('condominio_id', condominioId)

    if (vinculoError) {
      alert('Erro ao aprovar morador: ' + vinculoError.message)
      return
    }

    const { error: userError } = await supabase
      .from('usuarios')
      .update({ ativo: true })
      .eq('id', moradorId)

    if (userError) {
      alert('Erro ao ativar usuário: ' + userError.message)
      return
    }

    alert('Morador aprovado com sucesso!')
    carregarMoradores(condominioId)
  }

  async function rejeitarMorador(moradorId: string) {
    if (!confirm('Rejeitar este morador? Esta ação não pode ser desfeita.')) return

    const supabase = createSupabaseClient()

    const { error } = await supabase
      .from('usuarios_condominios')
      .update({ status: 'rejeitado' })
      .eq('usuario_id', moradorId)
      .eq('condominio_id', condominioId)

    if (error) {
      alert('Erro ao rejeitar morador: ' + error.message)
      return
    }

    alert('Morador rejeitado')
    carregarMoradores(condominioId)
  }

  async function bloquearMorador(moradorId: string) {
    if (!confirm('Bloquear acesso deste morador?')) return

    const supabase = createSupabaseClient()

    const { error: vinculoError } = await supabase
      .from('usuarios_condominios')
      .update({ status: 'bloqueado' })
      .eq('usuario_id', moradorId)
      .eq('condominio_id', condominioId)

    if (vinculoError) {
      alert('Erro ao bloquear morador: ' + vinculoError.message)
      return
    }

    const { error: userError } = await supabase
      .from('usuarios')
      .update({ ativo: false })
      .eq('id', moradorId)

    if (userError) {
      alert('Erro ao desativar usuário: ' + userError.message)
      return
    }

    alert('Morador bloqueado')
    carregarMoradores(condominioId)
  }

  const moradoresFiltrados = moradores
    .filter(m => {
      if (filtro === 'todos') return true
      if (filtro === 'pendentes') return m.vinculo?.status === 'pendente'
      if (filtro === 'aprovados') return m.vinculo?.status === 'aprovado'
      if (filtro === 'bloqueados') return m.vinculo?.status === 'bloqueado'
      return true
    })
    .filter(m =>
      m.nome_completo.toLowerCase().includes(busca.toLowerCase()) ||
      m.email.toLowerCase().includes(busca.toLowerCase())
    )

  const contadores = {
    todos: moradores.length,
    pendentes: moradores.filter(m => m.vinculo?.status === 'pendente').length,
    aprovados: moradores.filter(m => m.vinculo?.status === 'aprovado').length,
    bloqueados: moradores.filter(m => m.vinculo?.status === 'bloqueado').length,
  }

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'sindico':
        return '👔 Síndico'
      case 'morador':
        return '🏠 Morador'
      case 'zelador':
        return '🔑 Zelador'
      case 'administradora':
        return '🏢 Administradora'
      case 'admin':
        return '⚙️ Admin'
      default:
        return '👤 Usuário'
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'aprovado':
        return <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">✓ Aprovado</span>
      case 'pendente':
        return <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-1 rounded-full">⏳ Pendente</span>
      case 'rejeitado':
        return <span className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded-full">✗ Rejeitado</span>
      case 'bloqueado':
        return <span className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded-full">🚫 Bloqueado</span>
      default:
        return null
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Carregando moradores...</p>
        </div>
      </div>
    )
  }

  if (erro) {
    return (
      <div className="bg-white rounded-lg shadow p-8 text-center">
        <div className="text-6xl mb-4">⚠️</div>
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Erro ao Carregar</h2>
        <p className="text-gray-600 mb-6">{erro}</p>
        <button
          onClick={() => carregarMoradores(condominioId)}
          className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
        >
          Tentar Novamente
        </button>
      </div>
    )
  }

  return (
    <div>
      {/* Filtros e Busca */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
          <button
            onClick={() => setFiltro('todos')}
            className={`px-4 py-2 rounded-lg whitespace-nowrap transition ${
              filtro === 'todos'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Todos ({contadores.todos})
          </button>
          <button
            onClick={() => setFiltro('pendentes')}
            className={`px-4 py-2 rounded-lg whitespace-nowrap transition ${
              filtro === 'pendentes'
                ? 'bg-yellow-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            ⏳ Pendentes ({contadores.pendentes})
          </button>
          <button
            onClick={() => setFiltro('aprovados')}
            className={`px-4 py-2 rounded-lg whitespace-nowrap transition ${
              filtro === 'aprovados'
                ? 'bg-green-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            ✓ Aprovados ({contadores.aprovados})
          </button>
          <button
            onClick={() => setFiltro('bloqueados')}
            className={`px-4 py-2 rounded-lg whitespace-nowrap transition ${
              filtro === 'bloqueados'
                ? 'bg-red-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            🚫 Bloqueados ({contadores.bloqueados})
          </button>
        </div>

        <div className="relative">
          <input
            type="text"
            placeholder="Buscar morador..."
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            className="w-full px-4 py-2 pl-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <span className="absolute left-3 top-2.5 text-gray-400">🔍</span>
        </div>
      </div>

      {/* Lista de Moradores */}
      {moradoresFiltrados.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <div className="text-6xl mb-4">👥</div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            {busca ? 'Nenhum morador encontrado' : 'Nenhum morador'}
          </h3>
          <p className="text-gray-600">
            {busca ? 'Tente buscar com outros termos' : 'Ainda não há moradores cadastrados'}
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Morador
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Unidade
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Contato
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {moradoresFiltrados.map((morador) => (
                <tr key={morador.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {morador.nome_completo}
                      </div>
                      <div className="text-xs text-gray-500">
                        {getRoleLabel(morador.role)}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {morador.vinculo?.unidade?.numero || '-'}
                    </div>
                    {morador.vinculo?.unidade?.bloco && (
                      <div className="text-xs text-gray-500">
                        Bloco {morador.vinculo.unidade.bloco}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900">{morador.email}</div>
                    {morador.telefone && (
                      <div className="text-xs text-gray-500">{morador.telefone}</div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getStatusBadge(morador.vinculo?.status || '')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <div className="flex gap-2">
                      {morador.vinculo?.status === 'pendente' && (
                        <>
                          <button
                            onClick={() => aprovarMorador(morador.id)}
                            className="text-green-600 hover:text-green-900 font-medium"
                          >
                            ✓ Aprovar
                          </button>
                          <button
                            onClick={() => rejeitarMorador(morador.id)}
                            className="text-red-600 hover:text-red-900 font-medium"
                          >
                            ✗ Rejeitar
                          </button>
                        </>
                      )}
                      {morador.vinculo?.status === 'aprovado' && (
                        <button
                          onClick={() => bloquearMorador(morador.id)}
                          className="text-orange-600 hover:text-orange-900 font-medium"
                        >
                          🚫 Bloquear
                        </button>
                      )}
                      {morador.vinculo?.status === 'bloqueado' && (
                        <button
                          onClick={() => aprovarMorador(morador.id)}
                          className="text-green-600 hover:text-green-900 font-medium"
                        >
                          ✓ Desbloquear
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}