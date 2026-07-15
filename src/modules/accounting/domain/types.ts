import { Database } from "@/integrations/supabase/types";

type PublicSchema = Database["public"]["Tables"];

export type ChartOfAccount = PublicSchema["chart_of_accounts"]["Row"];
export type JournalEntry = PublicSchema["journal_entries"]["Row"];
export type JournalEntryLine = PublicSchema["journal_entry_lines"]["Row"];
export type FiscalYear = PublicSchema["fiscal_years"]["Row"];
export type AccountBalance = PublicSchema["account_balances"]["Row"];

export type CreateJournalEntryPayload = {
  posting_date: string;
  reference_type?: string;
  reference_id?: string;
  narration?: string;
  lines: {
    account_id: string;
    debit_amount: number;
    credit_amount: number;
    narration?: string;
  }[];
};

export type TrialBalanceRow = {
  account_id: string;
  account_number: string;
  account_name: string;
  total_debit: number;
  total_credit: number;
  balance: number;
};
