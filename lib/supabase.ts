/**
 * Buscar condomínio ativo do usuário (CORRIGIDA)
 */
export async function getCondominioAtivo(userId?: string) {
  const supabase = createSupabaseClient()
  
  try {
    // Se não tem userId, retorna null
    if (!userId) return null;

    // Verifica se o usuário é admin
    const { data: usuario } = await supabase
      .from('usuarios')
      .select('role')
      .eq('id', userId)
      .single();

    // Se for admin, retorna null (não precisa de condomínio)
    if (usuario?.role === 'admin') {
      return null;
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
      .single();

    if (vinculoError) {
      console.error('Erro ao buscar vínculo do usuário:', vinculoError);
      return null;
    }

    // Verifica se o condomínio está ativo
    if (!vinculo?.condominio?.ativo) {
      return null;
    }

    return vinculo.condominio;

  } catch (error) {
    console.error('Erro em getCondominioAtivo:', error);
    return null;
  }
}