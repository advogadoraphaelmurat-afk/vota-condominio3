import { supabase } from './supabase';

export async function isUserAdmin(userId: string) {
  const { data: usuario } = await supabase
    .from('usuarios')
    .select('role')
    .eq('id', userId)
    .single();

  return usuario?.role === 'admin';
}

export function userTemAcesso(usuario: any) {
  if (usuario?.role === 'admin') return true;
  return usuario?.ativo === true;
}