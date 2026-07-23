import { supabase } from "@/integrations/supabase/client";
import { CreateJournalEntryPayload, JournalEntry } from "../../domain/types";
import { CoaRepository } from "./coa.repository";

export type JournalEntryFilters = {
  search?: string;
  referenceType?: string;
  dateFrom?: string;
  dateTo?: string;
};

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
    const randomSuffix = Math.floor(100 + Math.random() * 900);
    const entryNumber = `JE-${dateStr}-${randomSuffix}`;

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
    for (const line of payload.lines) {
      const { data: balanceRecord } = await supabase
        .from("account_balances")
        .select("*")
        .eq("account_id", line.account_id)
        .eq("fiscal_year_id", fiscalYear.id)
        .maybeSingle();

      if (balanceRecord) {
        const newDebit = Number(balanceRecord.total_debit) + line.debit_amount;
        const newCredit = Number(balanceRecord.total_credit) + line.credit_amount;
        await supabase
          .from("account_balances")
          .update({
            total_debit: newDebit,
            total_credit: newCredit,
            balance: newDebit - newCredit,
            last_updated_at: new Date().toISOString(),
          })
          .eq("id", balanceRecord.id);
      } else {
        await supabase
          .from("account_balances")
          .insert({
            account_id: line.account_id,
            fiscal_year_id: fiscalYear.id,
            total_debit: line.debit_amount,
            total_credit: line.credit_amount,
            balance: line.debit_amount - line.credit_amount,
          });
      }
    }

    return je;

  }

  static async getJournalEntryByReference(referenceType: string, referenceId: string): Promise<JournalEntry | null> {
    const { data, error } = await supabase
      .from("journal_entries")
      .select("*")
      .eq("reference_type", referenceType)
      .eq("reference_id", referenceId)
      .maybeSingle();

    if (error) throw error;
    return data;
  }

  static async getJournalEntriesByReferences(referenceType: string, referenceIds: string[]): Promise<JournalEntry[]> {
    if (!referenceIds.length) return [];
    const { data, error } = await supabase
      .from("journal_entries")
      .select("*")
      .eq("reference_type", referenceType)
      .in("reference_id", referenceIds);

    if (error) throw error;
    return data || [];
  }

  static async getAllJournalEntries(filters?: JournalEntryFilters) {
    let query = supabase
      .from("journal_entries")
      .select(`
        *,
        journal_entry_lines (
          *,
          chart_of_accounts (
            id,
            account_number,
            name,
            account_type
          )
        )
      `);

    if (filters?.search) {
      const term = `%${filters.search}%`;
      query = query.or(`entry_number.ilike.${term},narration.ilike.${term}`);
    }

    if (filters?.referenceType && filters.referenceType !== "all") {
      query = query.eq("reference_type", filters.referenceType);
    }

    if (filters?.dateFrom) {
      query = query.gte("posting_date", filters.dateFrom);
    }

    if (filters?.dateTo) {
      query = query.lte("posting_date", filters.dateTo);
    }

    const { data, error } = await query.order("created_at", { ascending: false });

    if (error) throw error;
    return data || [];
  }

}


