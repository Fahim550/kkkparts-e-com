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
