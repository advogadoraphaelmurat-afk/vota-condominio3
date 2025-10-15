'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createSupabaseClient } from '@/lib/supabase'
import Link from 'next/link'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const supabase = createSupabaseClient()

      // Login com Supabase Auth
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password
      })

      if (authError) {
        setError(authError.message)
        return
      }

      if (data.user) {
        // Verificar se usuário existe na tabela usuarios e está ativo
        const { data: userData, error: userError } = await supabase
          .from('usuarios')
          .select('id, ativo, nome_completo')
          .eq('auth_id', data.user.id)
          .single()

        if (userError || !userData) {
          setError('Usuário não encontrado no sistema')
          await supabase.auth.signOut()
          return
        }

        if (!userData.ativo) {
          setError('Conta aguardando aprovação do síndico')
          await supabase.auth.signOut()
          return
        }

        // Sucesso - redirecionar
        router.push('/dashboard')
        router.refresh() // Forçar atualização do cache
      }
    } catch (error: any) {
      setError('Erro ao fazer login: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">🗳️ VotaCondôminos</h1>
          <p className="text-gray-600">Entre com sua conta</p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="seu@email.com"
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Senha
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 disabled:bg-gray-400 transition-colors"
          >
            {loading ? 'Entrando...' : 'Entrar'}
          </button>
        </form>

        <div className="mt-6 text-center space-y-2">
          <Link href="/cadastro" className="text-sm text-blue-600 hover:underline block">
            Criar nova conta
          </Link>
          <Link href="/esqueci-senha" className="text-sm text-gray-500 hover:underline block">
            Esqueci minha senha
          </Link>
        </div>

        {/* Info de teste */}
        <div className="mt-8 p-4 bg-gray-50 rounded-lg border border-gray-200">
          <p className="text-xs text-gray-600 font-semibold mb-2">💡 Para testar:</p>
          <p className="text-xs text-gray-500">1. Crie conta em /cadastro</p>
          <p className="text-xs text-gray-500">2. Aguarde aprovação do síndico</p>
          <p className="text-xs text-gray-500">3. Faça login aqui</p>
        </div>
      </div>
    </div>
  )
}