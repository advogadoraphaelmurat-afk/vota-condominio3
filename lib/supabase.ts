import { createClient } from '@supabase/supabase-js'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// Cliente para uso no servidor (API Routes, Server Components)
export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Cliente para uso no cliente (Client Components)
export const createSupabaseClient = () => {
  return createClientComponentClient()
}

// Tipos do banco de dados conforme seu schema real
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      condominios: {
        Row: {
          id: string
          nome: string
          cnpj: string
          endereco: string
          cidade: string
          estado: string
          cep: string
          telefone: string | null
          email: string | null
          created_at: string
        }
        Insert: {
          id?: string
          nome: string
          cnpj: string
          endereco: string
          cidade: string
          estado: string
          cep: string
          telefone?: string | null
          email?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          nome?: string
          cnpj?: string
          endereco?: string
          cidade?: string
          estado?: string
          cep?: string
          telefone?: string | null
          email?: string | null
          created_at?: string
        }
      }
      unidades: {
        Row: {
          id: string
          condominio_id: string
          numero: string
          bloco: string | null
          tipo: string
          area_m2: number | null
          fracao_ideal: number | null
          observacoes: string | null
          created_at: string
        }
        Insert: {
          id?: string
          condominio_id: string
          numero: string
          bloco?: string | null
          tipo: string
          area_m2?: number | null
          fracao_ideal?: number | null
          observacoes?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          condominio_id?: string
          numero?: string
          bloco?: string | null
          tipo?: string
          area_m2?: number | null
          fracao_ideal?: number | null
          observacoes?: string | null
          created_at?: string
        }
      }
      usuarios: {
        Row: {
          id: string
          auth_id: string
          nome: string
          email: string
          telefone: string | null
          cpf: string | null
          data_nascimento: string | null
          foto_url: string | null
          tipo_usuario: 'super_admin' | 'sindico' | 'conselheiro' | 'morador' | 'proprietario'
          status: 'ativo' | 'inativo' | 'pendente'
          ultimo_acesso: string | null
          created_at: string
        }
        Insert: {
          id?: string
          auth_id: string
          nome: string
          email: string
          telefone?: string | null
          cpf?: string | null
          data_nascimento?: string | null
          foto_url?: string | null
          tipo_usuario?: 'super_admin' | 'sindico' | 'conselheiro' | 'morador' | 'proprietario'
          status?: 'ativo' | 'inativo' | 'pendente'
          ultimo_acesso?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          auth_id?: string
          nome?: string
          email?: string
          telefone?: string | null
          cpf?: string | null
          data_nascimento?: string | null
          foto_url?: string | null
          tipo_usuario?: 'super_admin' | 'sindico' | 'conselheiro' | 'morador' | 'proprietario'
          status?: 'ativo' | 'inativo' | 'pendente'
          ultimo_acesso?: string | null
          created_at?: string
        }
      }
      usuarios_condominios: {
        Row: {
          id: string
          usuario_id: string
          condominio_id: string
          unidade_id: string | null
          papel: 'sindico' | 'conselheiro' | 'morador' | 'proprietario'
          status: 'ativo' | 'inativo' | 'pendente'
          data_inicio: string
          data_fim: string | null
          aprovado_por: string | null
          created_at: string
        }
        Insert: {
          id?: string
          usuario_id: string
          condominio_id: string
          unidade_id?: string | null
          papel: 'sindico' | 'conselheiro' | 'morador' | 'proprietario'
          status?: 'ativo' | 'inativo' | 'pendente'
          data_inicio?: string
          data_fim?: string | null
          aprovado_por?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          usuario_id?: string
          condominio_id?: string
          unidade_id?: string | null
          papel?: 'sindico' | 'conselheiro' | 'morador' | 'proprietario'
          status?: 'ativo' | 'inativo' | 'pendente'
          data_inicio?: string
          data_fim?: string | null
          aprovado_por?: string | null
          created_at?: string
        }
      }
      votacoes: {
        Row: {
          id: string
          condominio_id: string
          titulo: string
          descricao: string
          tipo: 'simples' | 'multipla' | 'secreta'
          categoria: string | null
          data_inicio: string
          data_fim: string
          quorum_minimo: number
          permite_abstencao: boolean
          resultado_visivel: boolean
          status: 'rascunho' | 'agendada' | 'ativa' | 'encerrada' | 'cancelada'
          criado_por: string
          encerrada_por: string | null
          created_at: string
        }
        Insert: {
          id?: string
          condominio_id: string
          titulo: string
          descricao: string
          tipo: 'simples' | 'multipla' | 'secreta'
          categoria?: string | null
          data_inicio: string
          data_fim: string
          quorum_minimo?: number
          permite_abstencao?: boolean
          resultado_visivel?: boolean
          status?: 'rascunho' | 'agendada' | 'ativa' | 'encerrada' | 'cancelada'
          criado_por: string
          encerrada_por?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          condominio_id?: string
          titulo?: string
          descricao?: string
          tipo?: 'simples' | 'multipla' | 'secreta'
          categoria?: string | null
          data_inicio?: string
          data_fim?: string
          quorum_minimo?: number
          permite_abstencao?: boolean
          resultado_visivel?: boolean
          status?: 'rascunho' | 'agendada' | 'ativa' | 'encerrada' | 'cancelada'
          criado_por?: string
          encerrada_por?: string | null
          created_at?: string
        }
      }
      opcoes_votacao: {
        Row: {
          id: string
          votacao_id: string
          texto: string
          ordem: number
        }
        Insert: {
          id?: string
          votacao_id: string
          texto: string
          ordem: number
        }
        Update: {
          id?: string
          votacao_id?: string
          texto?: string
          ordem?: number
        }
      }
      votos: {
        Row: {
          id: string
          votacao_id: string
          usuario_id: string
          unidade_id: string | null
          opcao_id: string | null
          justificativa: string | null
          ip_address: string | null
          user_agent: string | null
          timestamp: string
          created_at: string
        }
        Insert: {
          id?: string
          votacao_id: string
          usuario_id: string
          unidade_id?: string | null
          opcao_id?: string | null
          justificativa?: string | null
          ip_address?: string | null
          user_agent?: string | null
          timestamp?: string
          created_at?: string
        }
        Update: {
          id?: string
          votacao_id?: string
          usuario_id?: string
          unidade_id?: string | null
          opcao_id?: string | null
          justificativa?: string | null
          ip_address?: string | null
          user_agent?: string | null
          timestamp?: string
          created_at?: string
        }
      }
      comunicacoes: {
        Row: {
          id: string
          condominio_id: string
          titulo: string
          conteudo: string
          tipo: 'aviso' | 'comunicado' | 'urgente' | 'informativo'
          prioridade: 'baixa' | 'media' | 'alta' | 'urgente'
          destinatarios: Json
          enviado_por: string
          data_envio: string
          data_expiracao: string | null
          anexos: Json | null
          status: 'rascunho' | 'enviado' | 'arquivado'
          created_at: string
        }
        Insert: {
          id?: string
          condominio_id: string
          titulo: string
          conteudo: string
          tipo: 'aviso' | 'comunicado' | 'urgente' | 'informativo'
          prioridade?: 'baixa' | 'media' | 'alta' | 'urgente'
          destinatarios: Json
          enviado_por: string
          data_envio?: string
          data_expiracao?: string | null
          anexos?: Json | null
          status?: 'rascunho' | 'enviado' | 'arquivado'
          created_at?: string
        }
        Update: {
          id?: string
          condominio_id?: string
          titulo?: string
          conteudo?: string
          tipo?: 'aviso' | 'comunicado' | 'urgente' | 'informativo'
          prioridade?: 'baixa' | 'media' | 'alta' | 'urgente'
          destinatarios?: Json
          enviado_por?: string
          data_envio?: string
          data_expiracao?: string | null
          anexos?: Json | null
          status?: 'rascunho' | 'enviado' | 'arquivado'
          created_at?: string
        }
      }
      avisos: {
        Row: {
          id: string
          condominio_id: string
          titulo: string
          conteudo: string
          tipo: 'manutencao' | 'evento' | 'assembleia' | 'lembrete' | 'geral'
          categoria: string | null
          prioridade: 'baixa' | 'media' | 'alta'
          data_publicacao: string
          data_expiracao: string | null
          fixado: boolean
          visivel: boolean
          autor_id: string
          anexos: Json | null
          tags: string[] | null
          created_at: string
        }
        Insert: {
          id?: string
          condominio_id: string
          titulo: string
          conteudo: string
          tipo: 'manutencao' | 'evento' | 'assembleia' | 'lembrete' | 'geral'
          categoria?: string | null
          prioridade?: 'baixa' | 'media' | 'alta'
          data_publicacao?: string
          data_expiracao?: string | null
          fixado?: boolean
          visivel?: boolean
          autor_id: string
          anexos?: Json | null
          tags?: string[] | null
          created_at?: string
        }
        Update: {
          id?: string
          condominio_id?: string
          titulo?: string
          conteudo?: string
          tipo?: 'manutencao' | 'evento' | 'assembleia' | 'lembrete' | 'geral'
          categoria?: string | null
          prioridade?: 'baixa' | 'media' | 'alta'
          data_publicacao?: string
          data_expiracao?: string | null
          fixado?: boolean
          visivel?: boolean
          autor_id?: string
          anexos?: Json | null
          tags?: string[] | null
          created_at?: string
        }
      }
      logs_auditoria: {
        Row: {
          id: string
          usuario_id: string | null
          condominio_id: string | null
          acao: string
          tabela: string | null
          registro_id: string | null
          dados_anteriores: Json | null
          dados_novos: Json | null
          ip_address: string | null
          user_agent: string | null
          timestamp: string
        }
        Insert: {
          id?: string
          usuario_id?: string | null
          condominio_id?: string | null
          acao: string
          tabela?: string | null
          registro_id?: string | null
          dados_anteriores?: Json | null
          dados_novos?: Json | null
          ip_address?: string | null
          user_agent?: string | null
          timestamp?: string
        }
        Update: {
          id?: string
          usuario_id?: string | null
          condominio_id?: string | null
          acao?: string
          tabela?: string | null
          registro_id?: string | null
          dados_anteriores?: Json | null
          dados_novos?: Json | null
          ip_address?: string | null
          user_agent?: string | null
          timestamp?: string
        }
      }
    }
  }
}

// Helper para pegar o usuário atual com seus vínculos
export async function getCurrentUser() {
  const { data: { user }, error } = await supabase.auth.getUser()
  
  if (error || !user) {
    return null
  }

  // Busca os dados completos do usuário
  const { data: userData, error: userError } = await supabase
    .from('usuarios')
    .select('*')
    .eq('auth_id', user.id)
    .single()

  if (userError || !userData) {
    return null
  }

  return userData
}

// Helper para pegar os condomínios do usuário
export async function getUserCondominios(userId: string) {
  const { data, error } = await supabase
    .from('usuarios_condominios')
    .select(`
      *,
      condominio:condominios(*),
      unidade:unidades(*)
    `)
    .eq('usuario_id', userId)
    .eq('status', 'ativo')

  if (error) return []
  return data || []
}

// Helper para verificar se é síndico em algum condomínio
export async function isSindico(userId: string, condominioId?: string) {
  const query = supabase
    .from('usuarios_condominios')
    .select('papel')
    .eq('usuario_id', userId)
    .eq('papel', 'sindico')
    .eq('status', 'ativo')

  if (condominioId) {
    query.eq('condominio_id', condominioId)
  }

  const { data } = await query.single()
  return !!data
}

// Helper para verificar se é super admin
export async function isSuperAdmin(userId: string) {
  const { data } = await supabase
    .from('usuarios')
    .select('tipo_usuario')
    .eq('id', userId)
    .eq('tipo_usuario', 'super_admin')
    .single()

  return !!data
}

// Helper para pegar o condomínio ativo do usuário
export async function getCondominioAtivo(userId: string) {
  const { data, error } = await supabase
    .from('usuarios_condominios')
    .select(`
      *,
      condominio:condominios(*)
    `)
    .eq('usuario_id', userId)
    .eq('status', 'ativo')
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  if (error) {
    console.error('Erro ao buscar condomínio ativo:', error)
    return null
  }

  return data
}

// Helper para pegar todos os condomínios do usuário
export async function getUserCondominiosList(userId: string) {
  const { data, error } = await supabase
    .from('usuarios_condominios')
    .select(`
      *,
      condominio:condominios(*),
      unidade:unidades(*)
    `)
    .eq('usuario_id', userId)
    .eq('status', 'ativo')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Erro ao buscar condomínios:', error)
    return []
  }

  return data || []
}