export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5";
  };
  graphql_public: {
    Tables: {
      [_ in never]: never;
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      graphql: {
        Args: {
          extensions?: Json;
          operationName?: string;
          query?: string;
          variables?: Json;
        };
        Returns: Json;
      };
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
  public: {
    Tables: {
      account_balances: {
        Row: {
          account_id: string;
          balance: number;
          fiscal_year_id: string;
          id: string;
          last_updated_at: string | null;
          total_credit: number;
          total_debit: number;
        };
        Insert: {
          account_id: string;
          balance?: number;
          fiscal_year_id: string;
          id?: string;
          last_updated_at?: string | null;
          total_credit?: number;
          total_debit?: number;
        };
        Update: {
          account_id?: string;
          balance?: number;
          fiscal_year_id?: string;
          id?: string;
          last_updated_at?: string | null;
          total_credit?: number;
          total_debit?: number;
        };
        Relationships: [
          {
            foreignKeyName: "account_balances_account_id_fkey";
            columns: ["account_id"];
            isOneToOne: false;
            referencedRelation: "chart_of_accounts";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "account_balances_fiscal_year_id_fkey";
            columns: ["fiscal_year_id"];
            isOneToOne: false;
            referencedRelation: "fiscal_years";
            referencedColumns: ["id"];
          },
        ];
      };
      attribute_values: {
        Row: {
          attribute_id: string;
          created_at: string | null;
          id: string;
          updated_at: string | null;
          value: string;
        };
        Insert: {
          attribute_id: string;
          created_at?: string | null;
          id?: string;
          updated_at?: string | null;
          value: string;
        };
        Update: {
          attribute_id?: string;
          created_at?: string | null;
          id?: string;
          updated_at?: string | null;
          value?: string;
        };
        Relationships: [
          {
            foreignKeyName: "attribute_values_attribute_id_fkey";
            columns: ["attribute_id"];
            isOneToOne: false;
            referencedRelation: "attributes";
            referencedColumns: ["id"];
          },
        ];
      };
      attributes: {
        Row: {
          created_at: string | null;
          display_type: string;
          id: string;
          name: string;
          updated_at: string | null;
        };
        Insert: {
          created_at?: string | null;
          display_type: string;
          id?: string;
          name: string;
          updated_at?: string | null;
        };
        Update: {
          created_at?: string | null;
          display_type?: string;
          id?: string;
          name?: string;
          updated_at?: string | null;
        };
        Relationships: [];
      };
      brands: {
        Row: {
          created_at: string | null;
          description: string | null;
          id: string;
          is_active: boolean | null;
          name: string;
          updated_at: string | null;
        };
        Insert: {
          created_at?: string | null;
          description?: string | null;
          id?: string;
          is_active?: boolean | null;
          name: string;
          updated_at?: string | null;
        };
        Update: {
          created_at?: string | null;
          description?: string | null;
          id?: string;
          is_active?: boolean | null;
          name?: string;
          updated_at?: string | null;
        };
        Relationships: [];
      };
      categories: {
        Row: {
          created_at: string | null;
          id: string;
          image_url: string | null;
          is_active: boolean | null;
          name: string;
          parent_id: string | null;
          slug: string;
          updated_at: string | null;
        };
        Insert: {
          created_at?: string | null;
          id?: string;
          image_url?: string | null;
          is_active?: boolean | null;
          name: string;
          parent_id?: string | null;
          slug: string;
          updated_at?: string | null;
        };
        Update: {
          created_at?: string | null;
          id?: string;
          image_url?: string | null;
          is_active?: boolean | null;
          name?: string;
          parent_id?: string | null;
          slug?: string;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "categories_parent_id_fkey";
            columns: ["parent_id"];
            isOneToOne: false;
            referencedRelation: "categories";
            referencedColumns: ["id"];
          },
        ];
      };
      chart_of_accounts: {
        Row: {
          account_number: string;
          account_type: string;
          created_at: string | null;
          id: string;
          is_active: boolean | null;
          is_group: boolean | null;
          name: string;
          parent_id: string | null;
          updated_at: string | null;
        };
        Insert: {
          account_number: string;
          account_type: string;
          created_at?: string | null;
          id?: string;
          is_active?: boolean | null;
          is_group?: boolean | null;
          name: string;
          parent_id?: string | null;
          updated_at?: string | null;
        };
        Update: {
          account_number?: string;
          account_type?: string;
          created_at?: string | null;
          id?: string;
          is_active?: boolean | null;
          is_group?: boolean | null;
          name?: string;
          parent_id?: string | null;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "chart_of_accounts_parent_id_fkey";
            columns: ["parent_id"];
            isOneToOne: false;
            referencedRelation: "chart_of_accounts";
            referencedColumns: ["id"];
          },
        ];
      };
      cogs_entries: {
        Row: {
          created_at: string | null;
          fifo_ledger_id: string;
          id: string;
          outbound_reference_id: string;
          outbound_reference_type: string;
          quantity_deducted: number;
          total_cogs: number;
          unit_cost_applied: number;
        };
        Insert: {
          created_at?: string | null;
          fifo_ledger_id: string;
          id?: string;
          outbound_reference_id: string;
          outbound_reference_type: string;
          quantity_deducted: number;
          total_cogs: number;
          unit_cost_applied: number;
        };
        Update: {
          created_at?: string | null;
          fifo_ledger_id?: string;
          id?: string;
          outbound_reference_id?: string;
          outbound_reference_type?: string;
          quantity_deducted?: number;
          total_cogs?: number;
          unit_cost_applied?: number;
        };
        Relationships: [
          {
            foreignKeyName: "cogs_entries_fifo_ledger_id_fkey";
            columns: ["fifo_ledger_id"];
            isOneToOne: false;
            referencedRelation: "fifo_ledgers";
            referencedColumns: ["id"];
          },
        ];
      };
      customers: {
        Row: {
          billing_address: string | null;
          contact_email: string | null;
          contact_phone: string | null;
          created_at: string | null;
          credit_limit: number;
          customer_group: string | null;
          id: string;
          is_active: boolean | null;
          name: string;
          receivable_account_id: string;
          shipping_address: string | null;
          tax_id: string | null;
          updated_at: string | null;
        };
        Insert: {
          billing_address?: string | null;
          contact_email?: string | null;
          contact_phone?: string | null;
          created_at?: string | null;
          credit_limit?: number;
          customer_group?: string | null;
          id?: string;
          is_active?: boolean | null;
          name: string;
          receivable_account_id: string;
          shipping_address?: string | null;
          tax_id?: string | null;
          updated_at?: string | null;
        };
        Update: {
          billing_address?: string | null;
          contact_email?: string | null;
          contact_phone?: string | null;
          created_at?: string | null;
          credit_limit?: number;
          customer_group?: string | null;
          id?: string;
          is_active?: boolean | null;
          name?: string;
          receivable_account_id?: string;
          shipping_address?: string | null;
          tax_id?: string | null;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "customers_receivable_account_id_fkey";
            columns: ["receivable_account_id"];
            isOneToOne: false;
            referencedRelation: "chart_of_accounts";
            referencedColumns: ["id"];
          },
        ];
      };
      delivery_note_items: {
        Row: {
          bin_id: string | null;
          created_at: string | null;
          delivery_note_id: string;
          id: string;
          quantity_delivered: number;
          so_item_id: string | null;
          uom_id: string;
          updated_at: string | null;
          variation_id: string;
        };
        Insert: {
          bin_id?: string | null;
          created_at?: string | null;
          delivery_note_id: string;
          id?: string;
          quantity_delivered: number;
          so_item_id?: string | null;
          uom_id: string;
          updated_at?: string | null;
          variation_id: string;
        };
        Update: {
          bin_id?: string | null;
          created_at?: string | null;
          delivery_note_id?: string;
          id?: string;
          quantity_delivered?: number;
          so_item_id?: string | null;
          uom_id?: string;
          updated_at?: string | null;
          variation_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "delivery_note_items_bin_id_fkey";
            columns: ["bin_id"];
            isOneToOne: false;
            referencedRelation: "warehouse_bins";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "delivery_note_items_delivery_note_id_fkey";
            columns: ["delivery_note_id"];
            isOneToOne: false;
            referencedRelation: "delivery_notes";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "delivery_note_items_so_item_id_fkey";
            columns: ["so_item_id"];
            isOneToOne: false;
            referencedRelation: "sales_order_items";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "delivery_note_items_uom_id_fkey";
            columns: ["uom_id"];
            isOneToOne: false;
            referencedRelation: "units_of_measure";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "delivery_note_items_variation_id_fkey";
            columns: ["variation_id"];
            isOneToOne: false;
            referencedRelation: "product_variations";
            referencedColumns: ["id"];
          },
        ];
      };
      delivery_notes: {
        Row: {
          created_at: string | null;
          customer_id: string;
          delivery_date: string;
          delivery_number: string;
          id: string;
          sales_order_id: string | null;
          status: string;
          updated_at: string | null;
          warehouse_id: string;
        };
        Insert: {
          created_at?: string | null;
          customer_id: string;
          delivery_date: string;
          delivery_number: string;
          id?: string;
          sales_order_id?: string | null;
          status?: string;
          updated_at?: string | null;
          warehouse_id: string;
        };
        Update: {
          created_at?: string | null;
          customer_id?: string;
          delivery_date?: string;
          delivery_number?: string;
          id?: string;
          sales_order_id?: string | null;
          status?: string;
          updated_at?: string | null;
          warehouse_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "delivery_notes_customer_id_fkey";
            columns: ["customer_id"];
            isOneToOne: false;
            referencedRelation: "customers";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "delivery_notes_sales_order_id_fkey";
            columns: ["sales_order_id"];
            isOneToOne: false;
            referencedRelation: "sales_orders";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "delivery_notes_warehouse_id_fkey";
            columns: ["warehouse_id"];
            isOneToOne: false;
            referencedRelation: "warehouses";
            referencedColumns: ["id"];
          },
        ];
      };
      discount_rule_conditions: {
        Row: {
          condition_type: string;
          condition_value: string;
          created_at: string | null;
          discount_rule_id: string;
          id: string;
        };
        Insert: {
          condition_type: string;
          condition_value: string;
          created_at?: string | null;
          discount_rule_id: string;
          id?: string;
        };
        Update: {
          condition_type?: string;
          condition_value?: string;
          created_at?: string | null;
          discount_rule_id?: string;
          id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "discount_rule_conditions_discount_rule_id_fkey";
            columns: ["discount_rule_id"];
            isOneToOne: false;
            referencedRelation: "discount_rules";
            referencedColumns: ["id"];
          },
        ];
      };
      discount_rules: {
        Row: {
          created_at: string | null;
          discount_type: string;
          discount_value: number;
          id: string;
          is_active: boolean | null;
          name: string;
          priority: number;
          updated_at: string | null;
          valid_from: string | null;
          valid_to: string | null;
        };
        Insert: {
          created_at?: string | null;
          discount_type: string;
          discount_value: number;
          id?: string;
          is_active?: boolean | null;
          name: string;
          priority?: number;
          updated_at?: string | null;
          valid_from?: string | null;
          valid_to?: string | null;
        };
        Update: {
          created_at?: string | null;
          discount_type?: string;
          discount_value?: number;
          id?: string;
          is_active?: boolean | null;
          name?: string;
          priority?: number;
          updated_at?: string | null;
          valid_from?: string | null;
          valid_to?: string | null;
        };
        Relationships: [];
      };
      erp_roles: {
        Row: {
          id: string;
          name: string;
        };
        Insert: {
          id?: string;
          name: string;
        };
        Update: {
          id?: string;
          name?: string;
        };
        Relationships: [];
      };
      erp_user_roles: {
        Row: {
          role_id: string;
          user_id: string;
        };
        Insert: {
          role_id: string;
          user_id: string;
        };
        Update: {
          role_id?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "erp_user_roles_role_id_fkey";
            columns: ["role_id"];
            isOneToOne: false;
            referencedRelation: "erp_roles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "erp_user_roles_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "erp_users";
            referencedColumns: ["id"];
          },
        ];
      };
      erp_users: {
        Row: {
          created_at: string | null;
          email: string | null;
          full_name: string | null;
          id: string;
          is_active: boolean | null;
          updated_at: string | null;
        };
        Insert: {
          created_at?: string | null;
          email?: string | null;
          full_name?: string | null;
          id: string;
          is_active?: boolean | null;
          updated_at?: string | null;
        };
        Update: {
          created_at?: string | null;
          email?: string | null;
          full_name?: string | null;
          id?: string;
          is_active?: boolean | null;
          updated_at?: string | null;
        };
        Relationships: [];
      };
      fifo_ledgers: {
        Row: {
          created_at: string | null;
          id: string;
          inbound_reference_id: string;
          inbound_reference_type: string;
          original_quantity: number;
          quantity_remaining: number;
          transaction_date: string;
          unit_cost: number;
          updated_at: string | null;
          variation_id: string;
          warehouse_id: string;
        };
        Insert: {
          created_at?: string | null;
          id?: string;
          inbound_reference_id: string;
          inbound_reference_type: string;
          original_quantity: number;
          quantity_remaining: number;
          transaction_date: string;
          unit_cost: number;
          updated_at?: string | null;
          variation_id: string;
          warehouse_id: string;
        };
        Update: {
          created_at?: string | null;
          id?: string;
          inbound_reference_id?: string;
          inbound_reference_type?: string;
          original_quantity?: number;
          quantity_remaining?: number;
          transaction_date?: string;
          unit_cost?: number;
          updated_at?: string | null;
          variation_id?: string;
          warehouse_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "fifo_ledgers_variation_id_fkey";
            columns: ["variation_id"];
            isOneToOne: false;
            referencedRelation: "product_variations";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "fifo_ledgers_warehouse_id_fkey";
            columns: ["warehouse_id"];
            isOneToOne: false;
            referencedRelation: "warehouses";
            referencedColumns: ["id"];
          },
        ];
      };
      fiscal_years: {
        Row: {
          created_at: string | null;
          end_date: string;
          id: string;
          is_closed: boolean | null;
          name: string;
          start_date: string;
          updated_at: string | null;
        };
        Insert: {
          created_at?: string | null;
          end_date: string;
          id?: string;
          is_closed?: boolean | null;
          name: string;
          start_date: string;
          updated_at?: string | null;
        };
        Update: {
          created_at?: string | null;
          end_date?: string;
          id?: string;
          is_closed?: boolean | null;
          name?: string;
          start_date?: string;
          updated_at?: string | null;
        };
        Relationships: [];
      };
      journal_entries: {
        Row: {
          created_at: string | null;
          entry_number: string;
          fiscal_year_id: string;
          id: string;
          narration: string | null;
          posting_date: string;
          reference_id: string | null;
          reference_type: string | null;
          status: string;
          updated_at: string | null;
        };
        Insert: {
          created_at?: string | null;
          entry_number: string;
          fiscal_year_id: string;
          id?: string;
          narration?: string | null;
          posting_date: string;
          reference_id?: string | null;
          reference_type?: string | null;
          status?: string;
          updated_at?: string | null;
        };
        Update: {
          created_at?: string | null;
          entry_number?: string;
          fiscal_year_id?: string;
          id?: string;
          narration?: string | null;
          posting_date?: string;
          reference_id?: string | null;
          reference_type?: string | null;
          status?: string;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "journal_entries_fiscal_year_id_fkey";
            columns: ["fiscal_year_id"];
            isOneToOne: false;
            referencedRelation: "fiscal_years";
            referencedColumns: ["id"];
          },
        ];
      };
      journal_entry_lines: {
        Row: {
          account_id: string;
          created_at: string | null;
          credit_amount: number;
          debit_amount: number;
          id: string;
          journal_entry_id: string;
          narration: string | null;
          party_id: string | null;
          party_type: string | null;
        };
        Insert: {
          account_id: string;
          created_at?: string | null;
          credit_amount?: number;
          debit_amount?: number;
          id?: string;
          journal_entry_id: string;
          narration?: string | null;
          party_id?: string | null;
          party_type?: string | null;
        };
        Update: {
          account_id?: string;
          created_at?: string | null;
          credit_amount?: number;
          debit_amount?: number;
          id?: string;
          journal_entry_id?: string;
          narration?: string | null;
          party_id?: string | null;
          party_type?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "journal_entry_lines_account_id_fkey";
            columns: ["account_id"];
            isOneToOne: false;
            referencedRelation: "chart_of_accounts";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "journal_entry_lines_journal_entry_id_fkey";
            columns: ["journal_entry_id"];
            isOneToOne: false;
            referencedRelation: "journal_entries";
            referencedColumns: ["id"];
          },
        ];
      };
      pos_payments: {
        Row: {
          amount: number;
          created_at: string | null;
          id: string;
          payment_method: string;
          receipt_id: string;
          reference_code: string | null;
        };
        Insert: {
          amount: number;
          created_at?: string | null;
          id?: string;
          payment_method: string;
          receipt_id: string;
          reference_code?: string | null;
        };
        Update: {
          amount?: number;
          created_at?: string | null;
          id?: string;
          payment_method?: string;
          receipt_id?: string;
          reference_code?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "pos_payments_receipt_id_fkey";
            columns: ["receipt_id"];
            isOneToOne: false;
            referencedRelation: "pos_receipts";
            referencedColumns: ["id"];
          },
        ];
      };
      pos_receipt_items: {
        Row: {
          created_at: string | null;
          id: string;
          quantity: number;
          receipt_id: string;
          total_price: number;
          unit_price: number;
          variation_id: string;
        };
        Insert: {
          created_at?: string | null;
          id?: string;
          quantity: number;
          receipt_id: string;
          total_price: number;
          unit_price: number;
          variation_id: string;
        };
        Update: {
          created_at?: string | null;
          id?: string;
          quantity?: number;
          receipt_id?: string;
          total_price?: number;
          unit_price?: number;
          variation_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "pos_receipt_items_receipt_id_fkey";
            columns: ["receipt_id"];
            isOneToOne: false;
            referencedRelation: "pos_receipts";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "pos_receipt_items_variation_id_fkey";
            columns: ["variation_id"];
            isOneToOne: false;
            referencedRelation: "product_variations";
            referencedColumns: ["id"];
          },
        ];
      };
      pos_receipts: {
        Row: {
          created_at: string | null;
          customer_id: string | null;
          discount_amount: number;
          id: string;
          receipt_number: string;
          shift_id: string;
          status: string;
          tax_amount: number;
          total_amount: number;
          transaction_date: string;
          updated_at: string | null;
        };
        Insert: {
          created_at?: string | null;
          customer_id?: string | null;
          discount_amount?: number;
          id?: string;
          receipt_number: string;
          shift_id: string;
          status?: string;
          tax_amount?: number;
          total_amount: number;
          transaction_date: string;
          updated_at?: string | null;
        };
        Update: {
          created_at?: string | null;
          customer_id?: string | null;
          discount_amount?: number;
          id?: string;
          receipt_number?: string;
          shift_id?: string;
          status?: string;
          tax_amount?: number;
          total_amount?: number;
          transaction_date?: string;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "pos_receipts_customer_id_fkey";
            columns: ["customer_id"];
            isOneToOne: false;
            referencedRelation: "customers";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "pos_receipts_shift_id_fkey";
            columns: ["shift_id"];
            isOneToOne: false;
            referencedRelation: "pos_shifts";
            referencedColumns: ["id"];
          },
        ];
      };
      pos_registers: {
        Row: {
          created_at: string | null;
          default_card_account_id: string | null;
          default_cash_account_id: string | null;
          id: string;
          is_active: boolean | null;
          name: string;
          updated_at: string | null;
          warehouse_id: string;
        };
        Insert: {
          created_at?: string | null;
          default_card_account_id?: string | null;
          default_cash_account_id?: string | null;
          id?: string;
          is_active?: boolean | null;
          name: string;
          updated_at?: string | null;
          warehouse_id: string;
        };
        Update: {
          created_at?: string | null;
          default_card_account_id?: string | null;
          default_cash_account_id?: string | null;
          id?: string;
          is_active?: boolean | null;
          name?: string;
          updated_at?: string | null;
          warehouse_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "pos_registers_default_card_account_id_fkey";
            columns: ["default_card_account_id"];
            isOneToOne: false;
            referencedRelation: "chart_of_accounts";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "pos_registers_default_cash_account_id_fkey";
            columns: ["default_cash_account_id"];
            isOneToOne: false;
            referencedRelation: "chart_of_accounts";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "pos_registers_warehouse_id_fkey";
            columns: ["warehouse_id"];
            isOneToOne: false;
            referencedRelation: "warehouses";
            referencedColumns: ["id"];
          },
        ];
      };
      pos_shifts: {
        Row: {
          closed_at: string | null;
          closing_cash_actual: number | null;
          closing_cash_expected: number | null;
          id: string;
          opened_at: string;
          opening_cash: number;
          register_id: string;
          status: string;
          user_id: string;
        };
        Insert: {
          closed_at?: string | null;
          closing_cash_actual?: number | null;
          closing_cash_expected?: number | null;
          id?: string;
          opened_at: string;
          opening_cash: number;
          register_id: string;
          status?: string;
          user_id: string;
        };
        Update: {
          closed_at?: string | null;
          closing_cash_actual?: number | null;
          closing_cash_expected?: number | null;
          id?: string;
          opened_at?: string;
          opening_cash?: number;
          register_id?: string;
          status?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "pos_shifts_register_id_fkey";
            columns: ["register_id"];
            isOneToOne: false;
            referencedRelation: "pos_registers";
            referencedColumns: ["id"];
          },
        ];
      };
      price_list_items: {
        Row: {
          created_at: string | null;
          id: string;
          price: number;
          price_list_id: string;
          uom_id: string;
          updated_at: string | null;
          variation_id: string;
        };
        Insert: {
          created_at?: string | null;
          id?: string;
          price: number;
          price_list_id: string;
          uom_id: string;
          updated_at?: string | null;
          variation_id: string;
        };
        Update: {
          created_at?: string | null;
          id?: string;
          price?: number;
          price_list_id?: string;
          uom_id?: string;
          updated_at?: string | null;
          variation_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "price_list_items_price_list_id_fkey";
            columns: ["price_list_id"];
            isOneToOne: false;
            referencedRelation: "price_lists";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "price_list_items_uom_id_fkey";
            columns: ["uom_id"];
            isOneToOne: false;
            referencedRelation: "units_of_measure";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "price_list_items_variation_id_fkey";
            columns: ["variation_id"];
            isOneToOne: false;
            referencedRelation: "product_variations";
            referencedColumns: ["id"];
          },
        ];
      };
      price_lists: {
        Row: {
          created_at: string | null;
          currency: string;
          id: string;
          is_active: boolean | null;
          is_tax_included: boolean;
          name: string;
          updated_at: string | null;
        };
        Insert: {
          created_at?: string | null;
          currency?: string;
          id?: string;
          is_active?: boolean | null;
          is_tax_included?: boolean;
          name: string;
          updated_at?: string | null;
        };
        Update: {
          created_at?: string | null;
          currency?: string;
          id?: string;
          is_active?: boolean | null;
          is_tax_included?: boolean;
          name?: string;
          updated_at?: string | null;
        };
        Relationships: [];
      };
      product_attributes: {
        Row: {
          attribute_id: string;
          id: string;
          product_id: string;
        };
        Insert: {
          attribute_id: string;
          id?: string;
          product_id: string;
        };
        Update: {
          attribute_id?: string;
          id?: string;
          product_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "product_attributes_attribute_id_fkey";
            columns: ["attribute_id"];
            isOneToOne: false;
            referencedRelation: "attributes";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "product_attributes_product_id_fkey";
            columns: ["product_id"];
            isOneToOne: false;
            referencedRelation: "products";
            referencedColumns: ["id"];
          },
        ];
      };
      product_variations: {
        Row: {
          barcode: string | null;
          created_at: string | null;
          id: string;
          is_active: boolean | null;
          product_id: string;
          sku: string;
          updated_at: string | null;
          weight: number | null;
        };
        Insert: {
          barcode?: string | null;
          created_at?: string | null;
          id?: string;
          is_active?: boolean | null;
          product_id: string;
          sku: string;
          updated_at?: string | null;
          weight?: number | null;
        };
        Update: {
          barcode?: string | null;
          created_at?: string | null;
          id?: string;
          is_active?: boolean | null;
          product_id?: string;
          sku?: string;
          updated_at?: string | null;
          weight?: number | null;
        };
        Relationships: [
          {
            foreignKeyName: "product_variations_product_id_fkey";
            columns: ["product_id"];
            isOneToOne: false;
            referencedRelation: "products";
            referencedColumns: ["id"];
          },
        ];
      };
      products: {
        Row: {
          base_uom_id: string;
          brand_id: string | null;
          category_id: string;
          created_at: string | null;
          description: string | null;
          has_variants: boolean | null;
          id: string;
          image_url: string | null;
          is_active: boolean | null;
          item_code: string;
          name: string;
          price: number | null;
          original_price: number | null;
          dealer_price: number | null;
          dealer_original_price: number | null;
          updated_at: string | null;
        };
        Insert: {
          base_uom_id: string;
          brand_id?: string | null;
          category_id: string;
          created_at?: string | null;
          description?: string | null;
          has_variants?: boolean | null;
          id?: string;
          image_url?: string | null;
          is_active?: boolean | null;
          item_code: string;
          name: string;
          price?: number | null;
          original_price?: number | null;
          dealer_price?: number | null;
          dealer_original_price?: number | null;
          updated_at?: string | null;
        };
        Update: {
          base_uom_id?: string;
          brand_id?: string | null;
          category_id?: string;
          created_at?: string | null;
          description?: string | null;
          has_variants?: boolean | null;
          id?: string;
          image_url?: string | null;
          is_active?: boolean | null;
          item_code?: string;
          name?: string;
          price?: number | null;
          original_price?: number | null;
          dealer_price?: number | null;
          dealer_original_price?: number | null;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "products_base_uom_id_fkey";
            columns: ["base_uom_id"];
            isOneToOne: false;
            referencedRelation: "units_of_measure";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "products_brand_id_fkey";
            columns: ["brand_id"];
            isOneToOne: false;
            referencedRelation: "brands";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "products_category_id_fkey";
            columns: ["category_id"];
            isOneToOne: false;
            referencedRelation: "categories";
            referencedColumns: ["id"];
          },
        ];
      };
      purchase_invoice_items: {
        Row: {
          amount: number;
          created_at: string | null;
          expense_account_id: string | null;
          id: string;
          purchase_invoice_id: string;
          quantity_billed: number;
          receipt_item_id: string | null;
          unit_price: number;
          updated_at: string | null;
          variation_id: string;
        };
        Insert: {
          amount: number;
          created_at?: string | null;
          expense_account_id?: string | null;
          id?: string;
          purchase_invoice_id: string;
          quantity_billed: number;
          receipt_item_id?: string | null;
          unit_price: number;
          updated_at?: string | null;
          variation_id: string;
        };
        Update: {
          amount?: number;
          created_at?: string | null;
          expense_account_id?: string | null;
          id?: string;
          purchase_invoice_id?: string;
          quantity_billed?: number;
          receipt_item_id?: string | null;
          unit_price?: number;
          updated_at?: string | null;
          variation_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "purchase_invoice_items_expense_account_id_fkey";
            columns: ["expense_account_id"];
            isOneToOne: false;
            referencedRelation: "chart_of_accounts";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "purchase_invoice_items_purchase_invoice_id_fkey";
            columns: ["purchase_invoice_id"];
            isOneToOne: false;
            referencedRelation: "purchase_invoices";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "purchase_invoice_items_receipt_item_id_fkey";
            columns: ["receipt_item_id"];
            isOneToOne: false;
            referencedRelation: "purchase_receipt_items";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "purchase_invoice_items_variation_id_fkey";
            columns: ["variation_id"];
            isOneToOne: false;
            referencedRelation: "product_variations";
            referencedColumns: ["id"];
          },
        ];
      };
      purchase_invoices: {
        Row: {
          created_at: string | null;
          due_date: string;
          id: string;
          invoice_date: string;
          invoice_number: string;
          purchase_receipt_id: string | null;
          status: string;
          supplier_id: string;
          supplier_invoice_number: string;
          total_amount: number;
          updated_at: string | null;
        };
        Insert: {
          created_at?: string | null;
          due_date: string;
          id?: string;
          invoice_date: string;
          invoice_number: string;
          purchase_receipt_id?: string | null;
          status?: string;
          supplier_id: string;
          supplier_invoice_number: string;
          total_amount: number;
          updated_at?: string | null;
        };
        Update: {
          created_at?: string | null;
          due_date?: string;
          id?: string;
          invoice_date?: string;
          invoice_number?: string;
          purchase_receipt_id?: string | null;
          status?: string;
          supplier_id?: string;
          supplier_invoice_number?: string;
          total_amount?: number;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "purchase_invoices_purchase_receipt_id_fkey";
            columns: ["purchase_receipt_id"];
            isOneToOne: false;
            referencedRelation: "purchase_receipts";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "purchase_invoices_supplier_id_fkey";
            columns: ["supplier_id"];
            isOneToOne: false;
            referencedRelation: "suppliers";
            referencedColumns: ["id"];
          },
        ];
      };
      purchase_order_items: {
        Row: {
          created_at: string | null;
          id: string;
          purchase_order_id: string;
          quantity_ordered: number;
          quantity_received: number;
          total_price: number;
          unit_price: number;
          uom_id: string;
          updated_at: string | null;
          variation_id: string;
        };
        Insert: {
          created_at?: string | null;
          id?: string;
          purchase_order_id: string;
          quantity_ordered: number;
          quantity_received?: number;
          total_price: number;
          unit_price: number;
          uom_id: string;
          updated_at?: string | null;
          variation_id: string;
        };
        Update: {
          created_at?: string | null;
          id?: string;
          purchase_order_id?: string;
          quantity_ordered?: number;
          quantity_received?: number;
          total_price?: number;
          unit_price?: number;
          uom_id?: string;
          updated_at?: string | null;
          variation_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "purchase_order_items_purchase_order_id_fkey";
            columns: ["purchase_order_id"];
            isOneToOne: false;
            referencedRelation: "purchase_orders";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "purchase_order_items_uom_id_fkey";
            columns: ["uom_id"];
            isOneToOne: false;
            referencedRelation: "units_of_measure";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "purchase_order_items_variation_id_fkey";
            columns: ["variation_id"];
            isOneToOne: false;
            referencedRelation: "product_variations";
            referencedColumns: ["id"];
          },
        ];
      };
      purchase_orders: {
        Row: {
          created_at: string | null;
          expected_delivery_date: string | null;
          id: string;
          order_date: string;
          po_number: string;
          status: string;
          supplier_id: string;
          total_amount: number;
          updated_at: string | null;
        };
        Insert: {
          created_at?: string | null;
          expected_delivery_date?: string | null;
          id?: string;
          order_date: string;
          po_number: string;
          status?: string;
          supplier_id: string;
          total_amount?: number;
          updated_at?: string | null;
        };
        Update: {
          created_at?: string | null;
          expected_delivery_date?: string | null;
          id?: string;
          order_date?: string;
          po_number?: string;
          status?: string;
          supplier_id?: string;
          total_amount?: number;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "purchase_orders_supplier_id_fkey";
            columns: ["supplier_id"];
            isOneToOne: false;
            referencedRelation: "suppliers";
            referencedColumns: ["id"];
          },
        ];
      };
      purchase_receipt_items: {
        Row: {
          bin_id: string | null;
          created_at: string | null;
          id: string;
          po_item_id: string | null;
          purchase_receipt_id: string;
          quantity_received: number;
          uom_id: string;
          updated_at: string | null;
          variation_id: string;
        };
        Insert: {
          bin_id?: string | null;
          created_at?: string | null;
          id?: string;
          po_item_id?: string | null;
          purchase_receipt_id: string;
          quantity_received: number;
          uom_id: string;
          updated_at?: string | null;
          variation_id: string;
        };
        Update: {
          bin_id?: string | null;
          created_at?: string | null;
          id?: string;
          po_item_id?: string | null;
          purchase_receipt_id?: string;
          quantity_received?: number;
          uom_id?: string;
          updated_at?: string | null;
          variation_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "purchase_receipt_items_bin_id_fkey";
            columns: ["bin_id"];
            isOneToOne: false;
            referencedRelation: "warehouse_bins";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "purchase_receipt_items_po_item_id_fkey";
            columns: ["po_item_id"];
            isOneToOne: false;
            referencedRelation: "purchase_order_items";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "purchase_receipt_items_purchase_receipt_id_fkey";
            columns: ["purchase_receipt_id"];
            isOneToOne: false;
            referencedRelation: "purchase_receipts";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "purchase_receipt_items_uom_id_fkey";
            columns: ["uom_id"];
            isOneToOne: false;
            referencedRelation: "units_of_measure";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "purchase_receipt_items_variation_id_fkey";
            columns: ["variation_id"];
            isOneToOne: false;
            referencedRelation: "product_variations";
            referencedColumns: ["id"];
          },
        ];
      };
      purchase_receipts: {
        Row: {
          created_at: string | null;
          id: string;
          purchase_order_id: string | null;
          receipt_date: string;
          receipt_number: string;
          status: string;
          supplier_id: string;
          updated_at: string | null;
          warehouse_id: string;
        };
        Insert: {
          created_at?: string | null;
          id?: string;
          purchase_order_id?: string | null;
          receipt_date: string;
          receipt_number: string;
          status?: string;
          supplier_id: string;
          updated_at?: string | null;
          warehouse_id: string;
        };
        Update: {
          created_at?: string | null;
          id?: string;
          purchase_order_id?: string | null;
          receipt_date?: string;
          receipt_number?: string;
          status?: string;
          supplier_id?: string;
          updated_at?: string | null;
          warehouse_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "purchase_receipts_purchase_order_id_fkey";
            columns: ["purchase_order_id"];
            isOneToOne: false;
            referencedRelation: "purchase_orders";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "purchase_receipts_supplier_id_fkey";
            columns: ["supplier_id"];
            isOneToOne: false;
            referencedRelation: "suppliers";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "purchase_receipts_warehouse_id_fkey";
            columns: ["warehouse_id"];
            isOneToOne: false;
            referencedRelation: "warehouses";
            referencedColumns: ["id"];
          },
        ];
      };
      sales_invoice_items: {
        Row: {
          amount: number;
          created_at: string | null;
          delivery_item_id: string | null;
          id: string;
          quantity_billed: number;
          revenue_account_id: string | null;
          sales_invoice_id: string;
          unit_price: number;
          updated_at: string | null;
          variation_id: string;
        };
        Insert: {
          amount: number;
          created_at?: string | null;
          delivery_item_id?: string | null;
          id?: string;
          quantity_billed: number;
          revenue_account_id?: string | null;
          sales_invoice_id: string;
          unit_price: number;
          updated_at?: string | null;
          variation_id: string;
        };
        Update: {
          amount?: number;
          created_at?: string | null;
          delivery_item_id?: string | null;
          id?: string;
          quantity_billed?: number;
          revenue_account_id?: string | null;
          sales_invoice_id?: string;
          unit_price?: number;
          updated_at?: string | null;
          variation_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "sales_invoice_items_delivery_item_id_fkey";
            columns: ["delivery_item_id"];
            isOneToOne: false;
            referencedRelation: "delivery_note_items";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "sales_invoice_items_revenue_account_id_fkey";
            columns: ["revenue_account_id"];
            isOneToOne: false;
            referencedRelation: "chart_of_accounts";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "sales_invoice_items_sales_invoice_id_fkey";
            columns: ["sales_invoice_id"];
            isOneToOne: false;
            referencedRelation: "sales_invoices";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "sales_invoice_items_variation_id_fkey";
            columns: ["variation_id"];
            isOneToOne: false;
            referencedRelation: "product_variations";
            referencedColumns: ["id"];
          },
        ];
      };
      sales_invoices: {
        Row: {
          created_at: string | null;
          customer_id: string;
          delivery_note_id: string | null;
          due_date: string;
          id: string;
          invoice_date: string;
          invoice_number: string;
          sales_order_id: string | null;
          status: string;
          total_amount: number;
          updated_at: string | null;
        };
        Insert: {
          created_at?: string | null;
          customer_id: string;
          delivery_note_id?: string | null;
          due_date: string;
          id?: string;
          invoice_date: string;
          invoice_number: string;
          sales_order_id?: string | null;
          status?: string;
          total_amount: number;
          updated_at?: string | null;
        };
        Update: {
          created_at?: string | null;
          customer_id?: string;
          delivery_note_id?: string | null;
          due_date?: string;
          id?: string;
          invoice_date?: string;
          invoice_number?: string;
          sales_order_id?: string | null;
          status?: string;
          total_amount?: number;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "sales_invoices_customer_id_fkey";
            columns: ["customer_id"];
            isOneToOne: false;
            referencedRelation: "customers";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "sales_invoices_delivery_note_id_fkey";
            columns: ["delivery_note_id"];
            isOneToOne: false;
            referencedRelation: "delivery_notes";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "sales_invoices_sales_order_id_fkey";
            columns: ["sales_order_id"];
            isOneToOne: false;
            referencedRelation: "sales_orders";
            referencedColumns: ["id"];
          },
        ];
      };
      sales_order_items: {
        Row: {
          created_at: string | null;
          discount_amount: number;
          id: string;
          quantity_delivered: number;
          quantity_ordered: number;
          sales_order_id: string;
          total_price: number;
          unit_price: number;
          uom_id: string;
          updated_at: string | null;
          variation_id: string;
        };
        Insert: {
          created_at?: string | null;
          discount_amount?: number;
          id?: string;
          quantity_delivered?: number;
          quantity_ordered: number;
          sales_order_id: string;
          total_price: number;
          unit_price: number;
          uom_id: string;
          updated_at?: string | null;
          variation_id: string;
        };
        Update: {
          created_at?: string | null;
          discount_amount?: number;
          id?: string;
          quantity_delivered?: number;
          quantity_ordered?: number;
          sales_order_id?: string;
          total_price?: number;
          unit_price?: number;
          uom_id?: string;
          updated_at?: string | null;
          variation_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "sales_order_items_sales_order_id_fkey";
            columns: ["sales_order_id"];
            isOneToOne: false;
            referencedRelation: "sales_orders";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "sales_order_items_uom_id_fkey";
            columns: ["uom_id"];
            isOneToOne: false;
            referencedRelation: "units_of_measure";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "sales_order_items_variation_id_fkey";
            columns: ["variation_id"];
            isOneToOne: false;
            referencedRelation: "product_variations";
            referencedColumns: ["id"];
          },
        ];
      };
      sales_orders: {
        Row: {
          created_at: string | null;
          customer_id: string;
          delivery_date: string | null;
          id: string;
          order_date: string;
          so_number: string;
          status: string;
          total_amount: number;
          updated_at: string | null;
        };
        Insert: {
          created_at?: string | null;
          customer_id: string;
          delivery_date?: string | null;
          id?: string;
          order_date: string;
          so_number: string;
          status?: string;
          total_amount?: number;
          updated_at?: string | null;
        };
        Update: {
          created_at?: string | null;
          customer_id?: string;
          delivery_date?: string | null;
          id?: string;
          order_date?: string;
          so_number?: string;
          status?: string;
          total_amount?: number;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "sales_orders_customer_id_fkey";
            columns: ["customer_id"];
            isOneToOne: false;
            referencedRelation: "customers";
            referencedColumns: ["id"];
          },
        ];
      };
      shipping_methods: {
        Row: {
          area_zone: string;
          charge: number;
          created_at: string;
          description: string | null;
          estimated_delivery: string | null;
          id: string;
          is_active: boolean;
          name: string;
          sort_order: number | null;
          updated_at: string;
        };
        Insert: {
          area_zone?: string;
          charge?: number;
          created_at?: string;
          description?: string | null;
          estimated_delivery?: string | null;
          id?: string;
          is_active?: boolean;
          name: string;
          sort_order?: number | null;
          updated_at?: string;
        };
        Update: {
          area_zone?: string;
          charge?: number;
          created_at?: string;
          description?: string | null;
          estimated_delivery?: string | null;
          id?: string;
          is_active?: boolean;
          name?: string;
          sort_order?: number | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      stock_balances: {
        Row: {
          batch_number: string | null;
          bin_id: string | null;
          id: string;
          last_updated_at: string | null;
          quantity: number;
          variation_id: string;
          warehouse_id: string;
        };
        Insert: {
          batch_number?: string | null;
          bin_id?: string | null;
          id?: string;
          last_updated_at?: string | null;
          quantity?: number;
          variation_id: string;
          warehouse_id: string;
        };
        Update: {
          batch_number?: string | null;
          bin_id?: string | null;
          id?: string;
          last_updated_at?: string | null;
          quantity?: number;
          variation_id?: string;
          warehouse_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "stock_balances_bin_id_fkey";
            columns: ["bin_id"];
            isOneToOne: false;
            referencedRelation: "warehouse_bins";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "stock_balances_variation_id_fkey";
            columns: ["variation_id"];
            isOneToOne: false;
            referencedRelation: "product_variations";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "stock_balances_warehouse_id_fkey";
            columns: ["warehouse_id"];
            isOneToOne: false;
            referencedRelation: "warehouses";
            referencedColumns: ["id"];
          },
        ];
      };
      stock_ledgers: {
        Row: {
          batch_number: string | null;
          bin_id: string | null;
          created_at: string | null;
          id: string;
          quantity: number;
          reference_id: string;
          reference_type: string;
          serial_number: string | null;
          transaction_date: string;
          uom_id: string;
          variation_id: string;
          warehouse_id: string;
        };
        Insert: {
          batch_number?: string | null;
          bin_id?: string | null;
          created_at?: string | null;
          id?: string;
          quantity: number;
          reference_id: string;
          reference_type: string;
          serial_number?: string | null;
          transaction_date?: string;
          uom_id: string;
          variation_id: string;
          warehouse_id: string;
        };
        Update: {
          batch_number?: string | null;
          bin_id?: string | null;
          created_at?: string | null;
          id?: string;
          quantity?: number;
          reference_id?: string;
          reference_type?: string;
          serial_number?: string | null;
          transaction_date?: string;
          uom_id?: string;
          variation_id?: string;
          warehouse_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "stock_ledgers_bin_id_fkey";
            columns: ["bin_id"];
            isOneToOne: false;
            referencedRelation: "warehouse_bins";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "stock_ledgers_uom_id_fkey";
            columns: ["uom_id"];
            isOneToOne: false;
            referencedRelation: "units_of_measure";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "stock_ledgers_variation_id_fkey";
            columns: ["variation_id"];
            isOneToOne: false;
            referencedRelation: "product_variations";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "stock_ledgers_warehouse_id_fkey";
            columns: ["warehouse_id"];
            isOneToOne: false;
            referencedRelation: "warehouses";
            referencedColumns: ["id"];
          },
        ];
      };
      suppliers: {
        Row: {
          address: string | null;
          contact_email: string | null;
          contact_phone: string | null;
          created_at: string | null;
          id: string;
          is_active: boolean | null;
          name: string;
          payable_account_id: string;
          tax_id: string | null;
          updated_at: string | null;
        };
        Insert: {
          address?: string | null;
          contact_email?: string | null;
          contact_phone?: string | null;
          created_at?: string | null;
          id?: string;
          is_active?: boolean | null;
          name: string;
          payable_account_id: string;
          tax_id?: string | null;
          updated_at?: string | null;
        };
        Update: {
          address?: string | null;
          contact_email?: string | null;
          contact_phone?: string | null;
          created_at?: string | null;
          id?: string;
          is_active?: boolean | null;
          name?: string;
          payable_account_id?: string;
          tax_id?: string | null;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "suppliers_payable_account_id_fkey";
            columns: ["payable_account_id"];
            isOneToOne: false;
            referencedRelation: "chart_of_accounts";
            referencedColumns: ["id"];
          },
        ];
      };
      units_of_measure: {
        Row: {
          abbreviation: string;
          created_at: string | null;
          id: string;
          name: string;
          updated_at: string | null;
        };
        Insert: {
          abbreviation: string;
          created_at?: string | null;
          id?: string;
          name: string;
          updated_at?: string | null;
        };
        Update: {
          abbreviation?: string;
          created_at?: string | null;
          id?: string;
          name?: string;
          updated_at?: string | null;
        };
        Relationships: [];
      };
      uom_conversions: {
        Row: {
          conversion_factor: number;
          created_at: string | null;
          from_uom_id: string;
          id: string;
          to_uom_id: string;
          updated_at: string | null;
        };
        Insert: {
          conversion_factor: number;
          created_at?: string | null;
          from_uom_id: string;
          id?: string;
          to_uom_id: string;
          updated_at?: string | null;
        };
        Update: {
          conversion_factor?: number;
          created_at?: string | null;
          from_uom_id?: string;
          id?: string;
          to_uom_id?: string;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "uom_conversions_from_uom_id_fkey";
            columns: ["from_uom_id"];
            isOneToOne: false;
            referencedRelation: "units_of_measure";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "uom_conversions_to_uom_id_fkey";
            columns: ["to_uom_id"];
            isOneToOne: false;
            referencedRelation: "units_of_measure";
            referencedColumns: ["id"];
          },
        ];
      };
      variation_attributes: {
        Row: {
          attribute_value_id: string;
          id: string;
          variation_id: string;
        };
        Insert: {
          attribute_value_id: string;
          id?: string;
          variation_id: string;
        };
        Update: {
          attribute_value_id?: string;
          id?: string;
          variation_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "variation_attributes_attribute_value_id_fkey";
            columns: ["attribute_value_id"];
            isOneToOne: false;
            referencedRelation: "attribute_values";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "variation_attributes_variation_id_fkey";
            columns: ["variation_id"];
            isOneToOne: false;
            referencedRelation: "product_variations";
            referencedColumns: ["id"];
          },
        ];
      };
      warehouse_bins: {
        Row: {
          barcode: string | null;
          code: string;
          created_at: string | null;
          id: string;
          name: string;
          updated_at: string | null;
          zone_id: string;
        };
        Insert: {
          barcode?: string | null;
          code: string;
          created_at?: string | null;
          id?: string;
          name: string;
          updated_at?: string | null;
          zone_id: string;
        };
        Update: {
          barcode?: string | null;
          code?: string;
          created_at?: string | null;
          id?: string;
          name?: string;
          updated_at?: string | null;
          zone_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "warehouse_bins_zone_id_fkey";
            columns: ["zone_id"];
            isOneToOne: false;
            referencedRelation: "warehouse_zones";
            referencedColumns: ["id"];
          },
        ];
      };
      warehouse_zones: {
        Row: {
          code: string;
          created_at: string | null;
          id: string;
          name: string;
          updated_at: string | null;
          warehouse_id: string;
        };
        Insert: {
          code: string;
          created_at?: string | null;
          id?: string;
          name: string;
          updated_at?: string | null;
          warehouse_id: string;
        };
        Update: {
          code?: string;
          created_at?: string | null;
          id?: string;
          name?: string;
          updated_at?: string | null;
          warehouse_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "warehouse_zones_warehouse_id_fkey";
            columns: ["warehouse_id"];
            isOneToOne: false;
            referencedRelation: "warehouses";
            referencedColumns: ["id"];
          },
        ];
      };
      warehouses: {
        Row: {
          address: string | null;
          code: string;
          created_at: string | null;
          id: string;
          is_active: boolean | null;
          name: string;
          updated_at: string | null;
        };
        Insert: {
          address?: string | null;
          code: string;
          created_at?: string | null;
          id?: string;
          is_active?: boolean | null;
          name: string;
          updated_at?: string | null;
        };
        Update: {
          address?: string | null;
          code?: string;
          created_at?: string | null;
          id?: string;
          is_active?: boolean | null;
          name?: string;
          updated_at?: string | null;
        };
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      has_role:
        | {
            Args: {
              _role: Database["public"]["Enums"]["app_role"];
              _user_id: string;
            };
            Returns: boolean;
          }
        | { Args: { role_name: string }; Returns: boolean };
    };
    Enums: {
      app_role: "admin" | "moderator" | "user";
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">;

type DefaultSchema = DatabaseWithoutInternals[Extract<
  keyof Database,
  "public"
>];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    keyof DefaultSchema["Tables"] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    keyof DefaultSchema["Tables"] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    keyof DefaultSchema["Enums"] | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      app_role: ["admin", "moderator", "user"],
    },
  },
} as const;
