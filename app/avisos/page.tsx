'client'

import React, { useState } from 'react';
import { Bell, Pin, Calendar, AlertTriangle, Wrench, PartyPopper, MessageSquare, Eye, EyeOff, X, Check, Plus, Edit } from 'lucide-react';

const NoticeBoardSystem = () => {
  const [userRole, setUserRole] = useState('morador'); // 'morador' | 'sindico'
  const [filterType, setFilterType] = useState('todos');
  const [showUnreadOnly, setShowUnreadOnly] = useState(false);
  const [selectedAviso, setSelectedAviso] = useState(null);
  const [showForm, setShowForm] = useState(false);

  // Dados mockados
  const avisos = [
    {
      id: 1,
      tipo: 'urgente',
      titulo: 'Manutenção Emergencial - Elevador 2',
      conteudo: 'Informamos que o elevador 2 estará fora de operação até às 18h de hoje para manutenção emergencial. Por favor, utilizem o elevador 1 ou as escadas. Pedimos desculpas pelo transtorno.',
      prioridade: 'critica',
      dataPublicacao: '2025-10-03T08:00:00',
      dataExpiracao: '2025-10-03T18:00:00',
      fixado: true,
      confirmacaoLeitura: true,
      sindicoNome: 'João Silva',
      anexos: [],
      lido: false,
      leituras: 45,
      totalMoradores: 120
    },
    {
      id: 2,
      tipo: 'convocacao',
      titulo: 'Assembleia Extraordinária - 15/10',
      conteudo: 'Fica convocada Assembleia Extraordinária para o dia 15/10/2025 às 19h no salão de festas.\n\nPauta:\n1. Aprovação de reforma da piscina\n2. Aumento da taxa condominial\n3. Novos funcionários\n\nPresença obrigatória ou envio de procuração.',
      prioridade: 'alta',
      dataPublicacao: '2025-10-01T10:00:00',
      dataExpiracao: '2025-10-15T19:00:00',
      fixado: true,
      confirmacaoLeitura: true,
      sindicoNome: 'João Silva',
      anexos: ['pauta_completa.pdf'],
      lido: true,
      leituras: 89,
      totalMoradores: 120
    },
    {
      id: 3,
      tipo: 'manutencao',
      titulo: 'Limpeza da Caixa d\'Água - 08/10',
      conteudo: 'No dia 08/10 (domingo) das 8h às 16h será realizada a limpeza da caixa d\'água.\n\nDurante este período haverá interrupção no fornecimento de água.\n\nRecomendamos que armazenem água para uso durante o período.',
      prioridade: 'alta',
      dataPublicacao: '2025-10-02T09:00:00',
      dataExpiracao: '2025-10-08T16:00:00',
      fixado: false,
      confirmacaoLeitura: true,
      sindicoNome: 'João Silva',
      anexos: [],
      lido: false,
      leituras: 67,
      totalMoradores: 120
    },
    {
      id: 4,
      tipo: 'evento',
      titulo: 'Festa das Crianças - 12/10',
      conteudo: 'Venham comemorar o Dia das Crianças conosco! Teremos recreação, pipoca, algodão doce e muita diversão!\n\n📅 Data: 12/10\n⏰ Horário: 14h às 18h\n📍 Local: Salão de festas\n\nInscrições gratuitas na portaria até 10/10.',
      prioridade: 'media',
      dataPublicacao: '2025-10-01T15:00:00',
      dataExpiracao: '2025-10-12T18:00:00',
      fixado: false,
      confirmacaoLeitura: false,
      sindicoNome: 'João Silva',
      anexos: ['programacao_festa.pdf'],
      lido: true,
      leituras: 95,
      totalMoradores: 120
    },
    {
      id: 5,
      tipo: 'aviso',
      titulo: 'Novos Horários da Academia',
      conteudo: 'Informamos que a partir de 05/10 a academia funcionará nos seguintes horários:\n\nSegunda a Sexta: 6h às 22h\nSábados: 8h às 20h\nDomingos: 8h às 18h',
      prioridade: 'baixa',
      dataPublicacao: '2025-09-30T12:00:00',
      dataExpiracao: null,
      fixado: false,
      confirmacaoLeitura: false,
      sindicoNome: 'João Silva',
      anexos: [],
      lido: true,
      leituras: 102,
      totalMoradores: 120
    }
  ];

  const tiposConfig = {
    aviso: { label: 'Aviso Geral', icon: MessageSquare, cor: 'text-blue-600', bg: 'bg-blue-100', bgDark: 'bg-blue-600' },
    convocacao: { label: 'Convocação', icon: Bell, cor: 'text-purple-600', bg: 'bg-purple-100', bgDark: 'bg-purple-600' },
    urgente: { label: 'Urgente', icon: AlertTriangle, cor: 'text-red-600', bg: 'bg-red-100', bgDark: 'bg-red-600' },
    manutencao: { label: 'Manutenção', icon: Wrench, cor: 'text-orange-600', bg: 'bg-orange-100', bgDark: 'bg-orange-600' },
    evento: { label: 'Evento', icon: PartyPopper, cor: 'text-green-600', bg: 'bg-green-100', bgDark: 'bg-green-600' }
  };

  const prioridadesConfig = {
    baixa: { label: 'Baixa', cor: 'text-gray-600', bg: 'bg-gray-100' },
    media: { label: 'Média', cor: 'text-yellow-600', bg: 'bg-yellow-100' },
    alta: { label: 'Alta', cor: 'text-orange-600', bg: 'bg-orange-100' },
    critica: { label: 'Crítica', cor: 'text-red-600', bg: 'bg-red-100', pulse: true }
  };

  const avisosFiltrados = avisos
    .filter(a => filterType === 'todos' || a.tipo === filterType)
    .filter(a => !showUnreadOnly || !a.lido)
    .sort((a, b) => {
      // Fixados primeiro
      if (a.fixado !== b.fixado) return a.fixado ? -1 : 1;
      // Depois por prioridade
      const prioridadeOrder = { critica: 0, alta: 1, media: 2, baixa: 3 };
      if (a.prioridade !== b.prioridade) {
        return prioridadeOrder[a.prioridade] - prioridadeOrder[b.prioridade];
      }
      // Por último, mais recente primeiro
      return new Date(b.dataPublicacao) - new Date(a.dataPublicacao);
    });

  const avisosNaoLidos = avisos.filter(a => !a.lido).length;

  const marcarComoLido = (avisoId) => {
    // Lógica de marcar como lido
    console.log('Marcar como lido:', avisoId);
  };

  const AvisoCard = ({ aviso, compact = false }) => {
    const tipoInfo = tiposConfig[aviso.tipo];
    const prioridadeInfo = prioridadesConfig[aviso.prioridade];
    const Icon = tipoInfo.icon;
    const taxaLeitura = Math.round((aviso.leituras / aviso.totalMoradores) * 100);

    return (
      <div
        onClick={() => !compact && setSelectedAviso(aviso)}
        className={`bg-white rounded-xl shadow-sm border-2 overflow-hidden hover:shadow-md transition-all ${
          !aviso.lido ? 'border-blue-300' : 'border-gray-200'
        } ${compact ? '' : 'cursor-pointer'} ${aviso.fixado ? 'ring-2 ring-amber-400' : ''}`}
      >
        {/* Badge de Fixado */}
        {aviso.fixado && (
          <div className="bg-amber-400 px-4 py-2 flex items-center gap-2">
            <Pin size={16} className="text-amber-900" />
            <span className="text-xs font-bold text-amber-900 uppercase">Aviso Fixado</span>
          </div>
        )}

        <div className="p-6">
          {/* Header */}
          <div className="flex items-start gap-4 mb-4">
            <div className={`${tipoInfo.bg} p-3 rounded-lg flex-shrink-0 ${prioridadeInfo.pulse ? 'animate-pulse' : ''}`}>
              <Icon className={tipoInfo.cor} size={24} />
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-2 flex-wrap">
                <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${tipoInfo.bg} ${tipoInfo.cor}`}>
                  {tipoInfo.label}
                </span>
                <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${prioridadeInfo.bg} ${prioridadeInfo.cor}`}>
                  {prioridadeInfo.label}
                </span>
                {!aviso.lido && (
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-700">
                    Não lido
                  </span>
                )}
              </div>

              <h3 className="text-xl font-bold text-gray-900 mb-2">{aviso.titulo}</h3>

              {compact ? (
                <p className="text-gray-600 line-clamp-2">{aviso.conteudo}</p>
              ) : (
                <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">{aviso.conteudo}</p>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between text-sm text-gray-600 pt-4 border-t border-gray-200">
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1">
                <Calendar size={14} />
                {new Date(aviso.dataPublicacao).toLocaleDateString('pt-BR')}
              </span>
              {userRole === 'sindico' && (
                <span className="flex items-center gap-1">
                  <Eye size={14} />
                  {taxaLeitura}% ({aviso.leituras}/{aviso.totalMoradores})
                </span>
              )}
            </div>

            {!compact && aviso.confirmacaoLeitura && !aviso.lido && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  marcarComoLido(aviso.id);
                }}
                className="px-4 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 flex items-center gap-2"
              >
                <Check size={16} />
                Confirmar Leitura
              </button>
            )}
          </div>
        </div>
      </div>
    );
  };

  const AvisoModal = () => {
    if (!selectedAviso) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-xl shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
          {/* Header */}
          <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex items-center justify-between">
            <h2 className="text-2xl font-bold text-gray-900">Detalhes do Aviso</h2>
            <button
              onClick={() => setSelectedAviso(null)}
              className="p-2 hover:bg-gray-100 rounded-lg"
            >
              <X size={24} className="text-gray-600" />
            </button>
          </div>

          {/* Conteúdo */}
          <div className="p-6">
            <AvisoCard aviso={selectedAviso} compact={false} />

            {selectedAviso.anexos.length > 0 && (
              <div className="mt-6">
                <h3 className="font-semibold text-gray-900 mb-3">Anexos:</h3>
                <div className="space-y-2">
                  {selectedAviso.anexos.map((anexo, idx) => (
                    <a
                      key={idx}
                      href="#"
                      className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100"
                    >
                      <FileText size={20} className="text-blue-600" />
                      <span className="text-gray-900">{anexo}</span>
                      <Download size={16} className="ml-auto text-gray-600" />
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  const FormularioNovoAviso = () => (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Novo Aviso</h2>
        <button
          onClick={() => setShowForm(false)}
          className="text-gray-600 hover:text-gray-900"
        >
          <X size={24} />
        </button>
      </div>

      <div className="space-y-6">
        {/* Tipo */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">Tipo de Aviso</label>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {Object.entries(tiposConfig).map(([key, config]) => {
              const Icon = config.icon;
              return (
                <button
                  key={key}
                  className={`p-4 border-2 rounded-lg hover:border-blue-500 transition-all`}
                >
                  <Icon className={config.cor} size={24} />
                  <p className="text-sm font-medium text-gray-900 mt-2">{config.label}</p>
                </button>
              );
            })}
          </div>
        </div>

        {/* Prioridade */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">Prioridade</label>
          <div className="flex gap-3">
            {Object.entries(prioridadesConfig).map(([key, config]) => (
              <label key={key} className="flex-1">
                <input type="radio" name="prioridade" value={key} className="sr-only peer" />
                <div className={`p-3 border-2 rounded-lg text-center cursor-pointer peer-checked:border-blue-500 peer-checked:bg-blue-50 ${config.bg}`}>
                  <span className={`font-semibold ${config.cor}`}>{config.label}</span>
                </div>
              </label>
            ))}
          </div>
        </div>

        {/* Título */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Título</label>
          <input
            type="text"
            placeholder="Ex: Manutenção da Piscina"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Conteúdo */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Conteúdo</label>
          <textarea
            rows={8}
            placeholder="Descreva os detalhes do aviso..."
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 resize-none"
          />
        </div>

        {/* Opções */}
        <div className="space-y-3">
          <label className="flex items-center gap-3 cursor-pointer">
            <input type="checkbox" className="w-5 h-5" />
            <span className="text-gray-700">Fixar no topo do quadro de avisos</span>
          </label>
          <label className="flex items-center gap-3 cursor-pointer">
            <input type="checkbox" className="w-5 h-5" />
            <span className="text-gray-700">Exigir confirmação de leitura</span>
          </label>
        </div>

        {/* Data de Expiração */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Data de Expiração (opcional)
          </label>
          <input
            type="datetime-local"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Botões */}
        <div className="flex gap-3">
          <button
            onClick={() => setShowForm(false)}
            className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50"
          >
            Cancelar
          </button>
          <button className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700">
            Publicar Aviso
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                <Bell size={32} className="text-blue-600" />
                Quadro de Avisos
                {avisosNaoLidos > 0 && (
                  <span className="px-3 py-1 bg-red-600 text-white rounded-full text-sm font-semibold">
                    {avisosNaoLidos} não lidos
                  </span>
                )}
              </h1>
              <p className="text-gray-600 mt-1">
                {userRole === 'morador' 
                  ? 'Fique por dentro de tudo que acontece no condomínio'
                  : 'Gerencie os avisos do condomínio'
                }
              </p>
            </div>

            {userRole === 'sindico' && !showForm && (
              <button
                onClick={() => setShowForm(true)}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 flex items-center gap-2"
              >
                <Plus size={20} />
                Novo Aviso
              </button>
            )}
          </div>
        </div>

        {showForm ? (
          <FormularioNovoAviso />
        ) : (
          <>
            {/* Filtros */}
            <div className="flex flex-wrap gap-3 mb-6">
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

              <button
                onClick={() => setShowUnreadOnly(!showUnreadOnly)}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  showUnreadOnly
                    ? 'bg-blue-600 text-white'
                    : 'border border-gray-300 text-gray-700 hover:bg-gray-50'
                }`}
              >
                {showUnreadOnly ? <Eye size={18} className="inline mr-2" /> : <EyeOff size={18} className="inline mr-2" />}
                {showUnreadOnly ? 'Mostrar todos' : 'Apenas não lidos'}
              </button>
            </div>

            {/* Lista de Avisos */}
            <div className="space-y-6">
              {avisosFiltrados.map(aviso => (
                <AvisoCard key={aviso.id} aviso={aviso} compact={true} />
              ))}

              {avisosFiltrados.length === 0 && (
                <div className="text-center py-12 bg-white rounded-xl border-2 border-dashed border-gray-300">
                  <Bell className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-600 font-medium">Nenhum aviso encontrado</p>
                  <p className="text-gray-500 text-sm mt-1">Tente ajustar os filtros</p>
                </div>
              )}
            </div>
          </>
        )}

        {/* Modal */}
        {selectedAviso && <AvisoModal />}
      </div>
    </div>
  );
};

export default NoticeBoardSystem;