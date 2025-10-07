'use client'; // Adicione esta linha para usar hooks no App Router

import { useState } from 'react';
import { 
  MessageCircle, 
  Send, 
  Paperclip, 
  X, 
  Check, 
  Clock, 
  Eye, 
  AlertCircle, 
  ThumbsUp, 
  MessageSquare, 
  Lightbulb, 
  Flag 
} from 'lucide-react';

// Tipos
type TipoComunicacao = 'denuncia' | 'pedido' | 'elogio' | 'reclamacao' | 'ideia' | 'outro';
type StatusComunicacao = 'pendente' | 'em_analise' | 'resolvido' | 'arquivado';

interface Comunicacao {
  id: string;
  tipo: TipoComunicacao;
  assunto: string;
  mensagem: string;
  status: StatusComunicacao;
  anonimo: boolean;
  dataCriacao: Date;
  dataResposta?: Date;
  respostaSindico?: string;
  unidade: string;
}

const CommunicationSystem = () => {
  const [comunicacoes, setComunicacoes] = useState<Comunicacao[]>([
    {
      id: '1',
      tipo: 'pedido',
      assunto: 'Solicitação de reparo na iluminação',
      mensagem: 'A iluminação do corredor do 3º andar está com problemas há 3 dias.',
      status: 'pendente',
      anonimo: false,
      dataCriacao: new Date('2024-01-15'),
      unidade: 'Apto 301'
    }
  ]);

  const [novaComunicacao, setNovaComunicacao] = useState({
    tipo: 'pedido' as TipoComunicacao,
    assunto: '',
    mensagem: '',
    anonimo: false
  });

  const [mostrarForm, setMostrarForm] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const nova: Comunicacao = {
      id: Math.random().toString(36).substr(2, 9),
      tipo: novaComunicacao.tipo,
      assunto: novaComunicacao.assunto,
      mensagem: novaComunicacao.mensagem,
      status: 'pendente',
      anonimo: novaComunicacao.anonimo,
      dataCriacao: new Date(),
      unidade: 'Apto 101' // Simulado
    };

    setComunicacoes([nova, ...comunicacoes]);
    setNovaComunicacao({ tipo: 'pedido', assunto: '', mensagem: '', anonimo: false });
    setMostrarForm(false);
  };

  const getTipoIcon = (tipo: TipoComunicacao) => {
    const icons = {
      denuncia: AlertCircle,
      pedido: MessageSquare,
      elogio: ThumbsUp,
      reclamacao: Flag,
      ideia: Lightbulb,
      outro: MessageCircle
    };
    const IconComponent = icons[tipo];
    return <IconComponent size={18} />;
  };

  const getStatusIcon = (status: StatusComunicacao) => {
    const icons = {
      pendente: Clock,
      em_analise: Eye,
      resolvido: Check,
      arquivado: X
    };
    const IconComponent = icons[status];
    return <IconComponent size={16} />;
  };

  const getTipoColor = (tipo: TipoComunicacao) => {
    const colors = {
      denuncia: 'bg-red-100 text-red-800 border-red-200',
      pedido: 'bg-blue-100 text-blue-800 border-blue-200',
      elogio: 'bg-green-100 text-green-800 border-green-200',
      reclamacao: 'bg-orange-100 text-orange-800 border-orange-200',
      ideia: 'bg-purple-100 text-purple-800 border-purple-200',
      outro: 'bg-gray-100 text-gray-800 border-gray-200'
    };
    return colors[tipo];
  };

  const getStatusColor = (status: StatusComunicacao) => {
    const colors = {
      pendente: 'bg-yellow-100 text-yellow-800',
      em_analise: 'bg-blue-100 text-blue-800',
      resolvido: 'bg-green-100 text-green-800',
      arquivado: 'bg-gray-100 text-gray-800'
    };
    return colors[status];
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        {/* Cabeçalho */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <MessageCircle className="text-blue-600" />
            Sistema de Comunicação
          </h1>
          <p className="text-gray-600 mt-2">
            Canal direto entre moradores e síndico
          </p>
        </div>

        {/* Botão Nova Comunicação */}
        <div className="mb-6">
          <button
            onClick={() => setMostrarForm(!mostrarForm)}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
          >
            <MessageCircle size={20} />
            Nova Comunicação
          </button>
        </div>

        {/* Formulário de Nova Comunicação */}
        {mostrarForm && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-8 border border-gray-200">
            <h2 className="text-xl font-semibold mb-4">Nova Mensagem</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tipo de Comunicação
                  </label>
                  <select
                    value={novaComunicacao.tipo}
                    onChange={(e) => setNovaComunicacao({
                      ...novaComunicacao,
                      tipo: e.target.value as TipoComunicacao
                    })}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="pedido">Pedido</option>
                    <option value="denuncia">Denúncia</option>
                    <option value="reclamacao">Reclamação</option>
                    <option value="elogio">Elogio</option>
                    <option value="ideia">Sugestão/Ideia</option>
                    <option value="outro">Outro</option>
                  </select>
                </div>

                <div className="flex items-center">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={novaComunicacao.anonimo}
                      onChange={(e) => setNovaComunicacao({
                        ...novaComunicacao,
                        anonimo: e.target.checked
                      })}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700">Enviar como anônimo</span>
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Assunto
                </label>
                <input
                  type="text"
                  value={novaComunicacao.assunto}
                  onChange={(e) => setNovaComunicacao({
                    ...novaComunicacao,
                    assunto: e.target.value
                  })}
                  placeholder="Digite o assunto..."
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Mensagem
                </label>
                <textarea
                  value={novaComunicacao.mensagem}
                  onChange={(e) => setNovaComunicacao({
                    ...novaComunicacao,
                    mensagem: e.target.value
                  })}
                  placeholder="Descreva sua comunicação..."
                  rows={5}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                  required
                />
              </div>

              <div className="flex justify-between items-center">
                <button
                  type="button"
                  className="flex items-center gap-2 text-gray-600 hover:text-gray-800"
                >
                  <Paperclip size={18} />
                  Anexar arquivos
                </button>

                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setMostrarForm(false)}
                    className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                  >
                    <Send size={18} />
                    Enviar
                  </button>
                </div>
              </div>
            </form>
          </div>
        )}

        {/* Lista de Comunicações */}
        <div className="space-y-4">
          {comunicacoes.map((comunicacao) => (
            <div
              key={comunicacao.id}
              className="bg-white rounded-lg shadow-md border border-gray-200 p-6 hover:shadow-lg transition-shadow"
            >
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-3">
                  <div className={`flex items-center gap-2 px-3 py-1 rounded-full border ${getTipoColor(comunicacao.tipo)}`}>
                    {getTipoIcon(comunicacao.tipo)}
                    <span className="text-sm font-medium capitalize">
                      {comunicacao.tipo}
                    </span>
                  </div>
                  
                  <div className={`flex items-center gap-2 px-3 py-1 rounded-full ${getStatusColor(comunicacao.status)}`}>
                    {getStatusIcon(comunicacao.status)}
                    <span className="text-sm font-medium capitalize">
                      {comunicacao.status.replace('_', ' ')}
                    </span>
                  </div>
                </div>

                <div className="text-sm text-gray-500">
                  {comunicacao.dataCriacao.toLocaleDateString('pt-BR')}
                </div>
              </div>

              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {comunicacao.assunto}
              </h3>

              <p className="text-gray-700 mb-4 leading-relaxed">
                {comunicacao.mensagem}
              </p>

              <div className="flex justify-between items-center text-sm text-gray-500">
                <div className="flex items-center gap-4">
                  <span>Unidade: {comunicacao.unidade}</span>
                  {comunicacao.anonimo && (
                    <span className="text-orange-600">● Anônimo</span>
                  )}
                </div>

                {comunicacao.respostaSindico && (
                  <button className="text-blue-600 hover:text-blue-800 font-medium">
                    Ver resposta
                  </button>
                )}
              </div>

              {comunicacao.respostaSindico && (
                <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <h4 className="font-semibold text-blue-900 mb-2">Resposta do Síndico:</h4>
                  <p className="text-blue-800">{comunicacao.respostaSindico}</p>
                  <div className="text-sm text-blue-600 mt-2">
                    Respondido em: {comunicacao.dataResposta?.toLocaleDateString('pt-BR')}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {comunicacoes.length === 0 && (
          <div className="text-center py-12">
            <MessageCircle className="mx-auto text-gray-400 mb-4" size={48} />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Nenhuma comunicação encontrada
            </h3>
            <p className="text-gray-500">
              Suas comunicações com o síndico aparecerão aqui.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default CommunicationSystem;