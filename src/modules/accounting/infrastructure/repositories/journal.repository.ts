import { supabase } from "@/integrations/supabase/client";
import { CreateJournalEntryPayload, JournalEntry } from "../../domain/types";
import { CoaRepository } from "./coa.repository";

export class JournalRepository {
  static async createJournalEntry(payload: CreateJournalEntryPayload): Promise<JournalEntry> {
    const fiscalYear = await CoaRepository.getActiveFiscalYear();

    // Verify balance
    const totalDebit = payload.lines.reduce((sum, l) => sum + l.debit_amount, 0);
    const totalCredit = payload.lines.reduce((sum, l) => sum + l.credit_amount, 0);
    
    // Using a small epsilon for floating point comparison
    if (Math.abs(totalDebit - totalCredit) > 0.01) {
      throw new Error(`Journal Entry is unbalanced. Total Debits: ${totalDebit}, Total Credits: ${totalCredit}`);
    }

    const dateStr = new Date().toISOString().replace(/[-T:.Z]/g, "").slice(0, 14);
    const entryNumber = `JE-${dateStr}`;

    // 1. Insert Journal Entry
    const { data: je, error: jeError } = await supabase
      .from("journal_entries")
      .insert({
        entry_number: entryNumber,
        posting_date: payload.posting_date,
        fiscal_year_id: fiscalYear.id,
        reference_type: payload.reference_type,
        reference_id: payload.reference_id,
        narration: payload.narration,
        status: "Posted"
      })
      .select()
      .single();

    if (jeError) throw jeError;

    // 2. Insert Lines
    const linesToInsert = payload.lines.map(line => ({
      journal_entry_id: je.id,
      account_id: line.account_id,
      debit_amount: line.debit_amount,
      credit_amount: line.credit_amount,
      narration: line.narration,
    }));

    const { error: linesError } = await supabase
      .from("journal_entry_lines")
      .insert(linesToInsert);

    if (linesError) throw linesError;

    // 3. Update Account Balances
    // In a production environment, this should ideally be an RPC (stored procedure) for atomicity
    // or handled via DB triggers. For now, we update them manually.
    for (const line of payload.lines) {
      // Check if balance exists
      const { data: balanceRecord } = await supabase
        .from("account_balances")
        .select("*")
        .eq("account_id", line.account_id)
        .eq("fiscal_year_id", fiscalYear.id)
        .maybeSingle();

      if (balanceRecord) {
        // Calculate new balance
        // Typical logic: 
        // Assets/Expenses: Balance = Debit - Credit
        // Liabilities/Equity/Revenue: Balance = Credit - Debit
        // For simplicity, we can just track absolute total_debit and total_credit, 
        // and let the report calculate the net based on account_type.
        
        await supabase
          .from("account_balances")
          .update({
            total_debit: Number(balanceRecord.total_debit) + line.debit_amount,
            total_credit: Number(balanceRecord.total_credit) + line.credit_amount,
            // Assuming absolute diff for standard balance column, or leave it to reports.
            // Let's just track raw debits/credits.
          })
          .eq("id", balanceRecord.id);
      } else {
        // Create balance record
        await supabase
          .from("account_balances")
          .insert({
            account_id: line.account_id,
            fiscal_year_id: fiscalYear.id,
            total_debit: line.debit_amount,
            total_credit: line.credit_amount,
          });
      }
    }

    return je;
  }
}
