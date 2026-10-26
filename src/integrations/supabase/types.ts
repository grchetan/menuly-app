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
    PostgrestVersion: "14.18"
  }
  public: {
    Tables: {
      categories: {
        Row: {
          created_at: string
          id: string
          name: string
          position: number
          restaurant_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          position?: number
          restaurant_id: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          position?: number
          restaurant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "categories_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants"
            referencedColumns: ["id"]
          },
        ]
      }
      menu_items: {
        Row: {
          available: boolean
          category_id: string
          created_at: string
          description: string | null
          id: string
          image_url: string | null
          is_veg: boolean
          name: string
          position: number
          price: number
          restaurant_id: string
        }
        Insert: {
          available?: boolean
          category_id: string
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          is_veg?: boolean
          name: string
          position?: number
          price?: number
          restaurant_id: string
        }
        Update: {
          available?: boolean
          category_id?: string
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          is_veg?: boolean
          name?: string
          position?: number
          price?: number
          restaurant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "menu_items_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "menu_items_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants"
            referencedColumns: ["id"]
          },
        ]
      }
      restaurants: {
        Row: {
          address: string | null
          cover_url: string | null
          created_at: string
          hours: string | null
          id: string
          logo_url: string | null
          name: string
          owner_id: string
          phone: string | null
          qr_bg: string
          qr_corner: string
          qr_fg: string
          slug: string
          updated_at: string
          whatsapp: string | null
          is_pure_veg?: boolean
        }
        Insert: {
          address?: string | null
          cover_url?: string | null
          created_at?: string
          hours?: string | null
          id?: string
          logo_url?: string | null
          name?: string
          owner_id: string
          phone?: string | null
          qr_bg?: string
          qr_corner?: string
          qr_fg?: string
          slug: string
          updated_at?: string
          whatsapp?: string | null
          is_pure_veg?: boolean
        }
        Update: {
          address?: string | null
          cover_url?: string | null
          created_at?: string
          hours?: string | null
          id?: string
          logo_url?: string | null
          name?: string
          owner_id?: string
          phone?: string | null
          qr_bg?: string
          qr_corner?: string
          qr_fg?: string
          slug?: string
          updated_at?: string
          whatsapp?: string | null
          is_pure_veg?: boolean
        }
        Relationships: []
      }
      restaurant_tables: {
        Row: {
          id: string
          restaurant_id: string
          table_number: string
          label: string | null
          scans_count: number
          created_at: string
        }
        Insert: {
          id?: string
          restaurant_id: string
          table_number: string
          label?: string | null
          scans_count?: number
          created_at?: string
        }
        Update: {
          id?: string
          restaurant_id?: string
          table_number?: string
          label?: string | null
          scans_count?: number
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "restaurant_tables_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants"
            referencedColumns: ["id"]
          }
        ]
      }
      qr_scans: {
        Row: {
          id: string
          restaurant_id: string
          table_number: string | null
          user_agent: string | null
          ip_hash: string | null
          scanned_at: string
        }
        Insert: {
          id?: string
          restaurant_id: string
          table_number?: string | null
          user_agent?: string | null
          ip_hash?: string | null
          scanned_at?: string
        }
        Update: {
          id?: string
          restaurant_id?: string
          table_number?: string | null
          user_agent?: string | null
          ip_hash?: string | null
          scanned_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "qr_scans_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants"
            referencedColumns: ["id"]
          }
        ]
      }
      support_tickets: {
        Row: {
          id: string
          restaurant_id: string | null
          restaurant_name: string
          owner_email: string
          owner_phone: string | null
          category: string
          subject: string
          description: string
          priority: string
          status: string
          admin_notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          restaurant_id?: string | null
          restaurant_name: string
          owner_email: string
          owner_phone?: string | null
          category?: string
          subject: string
          description: string
          priority?: string
          status?: string
          admin_notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          restaurant_id?: string | null
          restaurant_name?: string
          owner_email?: string
          owner_phone?: string | null
          category?: string
          subject?: string
          description?: string
          priority?: string
          status?: string
          admin_notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      plans: {
        Row: {
          id: string
          name: string
          slug: string
          price_inr: number
          max_dishes: number
          max_tables: number
          custom_branding: boolean
          analytics_enabled: boolean
          photo_uploads: boolean
          features: Json
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          slug: string
          price_inr?: number
          max_dishes?: number
          max_tables?: number
          custom_branding?: boolean
          analytics_enabled?: boolean
          photo_uploads?: boolean
          features?: Json
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          slug?: string
          price_inr?: number
          max_dishes?: number
          max_tables?: number
          custom_branding?: boolean
          analytics_enabled?: boolean
          photo_uploads?: boolean
          features?: Json
          created_at?: string
        }
        Relationships: []
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
