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
      child_profiles: {
        Row: {
          avatar_key: string | null
          created_at: string
          family_id: string
          id: string
          name: string
          updated_at: string
        }
        Insert: {
          avatar_key?: string | null
          created_at?: string
          family_id: string
          id?: string
          name: string
          updated_at?: string
        }
        Update: {
          avatar_key?: string | null
          created_at?: string
          family_id?: string
          id?: string
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      child_devices: {
        Row: {
          child_profile_id: string
          created_at: string
          family_id: string
          id: string
          last_seen_at: string | null
          revoked_at: string | null
          token_hash: string
        }
        Insert: {
          child_profile_id: string
          created_at?: string
          family_id: string
          id?: string
          last_seen_at?: string | null
          revoked_at?: string | null
          token_hash: string
        }
        Update: {
          child_profile_id?: string
          created_at?: string
          family_id?: string
          id?: string
          last_seen_at?: string | null
          revoked_at?: string | null
          token_hash?: string
        }
        Relationships: []
      }
      child_mutation_receipts: {
        Row: {
          action: string
          created_at: string
          device_id: string
          mutation_id: string
          request: Json
          response: Json
        }
        Insert: {
          action: string
          created_at?: string
          device_id: string
          mutation_id: string
          request: Json
          response: Json
        }
        Update: {
          action?: string
          created_at?: string
          device_id?: string
          mutation_id?: string
          request?: Json
          response?: Json
        }
        Relationships: []
      }
      families: {
        Row: {
          created_at: string
          default_templates_seeded: boolean
          id: string
          name: string
          owner_user_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          default_templates_seeded?: boolean
          id?: string
          name?: string
          owner_user_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          default_templates_seeded?: boolean
          id?: string
          name?: string
          owner_user_id?: string
          updated_at?: string
        }
        Relationships: []
      }
      mission_items: {
        Row: {
          category_name: string
          category_position: number
          child_profile_id: string
          family_id: string
          help_request: string | null
          help_response: string | null
          id: string
          is_required: boolean
          label: string
          mission_id: string
          position: number
          quantity: number
          status: 'pending' | 'packed' | 'not_found' | 'missing'
          updated_at: string
          version: number
        }
        Insert: {
          category_name: string
          category_position: number
          child_profile_id: string
          family_id: string
          help_request?: string | null
          help_response?: string | null
          id?: string
          is_required: boolean
          label: string
          mission_id: string
          position: number
          quantity: number
          status?: 'pending' | 'packed' | 'not_found' | 'missing'
          updated_at?: string
          version?: number
        }
        Update: {
          category_name?: string
          category_position?: number
          child_profile_id?: string
          family_id?: string
          help_request?: string | null
          help_response?: string | null
          id?: string
          is_required?: boolean
          label?: string
          mission_id?: string
          position?: number
          quantity?: number
          status?: 'pending' | 'packed' | 'not_found' | 'missing'
          updated_at?: string
          version?: number
        }
        Relationships: []
      }
      missions: {
        Row: {
          cancelled_at: string | null
          child_profile_id: string
          completed_at: string | null
          created_at: string
          family_id: string
          id: string
          period: string
          sent_at: string | null
          source_template_id: string | null
          started_at: string | null
          status: 'draft' | 'sent' | 'started' | 'completed' | 'cancelled'
          template_name: string
          title: string
          updated_at: string
        }
        Insert: {
          cancelled_at?: string | null
          child_profile_id: string
          completed_at?: string | null
          created_at?: string
          family_id: string
          id?: string
          period: string
          sent_at?: string | null
          source_template_id?: string | null
          started_at?: string | null
          status?: 'draft' | 'sent' | 'started' | 'completed' | 'cancelled'
          template_name: string
          title: string
          updated_at?: string
        }
        Update: {
          cancelled_at?: string | null
          child_profile_id?: string
          completed_at?: string | null
          created_at?: string
          family_id?: string
          id?: string
          period?: string
          sent_at?: string | null
          source_template_id?: string | null
          started_at?: string | null
          status?: 'draft' | 'sent' | 'started' | 'completed' | 'cancelled'
          template_name?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      pairing_tokens: {
        Row: {
          child_profile_id: string
          consumed_at: string | null
          created_at: string
          expires_at: string
          family_id: string
          id: string
          token_hash: string
        }
        Insert: {
          child_profile_id: string
          consumed_at?: string | null
          created_at?: string
          expires_at: string
          family_id: string
          id?: string
          token_hash: string
        }
        Update: {
          child_profile_id?: string
          consumed_at?: string | null
          created_at?: string
          expires_at?: string
          family_id?: string
          id?: string
          token_hash?: string
        }
        Relationships: []
      }
      template_categories: {
        Row: {
          created_at: string
          family_id: string
          id: string
          name: string
          position: number
          starter_key: string | null
          template_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          family_id: string
          id?: string
          name: string
          position?: number
          starter_key?: string | null
          template_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          family_id?: string
          id?: string
          name?: string
          position?: number
          starter_key?: string | null
          template_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "template_categories_family_id_fkey"
            columns: ["family_id"]
            isOneToOne: false
            referencedRelation: "families"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "template_categories_template_id_family_id_fkey"
            columns: ["template_id", "family_id"]
            isOneToOne: false
            referencedRelation: "templates"
            referencedColumns: ["id", "family_id"]
          },
        ]
      }
      template_items: {
        Row: {
          category_id: string
          created_at: string
          family_id: string
          id: string
          is_required: boolean
          label: string
          position: number
          quantity: number
          starter_key: string | null
          template_id: string
          updated_at: string
        }
        Insert: {
          category_id: string
          created_at?: string
          family_id: string
          id?: string
          is_required?: boolean
          label: string
          position?: number
          quantity?: number
          starter_key?: string | null
          template_id: string
          updated_at?: string
        }
        Update: {
          category_id?: string
          created_at?: string
          family_id?: string
          id?: string
          is_required?: boolean
          label?: string
          position?: number
          quantity?: number
          starter_key?: string | null
          template_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "template_items_category_id_template_id_family_id_fkey"
            columns: ["category_id", "template_id", "family_id"]
            isOneToOne: false
            referencedRelation: "template_categories"
            referencedColumns: ["id", "template_id", "family_id"]
          },
          {
            foreignKeyName: "template_items_family_id_fkey"
            columns: ["family_id"]
            isOneToOne: false
            referencedRelation: "families"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "template_items_template_id_family_id_fkey"
            columns: ["template_id", "family_id"]
            isOneToOne: false
            referencedRelation: "templates"
            referencedColumns: ["id", "family_id"]
          },
        ]
      }
      templates: {
        Row: {
          created_at: string
          description: string
          family_id: string
          id: string
          name: string
          period: string
          position: number
          starter_key: string | null
          updated_at: string
          version: number
        }
        Insert: {
          created_at?: string
          description?: string
          family_id: string
          id?: string
          name: string
          period?: string
          position?: number
          starter_key?: string | null
          updated_at?: string
          version?: number
        }
        Update: {
          created_at?: string
          description?: string
          family_id?: string
          id?: string
          name?: string
          period?: string
          position?: number
          starter_key?: string | null
          updated_at?: string
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "templates_family_id_fkey"
            columns: ["family_id"]
            isOneToOne: false
            referencedRelation: "families"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      mark_family_templates_seeded: {
        Args: { p_family_id: string }
        Returns: undefined
      }
      packquest_child_mutation: {
        Args: {
          p_action: string
          p_device_hash: string
          p_expected_version?: number | null
          p_item_id?: string | null
          p_message?: string | null
          p_mission_id?: string | null
          p_mutation_id: string
          p_status?: string | null
        }
        Returns: Json
      }
      packquest_child_snapshot: {
        Args: { p_device_hash: string }
        Returns: Json
      }
      packquest_create_mission: {
        Args: {
          p_child_id: string
          p_owner_id: string
          p_period?: string | null
          p_template_id: string
          p_title?: string | null
        }
        Returns: Json
      }
      packquest_create_pairing: {
        Args: { p_child_id: string; p_owner_id: string; p_token_hash: string }
        Returns: string
      }
      packquest_parent_mutation: {
        Args: {
          p_action: string
          p_device_id?: string | null
          p_item_id?: string | null
          p_mission_id?: string | null
          p_owner_id: string
          p_response?: string | null
        }
        Returns: Json
      }
      packquest_redeem_pairing: {
        Args: { p_device_hash: string; p_token_hash: string }
        Returns: Json
      }
      save_template_content: {
        Args: {
          p_description: string
          p_expected_version: number
          p_items: Json
          p_name: string
          p_template_id: string
        }
        Returns: number
      }
    }
    Enums: {
      [_ in never]: never
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
