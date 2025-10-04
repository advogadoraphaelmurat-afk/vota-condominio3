import { createClient } from '@supabase/supabase-js'

export default async function TestePage() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  const { data } = await supabase
    .from('condominios')
    .select('*')
    .limit(5)

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Teste de Conexão</h1>
      <pre className="bg-gray-100 p-4 rounded">
        {JSON.stringify(data, null, 2)}
      </pre>
    </div>
  )
}