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
      audit_logs: {
        Row: {
          action: string
          created_at: string
          id: string
          ip_address: string | null
          new_value: Json | null
          old_value: Json | null
          target_id: string | null
          target_type: string
          user_agent: string | null
          user_id: string
        }
        Insert: {
          action: string
          created_at?: string
          id?: string
          ip_address?: string | null
          new_value?: Json | null
          old_value?: Json | null
          target_id?: string | null
          target_type: string
          user_agent?: string | null
          user_id: string
        }
        Update: {
          action?: string
          created_at?: string
          id?: string
          ip_address?: string | null
          new_value?: Json | null
          old_value?: Json | null
          target_id?: string | null
          target_type?: string
          user_agent?: string | null
          user_id?: string
        }
        Relationships: []
      }
      dim_calendario: {
        Row: {
          ano: number
          data_pk: string
          is_business_day: boolean
          mes: number
        }
        Insert: {
          ano: number
          data_pk: string
          is_business_day?: boolean
          mes: number
        }
        Update: {
          ano?: number
          data_pk?: string
          is_business_day?: boolean
          mes?: number
        }
        Relationships: []
      }
      fact_clima: {
        Row: {
          chuva_mm: number | null
          data_fk: string
          id: string
          localizacao: string | null
          temp_max: number | null
        }
        Insert: {
          chuva_mm?: number | null
          data_fk: string
          id?: string
          localizacao?: string | null
          temp_max?: number | null
        }
        Update: {
          chuva_mm?: number | null
          data_fk?: string
          id?: string
          localizacao?: string | null
          temp_max?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "fact_clima_data_fk_fkey"
            columns: ["data_fk"]
            isOneToOne: false
            referencedRelation: "dim_calendario"
            referencedColumns: ["data_pk"]
          },
        ]
      }
      fact_mercado: {
        Row: {
          data_fk: string
          id: string
          valor_boi_gordo: number | null
          valor_dolar: number | null
          valor_jbs: number | null
        }
        Insert: {
          data_fk: string
          id?: string
          valor_boi_gordo?: number | null
          valor_dolar?: number | null
          valor_jbs?: number | null
        }
        Update: {
          data_fk?: string
          id?: string
          valor_boi_gordo?: number | null
          valor_dolar?: number | null
          valor_jbs?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "fact_mercado_data_fk_fkey"
            columns: ["data_fk"]
            isOneToOne: false
            referencedRelation: "dim_calendario"
            referencedColumns: ["data_pk"]
          },
        ]
      }
      notifications: {
        Row: {
          id: number
          user_id: string | null
          title: string
          body: string
          created_at: string
        }
        Insert: {
          id?: number
          user_id?: string | null
          title: string
          body: string
          created_at?: string
        }
        Update: {
          id?: number
          user_id?: string | null
          title?: string
          body?: string
          created_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          email: string
          id: string
          nome: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          nome?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          nome?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
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
    }
    Views: {
      view_correlacao_dolar_jbs: {
        Row: {
          ano: number | null
          data_fk: string | null
          mes: number | null
          valor_dolar: number | null
          valor_jbs: number | null
        }
        Relationships: [
          {
            foreignKeyName: "fact_mercado_data_fk_fkey"
            columns: ["data_fk"]
            isOneToOne: false
            referencedRelation: "dim_calendario"
            referencedColumns: ["data_pk"]
          },
        ]
      }
      view_lag_chuva_60d_boi: {
        Row: {
          ano_preco: number | null
          chuva_mm_lag_60d: number | null
          data_chuva_original: string | null
          data_preco: string | null
          mes_preco: number | null
          valor_boi_gordo: number | null
        }
        Relationships: [
          {
            foreignKeyName: "fact_clima_data_fk_fkey"
            columns: ["data_chuva_original"]
            isOneToOne: false
            referencedRelation: "dim_calendario"
            referencedColumns: ["data_pk"]
          },
          {
            foreignKeyName: "fact_mercado_data_fk_fkey"
            columns: ["data_preco"]
            isOneToOne: false
            referencedRelation: "dim_calendario"
            referencedColumns: ["data_pk"]
          },
        ]
      }
      view_volatilidade_mensal: {
        Row: {
          ano: number | null
          max_boi: number | null
          max_dolar: number | null
          mediana_boi: number | null
          mediana_dolar: number | null
          mes: number | null
          min_boi: number | null
          min_dolar: number | null
          q1_boi: number | null
          q1_dolar: number | null
          q3_boi: number | null
          q3_dolar: number | null
        }
        Relationships: []
      }
    }
    Functions: {
      get_user_role: {
        Args: { _user_id: string }
        Returns: Database["public"]["Enums"]["app_role"]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "gestor"
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
      app_role: ["admin", "gestor"],
    },
  },
} as const
