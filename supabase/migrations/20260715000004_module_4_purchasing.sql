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
