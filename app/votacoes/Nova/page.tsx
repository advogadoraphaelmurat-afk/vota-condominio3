'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createSupabaseClient, getCurrentUser, getCondominioAtivo } from '@/lib/supabase'

interface OpcaoVotacao {
  id: string
  texto: string
  ordem: number
}

export default function NovaVotacaoPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [titulo, setTitulo] = useState('')
  const [descricao, setDescricao] = useState('')
  const [tipo, setTipo] = useState<'simples' | 'multipla' | 'secreta'>('simples')
  const [dataInicio, setDataInicio] = useState('')
  const [dataFim, setDataFim] = useState('')
  const [quorumMinimo, setQuorumMinimo] = useState(50)
  const [opcoes, setOpcoes] = useState<OpcaoVotacao[]>([
    { id: '1', texto: 'Sim', ordem: 1 },
    { id: '2', texto: 'Não', ordem: 2 }
  ])

  function adicionarOpcao() {
    const novaOpcao: OpcaoVotacao = {
      id: Date.now().toString(),
      texto: '',
      ordem: opcoes.length + 1
    }
    setOpcoes([...opcoes, novaOpcao])
  }

  function removerOpcao(id: string) {
    setOpcoes(opcoes.filter(op => op.id !== id))
  }

  function atualizarOpcao(id: string, texto: string) {
    setOpcoes(opcoes.map(op => 
      op.id === id ? { ...op, texto } : op
    ))
  }

  async function handleSubmit(e: React.FormEvent, status: 'rascunho' | 'agendada') {
    e.preventDefault()
    setLoading(true)

    try {
      const usuario = await getCurrentUser()
      if (!usuario) {
        alert('Usuário não autenticado')
        return
      }

      const vinculo = await getCondominioAtivo(usuario.id)
      if (!vinculo) {
        alert('Condomínio não encontrado')
        return
      }

      const supabase = createSupabaseClient()

      // Criar votação
      const { data: votacao, error: votacaoError } = await supabase
        .from('votacoes')
        .insert({
          condominio_id: vinculo.condominio_id,
          titulo,
          descricao,
          tipo,
          data_inicio: dataInicio,
          data_fim: dataFim,
          quorum_minimo: quorumMinimo,
          status,
          criado_por: usuario.id
        })
        .select()
        .single()

      if (votacaoError) throw votacaoError

      // Criar opções
      const opcoesData = opcoes.map(op => ({
        votacao_id: votacao.id,
        texto: op.texto,
        ordem: op.ordem
      }))

      const { error: opcoesError } = await supabase
        .from('opcoes_votacao')
        .insert(opcoesData)

      if (opcoesError) throw opcoesError

      alert(`Votação ${status === 'rascunho' ? 'salva como rascunho' : 'criada'} com sucesso!`)
      router.push('/votacoes')

    } catch (error) {
      console.error('Erro ao criar votação:', error)
      alert('Erro ao criar votação')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => router.back()}
            className="text-blue-600 hover:text-blue-700 mb-4"
          >
            ← Voltar
          </button>
          <h1 className="text-3xl font-bold text-gray-900">
            🗳️ Nova Votação
          </h1>
          <p className="text-gray-600 mt-2">
            Crie uma nova votação para o condomínio
          </p>
        </div>

        {/* Formulário */}
        <form onSubmit={(e) => handleSubmit(e, 'agendada')} className="space-y-6">
          {/* Card Principal */}
          <div className="bg-white rounded-lg shadow p-6">
            {/* Título */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Título da Votação *
              </label>
              <input
                type="text"
                value={titulo}
                onChange={(e) => setTitulo(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Ex: Aprovação do novo regimento interno"
                required
              />
            </div>

            {/* Descrição */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Descrição *
              </label>
              <textarea
                value={descricao}
                onChange={(e) => setDescricao(e.target.value)}
                rows={4}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Descreva os detalhes da votação..."
                required
              />
            </div>

            {/* Tipo */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tipo de Votação *
              </label>
              <select
                value={tipo}
                onChange={(e) => setTipo(e.target.value as any)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="simples">✓ Simples (uma opção)</option>
                <option value="multipla">☑ Múltipla (várias opções)</option>
                <option value="secreta">🔒 Secreta (anônima)</option>
              </select>
            </div>

            {/* Datas */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Data de Início *
                </label>
                <input
                  type="datetime-local"
                  value={dataInicio}
                  onChange={(e) => setDataInicio(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Data de Término *
                </label>
                <input
                  type="datetime-local"
                  value={dataFim}
                  onChange={(e) => setDataFim(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>
            </div>

            {/* Quorum */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Quorum Mínimo (%) *
              </label>
              <input
                type="number"
                value={quorumMinimo}
                onChange={(e) => setQuorumMinimo(Number(e.target.value))}
                min="1"
                max="100"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <p className="text-sm text-gray-500 mt-1">
                Percentual mínimo de participação para validar a votação
              </p>
            </div>
          </div>

          {/* Opções de Votação */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Opções de Voto</h3>
              <button
                type="button"
                onClick={adicionarOpcao}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
              >
                + Adicionar Opção
              </button>
            </div>

            <div className="space-y-3">
              {opcoes.map((opcao, index) => (
                <div key={opcao.id} className="flex gap-3">
                  <div className="flex-1">
                    <input
                      type="text"
                      value={opcao.texto}
                      onChange={(e) => atualizarOpcao(opcao.id, e.target.value)}
                      placeholder={`Opção ${index + 1}`}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    />
                  </div>
                  {opcoes.length > 2 && (
                    <button
                      type="button"
                      onClick={() => removerOpcao(opcao.id)}
                      className="px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg"
                    >
                      🗑️
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Botões de Ação */}
          <div className="flex gap-4 justify-end">
            <button
              type="button"
              onClick={(e: any) => handleSubmit(e, 'rascunho')}
              disabled={loading}
              className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50"
            >
              Salvar como Rascunho
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? 'Criando...' : 'Criar Votação'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}