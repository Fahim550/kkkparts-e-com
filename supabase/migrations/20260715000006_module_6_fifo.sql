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
