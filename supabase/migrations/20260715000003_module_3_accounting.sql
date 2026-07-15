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
