'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { createSupabaseClient, getCurrentUser } from '@/lib/supabase'
import Link from 'next/link'

interface Aviso {
  id: string
  titulo: string
  conteudo: string
  tipo: string
  prioridade: string
  fixado: boolean
  created_at: string
  updated_at: string
  autor?: {
    nome_completo: string
    role: string
  }
}

export default function AvisoDetalhesPage() {
  const router = useRouter()
  const params = useParams()
  const avisoId = params.id as string

  const [aviso, setAviso] = useState<Aviso | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    carregarAviso()
  }, [avisoId])

  async function carregarAviso() {
    try {
      const user = await getCurrentUser()
      if (!user) {
        router.push('/login')
        return
      }

      const supabase = createSupabaseClient()

      const { data, error } = await supabase
        .from('avisos')
        .select(`
          *,
          autor:usuarios(nome_completo, role)
        `)
        .eq('id', avisoId)
        .single()

      if (error || !data) {
        alert('Aviso não encontrado')
        router.push('/avisos')
        return
      }

      setAviso(data)
    } catch (error) {
      console.error('Erro ao carregar aviso:', error)
    } finally {
      setLoading(false)
    }
  }

  const getTipoIcon = (tipo: string) => {
    switch (tipo) {
      case 'manutencao': return '🔧'
      case 'evento': return '🎉'
      case 'assembleia': return '👥'
      case 'cobranca': return '💰'
      case 'regulamento': return '📋'
      case 'seguranca': return '🚨'
      default: return '📢'
    }
  }

  const getTipoLabel = (tipo: string) => {
    const labels: Record<string, string> = {
      manutencao: 'Manutenção',
      evento: 'Evento',
      assembleia: 'Assembleia',
      cobranca: 'Cobrança',
      regulamento: 'Regulamento',
      seguranca: 'Segurança',
      geral: 'Geral'
    }
    return labels[tipo] || tipo
  }

  const getPrioridadeColor = (prioridade: string) => {
    switch (prioridade) {
      case 'alta': return 'bg-red-100 text-red-700 border-red-300'
      case 'media': return 'bg-yellow-100 text-yellow-700 border-yellow-300'
      case 'baixa': return 'bg-green-100 text-green-700 border-green-300'
      default: return 'bg-gray-100 text-gray-700 border-gray-300'
    }
  }

  const getPrioridadeLabel = (prioridade: string) => {
    const labels: Record<string, string> = {
      alta: '🔴 Alta',
      media: '🟡 Média',
      baixa: '🟢 Baixa'
    }
    return labels[prioridade] || prioridade
  }

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'sindico': return '👔 Síndico'
      case 'administradora': return '🏢 Administradora'
      case 'zelador': return '🔑 Zelador'
      default: return '👤 Condomínio'
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Carregando aviso...</p>
        </div>
      </div>
    )
  }

  if (!aviso) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <p className="text-xl text-gray-600">Aviso não encontrado</p>
          <Link href="/avisos" className="text-blue-600 hover:underline mt-4 inline-block">
            ← Voltar para avisos
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <Link href="/avisos" className="text-blue-600 hover:text-blue-700 text-sm mb-2 inline-block">
            ← Voltar para avisos
          </Link>
          <div className="flex items-center gap-3 mb-2">
            <span className="text-3xl">{getTipoIcon(aviso.tipo)}</span>
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-gray-900">
                {aviso.titulo}
              </h1>
              {aviso.fixado && (
                <span className="inline-block text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full mt-1">
                  📌 Aviso Fixado
                </span>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Metadados */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Tipo */}
            <div className="flex items-center gap-2">
              <span className="text-2xl">{getTipoIcon(aviso.tipo)}</span>
              <div>
                <p className="text-xs text-gray-500">Tipo</p>
                <p className="font-medium text-gray-900">{getTipoLabel(aviso.tipo)}</p>
              </div>
            </div>

            {/* Prioridade */}
            <div className="flex items-center gap-2">
              <div className={`px-3 py-1 rounded-full border ${getPrioridadeColor(aviso.prioridade)}`}>
                <p className="text-sm font-semibold">{getPrioridadeLabel(aviso.prioridade)}</p>
              </div>
            </div>

            {/* Data */}
            <div>
              <p className="text-xs text-gray-500">Publicado em</p>
              <p className="font-medium text-gray-900">
                {new Date(aviso.created_at).toLocaleDateString('pt-BR', {
                  day: '2-digit',
                  month: 'long',
                  year: 'numeric'
                })}
              </p>
              <p className="text-xs text-gray-500">
                às {new Date(aviso.created_at).toLocaleTimeString('pt-BR', {
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </p>
            </div>
          </div>

          {/* Autor */}
          {aviso.autor && (
            <div className="mt-4 pt-4 border-t border-gray-200">
              <p className="text-xs text-gray-500">Publicado por</p>
              <p className="font-medium text-gray-900">
                {getRoleLabel(aviso.autor.role)} - {aviso.autor.nome_completo}
              </p>
            </div>
          )}
        </div>

        {/* Conteúdo */}
        <div className={`rounded-lg shadow-sm p-6 border-l-4 ${
          aviso.prioridade === 'alta'
            ? 'bg-red-50 border-red-500'
            : aviso.prioridade === 'media'
            ? 'bg-yellow-50 border-yellow-500'
            : 'bg-white border-blue-500'
        }`}>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">📄 Conteúdo do Aviso</h2>
          <div className="prose max-w-none">
            <p className="text-gray-800 whitespace-pre-wrap leading-relaxed">
              {aviso.conteudo}
            </p>
          </div>
        </div>

        {/* Atualização */}
        {aviso.updated_at !== aviso.created_at && (
          <div className="mt-4 text-center text-sm text-gray-500">
            Última atualização: {new Date(aviso.updated_at).toLocaleDateString('pt-BR')} às{' '}
            {new Date(aviso.updated_at).toLocaleTimeString('pt-BR', {
              hour: '2-digit',
              minute: '2-digit'
            })}
          </div>
        )}

        {/* Botão Voltar */}
        <div className="mt-8 text-center">
          <Link
            href="/avisos"
            className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            ← Voltar para Avisos
          </Link>
        </div>
      </main>
    </div>
  )
}