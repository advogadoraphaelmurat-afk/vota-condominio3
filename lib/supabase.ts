import { createBrowserClient } from '@supabase/ssr'

/**
 * Cliente Supabase para uso no Browser
 */
export function createSupabaseClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}

/**
 * Buscar usuário atual autenticado
 */
export async function getCurrentUser() {
  const supabase = createSupabaseClient()
  
  try {
    // Verificar sessão de autenticação
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return null
    }

    // Buscar dados completos do usuário
    const { data: userData, error: userError } = await supabase
      .from('usuarios')
      .select('*')
      .eq('auth_id', user.id)
      .single()

    if (userError || !userData) {
      console.error('Erro ao buscar usuário:', userError)
      return null
    }

    return userData

  } catch (error) {
    console.error('Erro em getCurrentUser:', error)
    return null
  }
}

/**
 * Buscar condomínio ativo do usuário
 */
export async function getCondominioAtivo(userId?: string) {
  const supabase = createSupabaseClient()
  
  try {
    if (!userId) return null

    const { data: usuario } = await supabase
      .from('usuarios')
      .select('role')
      .eq('id', userId)
      .single()

    if (usuario?.role === 'admin') return null

    const { data: vinculo } = await supabase
      .from('usuarios_condominios')
      .select('*, condominios(*)')
      .eq('usuario_id', userId)
      .eq('status', 'aprovado')
      .single()

    if (!vinculo?.condominios?.ativo) return null

    // ✅ RETORNAR ESTRUTURA CORRETA
    return {
      id: vinculo.condominios.id,
      condominio_id: vinculo.condominios.id,
      nome: vinculo.condominios.nome,
      ...vinculo.condominios
    }
  } catch (error) {
    console.error('Erro getCondominioAtivo:', error)
    return null
  }
}