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
      email_integrations: {
        Row: {
          id: string
          user_id: string
          provider: string
          credentials: string
          status: string
          sync_frequency: string
          filters: Json
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          provider: string
          credentials: string
          status?: string
          sync_frequency?: string
          filters?: Json
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          provider?: string
          credentials?: string
          status?: string
          sync_frequency?: string
          filters?: Json
          created_at?: string
          updated_at?: string
        }
      }
      job_applications: {
        Row: {
          id: string
          user_id: string
          job_title: string
          company_name: string
          status: string
          source: string
          job_url: string
          job_description: string
          location: string
          remote: boolean
          external_job_id: string
          applied_date: string
          last_updated: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          job_title: string
          company_name: string
          status: string
          source: string
          job_url: string
          job_description: string
          location: string
          remote: boolean
          external_job_id: string
          applied_date: string
          last_updated: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          job_title?: string
          company_name?: string
          status?: string
          source?: string
          job_url?: string
          job_description?: string
          location?: string
          remote?: boolean
          external_job_id?: string
          applied_date?: string
          last_updated?: string
          created_at?: string
        }
      }
      emails: {
        Row: {
          id: string
          user_id: string
          application_id: string
          email_id: string
          subject: string
          sender: string
          received_at: string
          content: string
          category: string
          metadata: Json
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          application_id: string
          email_id: string
          subject: string
          sender: string
          received_at: string
          content: string
          category: string
          metadata: Json
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          application_id?: string
          email_id?: string
          subject?: string
          sender?: string
          received_at?: string
          content?: string
          category?: string
          metadata?: Json
          created_at?: string
        }
      },
      application_emails: {
        Row: {
          id: string
          user_id: string
          application_id: string
          email_id: string
          subject: string
          sender: string
          received_at: string
          content: string
          category: string | null
          metadata: Json | null
        }
        Insert: {
          id?: string
          user_id: string
          application_id: string
          email_id: string
          subject: string
          sender: string
          received_at: string
          content: string
          category?: string | null
          metadata?: Json | null
        }
        Update: {
          id?: string
          user_id?: string
          application_id?: string
          email_id?: string
          subject?: string
          sender?: string
          received_at?: string
          content?: string
          category?: string | null
          metadata?: Json | null
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
} 