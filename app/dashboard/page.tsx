'use client'

import { useState } from 'react'
import { Home, Vote, Bell, MessageCircle, Users, Menu, X } from 'lucide-react'

export default function DashboardPage() {
  const [menuOpen, setMenuOpen] = useState(false)
  const userRole = 'morador' // Pode ser 'morador' ou 'sindico'

  const notificacoes = {
    votacoesAtivas: 3,
    avisosNaoLidos: 5,
    comunicacoesNovas: 2
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
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

            <div className="flex items-center gap-4">
              <button className="relative p-2 hover:bg-gray-100 rounded-lg">
                <Bell size={24} className="text-gray-600" />
                {notificacoes.avisosNaoLidos > 0 && (
                  <span className="absolute top-1 right-1 w-5 h-5 bg-red-600 text-white text-xs font-bold rounded-full flex items-center justify-center">
                    {notificacoes.avisosNaoLidos}
                  </span>
                )}
              </button>
              <div className="flex items-center gap-3">
                <div className="text-right hidden sm:block">
                  <p className="font-medium text-gray-900">João Silva</p>
                  <p className="text-xs text-gray-600">Morador - Apto 301</p>
                </div>
                <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold">
                  JS
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Cards de Status */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
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
              {[
                { titulo: 'Reforma da Piscina', prazo: '2 dias' },
                { titulo: 'Troca do Elevador', prazo: '5 dias' },
                { titulo: 'Pintura da Fachada', prazo: '1 semana' }
              ].map((votacao, i) => (
                <div key={i} className="p-4 bg-gray-50 rounded-lg hover:bg-gray-100 cursor-pointer transition-colors">
                  <h4 className="font-semibold text-gray-900 mb-1">{votacao.titulo}</h4>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Encerra em {votacao.prazo}</span>
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
                { titulo: 'Limpeza da Caixa d\'Água - 08/10', tipo: 'manutenção', lido: false },
                { titulo: 'Festa das Crianças - 12/10', tipo: 'evento', lido: true },
                { titulo: 'Novos Horários da Academia', tipo: 'aviso', lido: true }
              ].map((aviso, i) => (
                <div key={i} className="p-4 bg-gray-50 rounded-lg hover:bg-gray-100 cursor-pointer transition-colors">
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
        <div className="bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl p-8 text-white mt-8">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-2xl font-bold mb-2">Participe das decisões!</h3>
              <p className="text-blue-100 mb-4">
                Sua opinião é importante para melhorar nosso condomínio
              </p>
              <button className="px-6 py-3 bg-white text-blue-600 rounded-lg font-semibold hover:bg-opacity-90 transition-colors">
                Ver Votações Pendentes
              </button>
            </div>
            <Vote size={80} className="text-white opacity-20 hidden lg:block" />
          </div>
        </div>
      </main>

      {/* Botão Flutuante */}
      <button className="fixed bottom-6 right-6 w-16 h-16 bg-blue-600 text-white rounded-full shadow-lg hover:bg-blue-700 flex items-center justify-center z-50">
        <MessageCircle size={28} />
      </button>
    </div>
  )
}