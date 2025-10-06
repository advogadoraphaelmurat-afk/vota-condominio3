import React, { useState } from 'react';
import { MessageCircle, Send, Paperclip, X, Check, Clock, Eye, AlertCircle, ThumbsUp, MessageSquare, Lightbulb, Flag } from 'lucide-react';

const CommunicationSystem = () => {
  const [activeView, setActiveView] = useState('list'); // 'list' | 'new' | 'detail'
  const [selectedCommunication, setSelectedCommunication] = useState(null);
  const [filterStatus, setFilterStatus] = useState('todos');
  const [filterType, setFilterType] = useState('todos');

  // Dados mockados
  const comunicacoes = [
    {
      id: 1,
      tipo: 'denuncia',
      assunto: 'Barulho excessivo após 22h',
      mensagem: 'Gostaria de reportar que no último final de semana houve festas com som muito alto no apartamento 504 após as 22h, o que viola o regimento interno.',
      status: 'pendente',
      morador: { nome: 'Maria Silva', unidade: 'Apto 301' },
      anonimo: false,
      dataCriacao: '2025-10-01T14:30:00',
      anexos: ['audio_barulho.mp3'],
      respostaSindico: null
    },
    {
      id: 2,
      tipo: 'pedido',
      assunto: 'Troca de lâmpada no corredor',
      mensagem: 'A lâmpada do corredor do 3º andar está queimada há uma semana. Poderia providenciar a troca?',
      status: 'resolvido',
      morador: { nome: 'Anônimo', unidade: 'Apto 302' },
      anonimo: true,
      dataCriacao: '2025-09-28T09:15:00',
      anexos: [],
      respostaSindico: 'Já agendei a troca para amanhã pela manhã. Obrigado por avisar!',
      dataResposta: '2025-09-28T15:20:00'
    },
    {
      id: 3,
      tipo: 'elogio',
      assunto: 'Parabéns pela organização da festa junina',
      mensagem: 'Quero parabenizar toda a equipe pela organização da festa junina. Foi muito bem planejada e todos adoraram!',
      status: 'resolvido',
      morador: { nome: 'João Pedro', unidade: 'Apto 105' },
      anonimo: false,
      dataCriacao: '2025-09-25T18:45:00',
      anexos: ['fotos_festa.jpg'],
      respostaSindico: 'Muito obrigado pelo feedback positivo! Ficamos felizes que tenha gostado.',
      dataResposta: '2025-09-26T10:00:00'
    },
    {
      id: 4,
      tipo: 'ideia',
      assunto: 'Sugestão de horta comunitária',
      mensagem: 'Que tal criarmos uma horta comunitária no jardim? Poderia ser um ótimo projeto para envolver os moradores e ter temperos frescos.',
      status: 'em_analise',
      morador: { nome: 'Ana Costa', unidade: 'Apto 201' },
      anonimo: false,
      dataCriacao: '2025-09-30T11:20:00',
      anexos: [],
      respostaSindico: 'Ótima ideia! Vou levar para discussão na próxima assembleia.',
      dataResposta: '2025-10-01T09:00:00'
    }
  ];

  const tiposConfig = {
    denuncia: { 
      label: 'Denúncia', 
      icon: Flag, 
      cor: 'text-red-600', 
      bg: 'bg-red-100',
      descricao: 'Reportar violações ou problemas graves'
    },
    pedido: { 
      label: 'Pedido', 
      icon: MessageSquare, 
      cor: 'text-blue-600', 
      bg: 'bg-blue-100',
      descricao: 'Solicitar manutenções ou serviços'
    },
    elogio: { 
      label: 'Elogio', 
      icon: ThumbsUp, 
      cor: 'text-green-600', 
      bg: 'bg-green-100',
      descricao: 'Reconhecer bom trabalho ou atitudes'
    },
    reclamacao: { 
      label: 'Reclamação', 
      icon: AlertCircle, 
      cor: 'text-orange-600', 
      bg: 'bg-orange-100',
      descricao: 'Reportar insatisfações ou problemas'
    },
    ideia: { 
      label: 'Ideia/Sugestão', 
      icon: Lightbulb, 
      cor: 'text-purple-600', 
      bg: 'bg-purple-100',
      descricao: 'Propor melhorias ou novos projetos'
    },
    outro: { 
      label: 'Outro', 
      icon: MessageCircle, 
      cor: 'text-gray-600', 
      bg: 'bg-gray-100',
      descricao: 'Outros assuntos'
    }
  };

  const statusConfig = {
    pendente: { label: 'Pendente', cor: 'text-amber-600', bg: 'bg-amber-100' },
    em_analise: { label: 'Em Análise', cor: 'text-blue-600', bg: 'bg-blue-100' },
    resolvido: { label: 'Resolvido', cor: 'text-green-600', bg: 'bg-green-100' },
    arquivado: { label: 'Arquivado', cor: 'text-gray-600', bg: 'bg-gray-100' }
  };

  const [formData, setFormData] = useState({
    tipo: 'pedido',
    assunto: '',
    mensagem: '',
    anonimo: false,
    anexos: []
  });

  const comunicacoesFiltradas = comunicacoes.filter(c => {
    const matchStatus = filterStatus === 'todos' || c.status === filterStatus;
    const matchType = filterType === 'todos' || c.tipo === filterType;
    return matchStatus && matchType;
  });

  const CommunicationList = () => (
    <div className="space-y-4">
      {/* Filtros */}
      <div className="flex flex-wrap gap-3 mb-6">
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
        >
          <option value="todos">Todos os status</option>
          {Object.entries(statusConfig).map(([key, config]) => (
            <option key={key} value={key}>{config.label}</option>
          ))}
        </select>

        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
        >
          <option value="todos">Todos os tipos</option>
          {Object.entries(tiposConfig).map(([key, config]) => (
            <option key={key} value={key}>{config.label}</option>
          ))}
        </select>
      </div>

      {/* Lista */}
      {comunicacoesFiltradas.map((comm) => {
        const tipoInfo = tiposConfig[comm.tipo];
        const statusInfo = statusConfig[comm.status];
        const Icon = tipoInfo.icon;

        return (
          <div
            key={comm.id}
            onClick={() => {
              setSelectedCommunication(comm);
              setActiveView('detail');
            }}
            className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-all cursor-pointer"
          >
            <div className="flex items-start gap-4">
              <div className={`${tipoInfo.bg} p-3 rounded-lg flex-shrink-0`}>
                <Icon className={tipoInfo.cor} size={24} />
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-4 mb-2">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold ${tipoInfo.bg} ${tipoInfo.cor}`}>
                        {tipoInfo.label}
                      </span>
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold ${statusInfo.bg} ${statusInfo.cor}`}>
                        {statusInfo.label}
                      </span>
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900">{comm.assunto}</h3>
                  </div>
                  <span className="text-sm text-gray-500 whitespace-nowrap">
                    {new Date(comm.dataCriacao).toLocaleDateString('pt-BR')}
                  </span>
                </div>

                <p className="text-gray-600 mb-3 line-clamp-2">{comm.mensagem}</p>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4 text-sm">
                    <span className="text-gray-700">
                      <strong>De:</strong> {comm.morador.nome} - {comm.morador.unidade}
                    </span>
                    {comm.anexos.length > 0 && (
                      <span className="flex items-center gap-1 text-gray-600">
                        <Paperclip size={14} />
                        {comm.anexos.length} anexo(s)
                      </span>
                    )}
                  </div>

                  {comm.respostaSindico && (
                    <span className="flex items-center gap-1 text-green-600 text-sm font-medium">
                      <Check size={16} />
                      Respondida
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        );
      })}

      {comunicacoesFiltradas.length === 0 && (
        <div className="text-center py-12 bg-white rounded-xl border-2 border-dashed border-gray-300">
          <MessageCircle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-600 font-medium">Nenhuma comunicação encontrada</p>
          <p className="text-gray-500 text-sm mt-1">Tente ajustar os filtros</p>
        </div>
      )}
    </div>
  );

  const NewCommunicationForm = () => (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Nova Comunicação</h2>

      <div className="space-y-6">
        {/* Tipo */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Tipo de Comunicação *
          </label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {Object.entries(tiposConfig).map(([key, config]) => {
              const Icon = config.icon;
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => setFormData({ ...formData, tipo: key })}
                  className={`p-4 border-2 rounded-lg text-left transition-all ${
                    formData.tipo === key
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center gap-3 mb-2">
                    <Icon className={formData.tipo === key ? 'text-blue-600' : 'text-gray-600'} size={20} />
                    <span className="font-semibold text-gray-900">{config.label}</span>
                  </div>
                  <p className="text-sm text-gray-600">{config.descricao}</p>
                </button>
              );
            })}
          </div>
        </div>

        {/* Assunto */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Assunto *
          </label>
          <input
            type="text"
            value={formData.assunto}
            onChange={(e) => setFormData({ ...formData, assunto: e.target.value })}
            placeholder="Descreva brevemente o assunto"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {/* Mensagem */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Mensagem *
          </label>
          <textarea
            value={formData.mensagem}
            onChange={(e) => setFormData({ ...formData, mensagem: e.target.value })}
            rows={6}
            placeholder="Descreva sua comunicação em detalhes..."
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
          />
          <p className="text-sm text-gray-500 mt-1">{formData.mensagem.length} caracteres</p>
        </div>

        {/* Anexos */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Anexos (opcional)
          </label>
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors cursor-pointer">
            <Paperclip className="w-8 h-8 text-gray-400 mx-auto mb-2" />
            <p className="text-sm text-gray-600">
              Clique para adicionar arquivos ou arraste aqui
            </p>
            <p className="text-xs text-gray-500 mt-1">Máximo 3 arquivos (PDF, JPG, PNG - até 5MB cada)</p>
          </div>
        </div>

        {/* Anônimo */}
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={formData.anonimo}
              onChange={(e) => setFormData({ ...formData, anonimo: e.target.checked })}
              className="mt-1"
            />
            <div>
              <p className="font-semibold text-amber-900">Enviar anonimamente</p>
              <p className="text-sm text-amber-800 mt-1">
                O síndico não verá seu nome, apenas sua unidade. Use esta opção para comunicações sensíveis.
              </p>
            </div>
          </label>
        </div>

        {/* Botões */}
        <div className="flex gap-3">
          <button
            onClick={() => setActiveView('list')}
            className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50"
          >
            Cancelar
          </button>
          <button
            className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 flex items-center justify-center gap-2"
          >
            <Send size={20} />
            Enviar Comunicação
          </button>
        </div>
      </div>
    </div>
  );

  const CommunicationDetail = () => {
    const comm = selectedCommunication;
    if (!comm) return null;

    const tipoInfo = tiposConfig[comm.tipo];
    const statusInfo = statusConfig[comm.status];
    const Icon = tipoInfo.icon;

    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <button
            onClick={() => setActiveView('list')}
            className="text-blue-600 hover:text-blue-700 font-medium mb-4 flex items-center gap-2"
          >
            ← Voltar para lista
          </button>

          <div className="flex items-start gap-4">
            <div className={`${tipoInfo.bg} p-4 rounded-lg`}>
              <Icon className={tipoInfo.cor} size={32} />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${tipoInfo.bg} ${tipoInfo.cor}`}>
                  {tipoInfo.label}
                </span>
                <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${statusInfo.bg} ${statusInfo.cor}`}>
                  {statusInfo.label}
                </span>
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">{comm.assunto}</h2>
              <div className="flex items-center gap-4 text-sm text-gray-600">
                <span>
                  <strong>De:</strong> {comm.morador.nome} - {comm.morador.unidade}
                </span>
                <span>
                  <Clock size={14} className="inline mr-1" />
                  {new Date(comm.dataCriacao).toLocaleString('pt-BR')}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Mensagem */}
        <div className="p-6">
          <h3 className="font-semibold text-gray-900 mb-3">Mensagem:</h3>
          <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">{comm.mensagem}</p>

          {comm.anexos.length > 0 && (
            <div className="mt-6">
              <h3 className="font-semibold text-gray-900 mb-3">Anexos:</h3>
              <div className="space-y-2">
                {comm.anexos.map((anexo, idx) => (
                  <div key={idx} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                    <Paperclip className="text-gray-600" size={20} />
                    <span className="text-gray-900">{anexo}</span>
                    <button className="ml-auto text-blue-600 hover:text-blue-700 text-sm font-medium">
                      Download
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Resposta */}
        {comm.respostaSindico ? (
          <div className="p-6 bg-green-50 border-t border-green-200">
            <div className="flex items-center gap-2 mb-3">
              <Check className="text-green-600" size={20} />
              <h3 className="font-semibold text-green-900">Resposta do Síndico:</h3>
              <span className="text-sm text-green-700 ml-auto">
                {new Date(comm.dataResposta).toLocaleString('pt-BR')}
              </span>
            </div>
            <p className="text-green-900 leading-relaxed">{comm.respostaSindico}</p>
          </div>
        ) : (
          <div className="p-6 bg-gray-50 border-t border-gray-200">
            <div className="flex items-center gap-2 text-gray-600">
              <Clock size={20} />
              <p className="font-medium">Aguardando resposta do síndico...</p>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Comunicações</h1>
              <p className="text-gray-600 mt-1">Fale diretamente com o síndico de forma segura e privada</p>
            </div>
            {activeView === 'list' && (
              <button
                onClick={() => setActiveView('new')}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 flex items-center gap-2"
              >
                <MessageCircle size={20} />
                Nova Comunicação
              </button>
            )}
          </div>
        </div>

        {/* Conteúdo */}
        {activeView === 'list' && <CommunicationList />}
        {activeView === 'new' && <NewCommunicationForm />}
        {activeView === 'detail' && <CommunicationDetail />}
      </div>
    </div>
  );
};

export default CommunicationSystem;