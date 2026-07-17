-- DROP LEGACY E-COMMERCE TABLES
-- This script cleans up the old database schema to make way for the new ERP architecture.
-- CASCADE is used to ensure any foreign key dependencies are also dropped.

DROP TABLE IF EXISTS public.reviews CASCADE;
DROP TABLE IF EXISTS public.product_variations CASCADE;
DROP TABLE IF EXISTS public.visitor_sessions CASCADE;
DROP TABLE IF EXISTS public.page_views CASCADE;
DROP TABLE IF EXISTS public.categories CASCADE;
DROP TABLE IF EXISTS public.page_contents CASCADE;
DROP TABLE IF EXISTS public.products CASCADE;
DROP TABLE IF EXISTS public.orders CASCADE;
DROP TABLE IF EXISTS public.coupons CASCADE;
DROP TABLE IF EXISTS public.banners CASCADE;
DROP TABLE IF EXISTS public.site_settings CASCADE;
DROP TABLE IF EXISTS public.job_applications CASCADE;
DROP TABLE IF EXISTS public.user_roles CASCADE;
DROP TABLE IF EXISTS public.checkout_leads CASCADE;
DROP TABLE IF EXISTS public.dealers CASCADE;
DROP TABLE IF EXISTS public.contact_messages CASCADE;
-- MODULE 1: Product & Inventory Foundation

CREATE TABLE brands (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR NOT NULL UNIQUE,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX idx_brands_name ON brands(name);

CREATE TABLE categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    parent_id UUID REFERENCES categories(id) ON DELETE RESTRICT,
    name VARCHAR NOT NULL,
    slug VARCHAR NOT NULL UNIQUE,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    CONSTRAINT check_category_parent CHECK (id != parent_id)
);
CREATE INDEX idx_categories_parent_id ON categories(parent_id);
CREATE INDEX idx_categories_slug ON categories(slug);

CREATE TABLE units_of_measure (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR NOT NULL UNIQUE,
    abbreviation VARCHAR NOT NULL UNIQUE,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE uom_conversions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    from_uom_id UUID NOT NULL REFERENCES units_of_measure(id),
    to_uom_id UUID NOT NULL REFERENCES units_of_measure(id),
    conversion_factor NUMERIC(15,6) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(from_uom_id, to_uom_id),
    CONSTRAINT check_conversion_factor CHECK (conversion_factor > 0 AND from_uom_id != to_uom_id)
);

CREATE TABLE attributes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR NOT NULL UNIQUE,
    display_type VARCHAR NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE attribute_values (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    attribute_id UUID NOT NULL REFERENCES attributes(id) ON DELETE CASCADE,
    value VARCHAR NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(attribute_id, value)
);
CREATE INDEX idx_attr_values_attr_id ON attribute_values(attribute_id);

CREATE TABLE products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    item_code VARCHAR NOT NULL UNIQUE,
    name VARCHAR NOT NULL,
    description TEXT,
    category_id UUID NOT NULL REFERENCES categories(id),
    brand_id UUID REFERENCES brands(id),
    base_uom_id UUID NOT NULL REFERENCES units_of_measure(id),
    has_variants BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX idx_products_category ON products(category_id);
CREATE INDEX idx_products_brand ON products(brand_id);

CREATE TABLE product_attributes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    attribute_id UUID NOT NULL REFERENCES attributes(id) ON DELETE CASCADE,
    UNIQUE(product_id, attribute_id)
);

CREATE TABLE product_variations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    sku VARCHAR NOT NULL UNIQUE,
    barcode VARCHAR UNIQUE,
    weight NUMERIC(10,3),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX idx_variations_sku ON product_variations(sku);
CREATE INDEX idx_variations_barcode ON product_variations(barcode);
CREATE INDEX idx_variations_product ON product_variations(product_id);

CREATE TABLE variation_attributes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    variation_id UUID NOT NULL REFERENCES product_variations(id) ON DELETE CASCADE,
    attribute_value_id UUID NOT NULL REFERENCES attribute_values(id) ON DELETE RESTRICT,
    UNIQUE(variation_id, attribute_value_id)
);
CREATE INDEX idx_var_attrs_variation ON variation_attributes(variation_id);
CREATE INDEX idx_var_attrs_value ON variation_attributes(attribute_value_id);
-- MODULE 2: Warehouse & Stock Ledger

CREATE TABLE warehouses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR NOT NULL UNIQUE,
    code VARCHAR NOT NULL UNIQUE,
    address TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE warehouse_zones (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    warehouse_id UUID NOT NULL REFERENCES warehouses(id) ON DELETE CASCADE,
    name VARCHAR NOT NULL,
    code VARCHAR NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(warehouse_id, code)
);

CREATE TABLE warehouse_bins (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    zone_id UUID NOT NULL REFERENCES warehouse_zones(id) ON DELETE CASCADE,
    name VARCHAR NOT NULL,
    code VARCHAR NOT NULL,
    barcode VARCHAR UNIQUE,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(zone_id, code)
);

CREATE TABLE stock_ledgers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    transaction_date TIMESTAMPTZ NOT NULL DEFAULT now(),
    variation_id UUID NOT NULL REFERENCES product_variations(id) ON DELETE RESTRICT,
    warehouse_id UUID NOT NULL REFERENCES warehouses(id) ON DELETE RESTRICT,
    bin_id UUID REFERENCES warehouse_bins(id) ON DELETE RESTRICT,
    quantity NUMERIC(15,6) NOT NULL,
    uom_id UUID NOT NULL REFERENCES units_of_measure(id) ON DELETE RESTRICT,
    reference_type VARCHAR NOT NULL,
    reference_id UUID NOT NULL,
    batch_number VARCHAR,
    serial_number VARCHAR,
    created_at TIMESTAMPTZ DEFAULT now(),
    CONSTRAINT check_quantity_not_zero CHECK (quantity != 0)
);
CREATE INDEX idx_ledger_variation_warehouse ON stock_ledgers(variation_id, warehouse_id);
CREATE INDEX idx_ledger_reference ON stock_ledgers(reference_type, reference_id);

CREATE TABLE stock_balances (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    variation_id UUID NOT NULL REFERENCES product_variations(id) ON DELETE RESTRICT,
    warehouse_id UUID NOT NULL REFERENCES warehouses(id) ON DELETE RESTRICT,
    bin_id UUID REFERENCES warehouse_bins(id) ON DELETE RESTRICT,
    batch_number VARCHAR,
    quantity NUMERIC(15,6) NOT NULL DEFAULT 0,
    last_updated_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE NULLS NOT DISTINCT (variation_id, warehouse_id, bin_id, batch_number)
);
-- MODULE 3: Accounting & Financial Ledger

CREATE TABLE fiscal_years (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR NOT NULL UNIQUE,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    is_closed BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE chart_of_accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    account_number VARCHAR NOT NULL UNIQUE,
    name VARCHAR NOT NULL,
    account_type VARCHAR NOT NULL,
    parent_id UUID REFERENCES chart_of_accounts(id) ON DELETE RESTRICT,
    is_group BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX idx_coa_parent ON chart_of_accounts(parent_id);
CREATE INDEX idx_coa_type ON chart_of_accounts(account_type);

CREATE TABLE journal_entries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    entry_number VARCHAR NOT NULL UNIQUE,
    posting_date DATE NOT NULL,
    fiscal_year_id UUID NOT NULL REFERENCES fiscal_years(id) ON DELETE RESTRICT,
    reference_type VARCHAR,
    reference_id UUID,
    narration TEXT,
    status VARCHAR NOT NULL DEFAULT 'Draft',
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX idx_je_posting_date ON journal_entries(posting_date);
CREATE INDEX idx_je_reference ON journal_entries(reference_type, reference_id);

CREATE TABLE journal_entry_lines (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    journal_entry_id UUID NOT NULL REFERENCES journal_entries(id) ON DELETE CASCADE,
    account_id UUID NOT NULL REFERENCES chart_of_accounts(id) ON DELETE RESTRICT,
    party_type VARCHAR,
    party_id UUID,
    debit_amount NUMERIC(15,6) NOT NULL DEFAULT 0,
    credit_amount NUMERIC(15,6) NOT NULL DEFAULT 0,
    narration TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    CONSTRAINT check_positive_amounts CHECK (debit_amount >= 0 AND credit_amount >= 0),
    CONSTRAINT check_single_sided CHECK ((debit_amount > 0 AND credit_amount = 0) OR (debit_amount = 0 AND credit_amount > 0) OR (debit_amount = 0 AND credit_amount = 0))
);
CREATE INDEX idx_jel_account ON journal_entry_lines(account_id);
CREATE INDEX idx_jel_party ON journal_entry_lines(party_type, party_id);

CREATE TABLE account_balances (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    account_id UUID NOT NULL REFERENCES chart_of_accounts(id) ON DELETE CASCADE,
    fiscal_year_id UUID NOT NULL REFERENCES fiscal_years(id) ON DELETE CASCADE,
    total_debit NUMERIC(15,6) NOT NULL DEFAULT 0,
    total_credit NUMERIC(15,6) NOT NULL DEFAULT 0,
    balance NUMERIC(15,6) NOT NULL DEFAULT 0,
    last_updated_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(account_id, fiscal_year_id)
);
-- MODULE 4: Purchasing & Procure-to-Pay

CREATE TABLE suppliers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR NOT NULL UNIQUE,
    tax_id VARCHAR,
    contact_email VARCHAR,
    contact_phone VARCHAR,
    address TEXT,
    payable_account_id UUID NOT NULL REFERENCES chart_of_accounts(id) ON DELETE RESTRICT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE purchase_orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    po_number VARCHAR NOT NULL UNIQUE,
    supplier_id UUID NOT NULL REFERENCES suppliers(id) ON DELETE RESTRICT,
    order_date DATE NOT NULL,
    expected_delivery_date DATE,
    status VARCHAR NOT NULL DEFAULT 'Draft',
    total_amount NUMERIC(15,6) NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE purchase_order_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    purchase_order_id UUID NOT NULL REFERENCES purchase_orders(id) ON DELETE CASCADE,
    variation_id UUID NOT NULL REFERENCES product_variations(id) ON DELETE RESTRICT,
    uom_id UUID NOT NULL REFERENCES units_of_measure(id) ON DELETE RESTRICT,
    quantity_ordered NUMERIC(15,6) NOT NULL,
    quantity_received NUMERIC(15,6) NOT NULL DEFAULT 0,
    unit_price NUMERIC(15,6) NOT NULL,
    total_price NUMERIC(15,6) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE purchase_receipts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    receipt_number VARCHAR NOT NULL UNIQUE,
    purchase_order_id UUID REFERENCES purchase_orders(id) ON DELETE SET NULL,
    supplier_id UUID NOT NULL REFERENCES suppliers(id) ON DELETE RESTRICT,
    receipt_date DATE NOT NULL,
    warehouse_id UUID NOT NULL REFERENCES warehouses(id) ON DELETE RESTRICT,
    status VARCHAR NOT NULL DEFAULT 'Draft',
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE purchase_receipt_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    purchase_receipt_id UUID NOT NULL REFERENCES purchase_receipts(id) ON DELETE CASCADE,
    po_item_id UUID REFERENCES purchase_order_items(id) ON DELETE SET NULL,
    variation_id UUID NOT NULL REFERENCES product_variations(id) ON DELETE RESTRICT,
    quantity_received NUMERIC(15,6) NOT NULL,
    uom_id UUID NOT NULL REFERENCES units_of_measure(id) ON DELETE RESTRICT,
    bin_id UUID REFERENCES warehouse_bins(id) ON DELETE RESTRICT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    CONSTRAINT check_positive_received CHECK (quantity_received > 0)
);

CREATE TABLE purchase_invoices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    invoice_number VARCHAR NOT NULL UNIQUE,
    supplier_invoice_number VARCHAR NOT NULL,
    supplier_id UUID NOT NULL REFERENCES suppliers(id) ON DELETE RESTRICT,
    purchase_receipt_id UUID REFERENCES purchase_receipts(id) ON DELETE SET NULL,
    invoice_date DATE NOT NULL,
    due_date DATE NOT NULL,
    status VARCHAR NOT NULL DEFAULT 'Draft',
    total_amount NUMERIC(15,6) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(supplier_id, supplier_invoice_number)
);

CREATE TABLE purchase_invoice_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    purchase_invoice_id UUID NOT NULL REFERENCES purchase_invoices(id) ON DELETE CASCADE,
    receipt_item_id UUID REFERENCES purchase_receipt_items(id) ON DELETE SET NULL,
    variation_id UUID NOT NULL REFERENCES product_variations(id) ON DELETE RESTRICT,
    quantity_billed NUMERIC(15,6) NOT NULL,
    unit_price NUMERIC(15,6) NOT NULL,
    amount NUMERIC(15,6) NOT NULL,
    expense_account_id UUID REFERENCES chart_of_accounts(id) ON DELETE RESTRICT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);
-- MODULE 5: Sales & Order-to-Cash

CREATE TABLE customers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR NOT NULL UNIQUE,
    tax_id VARCHAR,
    contact_email VARCHAR,
    contact_phone VARCHAR,
    billing_address TEXT,
    shipping_address TEXT,
    receivable_account_id UUID NOT NULL REFERENCES chart_of_accounts(id) ON DELETE RESTRICT,
    credit_limit NUMERIC(15,6) NOT NULL DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX idx_customers_name ON customers(name);

CREATE TABLE sales_orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    so_number VARCHAR NOT NULL UNIQUE,
    customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE RESTRICT,
    order_date DATE NOT NULL,
    delivery_date DATE,
    status VARCHAR NOT NULL DEFAULT 'Draft',
    total_amount NUMERIC(15,6) NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX idx_so_customer ON sales_orders(customer_id);
CREATE INDEX idx_so_status ON sales_orders(status);

CREATE TABLE sales_order_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sales_order_id UUID NOT NULL REFERENCES sales_orders(id) ON DELETE CASCADE,
    variation_id UUID NOT NULL REFERENCES product_variations(id) ON DELETE RESTRICT,
    uom_id UUID NOT NULL REFERENCES units_of_measure(id) ON DELETE RESTRICT,
    quantity_ordered NUMERIC(15,6) NOT NULL,
    quantity_delivered NUMERIC(15,6) NOT NULL DEFAULT 0,
    unit_price NUMERIC(15,6) NOT NULL,
    discount_amount NUMERIC(15,6) NOT NULL DEFAULT 0,
    total_price NUMERIC(15,6) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE delivery_notes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    delivery_number VARCHAR NOT NULL UNIQUE,
    sales_order_id UUID REFERENCES sales_orders(id) ON DELETE SET NULL,
    customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE RESTRICT,
    delivery_date DATE NOT NULL,
    warehouse_id UUID NOT NULL REFERENCES warehouses(id) ON DELETE RESTRICT,
    status VARCHAR NOT NULL DEFAULT 'Draft',
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE delivery_note_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    delivery_note_id UUID NOT NULL REFERENCES delivery_notes(id) ON DELETE CASCADE,
    so_item_id UUID REFERENCES sales_order_items(id) ON DELETE SET NULL,
    variation_id UUID NOT NULL REFERENCES product_variations(id) ON DELETE RESTRICT,
    quantity_delivered NUMERIC(15,6) NOT NULL,
    uom_id UUID NOT NULL REFERENCES units_of_measure(id) ON DELETE RESTRICT,
    bin_id UUID REFERENCES warehouse_bins(id) ON DELETE RESTRICT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    CONSTRAINT check_positive_delivered CHECK (quantity_delivered > 0)
);

CREATE TABLE sales_invoices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    invoice_number VARCHAR NOT NULL UNIQUE,
    customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE RESTRICT,
    sales_order_id UUID REFERENCES sales_orders(id) ON DELETE SET NULL,
    delivery_note_id UUID REFERENCES delivery_notes(id) ON DELETE SET NULL,
    invoice_date DATE NOT NULL,
    due_date DATE NOT NULL,
    status VARCHAR NOT NULL DEFAULT 'Draft',
    total_amount NUMERIC(15,6) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE sales_invoice_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sales_invoice_id UUID NOT NULL REFERENCES sales_invoices(id) ON DELETE CASCADE,
    delivery_item_id UUID REFERENCES delivery_note_items(id) ON DELETE SET NULL,
    variation_id UUID NOT NULL REFERENCES product_variations(id) ON DELETE RESTRICT,
    quantity_billed NUMERIC(15,6) NOT NULL,
    unit_price NUMERIC(15,6) NOT NULL,
    amount NUMERIC(15,6) NOT NULL,
    revenue_account_id UUID REFERENCES chart_of_accounts(id) ON DELETE RESTRICT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);
-- MODULE 6: FIFO Cost Valuation Engine

CREATE TABLE fifo_ledgers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    variation_id UUID NOT NULL REFERENCES product_variations(id) ON DELETE RESTRICT,
    warehouse_id UUID NOT NULL REFERENCES warehouses(id) ON DELETE RESTRICT,
    inbound_reference_type VARCHAR NOT NULL,
    inbound_reference_id UUID NOT NULL,
    transaction_date TIMESTAMPTZ NOT NULL,
    original_quantity NUMERIC(15,6) NOT NULL,
    quantity_remaining NUMERIC(15,6) NOT NULL,
    unit_cost NUMERIC(15,6) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX idx_fifo_variation_warehouse ON fifo_ledgers(variation_id, warehouse_id);
CREATE INDEX idx_fifo_remaining ON fifo_ledgers(quantity_remaining);

CREATE TABLE cogs_entries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    fifo_ledger_id UUID NOT NULL REFERENCES fifo_ledgers(id) ON DELETE RESTRICT,
    outbound_reference_type VARCHAR NOT NULL,
    outbound_reference_id UUID NOT NULL,
    quantity_deducted NUMERIC(15,6) NOT NULL,
    unit_cost_applied NUMERIC(15,6) NOT NULL,
    total_cogs NUMERIC(15,6) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX idx_cogs_outbound_ref ON cogs_entries(outbound_reference_type, outbound_reference_id);
CREATE INDEX idx_cogs_fifo_ledger ON cogs_entries(fifo_ledger_id);
-- MODULE 7: POS (Point of Sale) Engine

CREATE TABLE pos_registers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR NOT NULL UNIQUE,
    warehouse_id UUID NOT NULL REFERENCES warehouses(id) ON DELETE RESTRICT,
    default_cash_account_id UUID REFERENCES chart_of_accounts(id) ON DELETE RESTRICT,
    default_card_account_id UUID REFERENCES chart_of_accounts(id) ON DELETE RESTRICT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE pos_shifts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    register_id UUID NOT NULL REFERENCES pos_registers(id) ON DELETE RESTRICT,
    user_id UUID NOT NULL, -- Assuming auth.users or similar
    opened_at TIMESTAMPTZ NOT NULL,
    closed_at TIMESTAMPTZ,
    opening_cash NUMERIC(15,6) NOT NULL,
    closing_cash_expected NUMERIC(15,6),
    closing_cash_actual NUMERIC(15,6),
    status VARCHAR NOT NULL DEFAULT 'Open'
);
CREATE INDEX idx_pos_shifts_status ON pos_shifts(status);

CREATE TABLE pos_receipts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    receipt_number VARCHAR NOT NULL UNIQUE,
    shift_id UUID NOT NULL REFERENCES pos_shifts(id) ON DELETE RESTRICT,
    customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
    transaction_date TIMESTAMPTZ NOT NULL,
    total_amount NUMERIC(15,6) NOT NULL,
    tax_amount NUMERIC(15,6) NOT NULL DEFAULT 0,
    discount_amount NUMERIC(15,6) NOT NULL DEFAULT 0,
    status VARCHAR NOT NULL DEFAULT 'Draft',
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX idx_pos_receipt_shift ON pos_receipts(shift_id);
CREATE INDEX idx_pos_receipt_date ON pos_receipts(transaction_date);

CREATE TABLE pos_receipt_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    receipt_id UUID NOT NULL REFERENCES pos_receipts(id) ON DELETE CASCADE,
    variation_id UUID NOT NULL REFERENCES product_variations(id) ON DELETE RESTRICT,
    quantity NUMERIC(15,6) NOT NULL,
    unit_price NUMERIC(15,6) NOT NULL,
    total_price NUMERIC(15,6) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE pos_payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    receipt_id UUID NOT NULL REFERENCES pos_receipts(id) ON DELETE CASCADE,
    payment_method VARCHAR NOT NULL,
    amount NUMERIC(15,6) NOT NULL,
    reference_code VARCHAR,
    created_at TIMESTAMPTZ DEFAULT now()
);
-- MODULE 8: Pricing & Discount Engine

CREATE TABLE price_lists (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR NOT NULL UNIQUE,
    currency VARCHAR NOT NULL DEFAULT 'BDT',
    is_tax_included BOOLEAN NOT NULL DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE price_list_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    price_list_id UUID NOT NULL REFERENCES price_lists(id) ON DELETE CASCADE,
    variation_id UUID NOT NULL REFERENCES product_variations(id) ON DELETE RESTRICT,
    uom_id UUID NOT NULL REFERENCES units_of_measure(id) ON DELETE RESTRICT,
    price NUMERIC(15,6) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(price_list_id, variation_id, uom_id)
);

CREATE TABLE discount_rules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR NOT NULL,
    priority INTEGER NOT NULL DEFAULT 0,
    discount_type VARCHAR NOT NULL,
    discount_value NUMERIC(15,6) NOT NULL,
    valid_from TIMESTAMPTZ,
    valid_to TIMESTAMPTZ,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE discount_rule_conditions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    discount_rule_id UUID NOT NULL REFERENCES discount_rules(id) ON DELETE CASCADE,
    condition_type VARCHAR NOT NULL,
    condition_value VARCHAR NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);
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
-- MODULE 6: Customer Groups

ALTER TABLE customers
ADD COLUMN customer_group VARCHAR DEFAULT 'General';
