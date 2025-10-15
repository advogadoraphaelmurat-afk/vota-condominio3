import { createBrowserClient } from '@supabase/ssr'

/**
 * Cliente Supabase para uso no Browser (Client-Side)
 * 
 * Este arquivo cria um cliente Supabase otimizado para uso
 * em componentes Client Components do Next.js 13+
 * 
 * USO:
 * import { createSupabaseBrowserClient } from '@/lib/client'
 * 
 * const supabase = createSupabaseBrowserClient()
 * const { data, error } = await supabase.from('tabela').select()
 */

export function createSupabaseBrowserClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}

// Exportar como default também para compatibilidade
export default createSupabaseBrowserClient