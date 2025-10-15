'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createSupabaseClient } from '@/lib/supabase'
import Link from 'next/link'

interface Condominio {
  id: string
  nome: string
  endereco: string
  cidade: string
  estado: string
}

interface Unidade {
  id: string
  numero: string
  bloco: string
  tipo: string
  limite_moradores: number
  moradores_atuais: number
  vagas_disponiveis: number
  tem_pendente?: boolean
}

// Função para validar CPF com dígitos verificadores
function validarCPF(cpf: string): boolean {
  cpf = cpf.replace(/[^\d]+/g, '');
  
  if (cpf.length !== 11 || /^(\d)\1+$/.test(cpf)) return false;
  
  let soma = 0;
  let resto;
  
  for (let i = 1; i <= 9; i++) {
    soma = soma + parseInt(cpf.substring(i-1, i)) * (11 - i);
  }
  
  resto = (soma * 10) % 11;
  if ((resto === 10) || (resto === 11)) resto = 0;
  if (resto !== parseInt(cpf.substring(9, 10))) return false;
  
  soma = 0;
  for (let i = 1; i <= 10; i++) {
    soma = soma + parseInt(cpf.substring(i-1, i)) * (12 - i);
  }
  
  resto = (soma * 10) % 11;
  if ((resto === 10) || (resto === 11)) resto = 0;
  if (resto !== parseInt(cpf.substring(10, 11))) return false;
  
  return true;
}

// Função para formatar CPF
function formatarCPF(cpf: string): string {
  cpf = cpf.replace(/\D/g, '');
  cpf = cpf.replace(/(\d{3})(\d)/, '$1.$2');
  cpf = cpf.replace(/(\d{3})(\d)/, '$1.$2');
  cpf = cpf.replace(/(\d{3})(\d{1,2})$/, '$1-$2');
  return cpf;
}

export default function CadastroPage() {
  const [formData, setFormData] = useState({
    nome_completo: '',
    email: '',
    telefone: '',
    cpf: '',
    password: '',
    confirmPassword: '',
    role: 'morador',
    condominio_id: '',
    unidade_id: ''
  })
  const [condominios, setCondominios] = useState<Condominio[]>([])
  const [unidades, setUnidades] = useState<Unidade[]>([])
  const [unidadesFiltradas, setUnidadesFiltradas] = useState<Unidade[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [cpfValido, setCpfValido] = useState(true)
  const router = useRouter()

  // Carregar condomínios disponíveis
  useEffect(() => {
    carregarCondominios()
  }, [])

  // Carregar unidades quando condomínio for selecionado
  useEffect(() => {
    if (formData.condominio_id) {
      carregarUnidades(formData.condominio_id)
    } else {
      setUnidades([])
      setUnidadesFiltradas([])
    }
  }, [formData.condominio_id])

  // Validar CPF quando mudar
  useEffect(() => {
    if (formData.cpf && formData.cpf.replace(/\D/g, '').length === 11) {
      setCpfValido(validarCPF(formData.cpf))
    } else {
      setCpfValido(true)
    }
  }, [formData.cpf])

  async function carregarCondominios() {
    const supabase = createSupabaseClient()
    
    const { data, error } = await supabase
      .from('condominios')
      .select('id, nome, endereco, cidade, estado')
      .order('nome')

    if (error) {
      console.error('Erro ao carregar condomínios:', error)
      return
    }

    setCondominios(data || [])
  }

  async function carregarUnidades(condominioId: string) {
    const supabase = createSupabaseClient()
    
    const { data, error } = await supabase
      .from('unidades')
      .select(`*`)
      .eq('condominio_id', condominioId)
      .order('bloco')
      .order('numero')

    if (error) {
      console.error('Erro ao carregar unidades:', error)
      return
    }

    // Calcular vagas disponíveis
    const unidadesComVagas = (data || []).map(unidade => {
      const vagasDisponiveis = unidade.limite_moradores - unidade.moradores_atuais
      
      return {
        ...unidade,
        vagas_disponiveis: vagasDisponiveis,
        tem_pendente: false // Simplificado para correção
      }
    })

    setUnidades(unidadesComVagas)
    setUnidadesFiltradas(unidadesComVagas)
  }

  const verificarUnidadeOcupada = async (unidadeId: string): Promise<boolean> => {
    const supabase = createSupabaseClient()
    
    const { data, error } = await supabase
      .from('usuarios_condominios')
      .select('id, status')
      .eq('unidade_id', unidadeId)
      .in('status', ['aprovado', 'pendente'])
      .single()

    if (error && error.code !== 'PGRST116') {
      console.error('Erro ao verificar unidade:', error)
      return true
    }

    return !!data
  }

  const verificarSindicoExistente = async (condominioId: string): Promise<boolean> => {
    const supabase = createSupabaseClient()
    
    const { data, error } = await supabase
      .from('usuarios_condominios')
      .select('id, status')
      .eq('condominio_id', condominioId)
      .eq('papel', 'sindico')
      .in('status', ['aprovado', 'pendente'])
      .single()

    if (error && error.code !== 'PGRST116') {
      console.error('Erro ao verificar síndico:', error)
      return true
    }

    return !!data
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    
    if (name === 'cpf') {
      const cpfFormatado = formatarCPF(value)
      setFormData(prev => ({
        ...prev,
        [name]: cpfFormatado
      }))
      return
    }

    setFormData(prev => ({
      ...prev,
      [name]: value
    }))

    if (name === 'condominio_id') {
      setFormData(prev => ({
        ...prev,
        unidade_id: ''
      }))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setMessage('')

    // Validações básicas
    if (formData.password !== formData.confirmPassword) {
      setError('As senhas não coincidem')
      setLoading(false)
      return
    }

    if (formData.password.length < 6) {
      setError('A senha deve ter pelo menos 6 caracteres')
      setLoading(false)
      return
    }

    const cpfNumerico = formData.cpf.replace(/\D/g, '')
    if (cpfNumerico.length !== 11 || !validarCPF(cpfNumerico)) {
      setError('CPF inválido. Verifique os dígitos.')
      setLoading(false)
      return
    }

    if (formData.role === 'morador' && !formData.unidade_id) {
      setError('Selecione uma unidade para vincular o morador')
      setLoading(false)
      return
    }

    try {
      const supabase = createSupabaseClient()

      // VERIFICAÇÃO 1: CPF já cadastrado
      const { data: cpfExistente } = await supabase
        .from('usuarios')
        .select('id, email')
        .eq('cpf', formData.cpf)
        .single()

      if (cpfExistente) {
        setError('CPF já cadastrado no sistema')
        setLoading(false)
        return
      }

      // VERIFICAÇÃO 2: Email já cadastrado
      const { data: emailExistente } = await supabase
        .from('usuarios')
        .select('id')
        .eq('email', formData.email)
        .single()

      if (emailExistente) {
        setError('Email já cadastrado no sistema')
        setLoading(false)
        return
      }

      // VERIFICAÇÃO 3: Unidade já ocupada (apenas para moradores)
      if (formData.role === 'morador' && formData.unidade_id) {
        const unidadeSelecionada = unidades.find(u => u.id === formData.unidade_id)
        
        if (!unidadeSelecionada) {
          setError('Unidade não encontrada')
          setLoading(false)
          return
        }

        if (unidadeSelecionada.vagas_disponiveis <= 0) {
          setError('Unidade já possui representante cadastrado')
          setLoading(false)
          return
        }

        const unidadeOcupada = await verificarUnidadeOcupada(formData.unidade_id)
        if (unidadeOcupada) {
          setError('Unidade já possui representante cadastrado ou aguardando aprovação')
          setLoading(false)
          return
        }
      }

      // VERIFICAÇÃO 4: Apenas um síndico por condomínio
      if (formData.role === 'sindico') {
        const sindicoExistente = await verificarSindicoExistente(formData.condominio_id)
        if (sindicoExistente) {
          setError('Condomínio já possui síndico cadastrado ou aguardando aprovação')
          setLoading(false)
          return
        }
      }

      // 1. Criar usuário no Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            nome_completo: formData.nome_completo
          }
        }
      })

      if (authError) {
        setError('Erro ao criar conta: ' + authError.message)
        return
      }

      if (!authData.user) {
        setError('Erro ao criar usuário no sistema de autenticação')
        return
      }

      // 2. Criar registro na tabela usuarios
      const { error: userError } = await supabase
        .from('usuarios')
        .insert({
          auth_id: authData.user.id,
          email: formData.email,
          nome_completo: formData.nome_completo,
          telefone: formData.telefone,
          cpf: formData.cpf,
          role: formData.role,
          ativo: false
        })

      if (userError) {
        console.error('Erro detalhado ao criar usuário:', userError)
        
        // Verificar se é erro de duplicidade
        if (userError.code === '23505') {
          if (userError.message.includes('cpf')) {
            setError('CPF já cadastrado no sistema')
          } else if (userError.message.includes('email')) {
            setError('Email já cadastrado no sistema')
          } else {
            setError('Usuário já cadastrado no sistema')
          }
        } else {
          setError('Erro ao salvar dados do usuário: ' + userError.message)
        }
        return
      }

      // 3. Buscar ID do usuário criado
      const { data: userData, error: userFetchError } = await supabase
        .from('usuarios')
        .select('id')
        .eq('email', formData.email)
        .single()

      if (userFetchError || !userData) {
        setError('Erro ao buscar usuário criado')
        return
      }

      // 4. Criar vínculo com condomínio
      const vinculoData: any = {
        usuario_id: userData.id,
        condominio_id: formData.condominio_id,
        papel: formData.role,
        status: 'pendente'
      }

      // 5. Vincular à unidade se for morador
      if (formData.role === 'morador' && formData.unidade_id) {
        // Verificação final da unidade (evitar race condition)
        const unidadeOcupada = await verificarUnidadeOcupada(formData.unidade_id)
        if (unidadeOcupada) {
          setError('Unidade já possui representante cadastrado')
          setLoading(false)
          return
        }

        vinculoData.unidade_id = formData.unidade_id

        // Atualizar contador da unidade
        const { error: updateError } = await supabase
          .from('unidades')
          .update({ 
            moradores_atuais: 1
          })
          .eq('id', formData.unidade_id)

        if (updateError) {
          console.error('Erro ao atualizar unidade:', updateError)
        }
      }

      // 6. Criar vínculo
      const { error: vinculoError } = await supabase
        .from('usuarios_condominios')
        .insert(vinculoData)

      if (vinculoError) {
        console.error('Erro ao criar vínculo:', vinculoError)
        
        // Se for erro de duplicidade de unidade
        if (vinculoError.code === '23505' && vinculoError.message.includes('unidade_id')) {
          setError('Unidade já possui representante cadastrado')
        } else if (vinculoError.code === '23505' && vinculoError.message.includes('sindico')) {
          setError('Condomínio já possui síndico cadastrado')
        } else {
          setError('Erro ao vincular ao condomínio: ' + vinculoError.message)
        }
        return
      }

      setMessage('✅ Cadastro realizado com sucesso! Aguarde aprovação do síndico.')
      
      // Limpar formulário
      setFormData({
        nome_completo: '',
        email: '',
        telefone: '',
        cpf: '',
        password: '',
        confirmPassword: '',
        role: 'morador',
        condominio_id: '',
        unidade_id: ''
      })

      setTimeout(() => {
        router.push('/login')
      }, 3000)

    } catch (error: any) {
      console.error('Erro completo:', error)
      setError('Erro inesperado: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  const filtrarUnidades = (termo: string) => {
    if (!termo) {
      setUnidadesFiltradas(unidades)
      return
    }

    const filtradas = unidades.filter(unidade =>
      unidade.numero.toLowerCase().includes(termo.toLowerCase()) ||
      (unidade.bloco && unidade.bloco.toLowerCase().includes(termo.toLowerCase()))
    )
    setUnidadesFiltradas(filtradas)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full bg-white rounded-2xl shadow-xl p-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">🗳️ VotaCondôminos</h1>
          <p className="text-gray-600">Criar nova conta</p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        {message && (
          <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-sm text-green-600">{message}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Dados Pessoais */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nome Completo *
              </label>
              <input
                type="text"
                name="nome_completo"
                value={formData.nome_completo}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                CPF *
              </label>
              <input
                type="text"
                name="cpf"
                value={formData.cpf}
                onChange={handleChange}
                required
                placeholder="000.000.000-00"
                maxLength={14}
                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  formData.cpf && !cpfValido ? 'border-red-300' : 'border-gray-300'
                }`}
              />
              {formData.cpf && !cpfValido && (
                <p className="text-red-500 text-xs mt-1">CPF inválido</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email *
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Telefone
              </label>
              <input
                type="tel"
                name="telefone"
                value={formData.telefone}
                onChange={handleChange}
                placeholder="(11) 99999-9999"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Senhas */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Senha *
              </label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                required
                minLength={6}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Confirmar Senha *
              </label>
              <input
                type="password"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Tipo de Usuário e Condomínio */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tipo de Usuário *
              </label>
              <select
                name="role"
                value={formData.role}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Selecione o tipo de usuário</option>
                <option value="morador">🏠 Morador (1 por unidade)</option>
                <option value="sindico">👔 Síndico (1 por condomínio)</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Condomínio *
              </label>
              <select
                name="condominio_id"
                value={formData.condominio_id}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Selecione um condomínio</option>
                {condominios.map(condominio => (
                  <option key={condominio.id} value={condominio.id}>
                    {condominio.nome} - {condominio.cidade}/{condominio.estado}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Seleção de Unidade (apenas para moradores) */}
          {formData.role === 'morador' && formData.condominio_id && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Unidade/Apartamento *
              </label>
              
              {/* Busca rápida */}
              <div className="mb-3">
                <input
                  type="text"
                  placeholder="Buscar unidade por número ou bloco..."
                  onChange={(e) => filtrarUnidades(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <select
                name="unidade_id"
                value={formData.unidade_id}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Selecione uma unidade</option>
                {unidadesFiltradas.map(unidade => (
                  <option 
                    key={unidade.id} 
                    value={unidade.id}
                    disabled={unidade.vagas_disponiveis <= 0}
                  >
                    {unidade.bloco ? `Bloco ${unidade.bloco} - ` : ''}
                    {unidade.numero} 
                    {unidade.vagas_disponiveis <= 0 ? 
                      ' (Representante já cadastrado)' 
                      : ' (Vaga disponível)'
                    }
                  </option>
                ))}
              </select>
              
              {unidadesFiltradas.length === 0 && formData.condominio_id && (
                <p className="text-sm text-gray-500 mt-2">
                  Nenhuma unidade disponível neste condomínio.
                </p>
              )}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 disabled:bg-gray-400 transition-colors"
          >
            {loading ? 'Criando conta...' : 'Criar Conta'}
          </button>
        </form>

        <div className="mt-6 text-center">
          <Link href="/login" className="text-sm text-blue-600 hover:underline">
            Já tem uma conta? Faça login
          </Link>
        </div>

        {/* Informações do sistema */}
        <div className="mt-8 p-4 bg-gray-50 rounded-lg border border-gray-200">
          <p className="text-xs text-gray-600 font-semibold mb-2">ℹ️ Como funciona:</p>
          <p className="text-xs text-gray-500">• <strong>1 representante por unidade</strong> - cada apartamento permite apenas 1 morador</p>
          <p className="text-xs text-gray-500">• <strong>1 síndico por condomínio</strong> - apenas 1 síndico por condomínio</p>
          <p className="text-xs text-gray-500">• <strong>Validação de CPF</strong> - dígitos verificadores são validados</p>
          <p className="text-xs text-gray-500">• <strong>Sem duplicidades</strong> - CPF e email são únicos no sistema</p>
          <p className="text-xs text-gray-500">• Síndico aprova cadastros pendentes</p>
        </div>
      </div>
    </div>
  )
}