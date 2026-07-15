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
