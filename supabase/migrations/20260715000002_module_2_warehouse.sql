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
