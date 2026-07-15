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
