export function userTemAcesso(usuario: any) {
  // Admin tem acesso total
  if (usuario?.role === 'admin') {
    return true;
  }
  
  // Usuários normais precisam estar ativos e ter condomínio
  return usuario?.ativo === true;
}

export function isAdmin(usuario: any) {
  return usuario?.role === 'admin';
}