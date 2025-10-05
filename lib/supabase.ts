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

// Tipos do banco de dados
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
          endereco: string
          cnpj: string
          created_at: string
          status: 'ativo' | 'inativo'
        }
        Insert: {
          id?: string
          nome: string
          endereco: string
          cnpj: string
          created_at?: string
          status?: 'ativo' | 'inativo'
        }
        Update: {
          id?: string
          nome?: string
          endereco?: string
          cnpj?: string
          created_at?: string
          status?: 'ativo' | 'inativo'
        }
      }
      usuarios: {
        Row: {
          id: string
          condominio_id: string
          email: string
          nome: string
          tipo_usuario: 'morador' | 'sindico' | 'super_admin'
          apartamento: string | null
          status: 'ativo' | 'pendente' | 'inativo'
          created_at: string
        }
        Insert: {
          id?: string
          condominio_id: string
          email: string
          nome: string
          tipo_usuario: 'morador' | 'sindico' | 'super_admin'
          apartamento?: string | null
          status?: 'ativo' | 'pendente' | 'inativo'
          created_at?: string
        }
        Update: {
          id?: string
          condominio_id?: string
          email?: string
          nome?: string
          tipo_usuario?: 'morador' | 'sindico' | 'super_admin'
          apartamento?: string | null
          status?: 'ativo' | 'pendente' | 'inativo'
          created_at?: string
        }
      }
      votacoes: {
        Row: {
          id: string
          condominio_id: string
          titulo: string
          descricao: string
          data_inicio: string
          data_fim: string
          tipo: 'simples' | 'multipla'
          status: 'rascunho' | 'ativa' | 'encerrada' | 'cancelada'
          created_by: string
          created_at: string
          quorum_minimo: number
        }
        Insert: {
          id?: string
          condominio_id: string
          titulo: string
          descricao: string
          data_inicio: string
          data_fim: string
          tipo: 'simples' | 'multipla'
          status?: 'rascunho' | 'ativa' | 'encerrada' | 'cancelada'
          created_by: string
          created_at?: string
          quorum_minimo?: number
        }
        Update: {
          id?: string
          condominio_id?: string
          titulo?: string
          descricao?: string
          data_inicio?: string
          data_fim?: string
          tipo?: 'simples' | 'multipla'
          status?: 'rascunho' | 'ativa' | 'encerrada' | 'cancelada'
          created_by?: string
          created_at?: string
          quorum_minimo?: number
        }
      }
      votos: {
        Row: {
          id: string
          votacao_id: string
          usuario_id: string
          opcao_id: string
          timestamp: string
        }
        Insert: {
          id?: string
          votacao_id: string
          usuario_id: string
          opcao_id: string
          timestamp?: string
        }
        Update: {
          id?: string
          votacao_id?: string
          usuario_id?: string
          opcao_id?: string
          timestamp?: string
        }
      }
    }
  }
}

// Helper para pegar o usuário atual
export async function getCurrentUser() {
  const { data: { user }, error } = await supabase.auth.getUser()
  
  if (error || !user) {
    return null
  }

  // Busca os dados completos do usuário no banco
  const { data: userData, error: userError } = await supabase
    .from('usuarios')
    .select('*')
    .eq('id', user.id)
    .single()

  if (userError) {
    return null
  }

  return userData
}

// Helper para verificar se é síndico
export async function isSindico() {
  const user = await getCurrentUser()
  return user?.tipo_usuario === 'sindico'
}

// Helper para verificar se é super admin
export async function isSuperAdmin() {
  const user = await getCurrentUser()
  return user?.tipo_usuario === 'super_admin'
}