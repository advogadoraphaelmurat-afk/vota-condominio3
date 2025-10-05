"use client";

import React, { useState } from 'react';
import { Home, Vote, Bell, MessageCircle, Users, BarChart3, Settings, Menu, X, AlertCircle, Pin, TrendingUp } from 'lucide-react';

const IntegratedDashboard = () => {
  const [activeSection, setActiveSection] = useState('dashboard');
  const [menuOpen, setMenuOpen] = useState(false);
  const [userRole] = useState('morador'); // 'morador' | 'sindico' | 'super_admin'

  // Contadores de notificações
  const notificacoes = {
    votacoesAtivas: 3,
    avisosNaoLidos: 5,
    comunicacoesNovas: 2,
    moradoresPendentes: 4 // Apenas para síndico
  };

  // Avisos fixados para dashboard
  const avisosFixados = [
    {
      id: 1,
      tipo: 'urgente',
      titulo: 'Manutenção Emergencial - Elevador 2',
      resumo: 'Elevador 2 fora de operação até 18h de hoje',
      prioridade: 'critica'
    }
  ];

  // Menu de navegação
  const menuItems = userRole === 'morador' ? [
    { id: 'dashboard', label: 'Início', icon: Home, badge: null },
    { id: 'votacoes', label: 'Votações', icon: Vote, badge: notificacoes.votacoesAtivas },
    { id: 'avisos', label: 'Avisos', icon: Bell, badge: notificacoes.avisosNaoLidos },
    { id: 'comunicacoes', label: 'Falar com Síndico', icon: MessageCircle, badge: notificacoes.comunicacoesNovas }
  ] : [
    { id: 'dashboard', label: 'Dashboard', icon: Home, badge: null },
    { id: 'votacoes', label: 'Votações', icon: Vote, badge: null },
    { id: 'comunicacoes', label: 'Comunicações', icon: MessageCircle, badge: notificacoes.comunicacoesNovas },
    { id: 'avisos', label: 'Avisos', icon: Bell, badge: null },
    { id: 'moradores', label: 'Moradores', icon: Users, badge: notificacoes.moradoresPendentes },
    { id: 'relatorios', label: 'Relatórios', icon: BarChart3, badge: null }
  ];

  const DashboardMorador = () => (
    <div className="space-y-6">
      {/* Avisos Fixados/Urgentes */}
      {avisosFixados.length > 0 && (
        <div className="space-y-3">
          {avisosFixados.map(aviso => (
            <div key={aviso.id} className="bg-gradient-to-r from-red-500 to-red-600 rounded-xl p-6 text-white shadow-lg animate-pulse">
              <div className="flex items-start gap-4">
                <div className="bg-white bg-opacity-20 p-3 rounded-lg">
                  <AlertCircle size={32} />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <Pin size={16} />
                    <span className="text-xs font-bold uppercase">Aviso Urgente - Fixado</span>
                  </div>
                  <h3 className="text-xl font-bold mb-2">{aviso.titulo}</h3>
                  <p className="text-white text-opacity-90">{aviso.resumo}</p>
                  <button className="mt-4 px-4 py-2 bg-white text-red-600 rounded-lg font-semibold hover:bg-opacity-90">
                    Ver Detalhes
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Cards de Status */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow cursor-pointer">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-700">Votações Ativas</h3>
            <div className="bg-blue-100 p-3 rounded-lg">
              <Vote className="text-blue-600" size={24} />
            </div>
          </div>
          <p className="text-3xl font-bold text-blue-600">{notificacoes.votacoesAtivas}</p>
          <p className="text-sm text-gray-600 mt-2">Aguardando seu voto</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow cursor-pointer">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-700">Avisos Não Lidos</h3>
            <div className="bg-amber-100 p-3 rounded-lg">
              <Bell className="text-amber-600" size={24} />
            </div>
          </div>
          <p className="text-3xl font-bold text-amber-600">{notificacoes.avisosNaoLidos}</p>
          <p className="text-sm text-gray-600 mt-2">Novidades importantes</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow cursor-pointer">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-700">Comunicações</h3>
            <div className="bg-green-100 p-3 rounded-lg">
              <MessageCircle className="text-green-600" size={24} />
            </div>
          </div>
          <p className="text-3xl font-bold text-green-600">{notificacoes.comunicacoesNovas}</p>
          <p className="text-sm text-gray-600 mt-2">Novas respostas</p>
        </div>
      </div>

      {/* Seções Principais */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Votações Recentes */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-bold text-gray-900">Votações Ativas</h3>
            <button className="text-blue-600 hover:text-blue-700 text-sm font-medium">
              Ver todas →
            </button>
          </div>
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="p-4 bg-gray-50 rounded-lg hover:bg-gray-100 cursor-pointer">
                <h4 className="font-semibold text-gray-900 mb-1">Reforma da Piscina</h4>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Encerra em 2 dias</span>
                  <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs font-medium">
                    Pendente
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Avisos Recentes */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-bold text-gray-900">Avisos Recentes</h3>
            <button className="text-blue-600 hover:text-blue-700 text-sm font-medium">
              Ver todos →
            </button>
          </div>
          <div className="space-y-3">
            {[
              { titulo: 'Limpeza da Caixa d\'Água', tipo: 'manutencao', lido: false },
              { titulo: 'Festa das Crianças - 12/10', tipo: 'evento', lido: true },
              { titulo: 'Novos Horários da Academia', tipo: 'aviso', lido: true }
            ].map((aviso, i) => (
              <div key={i} className="p-4 bg-gray-50 rounded-lg hover:bg-gray-100 cursor-pointer">
                <div className="flex items-center justify-between">
                  <h4 className="font-semibold text-gray-900">{aviso.titulo}</h4>
                  {!aviso.lido && (
                    <span className="w-2 h-2 bg-blue-600 rounded-full"></span>
                  )}
                </div>
                <span className="text-xs text-gray-600 capitalize">{aviso.tipo}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Banner de Ação */}
      <div className="bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl p-8 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-2xl font-bold mb-2">Participe das decisões!</h3>
            <p className="text-blue-100 mb-4">
              Sua opinião é importante para melhorar nosso condomínio
            </p>
            <button className="px-6 py-3 bg-white text-blue-600 rounded-lg font-semibold hover:bg-opacity-90">
              Ver Votações Pendentes
            </button>
          </div>
          <Vote size={80} className="text-white opacity-20" />
        </div>
      </div>
    </div>
  );

  const DashboardSindico = () => (
    <div className="space-y-6">
      {/* Métricas Principais */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-700">Votações Ativas</h3>
            <Vote className="text-blue-600" size={24} />
          </div>
          <p className="text-3xl font-bold text-gray-900">3</p>
          <p className="text-sm text-gray-600 mt-2">Em andamento</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-700">Comunicações</h3>
            {notificacoes.comunicacoesNovas > 0 && (
              <span className="bg-red-600 text-white text-xs font-bold px-2 py-1 rounded-full">
                {notificacoes.comunicacoesNovas}
              </span>
            )}
          </div>
          <p className="text-3xl font-bold text-amber-600">{notificacoes.comunicacoesNovas}</p>
          <p className="text-sm text-gray-600 mt-2">Pendentes</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-700">Taxa de Leitura</h3>
            <TrendingUp className="text-green-600" size={24} />
          </div>
          <p className="text-3xl font-bold text-green-600">87%</p>
          <p className="text-sm text-gray-600 mt-2">Avisos lidos</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-700">Moradores</h3>
            {notificacoes.moradoresPendentes > 0 && (
              <span className="bg-amber-600 text-white text-xs font-bold px-2 py-1 rounded-full">
                {notificacoes.moradoresPendentes}
              </span>
            )}
          </div>
          <p className="text-3xl font-bold text-gray-900">115</p>
          <p className="text-sm text-gray-600 mt-2">{notificacoes.moradoresPendentes} aguardando</p>
        </div>
      </div>

      {/* Ações Necessárias */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-xl font-bold text-gray-900 mb-4">Ações Necessárias</h3>
        <div className="space-y-3">
          <div className="flex items-center gap-4 p-4 bg-red-50 border border-red-200 rounded-lg">
            <AlertCircle className="text-red-600" size={24} />
            <div className="flex-1">
              <p className="font-semibold text-red-900">2 comunicações urgentes sem resposta</p>
              <p className="text-sm text-red-700">Requer atenção imediata</p>
            </div>
            <button className="px-4 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700">
              Ver Agora
            </button>
          </div>

          <div className="flex items-center gap-4 p-4 bg-amber-50 border border-amber-200 rounded-lg">
            <Users className="text-amber-600" size={24} />
            <div className="flex-1">
              <p className="font-semibold text-amber-900">4 moradores aguardando aprovação</p>
              <p className="text-sm text-amber-700">Cadastros pendentes há 2+ dias</p>
            </div>
            <button className="px-4 py-2 bg-amber-600 text-white rounded-lg font-medium hover:bg-amber-700">
              Revisar
            </button>
          </div>

          <div className="flex items-center gap-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <Bell className="text-blue-600" size={24} />
            <div className="flex-1">
              <p className="font-semibold text-blue-900">Aviso sobre piscina com baixa leitura</p>
              <p className="text-sm text-blue-700">Apenas 45% dos moradores leram</p>
            </div>
            <button className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700">
              Reenviar
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setMenuOpen(!menuOpen)}
                className="lg:hidden p-2 hover:bg-gray-100 rounded-lg"
              >
                {menuOpen ? <X size={24} /> : <Menu size={24} />}
              </button>
              <h1 className="text-xl font-bold text-gray-900">🗳️ VotaCondôminos</h1>
            </div>

            {/* Notificações */}
            <div className="flex items-center gap-4">
              <button className="relative p-2 hover:bg-gray-100 rounded-lg">
                <Bell size={24} className="text-gray-600" />
                {(notificacoes.avisosNaoLidos + notificacoes.comunicacoesNovas) > 0 && (
                  <span className="absolute top-1 right-1 w-5 h-5 bg-red-600 text-white text-xs font-bold rounded-full flex items-center justify-center">
                    {notificacoes.avisosNaoLidos + notificacoes.comunicacoesNovas}
                  </span>
                )}
              </button>
              <div className="flex items-center gap-3">
                <div className="text-right">
                  <p className="font-medium text-gray-900">João Silva</p>
                  <p className="text-xs text-gray-600 capitalize">{userRole}</p>
                </div>
                <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold">
                  JS
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar */}
        <aside className={`${
          menuOpen ? 'translate-x-0' : '-translate-x-full'
        } lg:translate-x-0 fixed lg:sticky top-16 left-0 h-[calc(100vh-4rem)] w-64 bg-white border-r border-gray-200 transition-transform z-30`}>
          <nav className="p-4 space-y-2">
            {menuItems.map(item => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveSection(item.id);
                    setMenuOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-colors ${
                    activeSection === item.id
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <Icon size={20} />
                  <span className="flex-1 text-left">{item.label}</span>
                  {item.badge !== null && item.badge > 0 && (
                    <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                      activeSection === item.id
                        ? 'bg-white text-blue-600'
                        : 'bg-red-600 text-white'
                    }`}>
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8">
          <div className="max-w-7xl mx-auto">
            {activeSection === 'dashboard' && (
              userRole === 'morador' ? <DashboardMorador /> : <DashboardSindico />
            )}
            
            {activeSection !== 'dashboard' && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
                <p className="text-gray-600">
                  Seção "{activeSection}" - Integrar componente correspondente aqui
                </p>
              </div>
            )}
          </div>
        </main>
      </div>

      {/* Botão Flutuante (apenas para morador) */}
      {userRole === 'morador' && (
        <button
          onClick={() => setActiveSection('comunicacoes')}
          className="fixed bottom-6 right-6 w-16 h-16 bg-blue-600 text-white rounded-full shadow-lg hover:bg-blue-700 flex items-center justify-center z-50"
        >
          <MessageCircle size={28} />
        </button>
      )}
    </div>
  );
};

export default IntegratedDashboard;