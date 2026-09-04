import { supabase } from "@/integrations/supabase/client";
import { TrialBalanceRow } from "../../domain/types";
import { CoaRepository } from "./coa.repository";

export class ReportsRepository {
  static async getTrialBalance(): Promise<TrialBalanceRow[]> {
    try {
      const fiscalYear = await CoaRepository.getActiveFiscalYear();
      if (!fiscalYear?.id) {
        return [];
      }

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
          if (!coa) return;

          const debit = Number(b.total_debit || 0);
          const credit = Number(b.total_credit || 0);

          // Compute net balance based on standard accounting rules:
          // Normal Debit balance accounts: Asset, Expense
          // Normal Credit balance accounts: Liability, Equity, Revenue
          let balance = 0;
          const accountType = coa.account_type || "Asset";
          if (accountType === "Asset" || accountType === "Expense") {
            balance = debit - credit;
          } else {
            balance = credit - debit;
          }

          tb.push({
            account_id: coa.id,
            account_number: coa.account_number || "",
            account_name: coa.name || "Unnamed Account",
            account_type: accountType,
            total_debit: debit,
            total_credit: credit,
            balance: balance,
          });
        });
      }

      // Sort by account number
      return tb.sort((a, b) => (a.account_number || "").localeCompare(b.account_number || ""));
    } catch (err) {
      console.error("[ReportsRepository] getTrialBalance error:", err);
      return [];
    }
  }
}
