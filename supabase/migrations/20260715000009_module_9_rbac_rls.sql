-- MODULE 9: Authentication, RBAC, and RLS

-- 1. Create RBAC Tables
CREATE TABLE erp_users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name VARCHAR,
    email VARCHAR,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE erp_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR NOT NULL UNIQUE
);

CREATE TABLE erp_user_roles (
    user_id UUID NOT NULL REFERENCES erp_users(id) ON DELETE CASCADE,
    role_id UUID NOT NULL REFERENCES erp_roles(id) ON DELETE CASCADE,
    PRIMARY KEY (user_id, role_id)
);
CREATE INDEX idx_erp_user_roles_user ON erp_user_roles(user_id);

-- Insert default roles
INSERT INTO erp_roles (name) VALUES 
('Admin'), 
('WarehouseManager'), 
('Accountant'), 
('Purchasing'), 
('Sales'), 
('Cashier')
ON CONFLICT DO NOTHING;

-- 2. Auth Helper Function
CREATE OR REPLACE FUNCTION public.has_role(role_name text)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER -- Runs with elevated privileges to check user roles
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.erp_user_roles ur
    JOIN public.erp_roles r ON ur.role_id = r.id
    WHERE ur.user_id = auth.uid()
    AND r.name = role_name
  );
$$;

-- 3. Enable RLS on ALL tables
ALTER TABLE brands ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE units_of_measure ENABLE ROW LEVEL SECURITY;
ALTER TABLE uom_conversions ENABLE ROW LEVEL SECURITY;
ALTER TABLE attributes ENABLE ROW LEVEL SECURITY;
ALTER TABLE attribute_values ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_attributes ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_variations ENABLE ROW LEVEL SECURITY;
ALTER TABLE variation_attributes ENABLE ROW LEVEL SECURITY;
ALTER TABLE warehouses ENABLE ROW LEVEL SECURITY;
ALTER TABLE warehouse_zones ENABLE ROW LEVEL SECURITY;
ALTER TABLE warehouse_bins ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_ledgers ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_balances ENABLE ROW LEVEL SECURITY;
ALTER TABLE fiscal_years ENABLE ROW LEVEL SECURITY;
ALTER TABLE chart_of_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE journal_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE journal_entry_lines ENABLE ROW LEVEL SECURITY;
ALTER TABLE account_balances ENABLE ROW LEVEL SECURITY;
ALTER TABLE suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchase_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchase_order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchase_receipts ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchase_receipt_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchase_invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchase_invoice_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales_order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE delivery_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE delivery_note_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales_invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales_invoice_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE fifo_ledgers ENABLE ROW LEVEL SECURITY;
ALTER TABLE cogs_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE pos_registers ENABLE ROW LEVEL SECURITY;
ALTER TABLE pos_shifts ENABLE ROW LEVEL SECURITY;
ALTER TABLE pos_receipts ENABLE ROW LEVEL SECURITY;
ALTER TABLE pos_receipt_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE pos_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE price_lists ENABLE ROW LEVEL SECURITY;
ALTER TABLE price_list_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE discount_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE discount_rule_conditions ENABLE ROW LEVEL SECURITY;
ALTER TABLE erp_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE erp_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE erp_user_roles ENABLE ROW LEVEL SECURITY;

-- 4. Apply Admin Override Policy to ALL tables
DO $$
DECLARE
    tbl_name text;
BEGIN
    FOR tbl_name IN 
        SELECT tablename 
        FROM pg_tables 
        WHERE schemaname = 'public' 
        AND tablename IN (
            'brands', 'categories', 'units_of_measure', 'uom_conversions', 'attributes', 'attribute_values', 
            'products', 'product_attributes', 'product_variations', 'variation_attributes', 'warehouses', 
            'warehouse_zones', 'warehouse_bins', 'stock_ledgers', 'stock_balances', 'fiscal_years', 
            'chart_of_accounts', 'journal_entries', 'journal_entry_lines', 'account_balances', 'suppliers', 
            'purchase_orders', 'purchase_order_items', 'purchase_receipts', 'purchase_receipt_items', 
            'purchase_invoices', 'purchase_invoice_items', 'customers', 'sales_orders', 'sales_order_items', 
            'delivery_notes', 'delivery_note_items', 'sales_invoices', 'sales_invoice_items', 'fifo_ledgers', 
            'cogs_entries', 'pos_registers', 'pos_shifts', 'pos_receipts', 'pos_receipt_items', 'pos_payments', 
            'price_lists', 'price_list_items', 'discount_rules', 'discount_rule_conditions', 
            'erp_users', 'erp_roles', 'erp_user_roles'
        )
    LOOP
        EXECUTE format('CREATE POLICY "Admin Override All Access" ON %I FOR ALL USING (public.has_role(''Admin''));', tbl_name);
    END LOOP;
END $$;

-- 5. Read-Only Policies for Foundational Data (Authenticated users can read so the UI works)
DO $$
DECLARE
    tbl_name text;
BEGIN
    FOR tbl_name IN 
        SELECT tablename 
        FROM pg_tables 
        WHERE schemaname = 'public' 
        AND tablename IN (
            'brands', 'categories', 'units_of_measure', 'uom_conversions', 'attributes', 'attribute_values', 
            'products', 'product_attributes', 'product_variations', 'variation_attributes', 'warehouses', 
            'warehouse_zones', 'warehouse_bins', 'suppliers', 'customers', 'price_lists', 'price_list_items',
            'erp_users', 'erp_roles'
        )
    LOOP
        EXECUTE format('CREATE POLICY "Authenticated users can read foundational data" ON %I FOR SELECT USING (auth.role() = ''authenticated'');', tbl_name);
    END LOOP;
END $$;
