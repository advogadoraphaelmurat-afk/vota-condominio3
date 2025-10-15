'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createSupabaseClient } from '@/lib/supabase'

interface Condominio {
  id: string
  nome: string
  cnpj: string
  endereco: string
  cidade: string
  estado: string
  ativo: boolean
  total_unidades: number
  unidades_ocupadas: number
  created_at: string
  sindico_responsavel_id?: string
  sindico_responsavel?: {
    id: string
    nome_completo: string
    email: string
  }
}

interface SindicoPendente {
  id: string
  usuario_id: string
  condominio_id: string
  created_at: string
  usuarios: {
    id: string
    nome_completo: string
    email: string
    telefone: string
    cpf: string
  }
  condominios: {
    nome: string
    cidade: string
    estado: string
  }
}

interface SindicoAprovado {
  id: string
  nome_completo: string
  email: string
  telefone: string
  condominio_id: string
  condominio_nome: string
}

export default function AdminDashboard() {
  const router = useRouter()
  const [usuario, setUsuario] = useState<any>(null)
  const [condominios, setCondominios] = useState<Condominio[]>([])
  const [condominiosFiltrados, setCondominiosFiltrados] = useState<Condominio[]>([])
  const [sindicosPendentes, setSindicosPendentes] = useState<SindicoPendente[]>([])
  const [sindicosAprovados, setSindicosAprovados] = useState<SindicoAprovado[]>([])
  const [loading, setLoading] = useState(true)
  const [abaAtiva, setAbaAtiva] = useState<'geral' | 'sindicos' | 'mensagens'>('geral')
  const [busca, setBusca] = useState('')
  
  // Estados para modais
  const [mostrarModalEditar, setMostrarModalEditar] = useState(false)
  const [mostrarModalSindico, setMostrarModalSindico] = useState(false)
  const [condominioEditando, setCondominioEditando] = useState<Condominio | null>(null)
  const [condominioSelecionado, setCondominioSelecionado] = useState<Condominio | null>(null)
  
  const [novoCondominio, setNovoCondominio] = useState({
    nome: '',
    cnpj: '',
    endereco: '',
    cidade: '',
    estado: '',
    cep: '',
    total_unidades: ''
  })
  
  const [novaMensagem, setNovaMensagem] = useState({
    titulo: '',
    conteudo: '',
    destinatarios: 'todos' as 'todos' | 'sindicos' | 'moradores' | 'condominios-especificos',
    condominios_selecionados: [] as string[]
  })

  useEffect(() => {
    verificarPermissoes()
  }, [])

  useEffect(() => {
    if (busca.trim() === '') {
      setCondominiosFiltrados(condominios)
    } else {
      const termoBusca = busca.toLowerCase()
      const filtrados = condominios.filter(condominio =>
        condominio.nome.toLowerCase().includes(termoBusca) ||
        condominio.cidade.toLowerCase().includes(termoBusca) ||
        condominio.estado.toLowerCase().includes(termoBusca)
      )
      setCondominiosFiltrados(filtrados)
    }
  }, [busca, condominios])

  const handleLogout = async () => {
    try {
      const supabase = createSupabaseClient()
      await supabase.auth.signOut()
      router.push('/login')
    } catch (error) {
      console.error('Erro ao fazer logout:', error)
    }
  }

  const verificarPermissoes = async () => {
    try {
      const supabase = createSupabaseClient()
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

      if (userData?.role !== 'admin') {
        router.push('/dashboard')
        return
      }

      setUsuario(userData)
      await carregarDados()
    } catch (error) {
      console.error('Erro ao verificar permissões:', error)
      router.push('/dashboard')
    }
  }

  const carregarDados = async () => {
    await Promise.all([
      carregarCondominios(),
      carregarSindicosPendentes(),
      carregarSindicosAprovados()
    ])
    setLoading(false)
  }

  const carregarCondominios = async () => {
    try {
      const supabase = createSupabaseClient()
      const { data, error } = await supabase
        .from('condominios')
        .select(`
          *,
          sindico_responsavel:usuarios!sindico_responsavel_id (
            id,
            nome_completo,
            email
          )
        `)
        .order('nome')

      if (error) {
        console.error('Erro ao carregar condomínios:', error)
        return
      }

      console.log('Condomínios carregados:', data)

      setCondominios(data || [])
      setCondominiosFiltrados(data || [])
    } catch (error) {
      console.error('Erro ao carregar condomínios:', error)
    }
  }

  const carregarSindicosPendentes = async () => {
    try {
      const supabase = createSupabaseClient()
      const { data, error } = await supabase
        .from('usuarios_condominios')
        .select(`
          id,
          usuario_id,
          condominio_id,
          created_at,
          usuarios (
            id,
            nome_completo,
            email,
            telefone,
            cpf
          ),
          condominios (
            nome,
            cidade,
            estado
          )
        `)
        .eq('papel', 'sindico')
        .eq('status', 'pendente')
        .order('created_at', { ascending: false })

      if (error) throw error

      setSindicosPendentes(data || [])
    } catch (error) {
      console.error('Erro ao carregar síndicos pendentes:', error)
    }
  }

  const carregarSindicosAprovados = async () => {
    try {
      const supabase = createSupabaseClient()
      const { data, error } = await supabase
        .from('usuarios_condominios')
        .select(`
          usuarios!inner(
            id,
            nome_completo,
            email,
            telefone
          ),
          condominios!inner(
            id,
            nome
          )
        `)
        .eq('papel', 'sindico')
        .eq('status', 'aprovado')

      if (error) throw error

      const sindicos = (data || []).map(item => ({
        id: item.usuarios.id,
        nome_completo: item.usuarios.nome_completo,
        email: item.usuarios.email,
        telefone: item.usuarios.telefone,
        condominio_id: item.condominios.id,
        condominio_nome: item.condominios.nome
      }))

      setSindicosAprovados(sindicos)
    } catch (error) {
      console.error('Erro ao carregar síndicos aprovados:', error)
    }
  }

  const criarCondominio = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const supabase = createSupabaseClient()
      
      const dadosCondominio = {
        nome: novoCondominio.nome,
        cnpj: novoCondominio.cnpj || null,
        endereco: novoCondominio.endereco,
        cidade: novoCondominio.cidade,
        estado: novoCondominio.estado,
        cep: novoCondominio.cep || null,
        total_unidades: parseInt(novoCondominio.total_unidades),
        unidades_ocupadas: 0,
        ativo: true
      }

      const { data, error } = await supabase
        .from('condominios')
        .insert([dadosCondominio])
        .select()

      if (error) {
        console.error('Erro ao criar condomínio:', error)
        throw error
      }

      alert('✅ Condomínio criado com sucesso!')
      setNovoCondominio({
        nome: '', cnpj: '', endereco: '', cidade: '', estado: '', cep: '', total_unidades: ''
      })
      
      await carregarCondominios()
    } catch (error: any) {
      console.error('Erro completo:', error)
      alert('❌ Erro ao criar condomínio: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  const abrirModalEditar = (condominio: Condominio) => {
    setCondominioEditando(condominio)
    setMostrarModalEditar(true)
  }

  const abrirModalSindico = (condominio: Condominio) => {
    setCondominioSelecionado(condominio)
    setMostrarModalSindico(true)
  }

  const atualizarCondominio = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!condominioEditando) return

    setLoading(true)

    try {
      const supabase = createSupabaseClient()
      
      const { error } = await supabase
        .from('condominios')
        .update({
          nome: condominioEditando.nome,
          cnpj: condominioEditando.cnpj || null,
          endereco: condominioEditando.endereco,
          cidade: condominioEditando.cidade,
          estado: condominioEditando.estado,
          cep: condominioEditando.cep || null,
          total_unidades: condominioEditando.total_unidades,
          unidades_ocupadas: condominioEditando.unidades_ocupadas
        })
        .eq('id', condominioEditando.id)

      if (error) throw error

      alert('✅ Condomínio atualizado com sucesso!')
      setMostrarModalEditar(false)
      await carregarCondominios()
    } catch (error: any) {
      alert('❌ Erro ao atualizar condomínio: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  const atualizarSindicoResponsavel = async (sindicoId: string) => {
    if (!condominioSelecionado) return

    try {
      const supabase = createSupabaseClient()
      
      const { error } = await supabase
        .from('condominios')
        .update({
          sindico_responsavel_id: sindicoId
        })
        .eq('id', condominioSelecionado.id)

      if (error) throw error

      alert('✅ Síndico responsável atualizado com sucesso!')
      setMostrarModalSindico(false)
      await carregarCondominios()
    } catch (error: any) {
      alert('❌ Erro ao atualizar síndico responsável: ' + error.message)
    }
  }

  const removerSindicoResponsavel = async () => {
    if (!condominioSelecionado) return

    try {
      const supabase = createSupabaseClient()
      
      const { error } = await supabase
        .from('condominios')
        .update({
          sindico_responsavel_id: null
        })
        .eq('id', condominioSelecionado.id)

      if (error) throw error

      alert('✅ Síndico responsável removido com sucesso!')
      setMostrarModalSindico(false)
      await carregarCondominios()
    } catch (error: any) {
      alert('❌ Erro ao remover síndico responsável: ' + error.message)
    }
  }

  const excluirCondominio = async (condominioId: string, nome: string) => {
    if (!confirm(`Tem certeza que deseja excluir o condomínio "${nome}"? Esta ação não pode ser desfeita.`)) return

    try {
      const supabase = createSupabaseClient()
      
      const { error } = await supabase
        .from('condominios')
        .delete()
        .eq('id', condominioId)

      if (error) throw error

      alert('✅ Condomínio excluído com sucesso!')
      await carregarCondominios()
    } catch (error: any) {
      alert('❌ Erro ao excluir condomínio: ' + error.message)
    }
  }

  const toggleStatusCondominio = async (condominioId: string, ativoAtual: boolean) => {
    if (!confirm(`Deseja ${ativoAtual ? 'desativar' : 'ativar'} este condomínio?`)) return

    try {
      const supabase = createSupabaseClient()
      const novoStatus = !ativoAtual
      
      const { error } = await supabase
        .from('condominios')
        .update({ ativo: novoStatus })
        .eq('id', condominioId)

      if (error) throw error

      setCondominios(prev => 
        prev.map(cond => 
          cond.id === condominioId 
            ? { ...cond, ativo: novoStatus }
            : cond
        )
      )

      alert(`✅ Condomínio ${novoStatus ? 'ativado' : 'desativado'} com sucesso!`)
    } catch (error: any) {
      alert('❌ Erro ao atualizar condomínio: ' + error.message)
    }
  }

  const aprovarSindico = async (sindicoPendente: SindicoPendente) => {
    if (!confirm(`Aprovar ${sindicoPendente.usuarios.nome_completo} como síndico do ${sindicoPendente.condominios.nome}?`)) return

    try {
      const supabase = createSupabaseClient()

      // 1. Atualizar usuário para ativo e definir role como síndico
      const { error: userError } = await supabase
        .from('usuarios')
        .update({ 
          ativo: true,
          role: 'sindico'
        })
        .eq('id', sindicoPendente.usuario_id)

      if (userError) throw userError

      // 2. Aprovar o vínculo do síndico com o condomínio
      const { error: vinculoError } = await supabase
        .from('usuarios_condominios')
        .update({ 
          status: 'aprovado',
          data_aprovacao: new Date().toISOString(),
          aprovado_por: usuario.id
        })
        .eq('id', sindicoPendente.id)

      if (vinculoError) throw vinculoError

      // 3. Atualizar o condomínio com o síndico responsável
      const { error: condominioError } = await supabase
        .from('condominios')
        .update({ 
          sindico_responsavel_id: sindicoPendente.usuario_id
        })
        .eq('id', sindicoPendente.condominio_id)

      if (condominioError) throw condominioError

      alert('✅ Síndico aprovado com sucesso!')
      await carregarSindicosPendentes()
      await carregarCondominios()
      await carregarSindicosAprovados()
    } catch (error: any) {
      alert('❌ Erro ao aprovar síndico: ' + error.message)
    }
  }

  const rejeitarSindico = async (sindicoPendenteId: string) => {
    if (!confirm('Rejeitar este cadastro de síndico?')) return

    try {
      const supabase = createSupabaseClient()
      const { error } = await supabase
        .from('usuarios_condominios')
        .update({ status: 'rejeitado' })
        .eq('id', sindicoPendenteId)

      if (error) throw error

      alert('❌ Cadastro de síndico rejeitado')
      await carregarSindicosPendentes()
    } catch (error: any) {
      alert('❌ Erro ao rejeitar síndico: ' + error.message)
    }
  }

  const enviarMensagem = async (e: React.FormEvent) => {
    e.preventDefault()
    // Implementar lógica de envio de mensagens
    alert('📨 Mensagem enviada com sucesso!')
    setNovaMensagem({
      titulo: '',
      conteudo: '',
      destinatarios: 'todos',
      condominios_selecionados: []
    })
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
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
              <h1 className="text-2xl font-bold text-gray-900">👑 Super Administrador</h1>
              <p className="text-sm text-gray-600">Gerencie todos os condomínios do sistema</p>
            </div>
            <div className="text-right">
              <div className="text-sm text-gray-600">Logado como: <strong>{usuario?.email}</strong></div>
              <button
                onClick={handleLogout}
                className="mt-1 px-3 py-1 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              >
                Sair
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow mb-6">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex">
              <button
                onClick={() => setAbaAtiva('geral')}
                className={`py-4 px-6 text-center border-b-2 font-medium text-sm ${
                  abaAtiva === 'geral' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                🏢 Gerenciar Condomínios
              </button>
              <button
                onClick={() => setAbaAtiva('sindicos')}
                className={`py-4 px-6 text-center border-b-2 font-medium text-sm ${
                  abaAtiva === 'sindicos' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                👔 Aprovar Síndicos
                {sindicosPendentes.length > 0 && (
                  <span className="ml-2 bg-red-500 text-white text-xs px-2 py-1 rounded-full">
                    {sindicosPendentes.length}
                  </span>
                )}
              </button>
              <button
                onClick={() => setAbaAtiva('mensagens')}
                className={`py-4 px-6 text-center border-b-2 font-medium text-sm ${
                  abaAtiva === 'mensagens' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                📨 Enviar Mensagens
              </button>
            </nav>
          </div>
        </div>

        {/* Aba Geral - Condomínios */}
        {abaAtiva === 'geral' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Estatísticas */}
            <div className="lg:col-span-3 grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center">
                  <div className="p-3 bg-blue-100 rounded-lg"><span className="text-2xl">🏢</span></div>
                  <div className="ml-4">
                    <p className="text-sm text-gray-600">Total de Condomínios</p>
                    <p className="text-2xl font-bold text-gray-900">{condominios.length}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center">
                  <div className="p-3 bg-green-100 rounded-lg"><span className="text-2xl">✅</span></div>
                  <div className="ml-4">
                    <p className="text-sm text-gray-600">Ativos</p>
                    <p className="text-2xl font-bold text-green-600">
                      {condominios.filter(c => c.ativo).length}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center">
                  <div className="p-3 bg-red-100 rounded-lg"><span className="text-2xl">❌</span></div>
                  <div className="ml-4">
                    <p className="text-sm text-gray-600">Inativos</p>
                    <p className="text-2xl font-bold text-red-600">
                      {condominios.filter(c => !c.ativo).length}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center">
                  <div className="p-3 bg-purple-100 rounded-lg"><span className="text-2xl">📊</span></div>
                  <div className="ml-4">
                    <p className="text-sm text-gray-600">Taxa de Ativos</p>
                    <p className="text-2xl font-bold text-purple-600">
                      {condominios.length > 0 
                        ? ((condominios.filter(c => c.ativo).length / condominios.length) * 100).toFixed(1) 
                        : '0'
                      }%
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Cadastrar Condomínio */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-xl font-semibold mb-4">Cadastrar Novo Condomínio</h2>
                <form onSubmit={criarCondominio} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Nome do Condomínio *</label>
                    <input
                      type="text"
                      value={novoCondominio.nome}
                      onChange={(e) => setNovoCondominio({ ...novoCondominio, nome: e.target.value })}
                      required
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">CNPJ</label>
                    <input
                      type="text"
                      value={novoCondominio.cnpj}
                      onChange={(e) => setNovoCondominio({ ...novoCondominio, cnpj: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Total de Unidades *</label>
                    <input
                      type="number"
                      value={novoCondominio.total_unidades}
                      onChange={(e) => setNovoCondominio({ ...novoCondominio, total_unidades: e.target.value })}
                      required
                      min="1"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Endereço *</label>
                    <input
                      type="text"
                      value={novoCondominio.endereco}
                      onChange={(e) => setNovoCondominio({ ...novoCondominio, endereco: e.target.value })}
                      required
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Cidade *</label>
                      <input
                        type="text"
                        value={novoCondominio.cidade}
                        onChange={(e) => setNovoCondominio({ ...novoCondominio, cidade: e.target.value })}
                        required
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Estado *</label>
                      <input
                        type="text"
                        value={novoCondominio.estado}
                        onChange={(e) => setNovoCondominio({ ...novoCondominio, estado: e.target.value })}
                        required
                        maxLength={2}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent uppercase"
                        placeholder="SP"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 disabled:bg-gray-400 transition-colors"
                  >
                    {loading ? 'Criando...' : 'Cadastrar Condomínio'}
                  </button>
                </form>
              </div>
            </div>

            {/* Lista de Condomínios */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-semibold">Todos os Condomínios ({condominios.length})</h2>
                  <div className="relative w-64">
                    <input
                      type="text"
                      placeholder="Buscar condomínio..."
                      value={busca}
                      onChange={(e) => setBusca(e.target.value)}
                      className="w-full px-4 py-2 pl-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <span className="text-gray-400">🔍</span>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-4 max-h-96 overflow-y-auto">
                  {condominiosFiltrados.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      {condominios.length === 0 ? 'Nenhum condomínio cadastrado' : 'Nenhum condomínio encontrado'}
                    </div>
                  ) : (
                    condominiosFiltrados.map((condominio) => (
                      <div key={condominio.id} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <h3 className="font-semibold text-lg">{condominio.nome}</h3>
                            <div className="grid grid-cols-2 gap-2 mt-2 text-sm text-gray-600">
                              <div><strong>CNPJ:</strong> {condominio.cnpj || 'Não informado'}</div>
                              <div><strong>Unidades:</strong> {condominio.unidades_ocupadas}/{condominio.total_unidades}</div>
                              <div><strong>Localização:</strong> {condominio.cidade}/{condominio.estado}</div>
                              <div>
                                <strong>Síndico:</strong> 
                                <span className={`ml-1 ${condominio.sindico_responsavel ? 'text-green-600' : 'text-gray-500'}`}>
                                  {condominio.sindico_responsavel 
                                    ? `${condominio.sindico_responsavel.nome_completo}`
                                    : 'Não definido'
                                  }
                                </span>
                              </div>
                              <div>
                                <strong>Status:</strong> 
                                <span className={`ml-1 ${condominio.ativo ? 'text-green-600' : 'text-red-600'}`}>
                                  {condominio.ativo ? 'Ativo' : 'Inativo'}
                                </span>
                              </div>
                            </div>
                          </div>
                          <div className="flex flex-col gap-2 ml-4">
                            <button
                              onClick={() => toggleStatusCondominio(condominio.id, condominio.ativo)}
                              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                                condominio.ativo 
                                  ? 'bg-red-600 text-white hover:bg-red-700' 
                                  : 'bg-green-600 text-white hover:bg-green-700'
                              }`}
                            >
                              {condominio.ativo ? 'Desativar' : 'Ativar'}
                            </button>
                            <button
                              onClick={() => abrirModalEditar(condominio)}
                              className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
                            >
                              Editar
                            </button>
                            <button
                              onClick={() => abrirModalSindico(condominio)}
                              className="px-4 py-2 bg-purple-600 text-white rounded-lg text-sm font-medium hover:bg-purple-700 transition-colors"
                            >
                              {condominio.sindico_responsavel ? 'Alterar Síndico' : 'Definir Síndico'}
                            </button>
                            <button
                              onClick={() => excluirCondominio(condominio.id, condominio.nome)}
                              className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 transition-colors"
                            >
                              Excluir
                            </button>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Aba Síndicos Pendentes */}
        {abaAtiva === 'sindicos' && (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">Síndicos Pendentes de Aprovação</h2>
            
            {sindicosPendentes.length === 0 ? (
              <div className="text-center py-8">
                <div className="text-4xl mb-4">👥</div>
                <p className="text-gray-500">Nenhum síndico aguardando aprovação</p>
              </div>
            ) : (
              <div className="space-y-4">
                {sindicosPendentes.map((sindico) => (
                  <div key={sindico.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h3 className="font-semibold text-lg">{sindico.usuarios.nome_completo}</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-2 text-sm text-gray-600">
                          <div><strong>Email:</strong> {sindico.usuarios.email}</div>
                          <div><strong>CPF:</strong> {sindico.usuarios.cpf}</div>
                          <div><strong>Telefone:</strong> {sindico.usuarios.telefone || 'Não informado'}</div>
                          <div><strong>Condomínio:</strong> {sindico.condominios.nome} - {sindico.condominios.cidade}/{sindico.condominios.estado}</div>
                          <div><strong>Solicitado em:</strong> {new Date(sindico.created_at).toLocaleDateString('pt-BR')}</div>
                        </div>
                      </div>
                      <div className="flex gap-2 ml-4">
                        <button
                          onClick={() => aprovarSindico(sindico)}
                          className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-700 transition-colors"
                        >
                          ✓ Aprovar
                        </button>
                        <button
                          onClick={() => rejeitarSindico(sindico.id)}
                          className="bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-red-700 transition-colors"
                        >
                          ✗ Rejeitar
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Aba Mensagens */}
        {abaAtiva === 'mensagens' && (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">Enviar Mensagem</h2>
            <form onSubmit={enviarMensagem} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Destinatários</label>
                <select
                  value={novaMensagem.destinatarios}
                  onChange={(e) => setNovaMensagem({ ...novaMensagem, destinatarios: e.target.value as any })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="todos">Todos os condomínios</option>
                  <option value="sindicos">Apenas síndicos</option>
                  <option value="moradores">Apenas moradores</option>
                  <option value="condominios-especificos">Condomínios específicos</option>
                </select>
              </div>

              {novaMensagem.destinatarios === 'condominios-especificos' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Selecione os condomínios</label>
                  <select
                    multiple
                    value={novaMensagem.condominios_selecionados}
                    onChange={(e) => setNovaMensagem({
                      ...novaMensagem,
                      condominios_selecionados: Array.from(e.target.selectedOptions, option => option.value)
                    })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent h-32"
                  >
                    {condominios.map(condominio => (
                      <option key={condominio.id} value={condominio.id}>
                        {condominio.nome} - {condominio.cidade}/{condominio.estado}
                      </option>
                    ))}
                  </select>
                  <p className="text-xs text-gray-500 mt-1">Mantenha Ctrl pressionado para selecionar múltiplos</p>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Assunto *</label>
                <input
                  type="text"
                  value={novaMensagem.titulo}
                  onChange={(e) => setNovaMensagem({ ...novaMensagem, titulo: e.target.value })}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Mensagem *</label>
                <textarea
                  value={novaMensagem.conteudo}
                  onChange={(e) => setNovaMensagem({ ...novaMensagem, conteudo: e.target.value })}
                  required
                  rows={6}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <button
                type="submit"
                className="w-full bg-green-600 text-white py-3 rounded-lg font-semibold hover:bg-green-700 transition-colors"
              >
                📨 Enviar Mensagem
              </button>
            </form>
          </div>
        )}

        {/* Modal de Edição */}
        {mostrarModalEditar && condominioEditando && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-2xl">
              <h2 className="text-xl font-semibold mb-4">Editar Condomínio</h2>
              <form onSubmit={atualizarCondominio} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Nome do Condomínio *</label>
                  <input
                    type="text"
                    value={condominioEditando.nome}
                    onChange={(e) => setCondominioEditando({ ...condominioEditando, nome: e.target.value })}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">CNPJ</label>
                  <input
                    type="text"
                    value={condominioEditando.cnpj || ''}
                    onChange={(e) => setCondominioEditando({ ...condominioEditando, cnpj: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Total de Unidades *</label>
                    <input
                      type="number"
                      value={condominioEditando.total_unidades}
                      onChange={(e) => setCondominioEditando({ ...condominioEditando, total_unidades: parseInt(e.target.value) })}
                      required
                      min="1"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Unidades Ocupadas</label>
                    <input
                      type="number"
                      value={condominioEditando.unidades_ocupadas}
                      onChange={(e) => setCondominioEditando({ ...condominioEditando, unidades_ocupadas: parseInt(e.target.value) })}
                      min="0"
                      max={condominioEditando.total_unidades}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Endereço *</label>
                  <input
                    type="text"
                    value={condominioEditando.endereco}
                    onChange={(e) => setCondominioEditando({ ...condominioEditando, endereco: e.target.value })}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Cidade *</label>
                    <input
                      type="text"
                      value={condominioEditando.cidade}
                      onChange={(e) => setCondominioEditando({ ...condominioEditando, cidade: e.target.value })}
                      required
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Estado *</label>
                    <input
                      type="text"
                      value={condominioEditando.estado}
                      onChange={(e) => setCondominioEditando({ ...condominioEditando, estado: e.target.value })}
                      required
                      maxLength={2}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent uppercase"
                      placeholder="SP"
                    />
                  </div>
                </div>

                <div className="flex gap-4 pt-4">
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 disabled:bg-gray-400 transition-colors"
                  >
                    {loading ? 'Salvando...' : 'Salvar Alterações'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setMostrarModalEditar(false)}
                    className="flex-1 bg-gray-300 text-gray-700 py-3 rounded-lg font-semibold hover:bg-gray-400 transition-colors"
                  >
                    Cancelar
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal de Gerenciar Síndico Responsável */}
        {mostrarModalSindico && condominioSelecionado && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <h2 className="text-xl font-semibold mb-4">
                Gerenciar Síndico - {condominioSelecionado.nome}
              </h2>
              
              <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                <h3 className="font-semibold mb-2">Síndico Atual:</h3>
                {condominioSelecionado.sindico_responsavel ? (
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="font-medium">{condominioSelecionado.sindico_responsavel.nome_completo}</p>
                      <p className="text-sm text-gray-600">{condominioSelecionado.sindico_responsavel.email}</p>
                    </div>
                    <button
                      onClick={removerSindicoResponsavel}
                      className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 transition-colors"
                    >
                      Remover
                    </button>
                  </div>
                ) : (
                  <p className="text-gray-500">Nenhum síndico definido</p>
                )}
              </div>

              <div>
                <h3 className="font-semibold mb-4">Selecionar Novo Síndico:</h3>
                <div className="space-y-3 max-h-64 overflow-y-auto">
                  {sindicosAprovados.map((sindico) => (
                    <div key={sindico.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="font-medium">{sindico.nome_completo}</p>
                          <p className="text-sm text-gray-600">{sindico.email}</p>
                          <p className="text-sm text-gray-500">Condomínio atual: {sindico.condominio_nome}</p>
                        </div>
                        <button
                          onClick={() => atualizarSindicoResponsavel(sindico.id)}
                          className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 transition-colors"
                          disabled={sindico.condominio_id === condominioSelecionado.id}
                        >
                          {sindico.condominio_id === condominioSelecionado.id ? 'Atual' : 'Selecionar'}
                        </button>
                      </div>
                    </div>
                  ))}
                  {sindicosAprovados.length === 0 && (
                    <p className="text-gray-500 text-center py-4">Nenhum síndico aprovado disponível</p>
                  )}
                </div>
              </div>

              <div className="flex gap-4 pt-6">
                <button
                  onClick={() => setMostrarModalSindico(false)}
                  className="flex-1 bg-gray-300 text-gray-700 py-3 rounded-lg font-semibold hover:bg-gray-400 transition-colors"
                >
                  Fechar
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}