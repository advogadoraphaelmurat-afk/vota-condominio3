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
    // Se não tem userId, retorna null
    if (!userId) return null

    // Verifica se o usuário é admin
    const { data: usuario } = await supabase
      .from('usuarios')
      .select('role')
      .eq('id', userId)
      .single()

    // Se for admin, retorna null (não precisa de condomínio)
    if (usuario?.role === 'admin') {
      return null
    }

    // Para síndicos e moradores, busca o vínculo com condomínio
    const { data: vinculo, error: vinculoError } = await supabase
      .from('usuarios_condominios')
      .select(`
        *,
        condominio:condominios(*)
      `)
      .eq('usuario_id', userId)
      .eq('status', 'aprovado')
      .single()

    if (vinculoError) {
      console.error('Erro ao buscar vínculo do usuário:', vinculoError)
      return null
    }

    // Verifica se o condomínio está ativo
    if (!vinculo?.condominio?.ativo) {
      return null
    }

    // CORREÇÃO: Retornar o objeto completo com condominio_id
    return {
      ...vinculo,
      condominio_id: vinculo.condominio.id
    }

  } catch (error) {
    console.error('Erro em getCondominioAtivo:', error)
    return null
  }
}