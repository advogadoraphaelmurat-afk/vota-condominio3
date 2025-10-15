'use client'

import { useRouter } from 'next/navigation'

export default function CondominioDesativado() {
  const router = useRouter()

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-lg p-8 max-w-md text-center">
        <div className="text-red-500 text-5xl mb-4">🚫</div>
        <h2 className="text-2xl font-bold text-gray-900 mb-4">
          Condomínio Desativado
        </h2>
        <p className="text-gray-600 mb-2">
          <strong>Morador:</strong> Entre em contato com o síndico do seu condomínio.
        </p>
        <p className="text-gray-600 mb-6">
          <strong>Síndico:</strong> Entre em contato com a administradora do APP.
        </p>
        <button
          onClick={() => router.push('/login')}
          className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          Voltar ao Login
        </button>
      </div>
    </div>
  )
}