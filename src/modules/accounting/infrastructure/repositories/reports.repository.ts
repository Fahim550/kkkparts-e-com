import { supabase } from "@/integrations/supabase/client";
import { TrialBalanceRow } from "../../domain/types";
import { CoaRepository } from "./coa.repository";

export class ReportsRepository {
  static async getTrialBalance(): Promise<TrialBalanceRow[]> {
    const fiscalYear = await CoaRepository.getActiveFiscalYear();

    const { data, error } = await supabase
      .from("account_balances")
      .select(`
        total_debit,
        total_credit,
        chart_of_accounts(id, account_number, name, account_type)
      `)
      .eq("fiscal_year_id", fiscalYear.id);

    if (error) throw error;

    const tb: TrialBalanceRow[] = [];
    
    if (data) {
      data.forEach((b: any) => {
        const coa = b.chart_of_accounts;
        const debit = Number(b.total_debit);
        const credit = Number(b.total_credit);
        
        // Compute net balance based on standard accounting rules
        // Normal Debit balance accounts: Asset, Expense
        // Normal Credit balance accounts: Liability, Equity, Revenue
        let balance = 0;
        if (coa.account_type === 'Asset' || coa.account_type === 'Expense') {
          balance = debit - credit;
        } else {
          balance = credit - debit;
        }

        tb.push({
          account_id: coa.id,
          account_number: coa.account_number,
          account_name: coa.name,
          account_type: coa.account_type,
          total_debit: debit,
          total_credit: credit,
          balance: balance
        });
      });
    }

    // Sort by account number
    return tb.sort((a, b) => a.account_number.localeCompare(b.account_number));
  }
}
