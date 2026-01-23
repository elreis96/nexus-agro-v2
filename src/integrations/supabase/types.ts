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
      [_ in never]: never
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
    Enums: {},
  },
} as const
