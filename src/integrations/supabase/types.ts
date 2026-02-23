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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      activity_logs: {
        Row: {
          action: string
          created_at: string
          entity_id: string | null
          entity_type: string | null
          id: string
          metadata: Json | null
          user_id: string
        }
        Insert: {
          action: string
          created_at?: string
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          metadata?: Json | null
          user_id: string
        }
        Update: {
          action?: string
          created_at?: string
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          metadata?: Json | null
          user_id?: string
        }
        Relationships: []
      }
      agent_memory: {
        Row: {
          confidence: number | null
          created_at: string
          key: string
          memory_id: string
          memory_type: Database["public"]["Enums"]["memory_type"]
          updated_at: string
          user_id: string
          value: Json | null
          workspace_id: string | null
        }
        Insert: {
          confidence?: number | null
          created_at?: string
          key: string
          memory_id?: string
          memory_type: Database["public"]["Enums"]["memory_type"]
          updated_at?: string
          user_id: string
          value?: Json | null
          workspace_id?: string | null
        }
        Update: {
          confidence?: number | null
          created_at?: string
          key?: string
          memory_id?: string
          memory_type?: Database["public"]["Enums"]["memory_type"]
          updated_at?: string
          user_id?: string
          value?: Json | null
          workspace_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "agent_memory_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["workspace_id"]
          },
        ]
      }
      buyer_interactions: {
        Row: {
          buyer_id: string | null
          created_at: string
          interaction_id: string
          interaction_type: Database["public"]["Enums"]["interaction_type"]
          message_snippet: string | null
          next_follow_up_date: string | null
          opened: boolean | null
          replied: boolean | null
          sent_at: string | null
          subject: string | null
          user_id: string
          workspace_id: string | null
        }
        Insert: {
          buyer_id?: string | null
          created_at?: string
          interaction_id?: string
          interaction_type: Database["public"]["Enums"]["interaction_type"]
          message_snippet?: string | null
          next_follow_up_date?: string | null
          opened?: boolean | null
          replied?: boolean | null
          sent_at?: string | null
          subject?: string | null
          user_id: string
          workspace_id?: string | null
        }
        Update: {
          buyer_id?: string | null
          created_at?: string
          interaction_id?: string
          interaction_type?: Database["public"]["Enums"]["interaction_type"]
          message_snippet?: string | null
          next_follow_up_date?: string | null
          opened?: boolean | null
          replied?: boolean | null
          sent_at?: string | null
          subject?: string | null
          user_id?: string
          workspace_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "buyer_interactions_buyer_id_fkey"
            columns: ["buyer_id"]
            isOneToOne: false
            referencedRelation: "buyers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "buyer_interactions_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["workspace_id"]
          },
        ]
      }
      buyers: {
        Row: {
          buyer_type: string | null
          channel: string | null
          channel_focus: string | null
          company_name: string | null
          contact_email: string | null
          contact_name: string | null
          contact_phone: string | null
          country: string
          created_at: string
          id: string
          margin_expectation: number | null
          name: string
          next_follow_up_date: string | null
          notes: string | null
          preferred_language: string | null
          rating: number | null
          status_stage: string | null
          target_category: string | null
          target_price_range: Json | null
          updated_at: string
          user_id: string
          website: string | null
          workspace_id: string | null
        }
        Insert: {
          buyer_type?: string | null
          channel?: string | null
          channel_focus?: string | null
          company_name?: string | null
          contact_email?: string | null
          contact_name?: string | null
          contact_phone?: string | null
          country: string
          created_at?: string
          id?: string
          margin_expectation?: number | null
          name: string
          next_follow_up_date?: string | null
          notes?: string | null
          preferred_language?: string | null
          rating?: number | null
          status_stage?: string | null
          target_category?: string | null
          target_price_range?: Json | null
          updated_at?: string
          user_id: string
          website?: string | null
          workspace_id?: string | null
        }
        Update: {
          buyer_type?: string | null
          channel?: string | null
          channel_focus?: string | null
          company_name?: string | null
          contact_email?: string | null
          contact_name?: string | null
          contact_phone?: string | null
          country?: string
          created_at?: string
          id?: string
          margin_expectation?: number | null
          name?: string
          next_follow_up_date?: string | null
          notes?: string | null
          preferred_language?: string | null
          rating?: number | null
          status_stage?: string | null
          target_category?: string | null
          target_price_range?: Json | null
          updated_at?: string
          user_id?: string
          website?: string | null
          workspace_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "buyers_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["workspace_id"]
          },
        ]
      }
      companies: {
        Row: {
          address: string | null
          bank_account: string | null
          bank_name: string | null
          bank_swift: string | null
          banned_claim_phrases: Json | null
          certifications: Json | null
          company_name_kr: string | null
          contact_email: string | null
          contact_phone: string | null
          created_at: string
          default_incoterms: string | null
          default_lead_time: number | null
          default_moq: number | null
          default_payment_terms: string | null
          id: string
          logo_url: string | null
          main_category: string | null
          manufacturing_type: string | null
          name: string
          tone_style: Json | null
          updated_at: string
          user_id: string
          website: string | null
          workspace_id: string | null
        }
        Insert: {
          address?: string | null
          bank_account?: string | null
          bank_name?: string | null
          bank_swift?: string | null
          banned_claim_phrases?: Json | null
          certifications?: Json | null
          company_name_kr?: string | null
          contact_email?: string | null
          contact_phone?: string | null
          created_at?: string
          default_incoterms?: string | null
          default_lead_time?: number | null
          default_moq?: number | null
          default_payment_terms?: string | null
          id?: string
          logo_url?: string | null
          main_category?: string | null
          manufacturing_type?: string | null
          name: string
          tone_style?: Json | null
          updated_at?: string
          user_id: string
          website?: string | null
          workspace_id?: string | null
        }
        Update: {
          address?: string | null
          bank_account?: string | null
          bank_name?: string | null
          bank_swift?: string | null
          banned_claim_phrases?: Json | null
          certifications?: Json | null
          company_name_kr?: string | null
          contact_email?: string | null
          contact_phone?: string | null
          created_at?: string
          default_incoterms?: string | null
          default_lead_time?: number | null
          default_moq?: number | null
          default_payment_terms?: string | null
          id?: string
          logo_url?: string | null
          main_category?: string | null
          manufacturing_type?: string | null
          name?: string
          tone_style?: Json | null
          updated_at?: string
          user_id?: string
          website?: string | null
          workspace_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "companies_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["workspace_id"]
          },
        ]
      }
      compliance_rules: {
        Row: {
          banned_ingredients: Json
          country_code: string
          country_name: string
          created_at: string
          id: string
          key_regulation: string | null
          label_requirements: string
          notes: string | null
          regulatory_body: string | null
          restricted_ingredients: Json
          updated_at: string
        }
        Insert: {
          banned_ingredients?: Json
          country_code: string
          country_name: string
          created_at?: string
          id?: string
          key_regulation?: string | null
          label_requirements?: string
          notes?: string | null
          regulatory_body?: string | null
          restricted_ingredients?: Json
          updated_at?: string
        }
        Update: {
          banned_ingredients?: Json
          country_code?: string
          country_name?: string
          created_at?: string
          id?: string
          key_regulation?: string | null
          label_requirements?: string
          notes?: string | null
          regulatory_body?: string | null
          restricted_ingredients?: Json
          updated_at?: string
        }
        Relationships: []
      }
      compliance_runs: {
        Row: {
          created_at: string
          export_ready_score: number | null
          findings: Json | null
          next_actions: Json | null
          product_id: string | null
          rulepack_versions: Json | null
          run_id: string
          target_countries: Json | null
          traffic_light: string | null
          user_id: string
          workspace_id: string | null
        }
        Insert: {
          created_at?: string
          export_ready_score?: number | null
          findings?: Json | null
          next_actions?: Json | null
          product_id?: string | null
          rulepack_versions?: Json | null
          run_id?: string
          target_countries?: Json | null
          traffic_light?: string | null
          user_id: string
          workspace_id?: string | null
        }
        Update: {
          created_at?: string
          export_ready_score?: number | null
          findings?: Json | null
          next_actions?: Json | null
          product_id?: string | null
          rulepack_versions?: Json | null
          run_id?: string
          target_countries?: Json | null
          traffic_light?: string | null
          user_id?: string
          workspace_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "compliance_runs_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "compliance_runs_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["workspace_id"]
          },
        ]
      }
      deals: {
        Row: {
          buyer_id: string | null
          created_at: string
          currency: string | null
          doc_refs: Json | null
          id: string
          incoterms: string | null
          lead_time: number | null
          notes: string | null
          payment_terms: string | null
          product_id: string | null
          quantity: number | null
          stage: string | null
          status: string | null
          total_amount: number | null
          trade_stage_enum: Database["public"]["Enums"]["trade_stage"] | null
          unit_price: number | null
          updated_at: string
          user_id: string
          validity_days: number | null
          workspace_id: string | null
        }
        Insert: {
          buyer_id?: string | null
          created_at?: string
          currency?: string | null
          doc_refs?: Json | null
          id?: string
          incoterms?: string | null
          lead_time?: number | null
          notes?: string | null
          payment_terms?: string | null
          product_id?: string | null
          quantity?: number | null
          stage?: string | null
          status?: string | null
          total_amount?: number | null
          trade_stage_enum?: Database["public"]["Enums"]["trade_stage"] | null
          unit_price?: number | null
          updated_at?: string
          user_id: string
          validity_days?: number | null
          workspace_id?: string | null
        }
        Update: {
          buyer_id?: string | null
          created_at?: string
          currency?: string | null
          doc_refs?: Json | null
          id?: string
          incoterms?: string | null
          lead_time?: number | null
          notes?: string | null
          payment_terms?: string | null
          product_id?: string | null
          quantity?: number | null
          stage?: string | null
          status?: string | null
          total_amount?: number | null
          trade_stage_enum?: Database["public"]["Enums"]["trade_stage"] | null
          unit_price?: number | null
          updated_at?: string
          user_id?: string
          validity_days?: number | null
          workspace_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "deals_buyer_id_fkey"
            columns: ["buyer_id"]
            isOneToOne: false
            referencedRelation: "buyers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deals_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deals_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["workspace_id"]
          },
        ]
      }
      documents: {
        Row: {
          buyer_id: string | null
          content: string | null
          content_md: string | null
          created_at: string
          deal_id: string | null
          doc_format: string | null
          generated_by: string | null
          id: string
          metadata: Json | null
          product_id: string | null
          source_context: Json | null
          status: string | null
          title: string
          type: string
          updated_at: string
          user_id: string
          version: number | null
          workspace_id: string | null
        }
        Insert: {
          buyer_id?: string | null
          content?: string | null
          content_md?: string | null
          created_at?: string
          deal_id?: string | null
          doc_format?: string | null
          generated_by?: string | null
          id?: string
          metadata?: Json | null
          product_id?: string | null
          source_context?: Json | null
          status?: string | null
          title: string
          type: string
          updated_at?: string
          user_id: string
          version?: number | null
          workspace_id?: string | null
        }
        Update: {
          buyer_id?: string | null
          content?: string | null
          content_md?: string | null
          created_at?: string
          deal_id?: string | null
          doc_format?: string | null
          generated_by?: string | null
          id?: string
          metadata?: Json | null
          product_id?: string | null
          source_context?: Json | null
          status?: string | null
          title?: string
          type?: string
          updated_at?: string
          user_id?: string
          version?: number | null
          workspace_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "documents_buyer_id_fkey"
            columns: ["buyer_id"]
            isOneToOne: false
            referencedRelation: "buyers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documents_deal_id_fkey"
            columns: ["deal_id"]
            isOneToOne: false
            referencedRelation: "deals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documents_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documents_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["workspace_id"]
          },
        ]
      }
      edit_logs: {
        Row: {
          after_snapshot: string | null
          before_snapshot: string | null
          created_at: string
          document_id: string | null
          edit_id: string
          edit_type: string
          reason_tag: string | null
          user_id: string
        }
        Insert: {
          after_snapshot?: string | null
          before_snapshot?: string | null
          created_at?: string
          document_id?: string | null
          edit_id?: string
          edit_type: string
          reason_tag?: string | null
          user_id: string
        }
        Update: {
          after_snapshot?: string | null
          before_snapshot?: string | null
          created_at?: string
          document_id?: string | null
          edit_id?: string
          edit_type?: string
          reason_tag?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "edit_logs_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "documents"
            referencedColumns: ["id"]
          },
        ]
      }
      expert_connection_requests: {
        Row: {
          assigned_partner_id: string | null
          company_name: string | null
          created_at: string
          documents: Json | null
          expert_type: string
          id: string
          message: string | null
          project_name: string
          status: string
          target_countries: Json | null
          total_cbm: string | null
          total_weight: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          assigned_partner_id?: string | null
          company_name?: string | null
          created_at?: string
          documents?: Json | null
          expert_type?: string
          id?: string
          message?: string | null
          project_name: string
          status?: string
          target_countries?: Json | null
          total_cbm?: string | null
          total_weight?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          assigned_partner_id?: string | null
          company_name?: string | null
          created_at?: string
          documents?: Json | null
          expert_type?: string
          id?: string
          message?: string | null
          project_name?: string
          status?: string
          target_countries?: Json | null
          total_cbm?: string | null
          total_weight?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      expert_verification_requests: {
        Row: {
          completed_at: string | null
          created_at: string
          description: string | null
          document_ids: Json | null
          expert_id: string | null
          expert_notes: string | null
          id: string
          priority: string | null
          request_type: string
          requested_at: string
          responded_at: string | null
          status: string
          updated_at: string
          user_id: string
          user_notes: string | null
          workspace_id: string | null
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          description?: string | null
          document_ids?: Json | null
          expert_id?: string | null
          expert_notes?: string | null
          id?: string
          priority?: string | null
          request_type?: string
          requested_at?: string
          responded_at?: string | null
          status?: string
          updated_at?: string
          user_id: string
          user_notes?: string | null
          workspace_id?: string | null
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          description?: string | null
          document_ids?: Json | null
          expert_id?: string | null
          expert_notes?: string | null
          id?: string
          priority?: string | null
          request_type?: string
          requested_at?: string
          responded_at?: string | null
          status?: string
          updated_at?: string
          user_id?: string
          user_notes?: string | null
          workspace_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "expert_verification_requests_expert_id_fkey"
            columns: ["expert_id"]
            isOneToOne: false
            referencedRelation: "experts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "expert_verification_requests_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["workspace_id"]
          },
        ]
      }
      experts: {
        Row: {
          bio: string | null
          created_at: string
          email: string | null
          id: string
          is_active: boolean | null
          name: string
          organization: string
          phone: string | null
          profile_image_url: string | null
          rating: number | null
          response_time: string | null
          review_count: number | null
          specialty: Json | null
          title: string
          updated_at: string
          verified: boolean | null
        }
        Insert: {
          bio?: string | null
          created_at?: string
          email?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          organization: string
          phone?: string | null
          profile_image_url?: string | null
          rating?: number | null
          response_time?: string | null
          review_count?: number | null
          specialty?: Json | null
          title: string
          updated_at?: string
          verified?: boolean | null
        }
        Update: {
          bio?: string | null
          created_at?: string
          email?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          organization?: string
          phone?: string | null
          profile_image_url?: string | null
          rating?: number | null
          response_time?: string | null
          review_count?: number | null
          specialty?: Json | null
          title?: string
          updated_at?: string
          verified?: boolean | null
        }
        Relationships: []
      }
      knowledge_assets: {
        Row: {
          asset_id: string
          asset_type: string
          created_at: string
          extracted_text: string | null
          file_url: string | null
          tags: Json | null
          updated_at: string
          user_id: string
          vector_index_ref: string | null
          workspace_id: string | null
        }
        Insert: {
          asset_id?: string
          asset_type: string
          created_at?: string
          extracted_text?: string | null
          file_url?: string | null
          tags?: Json | null
          updated_at?: string
          user_id: string
          vector_index_ref?: string | null
          workspace_id?: string | null
        }
        Update: {
          asset_id?: string
          asset_type?: string
          created_at?: string
          extracted_text?: string | null
          file_url?: string | null
          tags?: Json | null
          updated_at?: string
          user_id?: string
          vector_index_ref?: string | null
          workspace_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "knowledge_assets_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["workspace_id"]
          },
        ]
      }
      notifications: {
        Row: {
          created_at: string
          id: string
          is_read: boolean
          message: string
          metadata: Json | null
          title: string
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_read?: boolean
          message: string
          metadata?: Json | null
          title: string
          type?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_read?: boolean
          message?: string
          metadata?: Json | null
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      onboarding_context: {
        Row: {
          buyer_type: Database["public"]["Enums"]["buyer_type"] | null
          context_id: string
          created_at: string
          currency: string | null
          language: string | null
          target_channel: Database["public"]["Enums"]["sales_channel"] | null
          target_countries: Json | null
          trade_stage: Database["public"]["Enums"]["trade_stage"] | null
          updated_at: string
          updated_by: string | null
          user_id: string
          workspace_id: string | null
        }
        Insert: {
          buyer_type?: Database["public"]["Enums"]["buyer_type"] | null
          context_id?: string
          created_at?: string
          currency?: string | null
          language?: string | null
          target_channel?: Database["public"]["Enums"]["sales_channel"] | null
          target_countries?: Json | null
          trade_stage?: Database["public"]["Enums"]["trade_stage"] | null
          updated_at?: string
          updated_by?: string | null
          user_id: string
          workspace_id?: string | null
        }
        Update: {
          buyer_type?: Database["public"]["Enums"]["buyer_type"] | null
          context_id?: string
          created_at?: string
          currency?: string | null
          language?: string | null
          target_channel?: Database["public"]["Enums"]["sales_channel"] | null
          target_countries?: Json | null
          trade_stage?: Database["public"]["Enums"]["trade_stage"] | null
          updated_at?: string
          updated_by?: string | null
          user_id?: string
          workspace_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "onboarding_context_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: true
            referencedRelation: "workspaces"
            referencedColumns: ["workspace_id"]
          },
        ]
      }
      partner_quotes: {
        Row: {
          comment: string | null
          created_at: string
          estimated_cost_krw: number | null
          estimated_cost_usd: number | null
          estimated_duration: string | null
          id: string
          partner_id: string
          request_id: string
          status: string
          updated_at: string
        }
        Insert: {
          comment?: string | null
          created_at?: string
          estimated_cost_krw?: number | null
          estimated_cost_usd?: number | null
          estimated_duration?: string | null
          id?: string
          partner_id: string
          request_id: string
          status?: string
          updated_at?: string
        }
        Update: {
          comment?: string | null
          created_at?: string
          estimated_cost_krw?: number | null
          estimated_cost_usd?: number | null
          estimated_duration?: string | null
          id?: string
          partner_id?: string
          request_id?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "partner_quotes_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "expert_connection_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      product_ingredients: {
        Row: {
          cleaned_ingredient_list: Json | null
          created_at: string
          inci_mapped_list: Json | null
          ingredient_id: string
          last_user_edit_at: string | null
          product_id: string | null
          raw_ocr_text: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          cleaned_ingredient_list?: Json | null
          created_at?: string
          inci_mapped_list?: Json | null
          ingredient_id?: string
          last_user_edit_at?: string | null
          product_id?: string | null
          raw_ocr_text?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          cleaned_ingredient_list?: Json | null
          created_at?: string
          inci_mapped_list?: Json | null
          ingredient_id?: string
          last_user_edit_at?: string | null
          product_id?: string | null
          raw_ocr_text?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_ingredients_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      product_labels: {
        Row: {
          created_at: string
          extracted_label_text: string | null
          label_draft_by_country: Json | null
          label_id: string
          label_image_url: string | null
          label_risk_flags: Json | null
          product_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          extracted_label_text?: string | null
          label_draft_by_country?: Json | null
          label_id?: string
          label_image_url?: string | null
          label_risk_flags?: Json | null
          product_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          extracted_label_text?: string | null
          label_draft_by_country?: Json | null
          label_id?: string
          label_image_url?: string | null
          label_risk_flags?: Json | null
          product_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_labels_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          category: string | null
          company_id: string | null
          created_at: string
          function_claims: Json | null
          hs_code_candidate: string | null
          id: string
          ingredients_confirmed: Json | null
          ingredients_raw: string | null
          label_images: string[] | null
          lead_time: number | null
          moq: number | null
          name: string
          packaging_type: string | null
          product_name_en: string | null
          product_name_kr: string | null
          size_ml_g: number | null
          sku_code: string | null
          status: string | null
          unit_price_range: Json | null
          updated_at: string
          user_id: string
          workspace_id: string | null
        }
        Insert: {
          category?: string | null
          company_id?: string | null
          created_at?: string
          function_claims?: Json | null
          hs_code_candidate?: string | null
          id?: string
          ingredients_confirmed?: Json | null
          ingredients_raw?: string | null
          label_images?: string[] | null
          lead_time?: number | null
          moq?: number | null
          name: string
          packaging_type?: string | null
          product_name_en?: string | null
          product_name_kr?: string | null
          size_ml_g?: number | null
          sku_code?: string | null
          status?: string | null
          unit_price_range?: Json | null
          updated_at?: string
          user_id: string
          workspace_id?: string | null
        }
        Update: {
          category?: string | null
          company_id?: string | null
          created_at?: string
          function_claims?: Json | null
          hs_code_candidate?: string | null
          id?: string
          ingredients_confirmed?: Json | null
          ingredients_raw?: string | null
          label_images?: string[] | null
          lead_time?: number | null
          moq?: number | null
          name?: string
          packaging_type?: string | null
          product_name_en?: string | null
          product_name_kr?: string | null
          size_ml_g?: number | null
          sku_code?: string | null
          status?: string | null
          unit_price_range?: Json | null
          updated_at?: string
          user_id?: string
          workspace_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "products_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "products_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["workspace_id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          company_info: Json | null
          created_at: string
          display_name: string | null
          id: string
          precision_score: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          company_info?: Json | null
          created_at?: string
          display_name?: string | null
          id?: string
          precision_score?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          company_info?: Json | null
          created_at?: string
          display_name?: string | null
          id?: string
          precision_score?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      rulepack_pending_updates: {
        Row: {
          admin_notes: string | null
          change_description: string
          country: string
          country_code: string
          created_at: string
          detected_at: string | null
          evidence_links: Json | null
          id: string
          ingredient: string
          regulation_after: string | null
          regulation_before: string | null
          severity: string
          source: string
          status: string
          updated_at: string
        }
        Insert: {
          admin_notes?: string | null
          change_description: string
          country: string
          country_code: string
          created_at?: string
          detected_at?: string | null
          evidence_links?: Json | null
          id?: string
          ingredient: string
          regulation_after?: string | null
          regulation_before?: string | null
          severity?: string
          source: string
          status?: string
          updated_at?: string
        }
        Update: {
          admin_notes?: string | null
          change_description?: string
          country?: string
          country_code?: string
          created_at?: string
          detected_at?: string | null
          evidence_links?: Json | null
          id?: string
          ingredient?: string
          regulation_after?: string | null
          regulation_before?: string | null
          severity?: string
          source?: string
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      rulepacks: {
        Row: {
          country: string
          coverage_notes: Json | null
          created_at: string
          evidence_links: Json | null
          payload_json: Json | null
          rulepack_id: string
          updated_at: string
          version: string
        }
        Insert: {
          country: string
          coverage_notes?: Json | null
          created_at?: string
          evidence_links?: Json | null
          payload_json?: Json | null
          rulepack_id?: string
          updated_at?: string
          version: string
        }
        Update: {
          country?: string
          coverage_notes?: Json | null
          created_at?: string
          evidence_links?: Json | null
          payload_json?: Json | null
          rulepack_id?: string
          updated_at?: string
          version?: string
        }
        Relationships: []
      }
      sales_inquiries: {
        Row: {
          admin_notes: string | null
          brand_link: string | null
          company_name: string
          contact_info: string
          contact_name: string
          created_at: string
          id: string
          status: string
          target_countries: string | null
          updated_at: string
        }
        Insert: {
          admin_notes?: string | null
          brand_link?: string | null
          company_name: string
          contact_info: string
          contact_name: string
          created_at?: string
          id?: string
          status?: string
          target_countries?: string | null
          updated_at?: string
        }
        Update: {
          admin_notes?: string | null
          brand_link?: string | null
          company_name?: string
          contact_info?: string
          contact_name?: string
          created_at?: string
          id?: string
          status?: string
          target_countries?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      share_links: {
        Row: {
          buyer_package_ids: string[] | null
          created_at: string
          deal_id: string | null
          expires_at: string | null
          id: string
          is_active: boolean | null
          token: string
          user_id: string
          view_count: number | null
        }
        Insert: {
          buyer_package_ids?: string[] | null
          created_at?: string
          deal_id?: string | null
          expires_at?: string | null
          id?: string
          is_active?: boolean | null
          token: string
          user_id: string
          view_count?: number | null
        }
        Update: {
          buyer_package_ids?: string[] | null
          created_at?: string
          deal_id?: string | null
          expires_at?: string | null
          id?: string
          is_active?: boolean | null
          token?: string
          user_id?: string
          view_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "share_links_deal_id_fkey"
            columns: ["deal_id"]
            isOneToOne: false
            referencedRelation: "deals"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      workspaces: {
        Row: {
          created_at: string
          owner_user_id: string
          updated_at: string
          workspace_id: string
          workspace_name: string
        }
        Insert: {
          created_at?: string
          owner_user_id: string
          updated_at?: string
          workspace_id?: string
          workspace_name: string
        }
        Update: {
          created_at?: string
          owner_user_id?: string
          updated_at?: string
          workspace_id?: string
          workspace_name?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "user" | "partner"
      buyer_type: "importer" | "distributor" | "retailer" | "market_seller"
      deal_status_stage:
        | "lead"
        | "contacted"
        | "replied"
        | "sample"
        | "negotiation"
        | "won"
        | "lost"
      doc_status: "draft" | "edited" | "final" | "sent"
      doc_type:
        | "onepager"
        | "catalog"
        | "compliance_snapshot"
        | "deal_sheet"
        | "pi"
        | "contract"
        | "email_pack"
        | "expert_request"
      interaction_type: "email" | "call" | "meeting" | "chat"
      memory_type: "preference" | "template_param" | "risk_policy" | "tone_rule"
      sales_channel:
        | "wholesale"
        | "offline_retail"
        | "online_marketplace"
        | "d2c"
      trade_stage: "first_proposal" | "sample" | "main_order" | "reorder"
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
      app_role: ["admin", "user", "partner"],
      buyer_type: ["importer", "distributor", "retailer", "market_seller"],
      deal_status_stage: [
        "lead",
        "contacted",
        "replied",
        "sample",
        "negotiation",
        "won",
        "lost",
      ],
      doc_status: ["draft", "edited", "final", "sent"],
      doc_type: [
        "onepager",
        "catalog",
        "compliance_snapshot",
        "deal_sheet",
        "pi",
        "contract",
        "email_pack",
        "expert_request",
      ],
      interaction_type: ["email", "call", "meeting", "chat"],
      memory_type: ["preference", "template_param", "risk_policy", "tone_rule"],
      sales_channel: [
        "wholesale",
        "offline_retail",
        "online_marketplace",
        "d2c",
      ],
      trade_stage: ["first_proposal", "sample", "main_order", "reorder"],
    },
  },
} as const
