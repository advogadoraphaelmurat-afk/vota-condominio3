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
  bloco?: string
  bloco_nome?: string
  tipo: string
  limite_moradores: number
  moradores_atuais: number
  vagas_disponiveis: number
}

function validarCPF(cpf: string): boolean {
  cpf = cpf.replace(/[^\d]+/g, '')
  
  if (cpf.length !== 11 || /^(\d)\1+$/.test(cpf)) return false
  
  let soma = 0
  let resto
  
  for (let i = 1; i <= 9; i++) {
    soma = soma + parseInt(cpf.substring(i-1, i)) * (11 - i)
  }
  
  resto = (soma * 10) % 11
  if ((resto === 10) || (resto === 11)) resto = 0
  if (resto !== parseInt(cpf.substring(9, 10))) return false
  
  soma = 0
  for (let i = 1; i <= 10; i++) {
    soma = soma + parseInt(cpf.substring(i-1, i)) * (12 - i)
  }
  
  resto = (soma * 10) % 11
  if ((resto === 10) || (resto === 11)) resto = 0
  if (resto !== parseInt(cpf.substring(10, 11))) return false
  
  return true
}

function formatarCPF(cpf: string): string {
  cpf = cpf.replace(/\D/g, '')
  cpf = cpf.replace(/(\d{3})(\d)/, '$1.$2')
  cpf = cpf.replace(/(\d{3})(\d)/, '$1.$2')
  cpf = cpf.replace(/(\d{3})(\d{1,2})$/, '$1-$2')
  return cpf
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

  useEffect(() => {
    carregarCondominios()
  }, [])

  useEffect(() => {
    if (formData.condominio_id) {
      carregarUnidades(formData.condominio_id)
    } else {
      setUnidades([])
      setUnidadesFiltradas([])
    }
  }, [formData.condominio_id])

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
      .eq('ativo', true)
      .order('nome')

    if (error) {
      console.error('Erro ao carregar condomínios:', error)
      return
    }

    setCondominios(data || [])
  }

  async function carregarUnidades(condominioId: string) {
    const supabase = createSupabaseClient()
    
    // Buscar unidades COM blocos (novas)
    const { data: unidadesComBlocos } = await supabase
      .from('unidades')
      .select(`
        *,
        blocos:bloco_id(nome)
      `)
      .eq('condominio_id', condominioId)
      .not('bloco_id', 'is', null)

    // Buscar unidades SEM blocos (antigas)
    const { data: unidadesSemBlocos } = await supabase
      .from('unidades')
      .select('*')
      .eq('condominio_id', condominioId)
      .is('bloco_id', null)

    // Combinar resultados
    const todasUnidades = [
      ...(unidadesComBlocos || []).map(u => ({
        ...u,
        bloco_nome: u.blocos?.nome || ''
      })),
      ...(unidadesSemBlocos || [])
    ]

    // Calcular vagas disponíveis
    const unidadesComVagas = todasUnidades.map(unidade => ({
      ...unidade,
      vagas_disponiveis: (unidade.limite_moradores || 1) - (unidade.moradores_atuais || 0)
    }))

    setUnidades(unidadesComVagas)
    setUnidadesFiltradas(unidadesComVagas)
  }

  const verificarUnidadeOcupada = async (unidadeId: string): Promise<boolean> => {
    const supabase = createSupabaseClient()
    
    const { data } = await supabase
      .from('usuarios_condominios')
      .select('id')
      .eq('unidade_id', unidadeId)
      .in('status', ['aprovado', 'pendente'])
      .single()

    return !!data
  }

  const verificarSindicoExistente = async (condominioId: string): Promise<boolean> => {
    const supabase = createSupabaseClient()
    
    const { data } = await supabase
      .from('usuarios_condominios')
      .select('id')
      .eq('condominio_id', condominioId)
      .eq('papel', 'sindico')
      .in('status', ['aprovado', 'pendente'])
      .single()

    return !!data
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    
    if (name === 'cpf') {
      setFormData(prev => ({ ...prev, [name]: formatarCPF(value) }))
      return
    }

    setFormData(prev => ({ ...prev, [name]: value }))

    if (name === 'condominio_id') {
      setFormData(prev => ({ ...prev, unidade_id: '' }))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setMessage('')

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
      setError('CPF inválido')
      setLoading(false)
      return
    }

    if (formData.role === 'morador' && !formData.unidade_id) {
      setError('Selecione uma unidade')
      setLoading(false)
      return
    }

    try {
      const supabase = createSupabaseClient()

      // Verificar CPF existente
      const { data: cpfExistente } = await supabase
        .from('usuarios')
        .select('id')
        .eq('cpf', formData.cpf)
        .single()

      if (cpfExistente) {
        setError('CPF já cadastrado')
        setLoading(false)
        return
      }

      // Verificar email existente
      const { data: emailExistente } = await supabase
        .from('usuarios')
        .select('id')
        .eq('email', formData.email)
        .single()

      if (emailExistente) {
        setError('Email já cadastrado')
        setLoading(false)
        return
      }

      // Verificar unidade ocupada (morador)
      if (formData.role === 'morador' && formData.unidade_id) {
        const unidadeSelecionada = unidades.find(u => u.id === formData.unidade_id)
        
        if (!unidadeSelecionada || unidadeSelecionada.vagas_disponiveis <= 0) {
          setError('Unidade sem vagas disponíveis')
          setLoading(false)
          return
        }

        const ocupada = await verificarUnidadeOcupada(formData.unidade_id)
        if (ocupada) {
          setError('Unidade já possui representante')
          setLoading(false)
          return
        }
      }

      // Verificar síndico existente
      if (formData.role === 'sindico') {
        const existe = await verificarSindicoExistente(formData.condominio_id)
        if (existe) {
          setError('Condomínio já possui síndico')
          setLoading(false)
          return
        }
      }

      // Criar usuário no Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: { nome_completo: formData.nome_completo }
        }
      })

      if (authError) {
        setError('Erro ao criar conta: ' + authError.message)
        setLoading(false)
        return
      }

      if (!authData.user) {
        setError('Erro ao criar usuário')
        setLoading(false)
        return
      }

      // Criar registro na tabela usuarios
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
        setError('Erro ao salvar dados: ' + userError.message)
        setLoading(false)
        return
      }

      // Buscar ID do usuário
      const { data: userData, error: userFetchError } = await supabase
        .from('usuarios')
        .select('id')
        .eq('email', formData.email)
        .single()

      if (userFetchError || !userData) {
        setError('Erro ao buscar usuário')
        setLoading(false)
        return
      }

      // Criar vínculo
      const vinculoData: any = {
        usuario_id: userData.id,
        condominio_id: formData.condominio_id,
        papel: formData.role,
        status: 'pendente'
      }

      if (formData.role === 'morador' && formData.unidade_id) {
        vinculoData.unidade_id = formData.unidade_id

        // Atualizar contador da unidade
        await supabase
          .from('unidades')
          .update({ moradores_atuais: 1 })
          .eq('id', formData.unidade_id)
      }

      const { error: vinculoError } = await supabase
        .from('usuarios_condominios')
        .insert(vinculoData)

      if (vinculoError) {
        setError('Erro ao vincular: ' + vinculoError.message)
        setLoading(false)
        return
      }

      setMessage('✅ Cadastro realizado! Aguarde aprovação do síndico.')
      
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

      setTimeout(() => router.push('/login'), 3000)

    } catch (error: any) {
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

    const filtradas = unidades.filter(u =>
      u.numero.toLowerCase().includes(termo.toLowerCase()) ||
      (u.bloco && u.bloco.toLowerCase().includes(termo.toLowerCase())) ||
      (u.bloco_nome && u.bloco_nome.toLowerCase().includes(termo.toLowerCase()))
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Nome Completo *</label>
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
              <label className="block text-sm font-medium text-gray-700 mb-2">CPF *</label>
              <input
                type="text"
                name="cpf"
                value={formData.cpf}
                onChange={handleChange}
                required
                placeholder="000.000.000-00"
                maxLength={14}
                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
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
              <label className="block text-sm font-medium text-gray-700 mb-2">Email *</label>
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
              <label className="block text-sm font-medium text-gray-700 mb-2">Telefone</label>
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

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Senha *</label>
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
              <label className="block text-sm font-medium text-gray-700 mb-2">Confirmar Senha *</label>
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

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Tipo de Usuário *</label>
              <select
                name="role"
                value={formData.role}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="morador">🏠 Morador</option>
                <option value="sindico">👔 Síndico</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Condomínio *</label>
              <select
                name="condominio_id"
                value={formData.condominio_id}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Selecione</option>
                {condominios.map(c => (
                  <option key={c.id} value={c.id}>
                    {c.nome} - {c.cidade}/{c.estado}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {formData.role === 'morador' && formData.condominio_id && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Unidade/Apartamento *</label>
              
              <div className="mb-3">
                <input
                  type="text"
                  placeholder="Buscar unidade..."
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
                {unidadesFiltradas.map(u => (
                  <option 
                    key={u.id} 
                    value={u.id}
                    disabled={u.vagas_disponiveis <= 0}
                  >
                    {u.bloco_nome && `${u.bloco_nome} - `}
                    {u.bloco && !u.bloco_nome && `Bloco ${u.bloco} - `}
                    Apt {u.numero}
                    {u.vagas_disponiveis <= 0 ? ' (Ocupado)' : ' (Disponível)'}
                  </option>
                ))}
              </select>
              
              {unidadesFiltradas.length === 0 && formData.condominio_id && (
                <p className="text-sm text-gray-500 mt-2">Nenhuma unidade disponível</p>
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

        <div className="mt-8 p-4 bg-gray-50 rounded-lg border border-gray-200">
          <p className="text-xs text-gray-600 font-semibold mb-2">ℹ️ Como funciona:</p>
          <p className="text-xs text-gray-500">• 1 representante por unidade</p>
          <p className="text-xs text-gray-500">• 1 síndico por condomínio</p>
          <p className="text-xs text-gray-500">• CPF único no sistema</p>
          <p className="text-xs text-gray-500">• Aguarde aprovação do síndico</p>
        </div>
      </div>
    </div>
  )
}