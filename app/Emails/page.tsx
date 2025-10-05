'use client'

import { useState } from 'react'

export default function EmailsPage() {
  const [loading, setLoading] = useState(false)

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">📧 Gestão de Emails</h1>
        
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-gray-600">
            Página de gestão de emails (em desenvolvimento)
          </p>
          
          <div className="mt-6 space-y-4">
            <div className="border-l-4 border-blue-500 pl-4">
              <h3 className="font-semibold">📬 Notificações Automáticas</h3>
              <p className="text-sm text-gray-600">
                Emails enviados automaticamente quando:
              </p>
              <ul className="text-sm text-gray-600 mt-2 space-y-1">
                <li>• Nova votação criada</li>
                <li>• Lembrete de votação próxima do fim</li>
                <li>• Resultado de votação publicado</li>
                <li>• Novo aviso importante</li>
              </ul>
            </div>

            <div className="border-l-4 border-green-500 pl-4">
              <h3 className="font-semibold">📊 Estatísticas</h3>
              <div className="grid grid-cols-3 gap-4 mt-2">
                <div className="text-center p-3 bg-gray-50 rounded">
                  <div className="text-2xl font-bold">0</div>
                  <div className="text-xs text-gray-600">Enviados hoje</div>
                </div>
                <div className="text-center p-3 bg-gray-50 rounded">
                  <div className="text-2xl font-bold">0</div>
                  <div className="text-xs text-gray-600">Taxa de abertura</div>
                </div>
                <div className="text-center p-3 bg-gray-50 rounded">
                  <div className="text-2xl font-bold">0</div>
                  <div className="text-xs text-gray-600">Falhas</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}