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

interface Bloco {
  id: string
  nome: string
  andares: number
  unidades_por_andar: number
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
  
  const [blocos, setBlocos] = useState<Bloco[]>([
    { id: '1', nome: '', andares: 1, unidades_por_andar: 1 }
  ])

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
          usuarios:usuario_id (
            id,
            nome_completo,
            email,
            telefone,
            cpf
          ),
          condominios:condominio_id (
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
          usuarios:usuario_id!inner(
            id,
            nome_completo,
            email,
            telefone
          ),
          condominios:condominio_id!inner(
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

  const adicionarBloco = () => {
    setBlocos([...blocos, { 
      id: Date.now().toString(), 
      nome: '', 
      andares: 1, 
      unidades_por_andar: 1 
    }])
  }

  const removerBloco = (id: string) => {
    setBlocos(blocos.filter(b => b.id !== id))
  }

  const atualizarBloco = (id: string, field: string, value: any) => {
    setBlocos(blocos.map(b => b.id === id ? { ...b, [field]: value } : b))
  }

  const gerarUnidades = (nomeBloco: string, andares: number, unidadesPorAndar: number) => {
    const unidades = []
    for (let andar = 1; andar <= andares; andar++) {
      for (let unidade = 1; unidade <= unidadesPorAndar; unidade++) {
        const numero = `${andar}${unidade.toString().padStart(2, '0')}`
        unidades.push({
          bloco: nomeBloco,
          numero,
          andar,
          unidade_andar: unidade
        })
      }
    }
    return unidades
  }

  const criarCondominioComBlocos = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const supabase = createSupabaseClient()
      
      // Validar blocos
      if (blocos.some(b => !b.nome)) {
        alert('Preencha o nome de todos os blocos')
        setLoading(false)
        return
      }

      // Calcular total de unidades
      const totalUnidades = blocos.reduce((acc, b) => acc + (b.andares * b.unidades_por_andar), 0)

      // 1. Criar condomínio
      const { data: cond, error: condError } = await supabase
        .from('condominios')
        .insert({
          nome: novoCondominio.nome,
          cnpj: novoCondominio.cnpj || null,
          endereco: novoCondominio.endereco,
          cidade: novoCondominio.cidade,
          estado: novoCondominio.estado,
          cep: novoCondominio.cep || null,
          total_unidades: totalUnidades,
          unidades_ocupadas: 0,
          ativo: true
        })
        .select()
        .single()

      if (condError) throw condError

      // 2. Criar blocos
      const blocosData = blocos.map(b => ({
        condominio_id: cond.id,
        nome: b.nome,
        andares: b.andares,
        unidades_por_andar: b.unidades_por_andar,
        total_unidades: b.andares * b.unidades_por_andar
      }))

      const { data: blocosInseridos, error: blocosError } = await supabase
        .from('blocos')
        .insert(blocosData)
        .select()

      if (blocosError) throw blocosError

      // 3. Criar unidades (SEM a coluna 'ocupada')
      const todasUnidades = []
      for (const bloco of blocosInseridos) {
        const unidadesBloco = gerarUnidades(bloco.nome, bloco.andares, bloco.unidades_por_andar)
        const unidadesData = unidadesBloco.map(u => ({
          condominio_id: cond.id,
          bloco_id: bloco.id,
          numero: u.numero,
          andar: u.andar,
          unidade_andar: u.unidade_andar,
          moradores_atuais: 0,
          limite_moradores: 1,
          created_at: new Date().toISOString()
        }))
        todasUnidades.push(...unidadesData)
      }

      const { error: unidadesError } = await supabase
        .from('unidades')
        .insert(todasUnidades)

      if (unidadesError) throw unidadesError

      alert(`✅ Condomínio criado com ${totalUnidades} unidades!`)
      
      // Reset
      setNovoCondominio({ nome: '', cnpj: '', endereco: '', cidade: '', estado: '', cep: '', total_unidades: '' })
      setBlocos([{ id: '1', nome: '', andares: 1, unidades_por_andar: 1 }])
      
      await carregarCondominios()
    } catch (error: any) {
      alert('❌ Erro: ' + error.message)
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
        .update({ sindico_responsavel_id: sindicoId })
        .eq('id', condominioSelecionado.id)

      if (error) throw error

      alert('✅ Síndico responsável atualizado!')
      setMostrarModalSindico(false)
      await carregarCondominios()
    } catch (error: any) {
      alert('❌ Erro: ' + error.message)
    }
  }

  const removerSindicoResponsavel = async () => {
    if (!condominioSelecionado) return

    try {
      const supabase = createSupabaseClient()
      
      const { error } = await supabase
        .from('condominios')
        .update({ sindico_responsavel_id: null })
        .eq('id', condominioSelecionado.id)

      if (error) throw error

      alert('✅ Síndico removido!')
      setMostrarModalSindico(false)
      await carregarCondominios()
    } catch (error: any) {
      alert('❌ Erro: ' + error.message)
    }
  }

  const excluirCondominio = async (condominioId: string, nome: string) => {
    if (!confirm(`Excluir "${nome}"?`)) return

    try {
      const supabase = createSupabaseClient()
      const { error } = await supabase
        .from('condominios')
        .delete()
        .eq('id', condominioId)

      if (error) throw error

      alert('✅ Condomínio excluído!')
      await carregarCondominios()
    } catch (error: any) {
      alert('❌ Erro: ' + error.message)
    }
  }

  const toggleStatusCondominio = async (condominioId: string, ativoAtual: boolean) => {
    if (!confirm(`${ativoAtual ? 'Desativar' : 'Ativar'} condomínio?`)) return

    try {
      const supabase = createSupabaseClient()
      const { error } = await supabase
        .from('condominios')
        .update({ ativo: !ativoAtual })
        .eq('id', condominioId)

      if (error) throw error

      alert(`✅ Condomínio ${!ativoAtual ? 'ativado' : 'desativado'}!`)
      await carregarCondominios()
    } catch (error: any) {
      alert('❌ Erro: ' + error.message)
    }
  }

  const aprovarSindico = async (sindicoPendente: SindicoPendente) => {
    if (!confirm(`Aprovar ${sindicoPendente.usuarios.nome_completo}?`)) return

    try {
      const supabase = createSupabaseClient()

      const { error: userError } = await supabase
        .from('usuarios')
        .update({ ativo: true, role: 'sindico' })
        .eq('id', sindicoPendente.usuario_id)

      if (userError) throw userError

      const { error: vinculoError } = await supabase
        .from('usuarios_condominios')
        .update({ 
          status: 'aprovado',
          data_aprovacao: new Date().toISOString(),
          aprovado_por: usuario.id
        })
        .eq('id', sindicoPendente.id)

      if (vinculoError) throw vinculoError

      const { error: condominioError } = await supabase
        .from('condominios')
        .update({ sindico_responsavel_id: sindicoPendente.usuario_id })
        .eq('id', sindicoPendente.condominio_id)

      if (condominioError) throw condominioError

      alert('✅ Síndico aprovado!')
      await carregarDados()
    } catch (error: any) {
      alert('❌ Erro: ' + error.message)
    }
  }

  const rejeitarSindico = async (sindicoPendenteId: string) => {
    if (!confirm('Rejeitar síndico?')) return

    try {
      const supabase = createSupabaseClient()
      const { error } = await supabase
        .from('usuarios_condominios')
        .update({ status: 'rejeitado' })
        .eq('id', sindicoPendenteId)

      if (error) throw error

      alert('❌ Síndico rejeitado')
      await carregarSindicosPendentes()
    } catch (error: any) {
      alert('❌ Erro: ' + error.message)
    }
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
              <p className="text-sm text-gray-600">Gerencie todos os condomínios</p>
            </div>
            <div className="text-right">
              <div className="text-sm text-gray-600">Logado: <strong>{usuario?.email}</strong></div>
              <button onClick={handleLogout} className="mt-1 px-3 py-1 text-sm text-red-600 hover:bg-red-50 rounded-lg">
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
                className={`py-4 px-6 border-b-2 font-medium text-sm ${
                  abaAtiva === 'geral' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500'
                }`}
              >
                🏢 Condomínios
              </button>
              <button
                onClick={() => setAbaAtiva('sindicos')}
                className={`py-4 px-6 border-b-2 font-medium text-sm ${
                  abaAtiva === 'sindicos' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500'
                }`}
              >
                👔 Aprovar Síndicos
                {sindicosPendentes.length > 0 && (
                  <span className="ml-2 bg-red-500 text-white text-xs px-2 py-1 rounded-full">
                    {sindicosPendentes.length}
                  </span>
                )}
              </button>
            </nav>
          </div>
        </div>

        {abaAtiva === 'geral' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-3 grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center">
                  <div className="p-3 bg-blue-100 rounded-lg"><span className="text-2xl">🏢</span></div>
                  <div className="ml-4">
                    <p className="text-sm text-gray-600">Total</p>
                    <p className="text-2xl font-bold">{condominios.length}</p>
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center">
                  <div className="p-3 bg-green-100 rounded-lg"><span className="text-2xl">✅</span></div>
                  <div className="ml-4">
                    <p className="text-sm text-gray-600">Ativos</p>
                    <p className="text-2xl font-bold text-green-600">{condominios.filter(c => c.ativo).length}</p>
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center">
                  <div className="p-3 bg-red-100 rounded-lg"><span className="text-2xl">❌</span></div>
                  <div className="ml-4">
                    <p className="text-sm text-gray-600">Inativos</p>
                    <p className="text-2xl font-bold text-red-600">{condominios.filter(c => !c.ativo).length}</p>
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center">
                  <div className="p-3 bg-purple-100 rounded-lg"><span className="text-2xl">📊</span></div>
                  <div className="ml-4">
                    <p className="text-sm text-gray-600">Taxa Ativos</p>
                    <p className="text-2xl font-bold text-purple-600">
                      {condominios.length > 0 ? ((condominios.filter(c => c.ativo).length / condominios.length) * 100).toFixed(1) : '0'}%
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="lg:col-span-1">
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-xl font-semibold mb-4">Cadastrar Condomínio</h2>
                <form onSubmit={criarCondominioComBlocos} className="space-y-4">
                  <input
                    type="text"
                    value={novoCondominio.nome}
                    onChange={(e) => setNovoCondominio({ ...novoCondominio, nome: e.target.value })}
                    placeholder="Nome *"
                    required
                    className="w-full px-4 py-2 border rounded-lg"
                  />
                  <input
                    type="text"
                    value={novoCondominio.cnpj}
                    onChange={(e) => setNovoCondominio({ ...novoCondominio, cnpj: e.target.value })}
                    placeholder="CNPJ"
                    className="w-full px-4 py-2 border rounded-lg"
                  />
                  <input
                    type="text"
                    value={novoCondominio.endereco}
                    onChange={(e) => setNovoCondominio({ ...novoCondominio, endereco: e.target.value })}
                    placeholder="Endereço *"
                    required
                    className="w-full px-4 py-2 border rounded-lg"
                  />
                  <div className="grid grid-cols-2 gap-4">
                    <input
                      type="text"
                      value={novoCondominio.cidade}
                      onChange={(e) => setNovoCondominio({ ...novoCondominio, cidade: e.target.value })}
                      placeholder="Cidade *"
                      required
                      className="w-full px-4 py-2 border rounded-lg"
                    />
                    <input
                      type="text"
                      value={novoCondominio.estado}
                      onChange={(e) => setNovoCondominio({ ...novoCondominio, estado: e.target.value })}
                      placeholder="UF *"
                      required
                      maxLength={2}
                      className="w-full px-4 py-2 border rounded-lg uppercase"
                    />
                  </div>

                  {/* Blocos */}
                  <div className="border-t pt-4">
                    <div className="flex justify-between items-center mb-3">
                      <h3 className="font-semibold">Blocos</h3>
                      <button type="button" onClick={adicionarBloco} className="text-blue-600 text-sm">+ Adicionar Bloco</button>
                    </div>
                    
                    {blocos.map((bloco, idx) => (
                      <div key={bloco.id} className="bg-gray-50 p-3 rounded-lg mb-2">
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-sm font-medium">Bloco {idx + 1}</span>
                          {blocos.length > 1 && (
                            <button type="button" onClick={() => removerBloco(bloco.id)} className="text-red-600 text-sm">✗ Remover</button>
                          )}
                        </div>
                        
                        {/* Campo de Nome do Bloco */}
                        <input
                          type="text"
                          value={bloco.nome}
                          onChange={(e) => atualizarBloco(bloco.id, 'nome', e.target.value)}
                          placeholder="Nome do Bloco *"
                          required
                          className="w-full px-3 py-2 border rounded mb-2"
                        />
                        
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="text-xs text-gray-500 mb-1 block">Número de Andares</label>
                            <input
                              type="number"
                              value={bloco.andares}
                              onChange={(e) => atualizarBloco(bloco.id, 'andares', parseInt(e.target.value) || 1)}
                              placeholder="Andares *"
                              required
                              min="1"
                              className="w-full px-3 py-2 border rounded"
                            />
                          </div>
                          <div>
                            <label className="text-xs text-gray-500 mb-1 block">Unidades por Andar</label>
                            <input
                              type="number"
                              value={bloco.unidades_por_andar}
                              onChange={(e) => atualizarBloco(bloco.id, 'unidades_por_andar', parseInt(e.target.value) || 1)}
                              placeholder="Unid/Andar *"
                              required
                              min="1"
                              className="w-full px-3 py-2 border rounded"
                            />
                          </div>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                          {bloco.andares * bloco.unidades_por_andar} unidades neste bloco
                        </p>
                      </div>
                    ))}
                    
                    <p className="text-sm font-medium text-blue-600 mt-3">
                      Total: {blocos.reduce((acc, b) => acc + (b.andares * b.unidades_por_andar), 0)} unidades
                    </p>
                  </div>

                  <button type="submit" disabled={loading} className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700">
                    {loading ? 'Criando...' : 'Cadastrar Condomínio'}
                  </button>
                </form>
              </div>
            </div>

            <div className="lg:col-span-2">
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-semibold">Condomínios ({condominios.length})</h2>
                  <input
                    type="text"
                    placeholder="Buscar..."
                    value={busca}
                    onChange={(e) => setBusca(e.target.value)}
                    className="w-64 px-4 py-2 border rounded-lg"
                  />
                </div>
                
                <div className="space-y-4 max-h-96 overflow-y-auto">
                  {condominiosFiltrados.length === 0 ? (
                    <p className="text-center py-8 text-gray-500">Nenhum condomínio</p>
                  ) : (
                    condominiosFiltrados.map((cond) => (
                      <div key={cond.id} className="border rounded-lg p-4">
                        <div className="flex justify-between">
                          <div className="flex-1">
                            <h3 className="font-semibold text-lg">{cond.nome}</h3>
                            <div className="grid grid-cols-2 gap-2 mt-2 text-sm text-gray-600">
                              <div><strong>CNPJ:</strong> {cond.cnpj || 'N/A'}</div>
                              <div><strong>Unidades:</strong> {cond.unidades_ocupadas}/{cond.total_unidades}</div>
                              <div><strong>Local:</strong> {cond.cidade}/{cond.estado}</div>
                              <div>
                                <strong>Síndico:</strong> {cond.sindico_responsavel?.nome_completo || 'Não definido'}
                              </div>
                              <div>
                                <strong>Status:</strong> 
                                <span className={cond.ativo ? 'text-green-600' : 'text-red-600'}> {cond.ativo ? 'Ativo' : 'Inativo'}</span>
                              </div>
                            </div>
                          </div>
                          <div className="flex flex-col gap-2 ml-4">
                            <button
                              onClick={() => toggleStatusCondominio(cond.id, cond.ativo)}
                              className={`px-4 py-2 rounded-lg text-sm ${cond.ativo ? 'bg-red-600 hover:bg-red-700' : 'bg-green-600 hover:bg-green-700'} text-white`}
                            >
                              {cond.ativo ? 'Desativar' : 'Ativar'}
                            </button>
                            <button onClick={() => abrirModalEditar(cond)} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700">
                              Editar
                            </button>
                            <button onClick={() => abrirModalSindico(cond)} className="px-4 py-2 bg-purple-600 text-white rounded-lg text-sm hover:bg-purple-700">
                              Síndico
                            </button>
                            <button onClick={() => excluirCondominio(cond.id, cond.nome)} className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm hover:bg-red-700">
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

        {abaAtiva === 'sindicos' && (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">Síndicos Pendentes ({sindicosPendentes.length})</h2>
            
            {sindicosPendentes.length === 0 ? (
              <div className="text-center py-8">
                <div className="text-4xl mb-4">👥</div>
                <p className="text-gray-500">Nenhum síndico pendente</p>
              </div>
            ) : (
              <div className="space-y-4">
                {sindicosPendentes.map((sind) => (
                  <div key={sind.id} className="border rounded-lg p-4">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h3 className="font-semibold text-lg">{sind.usuarios.nome_completo}</h3>
                        <div className="grid grid-cols-2 gap-2 mt-2 text-sm text-gray-600">
                          <div><strong>Email:</strong> {sind.usuarios.email}</div>
                          <div><strong>CPF:</strong> {sind.usuarios.cpf}</div>
                          <div><strong>Telefone:</strong> {sind.usuarios.telefone || 'N/A'}</div>
                          <div><strong>Condomínio:</strong> {sind.condominios.nome}</div>
                        </div>
                      </div>
                      <div className="flex gap-2 ml-4">
                        <button onClick={() => aprovarSindico(sind)} className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700">
                          ✓ Aprovar
                        </button>
                        <button onClick={() => rejeitarSindico(sind.id)} className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700">
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

        {/* Modal Editar */}
        {mostrarModalEditar && condominioEditando && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-2xl">
              <h2 className="text-xl font-semibold mb-4">Editar Condomínio</h2>
              <form onSubmit={atualizarCondominio} className="space-y-4">
                <input
                  type="text"
                  value={condominioEditando.nome}
                  onChange={(e) => setCondominioEditando({ ...condominioEditando, nome: e.target.value })}
                  placeholder="Nome"
                  required
                  className="w-full px-4 py-2 border rounded-lg"
                />
                <input
                  type="text"
                  value={condominioEditando.cnpj || ''}
                  onChange={(e) => setCondominioEditando({ ...condominioEditando, cnpj: e.target.value })}
                  placeholder="CNPJ"
                  className="w-full px-4 py-2 border rounded-lg"
                />
                <div className="grid grid-cols-2 gap-4">
                  <input
                    type="number"
                    value={condominioEditando.total_unidades}
                    onChange={(e) => setCondominioEditando({ ...condominioEditando, total_unidades: parseInt(e.target.value) })}
                    placeholder="Total Unidades"
                    required
                    className="w-full px-4 py-2 border rounded-lg"
                  />
                  <input
                    type="number"
                    value={condominioEditando.unidades_ocupadas}
                    onChange={(e) => setCondominioEditando({ ...condominioEditando, unidades_ocupadas: parseInt(e.target.value) })}
                    placeholder="Ocupadas"
                    className="w-full px-4 py-2 border rounded-lg"
                  />
                </div>
                <input
                  type="text"
                  value={condominioEditando.endereco}
                  onChange={(e) => setCondominioEditando({ ...condominioEditando, endereco: e.target.value })}
                  placeholder="Endereço"
                  required
                  className="w-full px-4 py-2 border rounded-lg"
                />
                <div className="grid grid-cols-2 gap-4">
                  <input
                    type="text"
                    value={condominioEditando.cidade}
                    onChange={(e) => setCondominioEditando({ ...condominioEditando, cidade: e.target.value })}
                    placeholder="Cidade"
                    required
                    className="w-full px-4 py-2 border rounded-lg"
                  />
                  <input
                    type="text"
                    value={condominioEditando.estado}
                    onChange={(e) => setCondominioEditando({ ...condominioEditando, estado: e.target.value })}
                    placeholder="UF"
                    required
                    maxLength={2}
                    className="w-full px-4 py-2 border rounded-lg uppercase"
                  />
                </div>
                <div className="flex gap-4">
                  <button type="submit" disabled={loading} className="flex-1 bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700">
                    Salvar
                  </button>
                  <button type="button" onClick={() => setMostrarModalEditar(false)} className="flex-1 bg-gray-300 text-gray-700 py-3 rounded-lg font-semibold hover:bg-gray-400">
                    Cancelar
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal Síndico */}
        {mostrarModalSindico && condominioSelecionado && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <h2 className="text-xl font-semibold mb-4">Gerenciar Síndico - {condominioSelecionado.nome}</h2>
              
              <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                <h3 className="font-semibold mb-2">Síndico Atual:</h3>
                {condominioSelecionado.sindico_responsavel ? (
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="font-medium">{condominioSelecionado.sindico_responsavel.nome_completo}</p>
                      <p className="text-sm text-gray-600">{condominioSelecionado.sindico_responsavel.email}</p>
                    </div>
                    <button onClick={removerSindicoResponsavel} className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700">
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
                  {sindicosAprovados.map((sind) => (
                    <div key={sind.id} className="border rounded-lg p-4">
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="font-medium">{sind.nome_completo}</p>
                          <p className="text-sm text-gray-600">{sind.email}</p>
                          <p className="text-sm text-gray-500">Condomínio: {sind.condominio_nome}</p>
                        </div>
                        <button
                          onClick={() => atualizarSindicoResponsavel(sind.id)}
                          disabled={sind.condominio_id === condominioSelecionado.id}
                          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400"
                        >
                          {sind.condominio_id === condominioSelecionado.id ? 'Atual' : 'Selecionar'}
                        </button>
                      </div>
                    </div>
                  ))}
                  {sindicosAprovados.length === 0 && (
                    <p className="text-gray-500 text-center py-4">Nenhum síndico aprovado</p>
                  )}
                </div>
              </div>

              <button onClick={() => setMostrarModalSindico(false)} className="w-full mt-6 bg-gray-300 text-gray-700 py-3 rounded-lg font-semibold hover:bg-gray-400">
                Fechar
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}