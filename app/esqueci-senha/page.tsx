'use client'

import { useState } from 'react'
import { createSupabaseClient } from '@/lib/supabase'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

export default function EsqueciSenhaPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const router = useRouter()

  async function handleResetPassword(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    setMessage('')

    try {
      const supabase = createSupabaseClient()
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/atualizar-senha`,
      })

      if (error) {
        setError(error.message)
      } else {
        setMessage('Email de recuperação enviado! Verifique sua caixa de entrada.')
        setEmail('')
      }
    } catch (err) {
      setError('Erro ao enviar email de recuperação')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <Link href="/login" className="text-blue-600 hover:text-blue-700 text-sm mb-4 inline-block">
            ← Voltar para o login
          </Link>
          <h2 className="mt-2 text-center text-3xl font-extrabold text-gray-900">
            Recuperar senha
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Digite seu email para receber o link de recuperação
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleResetPassword}>
          <div>
            <label htmlFor="email" className="sr-only">
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="appearance-none rounded-lg relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
              placeholder="Seu email cadastrado"
            />
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          {message && (
            <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg text-sm">
              {message}
            </div>
          )}

          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Enviando...' : 'Enviar link de recuperação'}
            </button>
          </div>
        </form>

        <div className="text-center">
          <p className="text-sm text-gray-600">
            Lembrou sua senha?{' '}
            <Link href="/login" className="font-medium text-blue-600 hover:text-blue-500">
              Fazer login
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}