'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createSupabaseClient, getCurrentUser, getCondominioAtivo } from '@/lib/supabase'
import Link from 'next/link'

export default function NovoAvisoPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [titulo, setTitulo] = useState('')
  const [conteudo, setConteudo] = useState('')
  const [tipo, setTipo] = useState('geral')
  const [prioridade, setPrioridade] = useState('media')
  const [fixado, setFixado] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const user = await getCurrentUser()
      if (!user) {
        alert('Usuário não autenticado')
        return
      }

      // Verificar se é síndico
      const supabase = createSupabaseClient()
      const { data: userData } = await supabase
        .from('usuarios')
        .select('role')
        .eq('id', user.id)
        .single()

      if (userData?.role !== 'sindico' && userData?.role !== 'admin') {
        alert('Acesso restrito a síndicos')
        router.push('/dashboard')
        return
      }

      const condominio = await getCondominioAtivo(user.id)
      if (!condominio) {
        alert('Condomínio não encontrado')
        return
      }

      const { error } = await supabase
        .from('avisos')
        .insert({
          condominio_id: condominio.condominio_id,
          titulo,
          conteudo,
          tipo,
          prioridade,
          fixado,
          visivel: true,
          criado_por: user.id
        })

      if (error) throw error

      alert('✅ Aviso publicado com sucesso!')
      router.push('/avisos')
    } catch (error: any) {
      alert('❌ Erro ao publicar aviso: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <Link href="/sindico/dashboard" className="text-blue-600 hover:text-blue-700 text-sm mb-2 inline-block">
            ← Voltar ao Painel do Síndico
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">
            📢 Criar Novo Aviso
          </h1>
          <p className="text-sm text-gray-600">
            Publique um aviso para todos os moradores
          </p>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-6 space-y-6">
          {/* Título */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Título do Aviso *
            </label>
            <input
              type="text"
              placeholder="Ex: Manutenção no elevador"
              value={titulo}
              onChange={(e) => setTitulo(e.target.value)}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Conteúdo */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Conteúdo *
            </label>
            <textarea
              placeholder="Descreva o aviso em detalhes..."
              value={conteudo}
              onChange={(e) => setConteudo(e.target.value)}
              required
              rows={8}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            />
            <p className="text-xs text-gray-500 mt-1">
              {conteudo.length} caracteres
            </p>
          </div>

          {/* Grid com Tipo e Prioridade */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Tipo */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tipo de Aviso *
              </label>
              <select
                value={tipo}
                onChange={(e) => setTipo(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="geral">📢 Geral</option>
                <option value="manutencao">🔧 Manutenção</option>
                <option value="evento">🎉 Evento</option>
                <option value="assembleia">👥 Assembleia</option>
                <option value="cobranca">💰 Cobrança</option>
                <option value="regulamento">📋 Regulamento</option>
                <option value="seguranca">🚨 Segurança</option>
              </select>
            </div>

            {/* Prioridade */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Prioridade *
              </label>
              <select
                value={prioridade}
                onChange={(e) => setPrioridade(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="baixa">🟢 Baixa - Informativo</option>
                <option value="media">🟡 Média - Atenção</option>
                <option value="alta">🔴 Alta - Urgente</option>
              </select>
            </div>
          </div>

          {/* Checkbox Fixar */}
          <div className="flex items-start">
            <div className="flex items-center h-5">
              <input
                id="fixado"
                type="checkbox"
                checked={fixado}
                onChange={(e) => setFixado(e.target.checked)}
                className="w-4 h-4 border border-gray-300 rounded bg-gray-50 focus:ring-3 focus:ring-blue-300"
              />
            </div>
            <div className="ml-3 text-sm">
              <label htmlFor="fixado" className="font-medium text-gray-700">
                📌 Fixar este aviso no topo
              </label>
              <p className="text-xs text-gray-500">
                Avisos fixados aparecem sempre no início da lista
              </p>
            </div>
          </div>

          {/* Preview */}
          <div className="border-t pt-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">👁️ Prévia</h3>
            <div className={`border-l-4 rounded-lg p-4 ${
              prioridade === 'alta'
                ? 'border-red-500 bg-red-50'
                : prioridade === 'media'
                ? 'border-yellow-500 bg-yellow-50'
                : 'border-green-500 bg-green-50'
            }`}>
              <div className="flex items-center gap-2 mb-2">
                <h4 className="font-semibold text-gray-900">
                  {titulo || 'Título do aviso'}
                </h4>
                {fixado && (
                  <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
                    Fixado
                  </span>
                )}
              </div>
              <p className="text-sm text-gray-700 whitespace-pre-wrap">
                {conteudo || 'O conteúdo do aviso aparecerá aqui...'}
              </p>
              <div className="mt-3 flex items-center gap-3 text-xs text-gray-500">
                <span className="capitalize">{tipo.replace('_', ' ')}</span>
                <span>•</span>
                <span className="capitalize">Prioridade: {prioridade}</span>
              </div>
            </div>
          </div>

          {/* Botões */}
          <div className="flex gap-4">
            <button
              type="submit"
              disabled={loading || !titulo.trim() || !conteudo.trim()}
              className="flex-1 bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition"
            >
              {loading ? '📤 Publicando...' : '✅ Publicar Aviso'}
            </button>
            <button
              type="button"
              onClick={() => router.back()}
              className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition font-semibold"
            >
              Cancelar
            </button>
          </div>

          {/* Dicas */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="font-semibold text-blue-900 mb-2">💡 Dicas para um bom aviso:</h4>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Seja claro e objetivo no título</li>
              <li>• Use prioridade ALTA apenas para assuntos urgentes</li>
              <li>• Fixe apenas avisos importantes que precisam de destaque</li>
              <li>• Inclua datas e prazos quando relevante</li>
            </ul>
          </div>
        </form>
      </main>
    </div>
  )
}