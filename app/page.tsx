export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="max-w-4xl w-full bg-white rounded-2xl shadow-xl p-12 text-center">
        <h1 className="text-6xl font-bold text-gray-900 mb-4">
          🗳️ VotaCondôminos
        </h1>
        <p className="text-2xl text-gray-600 mb-8">
          Sistema de Votações para Condomínios
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="p-6 bg-blue-50 rounded-xl">
            <div className="text-4xl mb-3">📊</div>
            <h3 className="font-bold text-lg mb-2">Votações Online</h3>
            <p className="text-gray-600 text-sm">Seguras e transparentes</p>
          </div>
          
          <div className="p-6 bg-green-50 rounded-xl">
            <div className="text-4xl mb-3">💬</div>
            <h3 className="font-bold text-lg mb-2">Comunicação</h3>
            <p className="text-gray-600 text-sm">Direto com o síndico</p>
          </div>
          
          <div className="p-6 bg-purple-50 rounded-xl">
            <div className="text-4xl mb-3">📢</div>
            <h3 className="font-bold text-lg mb-2">Avisos</h3>
            <p className="text-gray-600 text-sm">Sempre informado</p>
          </div>
        </div>

        <div className="mt-8">
          <p className="text-green-600 font-semibold text-lg">
            ✅ Sistema no ar e funcionando!
          </p>
        </div>
      </div>
    </div>
  )
}