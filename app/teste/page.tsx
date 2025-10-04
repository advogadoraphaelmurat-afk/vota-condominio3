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
    
      Teste de Conexão
      
        {JSON.stringify(data, null, 2)}
      
    
  )
}