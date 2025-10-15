'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createSupabaseClient, getCurrentUser } from '@/lib/supabase'
import Link from 'next/link'

interface Condominio {
  id: string
  nome: string
  endereco: string
  cidade: string
  estado: string
  cep: string
  created_at: string
}

interface Unidade {
  id: string
  numero: string
  bloco: string
  tipo: string
  limite_moradores: number
  moradores_atuais: number
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
  }
}

export default function AdminPage() {
  const [usuario, setUsuario] = useState<any>(null)
  const [condominios, setCondominios] = useState<Condominio[]>([])
  const [sindicosPendentes, setSindicosPendentes] = useState<SindicoPendente[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [abaAtiva, setAbaAtiva] = useState<'sindicos' | 'condominios'>('sindicos')
  
  // Estados para novo condomínio
  const [novoCondominio, setNovoCondominio] = useState({
    nome: '',
    cnpj: '',
    endereco: '',
    cidade: '',
    estado: '',
    cep: ''
  })
  
  // Estados para unidades
  const [condominioSelecionado, setCondominioSelecionado] = useState('')
  const [unidades, setUnidades] = useState<Unidade[]>([])
  const [novaUnidade, setNovaUnidade] = useState({
    numero: '',
    bloco: '',
    tipo: 'Apartamento'
  })
  
  const router = useRouter()

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

      // Verificar se é super admin
      const supabase = createSupabaseClient()
      const { data: userData } = await supabase
        .from('usuarios')
        .select('role')
        .eq('id', user.id)
        .single()

      if (userData?.role !== 'admin') {
        alert('Acesso restrito a super administradores')
        router.push('/dashboard')
        return
      }

      await carregarCondominios()
      await carregarSindicosPendentes()
    } catch (error) {
      console.error('Erro ao carregar dados:', error)
    } finally {
      setLoading(false)
    }
  }

  async function carregarCondominios() {
    const supabase = createSupabaseClient()
    const { data, error } = await supabase
      .from('condominios')
      .select('*')
      .order('nome')

    if (error) {
      console.error('Erro ao carregar condomínios:', error)
      return
    }

    setCondominios(data || [])
  }

  async function carregarSindicosPendentes() {
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
          nome
        )
      `)
      .eq('papel', 'sindico')
      .eq('status', 'pendente')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Erro ao carregar síndicos pendentes:', error)
      return
    }

    setSindicosPendentes(data || [])
  }

  async function carregarUnidades(condominioId: string) {
    const supabase = createSupabaseClient()
    const { data, error } = await supabase
      .from('unidades')
      .select('*')
      .eq('condominio_id', condominioId)
      .order('bloco')
      .order('numero')

    if (error) {
      console.error('Erro ao carregar unidades:', error)
      return
    }

    setUnidades(data || [])
  }

  // Aprovar síndico
  async function aprovarSindico(sindicoPendente: SindicoPendente) {
    if (!confirm(`Aprovar ${sindicoPendente.usuarios.nome_completo} como síndico?`)) return

    const supabase = createSupabaseClient()

    try {
      // 1. Ativar usuário
      const { error: userError } = await supabase
        .from('usuarios')
        .update({ 
          ativo: true,
          role: 'sindico'
        })
        .eq('id', sindicoPendente.usuario_id)

      if (userError) throw userError

      // 2. Aprovar vínculo
      const { error: vinculoError } = await supabase
        .from('usuarios_condominios')
        .update({ 
          status: 'aprovado',
          data_aprovacao: new Date().toISOString(),
          aprovado_por: usuario.id
        })
        .eq('id', sindicoPendente.id)

      if (vinculoError) throw vinculoError

      setMessage('✅ Síndico aprovado com sucesso!')
      carregarSindicosPendentes()
    } catch (error: any) {
      setError('Erro ao aprovar síndico: ' + error.message)
    }
  }

  // Rejeitar síndico
  async function rejeitarSindico(sindicoPendenteId: string) {
    if (!confirm('Rejeitar este cadastro de síndico?')) return

    const supabase = createSupabaseClient()

    try {
      const { error } = await supabase
        .from('usuarios_condominios')
        .update({ status: 'rejeitado' })
        .eq('id', sindicoPendenteId)

      if (error) throw error

      setMessage('❌ Cadastro de síndico rejeitado')
      carregarSindicosPendentes()
    } catch (error: any) {
      setError('Erro ao rejeitar síndico: ' + error.message)
    }
  }

  // Criar novo condomínio
  async function criarCondominio(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const supabase = createSupabaseClient()
      const { error } = await supabase
        .from('condominios')
        .insert([novoCondominio])

      if (error) throw error

      setMessage('🏢 Condomínio criado com sucesso!')
      setNovoCondominio({ nome: '', cnpj: '', endereco: '', cidade: '', estado: '', cep: '' })
      carregarCondominios()
    } catch (error: any) {
      setError('Erro ao criar condomínio: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  // Adicionar unidade
  async function adicionarUnidade(e: React.FormEvent) {
    e.preventDefault()
    if (!condominioSelecionado) {
      setError('Selecione um condomínio')
      return
    }

    setLoading(true)
    setError('')

    try {
      const supabase = createSupabaseClient()
      const { error } = await supabase
        .from('unidades')
        .insert([{
          condominio_id: condominioSelecionado,
          numero: novaUnidade.numero,
          bloco: novaUnidade.bloco,
          tipo: novaUnidade.tipo,
          limite_moradores: 1,
          moradores_atuais: 0
        }])

      if (error) throw error

      setMessage('🏠 Unidade adicionada com sucesso!')
      setNovaUnidade({ numero: '', bloco: '', tipo: 'Apartamento' })
      carregarUnidades(condominioSelecionado)
    } catch (error: any) {
      setError('Erro ao adicionar unidade: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  // Adicionar múltiplas unidades (apartamentos de um prédio)
  async function adicionarMultiplasUnidades() {
    if (!condominioSelecionado) {
      setError('Selecione um condomínio')
      return
    }

    const andares = parseInt(prompt('Quantos andares?') || '0')
    const aptosPorAndar = parseInt(prompt('Apartamentos por andar?') || '0')
    const bloco = prompt('Bloco? (deixe em branco se não houver)') || ''

    if (andares <= 0 || aptosPorAndar <= 0) {
      setError('Valores inválidos')
      return
    }

    setLoading(true)
    setError('')

    try {
      const supabase = createSupabaseClient()
      const unidadesParaInserir = []

      for (let andar = 1; andar <= andares; andar++) {
        for (let apto = 1; apto <= aptosPorAndar; apto++) {
          const numero = `${andar}${String(apto).padStart(2, '0')}`
          unidadesParaInserir.push({
            condominio_id: condominioSelecionado,
            numero: numero,
            bloco: bloco,
            tipo: 'Apartamento',
            limite_moradores: 1,
            moradores_atuais: 0
          })
        }
      }

      const { error } = await supabase
        .from('unidades')
        .insert(unidadesParaInserir)

      if (error) throw error

      setMessage(`✅ ${unidadesParaInserir.length} unidades criadas com sucesso!`)
      carregarUnidades(condominioSelecionado)
    } catch (error: any) {
      setError('Erro ao criar unidades: ' + error.message)
    } finally {
      setLoading(false)
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
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div>
              <Link href="/dashboard" className="text-blue-600 hover:text-blue-700 text-sm mb-2 inline-block">
                ← Voltar ao Dashboard
              </Link>
              <h1 className="text-2xl font-bold text-gray-900">
                👑 Super Administrador
              </h1>
              <p className="text-sm text-gray-600">
                Gerencie condomínios e aprove síndicos
              </p>
            </div>
            <div className="text-right">
              <div className="text-sm text-gray-600">Logado como: <strong>{usuario?.email}</strong></div>
              <div className="text-xs text-green-600 font-semibold">Super Admin</div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Alertas */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        {message && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-sm text-green-600">{message}</p>
          </div>
        )}

        {/* Abas */}
        <div className="bg-white rounded-lg shadow mb-6">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex">
              <button
                onClick={() => setAbaAtiva('sindicos')}
                className={`py-4 px-6 text-center border-b-2 font-medium text-sm ${
                  abaAtiva === 'sindicos'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                👔 Aprovar Síndicos
                {sindicosPendentes.length > 0 && (
                  <span className="ml-2 bg-red-100 text-red-600 text-xs px-2 py-1 rounded-full">
                    {sindicosPendentes.length}
                  </span>
                )}
              </button>
              <button
                onClick={() => setAbaAtiva('condominios')}
                className={`py-4 px-6 text-center border-b-2 font-medium text-sm ${
                  abaAtiva === 'condominios'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                🏢 Gerenciar Condomínios
              </button>
            </nav>
          </div>
        </div>

        {/* Conteúdo - Aprovar Síndicos */}
        {abaAtiva === 'sindicos' && (
          <div className="space-y-6">
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
                            <div>
                              <strong>Email:</strong> {sindico.usuarios.email}
                            </div>
                            <div>
                              <strong>CPF:</strong> {sindico.usuarios.cpf}
                            </div>
                            <div>
                              <strong>Telefone:</strong> {sindico.usuarios.telefone || 'Não informado'}
                            </div>
                            <div>
                              <strong>Condomínio:</strong> {sindico.condominios.nome}
                            </div>
                            <div>
                              <strong>Solicitado em:</strong> {new Date(sindico.created_at).toLocaleDateString('pt-BR')}
                            </div>
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
          </div>
        )}

        {/* Conteúdo - Gerenciar Condomínios */}
        {abaAtiva === 'condominios' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Cadastrar Condomínio */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold mb-4">Cadastrar Novo Condomínio</h2>
              <form onSubmit={criarCondominio} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nome do Condomínio *
                  </label>
                  <input
                    type="text"
                    value={novoCondominio.nome}
                    onChange={(e) => setNovoCondominio({ ...novoCondominio, nome: e.target.value })}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Ex: Edifício Exemplo"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    CNPJ
                  </label>
                  <input
                    type="text"
                    value={novoCondominio.cnpj}
                    onChange={(e) => setNovoCondominio({ ...novoCondominio, cnpj: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="00.000.000/0000-00"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Endereço *
                  </label>
                  <input
                    type="text"
                    value={novoCondominio.endereco}
                    onChange={(e) => setNovoCondominio({ ...novoCondominio, endereco: e.target.value })}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Rua, número, bairro"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Cidade *
                    </label>
                    <input
                      type="text"
                      value={novoCondominio.cidade}
                      onChange={(e) => setNovoCondominio({ ...novoCondominio, cidade: e.target.value })}
                      required
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Estado *
                    </label>
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

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    CEP
                  </label>
                  <input
                    type="text"
                    value={novoCondominio.cep}
                    onChange={(e) => setNovoCondominio({ ...novoCondominio, cep: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="00000-000"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 disabled:bg-gray-400 transition-colors"
                >
                  {loading ? 'Criando...' : 'Criar Condomínio'}
                </button>
              </form>
            </div>

            {/* Gerenciar Unidades */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold mb-4">Gerenciar Unidades</h2>
              
              {/* Selecionar Condomínio */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Selecione o Condomínio
                </label>
                <select
                  value={condominioSelecionado}
                  onChange={(e) => {
                    setCondominioSelecionado(e.target.value)
                    if (e.target.value) carregarUnidades(e.target.value)
                  }}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Selecione um condomínio</option>
                  {condominios.map(condominio => (
                    <option key={condominio.id} value={condominio.id}>
                      {condominio.nome} - {condominio.cidade}/{condominio.estado}
                    </option>
                  ))}
                </select>
              </div>

              {condominioSelecionado && (
                <>
                  {/* Adicionar Unidade Individual */}
                  <form onSubmit={adicionarUnidade} className="space-y-4 mb-6 p-4 border border-gray-200 rounded-lg">
                    <h3 className="font-semibold mb-2">Adicionar Unidade Individual</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Número *
                        </label>
                        <input
                          type="text"
                          value={novaUnidade.numero}
                          onChange={(e) => setNovaUnidade({ ...novaUnidade, numero: e.target.value })}
                          required
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="101"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Bloco
                        </label>
                        <input
                          type="text"
                          value={novaUnidade.bloco}
                          onChange={(e) => setNovaUnidade({ ...novaUnidade, bloco: e.target.value })}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="A"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Tipo
                      </label>
                      <select
                        value={novaUnidade.tipo}
                        onChange={(e) => setNovaUnidade({ ...novaUnidade, tipo: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="Apartamento">Apartamento</option>
                        <option value="Casa">Casa</option>
                        <option value="Sala Comercial">Sala Comercial</option>
                        <option value="Cobertura">Cobertura</option>
                      </select>
                    </div>
                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full bg-green-600 text-white py-2 rounded-lg font-medium hover:bg-green-700 disabled:bg-gray-400 transition-colors"
                    >
                      {loading ? 'Adicionando...' : 'Adicionar Unidade'}
                    </button>
                  </form>

                  {/* Adicionar Múltiplas Unidades */}
                  <div className="mb-6">
                    <button
                      onClick={adicionarMultiplasUnidades}
                      className="w-full bg-purple-600 text-white py-3 rounded-lg font-semibold hover:bg-purple-700 transition-colors"
                    >
                      🏢 Criar Múltiplas Unidades (Prédio)
                    </button>
                    <p className="text-xs text-gray-500 mt-2 text-center">
                      Cria automaticamente apartamentos por andar
                    </p>
                  </div>

                  {/* Lista de Unidades Existentes */}
                  <div>
                    <h3 className="font-semibold mb-4">Unidades Existentes ({unidades.length})</h3>
                    {unidades.length === 0 ? (
                      <p className="text-gray-500 text-center py-4">Nenhuma unidade cadastrada</p>
                    ) : (
                      <div className="max-h-60 overflow-y-auto border border-gray-200 rounded-lg">
                        <table className="min-w-full divide-y divide-gray-200">
                          <thead className="bg-gray-50">
                            <tr>
                              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Número</th>
                              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Bloco</th>
                              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Tipo</th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-200">
                            {unidades.map(unidade => (
                              <tr key={unidade.id}>
                                <td className="px-4 py-2 text-sm">{unidade.numero}</td>
                                <td className="px-4 py-2 text-sm">{unidade.bloco || '-'}</td>
                                <td className="px-4 py-2 text-sm">{unidade.tipo}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  )
}