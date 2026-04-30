export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      assignment_rules: {
        Row: {
          created_at: string | null
          fixed_agent_id: string | null
          id: string
          instance_id: string | null
          is_active: boolean | null
          name: string
          round_robin_agents: string[] | null
          round_robin_last_index: number | null
          rule_type: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          fixed_agent_id?: string | null
          id?: string
          instance_id?: string | null
          is_active?: boolean | null
          name: string
          round_robin_agents?: string[] | null
          round_robin_last_index?: number | null
          rule_type: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          fixed_agent_id?: string | null
          id?: string
          instance_id?: string | null
          is_active?: boolean | null
          name?: string
          round_robin_agents?: string[] | null
          round_robin_last_index?: number | null
          rule_type?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "assignment_rules_fixed_agent_id_fkey"
            columns: ["fixed_agent_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assignment_rules_instance_id_fkey"
            columns: ["instance_id"]
            isOneToOne: false
            referencedRelation: "whatsapp_instances"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_logs: {
        Row: {
          action: string
          created_at: string
          id: string
          metadata: Json | null
          organization_id: string | null
          resource_id: string | null
          resource_type: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string
          id?: string
          metadata?: Json | null
          organization_id?: string | null
          resource_id?: string | null
          resource_type?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string
          id?: string
          metadata?: Json | null
          organization_id?: string | null
          resource_id?: string | null
          resource_type?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "audit_logs_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      billing_events: {
        Row: {
          amount: number | null
          asaas_payment_id: string | null
          created_at: string
          event_type: string
          id: string
          organization_id: string | null
          payload: Json | null
          status: string | null
        }
        Insert: {
          amount?: number | null
          asaas_payment_id?: string | null
          created_at?: string
          event_type: string
          id?: string
          organization_id?: string | null
          payload?: Json | null
          status?: string | null
        }
        Update: {
          amount?: number | null
          asaas_payment_id?: string | null
          created_at?: string
          event_type?: string
          id?: string
          organization_id?: string | null
          payload?: Json | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "billing_events_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      conversation_assignments: {
        Row: {
          assigned_by: string | null
          assigned_from: string | null
          assigned_to: string
          conversation_id: string
          created_at: string | null
          id: string
          reason: string | null
        }
        Insert: {
          assigned_by?: string | null
          assigned_from?: string | null
          assigned_to: string
          conversation_id: string
          created_at?: string | null
          id?: string
          reason?: string | null
        }
        Update: {
          assigned_by?: string | null
          assigned_from?: string | null
          assigned_to?: string
          conversation_id?: string
          created_at?: string | null
          id?: string
          reason?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "conversation_assignments_assigned_by_fkey"
            columns: ["assigned_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversation_assignments_assigned_from_fkey"
            columns: ["assigned_from"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversation_assignments_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversation_assignments_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "whatsapp_conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      organization_members: {
        Row: {
          created_at: string
          id: string
          organization_id: string
          role: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          organization_id: string
          role?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          organization_id?: string
          role?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "organization_members_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      organizations: {
        Row: {
          created_at: string
          id: string
          name: string
          plan: string
          slug: string
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          plan?: string
          slug: string
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          plan?: string
          slug?: string
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      plan_quotas: {
        Row: {
          created_at: string
          max_conversations_per_month: number
          max_instances: number
          max_members: number
          plan: string
          price_brl: number
        }
        Insert: {
          created_at?: string
          max_conversations_per_month?: number
          max_instances?: number
          max_members?: number
          plan: string
          price_brl?: number
        }
        Update: {
          created_at?: string
          max_conversations_per_month?: number
          max_instances?: number
          max_members?: number
          plan?: string
          price_brl?: number
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string | null
          email: string | null
          full_name: string
          id: string
          is_active: boolean
          is_approved: boolean | null
          organization_id: string | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string | null
          email?: string | null
          full_name: string
          id: string
          is_active?: boolean
          is_approved?: boolean | null
          organization_id?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string | null
          email?: string | null
          full_name?: string
          id?: string
          is_active?: boolean
          is_approved?: boolean | null
          organization_id?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      project_config: {
        Row: {
          created_at: string | null
          id: string
          key: string
          updated_at: string | null
          value: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          key: string
          updated_at?: string | null
          value: string
        }
        Update: {
          created_at?: string | null
          id?: string
          key?: string
          updated_at?: string | null
          value?: string
        }
        Relationships: []
      }
      quota_alerts: {
        Row: {
          created_at: string
          id: string
          metric: string
          organization_id: string
          period_month: number
          period_year: number
          threshold_pct: number
        }
        Insert: {
          created_at?: string
          id?: string
          metric: string
          organization_id: string
          period_month: number
          period_year: number
          threshold_pct: number
        }
        Update: {
          created_at?: string
          id?: string
          metric?: string
          organization_id?: string
          period_month?: number
          period_year?: number
          threshold_pct?: number
        }
        Relationships: [
          {
            foreignKeyName: "quota_alerts_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      subscriptions: {
        Row: {
          amount: number | null
          asaas_customer_id: string | null
          asaas_subscription_id: string | null
          created_at: string
          current_period_end: string | null
          current_period_start: string | null
          id: string
          next_due_date: string | null
          organization_id: string
          plan: string
          status: string
          trial_ends_at: string | null
          updated_at: string
        }
        Insert: {
          amount?: number | null
          asaas_customer_id?: string | null
          asaas_subscription_id?: string | null
          created_at?: string
          current_period_end?: string | null
          current_period_start?: string | null
          id?: string
          next_due_date?: string | null
          organization_id: string
          plan?: string
          status?: string
          trial_ends_at?: string | null
          updated_at?: string
        }
        Update: {
          amount?: number | null
          asaas_customer_id?: string | null
          asaas_subscription_id?: string | null
          created_at?: string
          current_period_end?: string | null
          current_period_start?: string | null
          id?: string
          next_due_date?: string | null
          organization_id?: string
          plan?: string
          status?: string
          trial_ends_at?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "subscriptions_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: true
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      system_settings: {
        Row: {
          created_at: string
          id: string
          registration_enabled: boolean
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          registration_enabled?: boolean
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          registration_enabled?: boolean
          updated_at?: string
        }
        Relationships: []
      }
      usage_metrics: {
        Row: {
          ai_calls_count: number
          conversations_count: number
          created_at: string
          id: string
          messages_count: number
          organization_id: string
          period_month: number
          period_year: number
          updated_at: string
        }
        Insert: {
          ai_calls_count?: number
          conversations_count?: number
          created_at?: string
          id?: string
          messages_count?: number
          organization_id: string
          period_month: number
          period_year: number
          updated_at?: string
        }
        Update: {
          ai_calls_count?: number
          conversations_count?: number
          created_at?: string
          id?: string
          messages_count?: number
          organization_id?: string
          period_month?: number
          period_year?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "usage_metrics_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      whatsapp_contacts: {
        Row: {
          created_at: string
          id: string
          instance_id: string
          is_group: boolean | null
          metadata: Json | null
          name: string
          notes: string | null
          phone_number: string
          profile_picture_url: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          instance_id: string
          is_group?: boolean | null
          metadata?: Json | null
          name: string
          notes?: string | null
          phone_number: string
          profile_picture_url?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          instance_id?: string
          is_group?: boolean | null
          metadata?: Json | null
          name?: string
          notes?: string | null
          phone_number?: string
          profile_picture_url?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "whatsapp_contacts_instance_id_fkey"
            columns: ["instance_id"]
            isOneToOne: false
            referencedRelation: "whatsapp_instances"
            referencedColumns: ["id"]
          },
        ]
      }
      whatsapp_conversation_notes: {
        Row: {
          content: string
          conversation_id: string
          created_at: string | null
          id: string
          is_pinned: boolean | null
          updated_at: string | null
        }
        Insert: {
          content: string
          conversation_id: string
          created_at?: string | null
          id?: string
          is_pinned?: boolean | null
          updated_at?: string | null
        }
        Update: {
          content?: string
          conversation_id?: string
          created_at?: string | null
          id?: string
          is_pinned?: boolean | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "whatsapp_conversation_notes_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "whatsapp_conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      whatsapp_conversation_summaries: {
        Row: {
          action_items: Json | null
          conversation_id: string
          created_at: string | null
          id: string
          key_points: Json | null
          messages_count: number | null
          period_end: string | null
          period_start: string | null
          sentiment_at_time: string | null
          summary: string
        }
        Insert: {
          action_items?: Json | null
          conversation_id: string
          created_at?: string | null
          id?: string
          key_points?: Json | null
          messages_count?: number | null
          period_end?: string | null
          period_start?: string | null
          sentiment_at_time?: string | null
          summary: string
        }
        Update: {
          action_items?: Json | null
          conversation_id?: string
          created_at?: string | null
          id?: string
          key_points?: Json | null
          messages_count?: number | null
          period_end?: string | null
          period_start?: string | null
          sentiment_at_time?: string | null
          summary?: string
        }
        Relationships: [
          {
            foreignKeyName: "whatsapp_conversation_summaries_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "whatsapp_conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      whatsapp_conversations: {
        Row: {
          assigned_to: string | null
          contact_id: string
          created_at: string
          id: string
          instance_id: string
          last_message_at: string | null
          last_message_preview: string | null
          metadata: Json | null
          status: string | null
          unread_count: number | null
          updated_at: string
        }
        Insert: {
          assigned_to?: string | null
          contact_id: string
          created_at?: string
          id?: string
          instance_id: string
          last_message_at?: string | null
          last_message_preview?: string | null
          metadata?: Json | null
          status?: string | null
          unread_count?: number | null
          updated_at?: string
        }
        Update: {
          assigned_to?: string | null
          contact_id?: string
          created_at?: string
          id?: string
          instance_id?: string
          last_message_at?: string | null
          last_message_preview?: string | null
          metadata?: Json | null
          status?: string | null
          unread_count?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "whatsapp_conversations_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "whatsapp_conversations_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "whatsapp_contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "whatsapp_conversations_instance_id_fkey"
            columns: ["instance_id"]
            isOneToOne: false
            referencedRelation: "whatsapp_instances"
            referencedColumns: ["id"]
          },
        ]
      }
      whatsapp_instance_secrets: {
        Row: {
          api_key: string
          api_url: string
          created_at: string | null
          id: string
          instance_id: string
          updated_at: string | null
        }
        Insert: {
          api_key: string
          api_url: string
          created_at?: string | null
          id?: string
          instance_id: string
          updated_at?: string | null
        }
        Update: {
          api_key?: string
          api_url?: string
          created_at?: string | null
          id?: string
          instance_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "whatsapp_instance_secrets_instance_id_fkey"
            columns: ["instance_id"]
            isOneToOne: true
            referencedRelation: "whatsapp_instances"
            referencedColumns: ["id"]
          },
        ]
      }
      whatsapp_instances: {
        Row: {
          created_at: string
          id: string
          instance_id_external: string | null
          instance_name: string
          metadata: Json | null
          name: string
          organization_id: string | null
          provider_type: string
          qr_code: string | null
          status: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          instance_id_external?: string | null
          instance_name: string
          metadata?: Json | null
          name: string
          organization_id?: string | null
          provider_type?: string
          qr_code?: string | null
          status?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          instance_id_external?: string | null
          instance_name?: string
          metadata?: Json | null
          name?: string
          organization_id?: string | null
          provider_type?: string
          qr_code?: string | null
          status?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "whatsapp_instances_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      whatsapp_macros: {
        Row: {
          category: string | null
          content: string
          created_at: string | null
          description: string | null
          id: string
          instance_id: string | null
          is_active: boolean | null
          name: string
          shortcut: string
          updated_at: string | null
          usage_count: number | null
        }
        Insert: {
          category?: string | null
          content: string
          created_at?: string | null
          description?: string | null
          id?: string
          instance_id?: string | null
          is_active?: boolean | null
          name: string
          shortcut: string
          updated_at?: string | null
          usage_count?: number | null
        }
        Update: {
          category?: string | null
          content?: string
          created_at?: string | null
          description?: string | null
          id?: string
          instance_id?: string | null
          is_active?: boolean | null
          name?: string
          shortcut?: string
          updated_at?: string | null
          usage_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "whatsapp_macros_instance_id_fkey"
            columns: ["instance_id"]
            isOneToOne: false
            referencedRelation: "whatsapp_instances"
            referencedColumns: ["id"]
          },
        ]
      }
      whatsapp_message_edit_history: {
        Row: {
          conversation_id: string
          created_at: string
          edited_at: string
          id: string
          message_id: string
          previous_content: string
        }
        Insert: {
          conversation_id: string
          created_at?: string
          edited_at?: string
          id?: string
          message_id: string
          previous_content: string
        }
        Update: {
          conversation_id?: string
          created_at?: string
          edited_at?: string
          id?: string
          message_id?: string
          previous_content?: string
        }
        Relationships: [
          {
            foreignKeyName: "whatsapp_message_edit_history_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "whatsapp_conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      whatsapp_messages: {
        Row: {
          audio_transcription: string | null
          content: string
          conversation_id: string
          created_at: string
          edited_at: string | null
          id: string
          is_from_me: boolean | null
          media_mimetype: string | null
          media_url: string | null
          message_id: string
          message_type: string | null
          metadata: Json | null
          original_content: string | null
          quoted_message_id: string | null
          remote_jid: string
          status: string | null
          timestamp: string
          transcription_status: string | null
        }
        Insert: {
          audio_transcription?: string | null
          content: string
          conversation_id: string
          created_at?: string
          edited_at?: string | null
          id?: string
          is_from_me?: boolean | null
          media_mimetype?: string | null
          media_url?: string | null
          message_id: string
          message_type?: string | null
          metadata?: Json | null
          original_content?: string | null
          quoted_message_id?: string | null
          remote_jid: string
          status?: string | null
          timestamp: string
          transcription_status?: string | null
        }
        Update: {
          audio_transcription?: string | null
          content?: string
          conversation_id?: string
          created_at?: string
          edited_at?: string | null
          id?: string
          is_from_me?: boolean | null
          media_mimetype?: string | null
          media_url?: string | null
          message_id?: string
          message_type?: string | null
          metadata?: Json | null
          original_content?: string | null
          quoted_message_id?: string | null
          remote_jid?: string
          status?: string | null
          timestamp?: string
          transcription_status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "whatsapp_messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "whatsapp_conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      whatsapp_reactions: {
        Row: {
          conversation_id: string
          created_at: string | null
          emoji: string
          id: string
          is_from_me: boolean | null
          message_id: string
          reactor_jid: string
        }
        Insert: {
          conversation_id: string
          created_at?: string | null
          emoji: string
          id?: string
          is_from_me?: boolean | null
          message_id: string
          reactor_jid: string
        }
        Update: {
          conversation_id?: string
          created_at?: string | null
          emoji?: string
          id?: string
          is_from_me?: boolean | null
          message_id?: string
          reactor_jid?: string
        }
        Relationships: [
          {
            foreignKeyName: "whatsapp_reactions_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "whatsapp_conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      whatsapp_sentiment_analysis: {
        Row: {
          confidence_score: number | null
          contact_id: string
          conversation_id: string
          created_at: string
          id: string
          messages_analyzed: number | null
          metadata: Json | null
          reasoning: string | null
          sentiment: Database["public"]["Enums"]["sentiment_type"]
          summary: string | null
        }
        Insert: {
          confidence_score?: number | null
          contact_id: string
          conversation_id: string
          created_at?: string
          id?: string
          messages_analyzed?: number | null
          metadata?: Json | null
          reasoning?: string | null
          sentiment?: Database["public"]["Enums"]["sentiment_type"]
          summary?: string | null
        }
        Update: {
          confidence_score?: number | null
          contact_id?: string
          conversation_id?: string
          created_at?: string
          id?: string
          messages_analyzed?: number | null
          metadata?: Json | null
          reasoning?: string | null
          sentiment?: Database["public"]["Enums"]["sentiment_type"]
          summary?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "whatsapp_sentiment_analysis_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "whatsapp_contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "whatsapp_sentiment_analysis_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: true
            referencedRelation: "whatsapp_conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      whatsapp_sentiment_history: {
        Row: {
          confidence_score: number | null
          contact_id: string
          conversation_id: string
          created_at: string
          id: string
          messages_analyzed: number | null
          sentiment: Database["public"]["Enums"]["sentiment_type"]
          summary: string | null
        }
        Insert: {
          confidence_score?: number | null
          contact_id: string
          conversation_id: string
          created_at?: string
          id?: string
          messages_analyzed?: number | null
          sentiment: Database["public"]["Enums"]["sentiment_type"]
          summary?: string | null
        }
        Update: {
          confidence_score?: number | null
          contact_id?: string
          conversation_id?: string
          created_at?: string
          id?: string
          messages_analyzed?: number | null
          sentiment?: Database["public"]["Enums"]["sentiment_type"]
          summary?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "whatsapp_sentiment_history_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "whatsapp_contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "whatsapp_sentiment_history_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "whatsapp_conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      whatsapp_topics_history: {
        Row: {
          ai_confidence: number | null
          ai_reasoning: string | null
          categorization_model: string | null
          contact_id: string
          conversation_id: string
          created_at: string
          id: string
          primary_topic: string | null
          topics: string[]
        }
        Insert: {
          ai_confidence?: number | null
          ai_reasoning?: string | null
          categorization_model?: string | null
          contact_id: string
          conversation_id: string
          created_at?: string
          id?: string
          primary_topic?: string | null
          topics: string[]
        }
        Update: {
          ai_confidence?: number | null
          ai_reasoning?: string | null
          categorization_model?: string | null
          contact_id?: string
          conversation_id?: string
          created_at?: string
          id?: string
          primary_topic?: string | null
          topics?: string[]
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      can_access_conversation: {
        Args: { _conversation_id: string; _user_id: string }
        Returns: boolean
      }
      get_orgs_near_quota: {
        Args: { p_month: number; p_year: number }
        Returns: {
          current_value: number
          metric: string
          organization_id: string
          plan: string
          quota_limit: number
          threshold_pct: number
        }[]
      }
      get_user_organization_id: { Args: { _user_id: string }; Returns: string }
      has_org_role: {
        Args: { _org_id: string; _roles: string[]; _user_id: string }
        Returns: boolean
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      increment_usage_metric: {
        Args: {
          p_increment?: number
          p_metric: string
          p_organization_id: string
        }
        Returns: undefined
      }
      is_first_user: { Args: never; Returns: boolean }
      is_org_member: {
        Args: { _org_id: string; _user_id: string }
        Returns: boolean
      }
      write_audit_log: {
        Args: {
          p_action: string
          p_metadata?: Json
          p_organization_id: string
          p_resource_id?: string
          p_resource_type?: string
          p_user_id: string
        }
        Returns: string
      }
    }
    Enums: {
      app_role: "admin" | "supervisor" | "agent"
      sentiment_type: "positive" | "neutral" | "negative"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "supervisor", "agent"],
      sentiment_type: ["positive", "neutral", "negative"],
    },
  },
} as const
