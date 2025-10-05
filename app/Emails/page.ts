// =====================================================
// SISTEMA DE NOTIFICAÇÕES POR EMAIL
// Usando Resend (https://resend.com) - API moderna e simples
// =====================================================

import { Resend } from 'resend';

// Inicializar Resend
const resend = new Resend(process.env.RESEND_API_KEY);

// =====================================================
// TYPES & INTERFACES
// =====================================================

interface EmailData {
  to: string;
  subject: string;
  html: string;
}

interface VotacaoData {
  id: string;
  titulo: string;
  descricao: string;
  dataFim: string;
  condominioNome: string;
  condominioId: string;
}

interface MoradorData {
  id: string;
  nome: string;
  email: string;
  unidade: string;
  condominioNome: string;
}

interface CondominioData {
  id: string;
  nome: string;
  cnpj: string;
  cidade: string;
  sindico: string;
  plano: string;
  valorMensal: number;
}

// =====================================================
// TEMPLATES DE EMAIL
// =====================================================

class EmailTemplates {
  // Template base responsivo
  private static baseTemplate(content: string): string {
    return `
      <!DOCTYPE html>
      <html lang="pt-BR">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Notificação - VotaCondôminos</title>
        <style>
          body {
            margin: 0;
            padding: 0;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            background-color: #f3f4f6;
          }
          .container {
            max-width: 600px;
            margin: 0 auto;
            background-color: #ffffff;
          }
          .header {
            background: linear-gradient(135deg, #2563eb 0%, #4f46e5 100%);
            padding: 40px 30px;
            text-align: center;
          }
          .logo {
            color: #ffffff;
            font-size: 28px;
            font-weight: bold;
            margin: 0;
          }
          .content {
            padding: 40px 30px;
            color: #374151;
            line-height: 1.6;
          }
          .button {
            display: inline-block;
            padding: 14px 32px;
            background-color: #2563eb;
            color: #ffffff !important;
            text-decoration: none;
            border-radius: 8px;
            font-weight: 600;
            margin: 20px 0;
          }
          .info-box {
            background-color: #f9fafb;
            border-left: 4px solid #2563eb;
            padding: 16px;
            margin: 20px 0;
            border-radius: 4px;
          }
          .warning-box {
            background-color: #fef3c7;
            border-left: 4px solid #f59e0b;
            padding: 16px;
            margin: 20px 0;
            border-radius: 4px;
          }
          .success-box {
            background-color: #d1fae5;
            border-left: 4px solid #10b981;
            padding: 16px;
            margin: 20px 0;
            border-radius: 4px;
          }
          .footer {
            background-color: #f9fafb;
            padding: 30px;
            text-align: center;
            color: #6b7280;
            font-size: 14px;
          }
          .footer a {
            color: #2563eb;
            text-decoration: none;
          }
          @media only screen and (max-width: 600px) {
            .content {
              padding: 20px;
            }
            .header {
              padding: 30px 20px;
            }
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1 class="logo">🗳️ VotaCondôminos</h1>
          </div>
          <div class="content">
            ${content}
          </div>
          <div class="footer">
            <p>Este é um email automático, por favor não responda.</p>
            <p>
              <a href="{{DASHBOARD_URL}}">Acessar Plataforma</a> | 
              <a href="{{UNSUBSCRIBE_URL}}">Gerenciar Notificações</a>
            </p>
            <p style="margin-top: 20px; color: #9ca3af; font-size: 12px;">
              © 2025 VotaCondôminos. Todos os direitos reservados.
            </p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  // =====================================================
  // TEMPLATES PARA MORADORES
  // =====================================================

  static novaVotacao(votacao: VotacaoData, moradorNome: string): string {
    const content = `
      <h2 style="color: #1f2937; margin-top: 0;">Olá, ${moradorNome}! 👋</h2>
      <p>Uma nova votação foi criada no <strong>${votacao.condominioNome}</strong> e sua participação é muito importante!</p>
      
      <div class="info-box">
        <h3 style="margin-top: 0; color: #2563eb;">📋 ${votacao.titulo}</h3>
        <p style="margin-bottom: 0;">${votacao.descricao}</p>
      </div>

      <p><strong>Prazo para votar:</strong> até ${new Date(votacao.dataFim).toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })}</p>

      <div style="text-align: center;">
        <a href="{{DASHBOARD_URL}}/votacoes/${votacao.id}" class="button">
          Votar Agora
        </a>
      </div>

      <p style="color: #6b7280; font-size: 14px;">
        💡 <em>Sua opinião faz a diferença! Vote o quanto antes para garantir sua participação.</em>
      </p>
    `;
    return this.baseTemplate(content);
  }

  static votacaoEncerrando(votacao: VotacaoData, moradorNome: string): string {
    const content = `
      <h2 style="color: #1f2937; margin-top: 0;">⏰ Última chance, ${moradorNome}!</h2>
      <p>A votação <strong>"${votacao.titulo}"</strong> encerra em menos de 24 horas e você ainda não votou!</p>
      
      <div class="warning-box">
        <h3 style="margin-top: 0; color: #f59e0b;">⚠️ Atenção: Prazo Próximo</h3>
        <p><strong>Encerra em:</strong> ${new Date(votacao.dataFim).toLocaleDateString('pt-BR', {
          day: '2-digit',
          month: 'long',
          hour: '2-digit',
          minute: '2-digit'
        })}</p>
        <p style="margin-bottom: 0;">Não perca a oportunidade de expressar sua opinião!</p>
      </div>

      <div style="text-align: center;">
        <a href="{{DASHBOARD_URL}}/votacoes/${votacao.id}" class="button">
          Votar Agora
        </a>
      </div>

      <p style="color: #6b7280; font-size: 14px;">
        Este é um lembrete automático. Se já votou, por favor desconsidere este email.
      </p>
    `;
    return this.baseTemplate(content);
  }

  static resultadoDisponivel(votacao: VotacaoData, moradorNome: string, resultado: string): string {
    const content = `
      <h2 style="color: #1f2937; margin-top: 0;">Olá, ${moradorNome}! 👋</h2>
      <p>O resultado da votação <strong>"${votacao.titulo}"</strong> já está disponível!</p>
      
      <div class="success-box">
        <h3 style="margin-top: 0; color: #10b981;">✅ Resultado Final</h3>
        <p style="font-size: 18px; margin-bottom: 0;">
          <strong>Status:</strong> ${resultado}
        </p>
      </div>

      <div style="text-align: center;">
        <a href="{{DASHBOARD_URL}}/votacoes/${votacao.id}" class="button">
          Ver Resultado Completo
        </a>
      </div>

      <p style="color: #6b7280; font-size: 14px;">
        Obrigado por participar! Sua opinião ajuda a construir um condomínio melhor.
      </p>
    `;
    return this.baseTemplate(content);
  }

  // =====================================================
  // TEMPLATES PARA SÍNDICO
  // =====================================================

  static novoMoradorPendente(morador: MoradorData, sindicoNome: string): string {
    const content = `
      <h2 style="color: #1f2937; margin-top: 0;">Olá, ${sindicoNome}! 👋</h2>
      <p>Um novo morador se cadastrou e está aguardando sua aprovação.</p>
      
      <div class="info-box">
        <h3 style="margin-top: 0; color: #2563eb;">👤 Novo Cadastro</h3>
        <p><strong>Nome:</strong> ${morador.nome}</p>
        <p><strong>Email:</strong> ${morador.email}</p>
        <p><strong>Unidade:</strong> ${morador.unidade}</p>
        <p style="margin-bottom: 0;"><strong>Condomínio:</strong> ${morador.condominioNome}</p>
      </div>

      <div style="text-align: center;">
        <a href="{{DASHBOARD_URL}}/moradores/pendentes" class="button">
          Revisar Cadastro
        </a>
      </div>

      <p style="color: #6b7280; font-size: 14px;">
        💡 <em>Por favor, aprove ou rejeite o cadastro o quanto antes para que o morador possa participar das votações.</em>
      </p>
    `;
    return this.baseTemplate(content);
  }

  static quorumAtingido(votacao: VotacaoData, sindicoNome: string, participacao: number): string {
    const content = `
      <h2 style="color: #1f2937; margin-top: 0;">Parabéns, ${sindicoNome}! 🎉</h2>
      <p>A votação <strong>"${votacao.titulo}"</strong> atingiu o quórum necessário!</p>
      
      <div class="success-box">
        <h3 style="margin-top: 0; color: #10b981;">✅ Quórum Atingido</h3>
        <p><strong>Taxa de participação:</strong> ${participacao}%</p>
        <p style="margin-bottom: 0;">A votação já pode ser considerada válida.</p>
      </div>

      <div style="text-align: center;">
        <a href="{{DASHBOARD_URL}}/votacoes/${votacao.id}" class="button">
          Ver Detalhes
        </a>
      </div>

      <p style="color: #6b7280; font-size: 14px;">
        O resultado parcial pode ser consultado a qualquer momento no painel do síndico.
      </p>
    `;
    return this.baseTemplate(content);
  }

  static votacaoEncerrada(votacao: VotacaoData, sindicoNome: string, resultado: string, participacao: number): string {
    const content = `
      <h2 style="color: #1f2937; margin-top: 0;">Olá, ${sindicoNome}! 👋</h2>
      <p>A votação <strong>"${votacao.titulo}"</strong> foi encerrada!</p>
      
      <div class="info-box">
        <h3 style="margin-top: 0; color: #2563eb;">📊 Resumo da Votação</h3>
        <p><strong>Resultado:</strong> ${resultado}</p>
        <p><strong>Participação:</strong> ${participacao}%</p>
        <p style="margin-bottom: 0;"><strong>Encerrada em:</strong> ${new Date(votacao.dataFim).toLocaleDateString('pt-BR')}</p>
      </div>

      <div style="text-align: center;">
        <a href="{{DASHBOARD_URL}}/votacoes/${votacao.id}" class="button">
          Ver Resultado Completo
        </a>
        <br/>
        <a href="{{DASHBOARD_URL}}/votacoes/${votacao.id}/ata" style="display: inline-block; margin-top: 10px; color: #2563eb; text-decoration: none;">
          📄 Gerar Ata da Assembleia
        </a>
      </div>

      <p style="color: #6b7280; font-size: 14px;">
        Não se esqueça de gerar e arquivar a ata oficial da votação.
      </p>
    `;
    return this.baseTemplate(content);
  }

  // =====================================================
  // TEMPLATES PARA SUPER ADMIN
  // =====================================================

  static novoCondominioAdmin(condominio: CondominioData, adminNome: string): string {
    const content = `
      <h2 style="color: #1f2937; margin-top: 0;">Olá, ${adminNome}! 👋</h2>
      <p>Um novo condomínio foi cadastrado na plataforma!</p>
      
      <div class="info-box">
        <h3 style="margin-top: 0; color: #2563eb;">🏢 Novo Condomínio</h3>
        <p><strong>Nome:</strong> ${condominio.nome}</p>
        <p><strong>CNPJ:</strong> ${condominio.cnpj}</p>
        <p><strong>Localização:</strong> ${condominio.cidade}</p>
        <p><strong>Síndico:</strong> ${condominio.sindico}</p>
        <p><strong>Plano:</strong> ${condominio.plano}</p>
        <p style="margin-bottom: 0;"><strong>Valor Mensal:</strong> R$ ${condominio.valorMensal.toFixed(2)}</p>
      </div>

      <div style="text-align: center;">
        <a href="{{ADMIN_URL}}/condominios/${condominio.id}" class="button">
          Ver Detalhes
        </a>
      </div>

      <p style="color: #6b7280; font-size: 14px;">
        O condomínio já está ativo e pode começar a criar votações.
      </p>
    `;
    return this.baseTemplate(content);
  }

  static inadimplenciaAdmin(condominio: CondominioData, adminNome: string, diasAtraso: number): string {
    const content = `
      <h2 style="color: #1f2937; margin-top: 0;">⚠️ Alerta de Inadimplência</h2>
      <p>O condomínio <strong>${condominio.nome}</strong> está com pagamento em atraso.</p>
      
      <div class="warning-box">
        <h3 style="margin-top: 0; color: #f59e0b;">💳 Pagamento Pendente</h3>
        <p><strong>Condomínio:</strong> ${condominio.nome}</p>
        <p><strong>CNPJ:</strong> ${condominio.cnpj}</p>
        <p><strong>Plano:</strong> ${condominio.plano}</p>
        <p><strong>Valor:</strong> R$ ${condominio.valorMensal.toFixed(2)}</p>
        <p style="margin-bottom: 0;"><strong>Dias de atraso:</strong> ${diasAtraso} dias</p>
      </div>

      <div style="text-align: center;">
        <a href="{{ADMIN_URL}}/condominios/${condominio.id}" class="button">
          Gerenciar Pagamento
        </a>
      </div>

      <p style="color: #6b7280; font-size: 14px;">
        ${diasAtraso > 30 ? '🚨 Atenção: Considere suspender o acesso do condomínio.' : 'Entre em contato com o síndico para regularizar o pagamento.'}
      </p>
    `;
    return this.baseTemplate(content);
  }
}

// =====================================================
// SERVIÇO DE NOTIFICAÇÕES
// =====================================================

export class NotificationService {
  
  // =====================================================
  // NOTIFICAÇÕES PARA MORADORES
  // =====================================================

  static async notificarNovaVotacao(
    moradorEmail: string,
    moradorNome: string,
    votacao: VotacaoData
  ): Promise<void> {
    try {
      const html = EmailTemplates.novaVotacao(votacao, moradorNome);
      
      await resend.emails.send({
        from: 'VotaCondôminos <noreply@votacondominios.com>',
        to: moradorEmail,
        subject: `📋 Nova votação: ${votacao.titulo}`,
        html
      });

      console.log(`✅ Email enviado: Nova votação para ${moradorEmail}`);
    } catch (error) {
      console.error('❌ Erro ao enviar email de nova votação:', error);
      throw error;
    }
  }

  static async notificarVotacaoEncerrando(
    moradorEmail: string,
    moradorNome: string,
    votacao: VotacaoData
  ): Promise<void> {
    try {
      const html = EmailTemplates.votacaoEncerrando(votacao, moradorNome);
      
      await resend.emails.send({
        from: 'VotaCondôminos <noreply@votacondominios.com>',
        to: moradorEmail,
        subject: `⏰ Última chance! Votação encerra em 24h`,
        html
      });

      console.log(`✅ Email enviado: Votação encerrando para ${moradorEmail}`);
    } catch (error) {
      console.error('❌ Erro ao enviar email de lembrete:', error);
      throw error;
    }
  }

  static async notificarResultadoDisponivel(
    moradorEmail: string,
    moradorNome: string,
    votacao: VotacaoData,
    resultado: string
  ): Promise<void> {
    try {
      const html = EmailTemplates.resultadoDisponivel(votacao, moradorNome, resultado);
      
      await resend.emails.send({
        from: 'VotaCondôminos <noreply@votacondominios.com>',
        to: moradorEmail,
        subject: `✅ Resultado disponível: ${votacao.titulo}`,
        html
      });

      console.log(`✅ Email enviado: Resultado disponível para ${moradorEmail}`);
    } catch (error) {
      console.error('❌ Erro ao enviar email de resultado:', error);
      throw error;
    }
  }

  // =====================================================
  // NOTIFICAÇÕES PARA SÍNDICO
  // =====================================================

  static async notificarNovoMoradorPendente(
    sindicoEmail: string,
    sindicoNome: string,
    morador: MoradorData
  ): Promise<void> {
    try {
      const html = EmailTemplates.novoMoradorPendente(morador, sindicoNome);
      
      await resend.emails.send({
        from: 'VotaCondôminos <noreply@votacondominios.com>',
        to: sindicoEmail,
        subject: `👤 Novo morador aguardando aprovação - ${morador.nome}`,
        html
      });

      console.log(`✅ Email enviado: Novo morador pendente para ${sindicoEmail}`);
    } catch (error) {
      console.error('❌ Erro ao enviar email de morador pendente:', error);
      throw error;
    }
  }

  static async notificarQuorumAtingido(
    sindicoEmail: string,
    sindicoNome: string,
    votacao: VotacaoData,
    participacao: number
  ): Promise<void> {
    try {
      const html = EmailTemplates.quorumAtingido(votacao, sindicoNome, participacao);
      
      await resend.emails.send({
        from: 'VotaCondôminos <noreply@votacondominios.com>',
        to: sindicoEmail,
        subject: `🎉 Quórum atingido: ${votacao.titulo}`,
        html
      });

      console.log(`✅ Email enviado: Quórum atingido para ${sindicoEmail}`);
    } catch (error) {
      console.error('❌ Erro ao enviar email de quórum:', error);
      throw error;
    }
  }

  static async notificarVotacaoEncerrada(
    sindicoEmail: string,
    sindicoNome: string,
    votacao: VotacaoData,
    resultado: string,
    participacao: number
  ): Promise<void> {
    try {
      const html = EmailTemplates.votacaoEncerrada(votacao, sindicoNome, resultado, participacao);
      
      await resend.emails.send({
        from: 'VotaCondôminos <noreply@votacondominios.com>',
        to: sindicoEmail,
        subject: `📊 Votação encerrada: ${votacao.titulo}`,
        html
      });

      console.log(`✅ Email enviado: Votação encerrada para ${sindicoEmail}`);
    } catch (error) {
      console.error('❌ Erro ao enviar email de votação encerrada:', error);
      throw error;
    }
  }

  // =====================================================
  // NOTIFICAÇÕES PARA SUPER ADMIN
  // =====================================================

  static async notificarNovoCondominio(
    adminEmail: string,
    adminNome: string,
    condominio: CondominioData
  ): Promise<void> {
    try {
      const html = EmailTemplates.novoCondominioAdmin(condominio, adminNome);
      
      await resend.emails.send({
        from: 'VotaCondôminos <noreply@votacondominios.com>',
        to: adminEmail,
        subject: `🏢 Novo condomínio cadastrado: ${condominio.nome}`,
        html
      });

      console.log(`✅ Email enviado: Novo condomínio para ${adminEmail}`);
    } catch (error) {
      console.error('❌ Erro ao enviar email de novo condomínio:', error);
      throw error;
    }
  }

  static async notificarInadimplencia(
    adminEmail: string,
    adminNome: string,
    condominio: CondominioData,
    diasAtraso: number
  ): Promise<void> {
    try {
      const html = EmailTemplates.inadimplenciaAdmin(condominio, adminNome, diasAtraso);
      
      await resend.emails.send({
        from: 'VotaCondôminos <noreply@votacondominios.com>',
        to: adminEmail,
        subject: `⚠️ Inadimplência: ${condominio.nome} - ${diasAtraso} dias`,
        html,
        tags: [
          { name: 'type', value: 'inadimplencia' },
          { name: 'dias_atraso', value: diasAtraso.toString() }
        ]
      });

      console.log(`✅ Email enviado: Inadimplência para ${adminEmail}`);
    } catch (error) {
      console.error('❌ Erro ao enviar email de inadimplência:', error);
      throw error;
    }
  }

  // =====================================================
  // NOTIFICAÇÕES EM LOTE (BATCH)
  // =====================================================

  static async notificarTodosMoradoresNovaVotacao(
    moradores: Array<{ email: string; nome: string }>,
    votacao: VotacaoData
  ): Promise<void> {
    const promises = moradores.map(morador =>
      this.notificarNovaVotacao(morador.email, morador.nome, votacao)
    );

    try {
      await Promise.allSettled(promises);
      console.log(`✅ Notificações enviadas para ${moradores.length} moradores`);
    } catch (error) {
      console.error('❌ Erro ao enviar notificações em lote:', error);
    }
  }

  static async notificarMoradoresNaoVotaram(
    moradores: Array<{ email: string; nome: string }>,
    votacao: VotacaoData
  ): Promise<void> {
    const promises = moradores.map(morador =>
      this.notificarVotacaoEncerrando(morador.email, morador.nome, votacao)
    );

    try {
      await Promise.allSettled(promises);
      console.log(`✅ Lembretes enviados para ${moradores.length} moradores`);
    } catch (error) {
      console.error('❌ Erro ao enviar lembretes:', error);
    }
  }
}

// =====================================================
// TRIGGERS AUTOMÁTICOS (Supabase Functions ou Cron Jobs)
// =====================================================

export class NotificationTriggers {
  
  // Trigger: Nova votação criada
  static async onVotacaoCriada(votacaoId: string): Promise<void> {
    // 1. Buscar dados da votação
    // 2. Buscar moradores aprovados do condomínio
    // 3. Enviar notificações
    console.log(`🔔 Trigger: Nova votação criada (${votacaoId})`);
  }

  // Trigger: Verificar votações que encerram em 24h (executar diariamente)
  static async checkVotacoesEncerrando(): Promise<void> {
    // 1. Buscar votações que encerram em 24h
    // 2. Para cada votação, buscar moradores que não votaram
    // 3. Enviar lembretes
    console.log(`🔔 Cron: Verificando votações encerrando`);
  }

  // Trigger: Votação encerrada
  static async onVotacaoEncerrada(votacaoId: string): Promise<void> {
    // 1. Calcular resultado
    // 2. Notificar síndico
    // 3. Notificar moradores
    console.log(`🔔 Trigger: Votação encerrada (${votacaoId})`);
  }

  // Trigger: Novo morador cadastrado
  static async onNovoMoradorCadastrado(moradorId: string): Promise<void> {
    // 1. Buscar dados do morador
    // 2. Buscar síndico do condomínio
    // 3. Notificar síndico
    console.log(`🔔 Trigger: Novo morador cadastrado (${moradorId})`);
  }

  // Trigger: Quórum atingido
  static async onQuorumAtingido(votacaoId: string): Promise<void> {
    // 1. Buscar dados da votação
    // 2. Buscar síndico
    // 3. Notificar síndico
    console.log(`🔔 Trigger: Quórum atingido (${votacaoId})`);
  }

  // Cron: Verificar inadimplências (executar diariamente)
  static async checkInadimplencias(): Promise<void> {
    // 1. Buscar condomínios com pagamento atrasado
    // 2. Para cada condomínio, calcular dias de atraso
    // 3. Notificar admin se atraso > 5 dias
    console.log(`🔔 Cron: Verificando inadimplências`);
  }
}

// =====================================================
// EXEMPLO DE USO
// =====================================================

/*
// No código da aplicação:

// Quando criar uma votação
await NotificationService.notificarTodosMoradoresNovaVotacao(
  moradores,
  votacao
);

// Quando síndico aprovar morador
await NotificationService.notificarNovoMoradorPendente(
  sindicoEmail,
  sindicoNome,
  morador
);

// Quando votação encerrar
await NotificationService.notificarVotacaoEncerrada(
  sindicoEmail,
  sindicoNome,
  votacao,
  'APROVADA',
  85
);

// Cron job diário (via Vercel Cron, Supabase Functions, etc.)
export default async function handler(req: Request) {
  await NotificationTriggers.checkVotacoesEncerrando();
  await NotificationTriggers.checkInadimplencias();
  return new Response('OK');
}
*/

// =====================================================
// CONFIGURAÇÃO NO SUPABASE (Database Functions)
// =====================================================

/*
-- Trigger no Supabase para nova votação
CREATE OR REPLACE FUNCTION notify_nova_votacao()
RETURNS TRIGGER AS $
BEGIN
  PERFORM net.http_post(
    url := 'https://seu-dominio.com/api/notifications/nova-votacao',
    body := json_build_object('votacao_id', NEW.id)::text,
    headers := '{"Content-Type": "application/json"}'::jsonb
  );
  RETURN NEW;
END;
$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_nova_votacao
  AFTER INSERT ON votacoes
  FOR EACH ROW
  WHEN (NEW.status = 'aberta')
  EXECUTE FUNCTION notify_nova_votacao();

-- Trigger para novo morador
CREATE OR REPLACE FUNCTION notify_novo_morador()
RETURNS TRIGGER AS $
BEGIN
  PERFORM net.http_post(
    url := 'https://seu-dominio.com/api/notifications/novo-morador',
    body := json_build_object('morador_id', NEW.id, 'condominio_id', NEW.condominio_id)::text,
    headers := '{"Content-Type": "application/json"}'::jsonb
  );
  RETURN NEW;
END;
$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_novo_morador
  AFTER INSERT ON usuarios_condominios
  FOR EACH ROW
  WHEN (NEW.status = 'pendente')
  EXECUTE FUNCTION notify_novo_morador();

-- Trigger para quórum atingido
CREATE OR REPLACE FUNCTION check_quorum_atingido()
RETURNS TRIGGER AS $
DECLARE
  v_total_votos INTEGER;
  v_total_elegiveis INTEGER;
  v_quorum_necessario DECIMAL;
  v_participacao DECIMAL;
BEGIN
  -- Buscar dados da votação
  SELECT 
    quorum_minimo,
    (SELECT COUNT(*) FROM votos WHERE votacao_id = NEW.votacao_id) as total_votos,
    (SELECT COUNT(*) FROM usuarios_condominios uc 
     JOIN votacoes v ON v.condominio_id = uc.condominio_id
     WHERE v.id = NEW.votacao_id AND uc.status = 'aprovado') as total_elegiveis
  INTO v_quorum_necessario, v_total_votos, v_total_elegiveis
  FROM votacoes
  WHERE id = NEW.votacao_id;

  v_participacao := (v_total_votos::DECIMAL / v_total_elegiveis::DECIMAL) * 100;

  -- Se atingiu quórum pela primeira vez
  IF v_participacao >= v_quorum_necessario THEN
    PERFORM net.http_post(
      url := 'https://seu-dominio.com/api/notifications/quorum-atingido',
      body := json_build_object('votacao_id', NEW.votacao_id, 'participacao', v_participacao)::text,
      headers := '{"Content-Type": "application/json"}'::jsonb
    );
  END IF;

  RETURN NEW;
END;
$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_quorum_atingido
  AFTER INSERT ON votos
  FOR EACH ROW
  EXECUTE FUNCTION check_quorum_atingido();
*/

// =====================================================
// API ROUTES (Next.js App Router)
// app/api/notifications/[trigger]/route.ts
// =====================================================

/*
import { NextRequest, NextResponse } from 'next/server';
import { NotificationService } from '@/lib/notifications/emailService';
import { supabaseServer } from '@/lib/supabase/server';

export async function POST(
  request: NextRequest,
  { params }: { params: { trigger: string } }
) {
  try {
    const body = await request.json();
    const { trigger } = params;

    switch (trigger) {
      case 'nova-votacao':
        await handleNovaVotacao(body.votacao_id);
        break;
      
      case 'novo-morador':
        await handleNovoMorador(body.morador_id, body.condominio_id);
        break;
      
      case 'quorum-atingido':
        await handleQuorumAtingido(body.votacao_id, body.participacao);
        break;
      
      case 'votacao-encerrada':
        await handleVotacaoEncerrada(body.votacao_id);
        break;
      
      default:
        return NextResponse.json({ error: 'Trigger inválido' }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Erro no trigger de notificação:', error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}

async function handleNovaVotacao(votacaoId: string) {
  const supabase = supabaseServer();

  // Buscar votação
  const { data: votacao } = await supabase
    .from('votacoes')
    .select(`
      id,
      titulo,
      descricao,
      data_fim,
      condominio_id,
      condominios (nome)
    `)
    .eq('id', votacaoId)
    .single();

  if (!votacao) return;

  // Buscar moradores aprovados
  const { data: moradores } = await supabase
    .from('usuarios_condominios')
    .select(`
      usuarios (
        email,
        nome_completo
      )
    `)
    .eq('condominio_id', votacao.condominio_id)
    .eq('status', 'aprovado');

  if (!moradores) return;

  // Enviar notificações
  const moradoresData = moradores.map(m => ({
    email: m.usuarios.email,
    nome: m.usuarios.nome_completo
  }));

  await NotificationService.notificarTodosMoradoresNovaVotacao(
    moradoresData,
    {
      id: votacao.id,
      titulo: votacao.titulo,
      descricao: votacao.descricao,
      dataFim: votacao.data_fim,
      condominioNome: votacao.condominios.nome,
      condominioId: votacao.condominio_id
    }
  );
}

async function handleNovoMorador(moradorId: string, condominioId: string) {
  const supabase = supabaseServer();

  // Buscar dados do morador
  const { data: moradorData } = await supabase
    .from('usuarios_condominios')
    .select(`
      id,
      usuarios (
        nome_completo,
        email
      ),
      unidades (
        identificador
      ),
      condominios (
        nome
      )
    `)
    .eq('id', moradorId)
    .single();

  if (!moradorData) return;

  // Buscar síndico do condomínio
  const { data: sindico } = await supabase
    .from('usuarios')
    .select('email, nome_completo')
    .eq('role', 'sindico')
    .limit(1)
    .single();

  if (!sindico) return;

  // Enviar notificação
  await NotificationService.notificarNovoMoradorPendente(
    sindico.email,
    sindico.nome_completo,
    {
      id: moradorData.id,
      nome: moradorData.usuarios.nome_completo,
      email: moradorData.usuarios.email,
      unidade: moradorData.unidades.identificador,
      condominioNome: moradorData.condominios.nome
    }
  );
}

async function handleQuorumAtingido(votacaoId: string, participacao: number) {
  const supabase = supabaseServer();

  // Buscar votação e síndico
  const { data: votacao } = await supabase
    .from('votacoes')
    .select(`
      id,
      titulo,
      descricao,
      data_fim,
      condominio_id,
      condominios (
        nome
      ),
      criado_por,
      usuarios (
        email,
        nome_completo
      )
    `)
    .eq('id', votacaoId)
    .single();

  if (!votacao) return;

  await NotificationService.notificarQuorumAtingido(
    votacao.usuarios.email,
    votacao.usuarios.nome_completo,
    {
      id: votacao.id,
      titulo: votacao.titulo,
      descricao: votacao.descricao,
      dataFim: votacao.data_fim,
      condominioNome: votacao.condominios.nome,
      condominioId: votacao.condominio_id
    },
    participacao
  );
}

async function handleVotacaoEncerrada(votacaoId: string) {
  const supabase = supabaseServer();

  // Buscar votação completa
  const { data: votacao } = await supabase
    .from('votacoes')
    .select(`
      *,
      condominios (nome),
      usuarios (email, nome_completo),
      votos (count),
      opcoes_votacao (
        id,
        texto,
        votos (count)
      )
    `)
    .eq('id', votacaoId)
    .single();

  if (!votacao) return;

  // Calcular resultado
  const totalVotos = votacao.votos[0].count;
  const opcaoVencedora = votacao.opcoes_votacao.reduce((prev, curr) =>
    curr.votos[0].count > prev.votos[0].count ? curr : prev
  );

  const resultado = opcaoVencedora.texto;
  const participacao = 85; // Calcular real

  // Notificar síndico
  await NotificationService.notificarVotacaoEncerrada(
    votacao.usuarios.email,
    votacao.usuarios.nome_completo,
    {
      id: votacao.id,
      titulo: votacao.titulo,
      descricao: votacao.descricao,
      dataFim: votacao.data_fim,
      condominioNome: votacao.condominios.nome,
      condominioId: votacao.condominio_id
    },
    resultado,
    participacao
  );

  // Buscar e notificar todos os moradores
  const { data: moradores } = await supabase
    .from('usuarios_condominios')
    .select('usuarios (email, nome_completo)')
    .eq('condominio_id', votacao.condominio_id)
    .eq('status', 'aprovado');

  if (moradores) {
    for (const morador of moradores) {
      await NotificationService.notificarResultadoDisponivel(
        morador.usuarios.email,
        morador.usuarios.nome_completo,
        {
          id: votacao.id,
          titulo: votacao.titulo,
          descricao: votacao.descricao,
          dataFim: votacao.data_fim,
          condominioNome: votacao.condominios.nome,
          condominioId: votacao.condominio_id
        },
        resultado
      );
    }
  }
}
*/

// =====================================================
// CRON JOBS (Vercel Cron ou similar)
// app/api/cron/notifications/route.ts
// =====================================================

/*
import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase/server';
import { NotificationService } from '@/lib/notifications/emailService';

export async function GET(request: NextRequest) {
  // Verificar authorization header
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    await checkVotacoesEncerrando();
    await checkInadimplencias();
    
    return NextResponse.json({ success: true, timestamp: new Date().toISOString() });
  } catch (error) {
    console.error('Erro no cron job:', error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}

async function checkVotacoesEncerrando() {
  const supabase = supabaseServer();

  // Buscar votações que encerram em 24h
  const dataLimite = new Date();
  dataLimite.setHours(dataLimite.getHours() + 24);

  const { data: votacoes } = await supabase
    .from('votacoes')
    .select(`
      id,
      titulo,
      descricao,
      data_fim,
      condominio_id,
      condominios (nome)
    `)
    .eq('status', 'aberta')
    .lte('data_fim', dataLimite.toISOString())
    .gte('data_fim', new Date().toISOString());

  if (!votacoes) return;

  for (const votacao of votacoes) {
    // Buscar moradores que NÃO votaram
    const { data: moradoresNaoVotaram } = await supabase
      .from('usuarios_condominios')
      .select(`
        usuario_id,
        usuarios (
          email,
          nome_completo
        )
      `)
      .eq('condominio_id', votacao.condominio_id)
      .eq('status', 'aprovado')
      .not('usuario_id', 'in', 
        supabase
          .from('votos')
          .select('usuario_id')
          .eq('votacao_id', votacao.id)
      );

    if (!moradoresNaoVotaram) continue;

    // Enviar lembretes
    const moradoresData = moradoresNaoVotaram.map(m => ({
      email: m.usuarios.email,
      nome: m.usuarios.nome_completo
    }));

    await NotificationService.notificarMoradoresNaoVotaram(
      moradoresData,
      {
        id: votacao.id,
        titulo: votacao.titulo,
        descricao: votacao.descricao,
        dataFim: votacao.data_fim,
        condominioNome: votacao.condominios.nome,
        condominioId: votacao.condominio_id
      }
    );

    console.log(`✅ Lembretes enviados para ${moradoresData.length} moradores da votação ${votacao.id}`);
  }
}

async function checkInadimplencias() {
  const supabase = supabaseServer();

  // Buscar condomínios com pagamento atrasado
  const hoje = new Date();

  const { data: condominios } = await supabase
    .from('condominios')
    .select('*')
    .eq('status_pagamento', 'inadimplente')
    .lt('proximo_vencimento', hoje.toISOString());

  if (!condominios) return;

  // Buscar email do super admin
  const { data: admin } = await supabase
    .from('usuarios')
    .select('email, nome_completo')
    .eq('role', 'super_admin')
    .limit(1)
    .single();

  if (!admin) return;

  for (const condominio of condominios) {
    const diasAtraso = Math.floor(
      (hoje.getTime() - new Date(condominio.proximo_vencimento).getTime()) / (1000 * 60 * 60 * 24)
    );

    // Notificar apenas se atraso >= 5 dias
    if (diasAtraso >= 5) {
      await NotificationService.notificarInadimplencia(
        admin.email,
        admin.nome_completo,
        {
          id: condominio.id,
          nome: condominio.nome,
          cnpj: condominio.cnpj,
          cidade: condominio.cidade,
          sindico: '', // Buscar se necessário
          plano: condominio.plano,
          valorMensal: condominio.valor_mensal
        },
        diasAtraso
      );

      console.log(`✅ Notificação de inadimplência enviada para ${condominio.nome} (${diasAtraso} dias)`);
    }
  }
}

// Configurar no vercel.json:
{
  "crons": [
    {
      "path": "/api/cron/notifications",
      "schedule": "0 9 * * *"
    }
  ]
}
*/

// =====================================================
// VARIÁVEIS DE AMBIENTE NECESSÁRIAS (.env)
// =====================================================

/*
# Resend
RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# URLs da aplicação
NEXT_PUBLIC_APP_URL=https://votacondominios.com
DASHBOARD_URL=https://votacondominios.com/dashboard
ADMIN_URL=https://votacondominios.com/admin

# Cron Secret (gerar hash seguro)
CRON_SECRET=seu_secret_aqui

# Email de suporte
SUPPORT_EMAIL=suporte@votacondominios.com
*/

// =====================================================
// TESTES UNITÁRIOS
// =====================================================

/*
import { NotificationService } from './emailService';

describe('NotificationService', () => {
  it('deve enviar email de nova votação', async () => {
    const result = await NotificationService.notificarNovaVotacao(
      'teste@email.com',
      'João Teste',
      {
        id: '1',
        titulo: 'Teste de Votação',
        descricao: 'Descrição teste',
        dataFim: new Date().toISOString(),
        condominioNome: 'Condomínio Teste',
        condominioId: '1'
      }
    );

    expect(result).toBeDefined();
  });
});
*/

export default NotificationService;