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
    PostgrestVersion: "14.4"
  }
  public: {
    Tables: {
      banners: {
        Row: {
          created_at: string
          id: string
          image_url: string
          is_active: boolean | null
          link_url: string | null
          position: string
          subtitle: string | null
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          image_url: string
          is_active?: boolean | null
          link_url?: string | null
          position?: string
          subtitle?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          image_url?: string
          is_active?: boolean | null
          link_url?: string | null
          position?: string
          subtitle?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      categories: {
        Row: {
          created_at: string
          description: string | null
          id: string
          image_url: string | null
          is_active: boolean | null
          name: string
          parent_id: string | null
          slug: string
          sort_order: number | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          name: string
          parent_id?: string | null
          slug: string
          sort_order?: number | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          name?: string
          parent_id?: string | null
          slug?: string
          sort_order?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "categories_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      checkout_leads: {
        Row: {
          area: string | null
          cart_items: Json | null
          cart_total: number | null
          contacted: boolean | null
          created_at: string
          customer_email: string | null
          customer_name: string | null
          customer_phone: string
          id: string
          notes: string | null
          session_id: string
          shipping_address: string | null
          status: string
          updated_at: string
        }
        Insert: {
          area?: string | null
          cart_items?: Json | null
          cart_total?: number | null
          contacted?: boolean | null
          created_at?: string
          customer_email?: string | null
          customer_name?: string | null
          customer_phone: string
          id?: string
          notes?: string | null
          session_id: string
          shipping_address?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          area?: string | null
          cart_items?: Json | null
          cart_total?: number | null
          contacted?: boolean | null
          created_at?: string
          customer_email?: string | null
          customer_name?: string | null
          customer_phone?: string
          id?: string
          notes?: string | null
          session_id?: string
          shipping_address?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      coupons: {
        Row: {
          code: string
          created_at: string
          expires_at: string
          id: string
          is_active: boolean | null
          max_uses: number | null
          min_order: number | null
          type: string
          updated_at: string
          used_count: number | null
          value: number
        }
        Insert: {
          code: string
          created_at?: string
          expires_at?: string
          id?: string
          is_active?: boolean | null
          max_uses?: number | null
          min_order?: number | null
          type?: string
          updated_at?: string
          used_count?: number | null
          value?: number
        }
        Update: {
          code?: string
          created_at?: string
          expires_at?: string
          id?: string
          is_active?: boolean | null
          max_uses?: number | null
          min_order?: number | null
          type?: string
          updated_at?: string
          used_count?: number | null
          value?: number
        }
        Relationships: []
      }
      orders: {
        Row: {
          created_at: string
          customer_email: string | null
          customer_name: string
          customer_phone: string
          id: string
          items: Json
          notes: string | null
          order_number: string
          payment_method: string
          shipping_address: string
          status: string
          total: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          customer_email?: string | null
          customer_name: string
          customer_phone: string
          id?: string
          items?: Json
          notes?: string | null
          order_number: string
          payment_method?: string
          shipping_address: string
          status?: string
          total?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          customer_email?: string | null
          customer_name?: string
          customer_phone?: string
          id?: string
          items?: Json
          notes?: string | null
          order_number?: string
          payment_method?: string
          shipping_address?: string
          status?: string
          total?: number
          updated_at?: string
        }
        Relationships: []
      }
      page_contents: {
        Row: {
          content: string
          created_at: string
          id: string
          is_active: boolean
          meta_description: string | null
          meta_title: string | null
          page_slug: string
          page_title: string
          updated_at: string
        }
        Insert: {
          content?: string
          created_at?: string
          id?: string
          is_active?: boolean
          meta_description?: string | null
          meta_title?: string | null
          page_slug: string
          page_title?: string
          updated_at?: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          is_active?: boolean
          meta_description?: string | null
          meta_title?: string | null
          page_slug?: string
          page_title?: string
          updated_at?: string
        }
        Relationships: []
      }
      page_views: {
        Row: {
          created_at: string
          id: string
          page_title: string | null
          page_url: string
          session_id: string
          visitor_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          page_title?: string | null
          page_url: string
          session_id: string
          visitor_id: string
        }
        Update: {
          created_at?: string
          id?: string
          page_title?: string | null
          page_url?: string
          session_id?: string
          visitor_id?: string
        }
        Relationships: []
      }
      product_variations: {
        Row: {
          color: string
          created_at: string
          id: string
          price: number | null
          product_id: string
          size: string
          sku: string | null
          stock: number
          updated_at: string
        }
        Insert: {
          color?: string
          created_at?: string
          id?: string
          price?: number | null
          product_id: string
          size?: string
          sku?: string | null
          stock?: number
          updated_at?: string
        }
        Update: {
          color?: string
          created_at?: string
          id?: string
          price?: number | null
          product_id?: string
          size?: string
          sku?: string | null
          stock?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_variations_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          brand: string
          category: string
          colors: string[] | null
          created_at: string
          dealer_price: number | null
          dealer_original_price: number | null
          description: string | null
          id: string
          image: string
          images: string[] | null
          is_active: boolean | null
          is_new: boolean | null
          is_offer: boolean | null
          is_trending: boolean | null
          location: string | null
          name: string
          original_price: number | null
          price: number
          rating: number | null
          reviews: number | null
          sizes: (string | number)[] | null
          sku: string | null
          stock: number | null
          updated_at: string
        }
        Insert: {
          brand: string
          category?: string
          colors?: string[] | null
          created_at?: string
          dealer_price?: number | null
          dealer_original_price?: number | null
          description?: string | null
          id?: string
          image?: string
          images?: string[] | null
          is_active?: boolean | null
          is_new?: boolean | null
          is_offer?: boolean | null
          is_trending?: boolean | null
          location?: string | null
          name: string
          original_price?: number | null
          price: number
          rating?: number | null
          reviews?: number | null
          sizes?: (string | number)[] | null
          sku?: string | null
          stock?: number | null
          updated_at?: string
        }
        Update: {
          brand?: string
          category?: string
          colors?: string[] | null
          created_at?: string
          dealer_price?: number | null
          dealer_original_price?: number | null
          description?: string | null
          id?: string
          image?: string
          images?: string[] | null
          is_active?: boolean | null
          is_new?: boolean | null
          is_offer?: boolean | null
          is_trending?: boolean | null
          location?: string | null
          name?: string
          original_price?: number | null
          price?: number
          rating?: number | null
          reviews?: number | null
          sizes?: (string | number)[] | null
          sku?: string | null
          stock?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      reviews: {
        Row: {
          created_at: string
          id: string
          is_active: boolean
          product_id: string | null
          rating: number
          review_text: string
          reviewer_image: string | null
          reviewer_name: string
          show_for_all: boolean
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean
          product_id?: string | null
          rating?: number
          review_text?: string
          reviewer_image?: string | null
          reviewer_name: string
          show_for_all?: boolean
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          product_id?: string | null
          rating?: number
          review_text?: string
          reviewer_image?: string | null
          reviewer_name?: string
          show_for_all?: boolean
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "reviews_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      shipping_methods: {
        Row: {
          area_zone: string
          charge: number
          created_at: string
          description: string | null
          estimated_delivery: string | null
          id: string
          is_active: boolean
          name: string
          sort_order: number | null
          updated_at: string
        }
        Insert: {
          area_zone?: string
          charge?: number
          created_at?: string
          description?: string | null
          estimated_delivery?: string | null
          id?: string
          is_active?: boolean
          name: string
          sort_order?: number | null
          updated_at?: string
        }
        Update: {
          area_zone?: string
          charge?: number
          created_at?: string
          description?: string | null
          estimated_delivery?: string | null
          id?: string
          is_active?: boolean
          name?: string
          sort_order?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      site_settings: {
        Row: {
          about_short: string | null
          contact_address: string | null
          contact_email: string | null
          contact_phone: string | null
          created_at: string
          currency: string | null
          default_content_type: string | null
          facebook_access_token: string | null
          facebook_api_version: string | null
          facebook_capi_enabled: boolean | null
          facebook_pixel_enabled: boolean | null
          facebook_pixel_id: string | null
          facebook_test_event_code: string | null
          facebook_url: string | null
          favicon_url: string | null
          footer_copyright: string | null
          footer_description: string | null
          footer_tagline: string | null
          free_shipping_threshold: number | null
          id: string
          instagram_handle: string | null
          instagram_url: string | null
          language: string | null
          logo_url: string | null
          meta_description: string | null
          meta_title: string | null
          site_description: string | null
          site_name: string | null
          tiktok_access_token: string | null
          tiktok_pixel_enabled: boolean | null
          tiktok_pixel_id: string | null
          tracking_addtocart: boolean | null
          tracking_complete_registration: boolean | null
          tracking_initiatecheckout: boolean | null
          tracking_lead: boolean | null
          tracking_pageview: boolean | null
          tracking_purchase: boolean | null
          tracking_viewcontent: boolean | null
          twitter_url: string | null
          updated_at: string
          whatsapp_number: string | null
          youtube_url: string | null
        }
        Insert: {
          about_short?: string | null
          contact_address?: string | null
          contact_email?: string | null
          contact_phone?: string | null
          created_at?: string
          currency?: string | null
          default_content_type?: string | null
          facebook_access_token?: string | null
          facebook_api_version?: string | null
          facebook_capi_enabled?: boolean | null
          facebook_pixel_enabled?: boolean | null
          facebook_pixel_id?: string | null
          facebook_test_event_code?: string | null
          facebook_url?: string | null
          favicon_url?: string | null
          footer_copyright?: string | null
          footer_description?: string | null
          footer_tagline?: string | null
          free_shipping_threshold?: number | null
          id?: string
          instagram_handle?: string | null
          instagram_url?: string | null
          language?: string | null
          logo_url?: string | null
          meta_description?: string | null
          meta_title?: string | null
          site_description?: string | null
          site_name?: string | null
          tiktok_access_token?: string | null
          tiktok_pixel_enabled?: boolean | null
          tiktok_pixel_id?: string | null
          tracking_addtocart?: boolean | null
          tracking_complete_registration?: boolean | null
          tracking_initiatecheckout?: boolean | null
          tracking_lead?: boolean | null
          tracking_pageview?: boolean | null
          tracking_purchase?: boolean | null
          tracking_viewcontent?: boolean | null
          twitter_url?: string | null
          updated_at?: string
          whatsapp_number?: string | null
          youtube_url?: string | null
        }
        Update: {
          about_short?: string | null
          contact_address?: string | null
          contact_email?: string | null
          contact_phone?: string | null
          created_at?: string
          currency?: string | null
          default_content_type?: string | null
          facebook_access_token?: string | null
          facebook_api_version?: string | null
          facebook_capi_enabled?: boolean | null
          facebook_pixel_enabled?: boolean | null
          facebook_pixel_id?: string | null
          facebook_test_event_code?: string | null
          facebook_url?: string | null
          favicon_url?: string | null
          footer_copyright?: string | null
          footer_description?: string | null
          footer_tagline?: string | null
          free_shipping_threshold?: number | null
          id?: string
          instagram_handle?: string | null
          instagram_url?: string | null
          language?: string | null
          logo_url?: string | null
          meta_description?: string | null
          meta_title?: string | null
          site_description?: string | null
          site_name?: string | null
          tiktok_access_token?: string | null
          tiktok_pixel_enabled?: boolean | null
          tiktok_pixel_id?: string | null
          tracking_addtocart?: boolean | null
          tracking_complete_registration?: boolean | null
          tracking_initiatecheckout?: boolean | null
          tracking_lead?: boolean | null
          tracking_pageview?: boolean | null
          tracking_purchase?: boolean | null
          tracking_viewcontent?: boolean | null
          twitter_url?: string | null
          updated_at?: string
          whatsapp_number?: string | null
          youtube_url?: string | null
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      visitor_sessions: {
        Row: {
          browser: string | null
          city: string | null
          country: string | null
          created_at: string
          device_type: string | null
          entry_page: string | null
          exit_page: string | null
          id: string
          ip_address: string | null
          is_online: boolean | null
          last_active_at: string
          os: string | null
          referrer: string | null
          session_id: string
          updated_at: string
          visitor_id: string
        }
        Insert: {
          browser?: string | null
          city?: string | null
          country?: string | null
          created_at?: string
          device_type?: string | null
          entry_page?: string | null
          exit_page?: string | null
          id?: string
          ip_address?: string | null
          is_online?: boolean | null
          last_active_at?: string
          os?: string | null
          referrer?: string | null
          session_id: string
          updated_at?: string
          visitor_id: string
        }
        Update: {
          browser?: string | null
          city?: string | null
          country?: string | null
          created_at?: string
          device_type?: string | null
          entry_page?: string | null
          exit_page?: string | null
          id?: string
          ip_address?: string | null
          is_online?: boolean | null
          last_active_at?: string
          os?: string | null
          referrer?: string | null
          session_id?: string
          updated_at?: string
          visitor_id?: string
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
      app_role: "admin" | "moderator" | "user"
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
      app_role: ["admin", "moderator", "user"],
    },
  },
} as const
