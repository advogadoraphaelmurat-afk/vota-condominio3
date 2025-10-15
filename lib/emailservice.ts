// lib/emailservice.ts
// Serviço para envio de emails/notificações

import { createSupabaseClient } from './supabase'

interface EmailData {
  to: string
  subject: string
  body: string
  from?: string
}

interface NotificationData {
  usuario_id: string
  tipo: 'email' | 'sms' | 'push'
  titulo: string
  mensagem: string
  dados?: any
}

export class NotificationService {
  private supabase = createSupabaseClient()

  // Enviar email via Supabase Edge Function (futuro)
  async sendEmail(data: EmailData): Promise<boolean> {
    try {
      // TODO: Implementar quando tiver Edge Function configurada
      console.log('Email a ser enviado:', data)
      
      // Exemplo de chamada futura:
      // const { data: result, error } = await this.supabase.functions.invoke('send-email', {
      //   body: data
      // })
      
      return true
    } catch (error) {
      console.error('Erro ao enviar email:', error)
      return false
    }
  }

  // Registrar notificação no banco (para histórico)
  async registrarNotificacao(data: NotificationData): Promise<boolean> {
    try {
      const { error } = await this.supabase
        .from('logs_auditoria')
        .insert({
          usuario_id: data.usuario_id,
          acao: `notificacao_${data.tipo}`,
          dados_novos: {
            titulo: data.titulo,
            mensagem: data.mensagem,
            ...data.dados
          }
        })

      return !error
    } catch (error) {
      console.error('Erro ao registrar notificação:', error)
      return false
    }
  }

  // Notificar sobre nova votação
  async notificarNovaVotacao(votacaoId: string, condominioId: string) {
    try {
      // Buscar usuários do condomínio
      const { data: usuarios } = await this.supabase
        .from('usuarios_condominios')
        .select('usuario_id, usuarios(email, nome)')
        .eq('condominio_id', condominioId)
        .eq('status', 'ativo')

      if (!usuarios) return false

      // Buscar detalhes da votação
      const { data: votacao } = await this.supabase
        .from('votacoes')
        .select('titulo, descricao, data_fim')
        .eq('id', votacaoId)
        .single()

      if (!votacao) return false

      // Enviar email para cada usuário (simulado por enquanto)
      for (const vinculo of usuarios) {
        const usuario = vinculo.usuarios as any
        
        await this.sendEmail({
          to: usuario.email,
          subject: `Nova Votação: ${votacao.titulo}`,
          body: `
            Olá ${usuario.nome},
            
            Uma nova votação foi criada no seu condomínio:
            
            Título: ${votacao.titulo}
            Descrição: ${votacao.descricao}
            Prazo: ${new Date(votacao.data_fim).toLocaleDateString('pt-BR')}
            
            Acesse o sistema para participar!
          `
        })

        // Registrar log
        await this.registrarNotificacao({
          usuario_id: vinculo.usuario_id,
          tipo: 'email',
          titulo: 'Nova Votação',
          mensagem: votacao.titulo,
          dados: { votacao_id: votacaoId }
        })
      }

      return true
    } catch (error) {
      console.error('Erro ao notificar sobre votação:', error)
      return false
    }
  }

  // Notificar sobre resultado de votação
  async notificarResultadoVotacao(votacaoId: string) {
    // Similar ao método acima
    console.log('Notificar resultado da votação:', votacaoId)
    return true
  }

  // Lembrete de votação próxima do fim
  async enviarLembreteVotacao(votacaoId: string) {
    // Buscar quem ainda não votou
    console.log('Enviar lembrete da votação:', votacaoId)
    return true
  }
}

// Exportar instância singleton
export const notificationService = new NotificationService()

// Funções auxiliares para uso direto
export async function enviarEmailNovaVotacao(votacaoId: string, condominioId: string) {
  return notificationService.notificarNovaVotacao(votacaoId, condominioId)
}

export async function enviarEmailResultado(votacaoId: string) {
  return notificationService.notificarResultadoVotacao(votacaoId)
}

export async function enviarLembrete(votacaoId: string) {
  return notificationService.enviarLembreteVotacao(votacaoId)
}