import { supabase } from "@/integrations/supabase/client";
import { CreateJournalEntryPayload } from "../../domain/types";
import { SYSTEM_ACCOUNTS } from "../../domain/constants";
import { CoaRepository } from "../../infrastructure/repositories/coa.repository";
import { JournalRepository } from "../../infrastructure/repositories/journal.repository";

export class AccountingEngine {
  
  static async postManualJournal(payload: CreateJournalEntryPayload) {
    return JournalRepository.createJournalEntry(payload);
  }

  static async postPosSale(receiptId: string, totalAmount: number, cogsAmount: number, receiptNumber: string, dueAmount: number = 0) {
    // We need to fetch the IDs for our System Accounts
    // 1. Cash, 2. Sales Revenue, 3. COGS, 4. Inventory Asset, 5. Accounts Receivable (if due)
    const cashAcc = await CoaRepository.getAccountByNumber(SYSTEM_ACCOUNTS.CASH);
    const revenueAcc = await CoaRepository.getAccountByNumber(SYSTEM_ACCOUNTS.SALES_REVENUE);
    
    const paidAmount = totalAmount - dueAmount;
    
    const lines: any[] = [];
    
    if (paidAmount > 0) {
      lines.push({ account_id: cashAcc.id, debit_amount: paidAmount, credit_amount: 0, narration: "POS Sale - Paid" });
    }
    
    if (dueAmount > 0) {
      const arAcc = await CoaRepository.getAccountByNumber(SYSTEM_ACCOUNTS.ACCOUNTS_RECEIVABLE);
      lines.push({ account_id: arAcc.id, debit_amount: dueAmount, credit_amount: 0, narration: "POS Sale - Due" });
    }

    lines.push({ account_id: revenueAcc.id, debit_amount: 0, credit_amount: totalAmount, narration: "POS Sale" });

    if (cogsAmount > 0) {
      const cogsAcc = await CoaRepository.getAccountByNumber(SYSTEM_ACCOUNTS.COGS);
      const invAcc = await CoaRepository.getAccountByNumber(SYSTEM_ACCOUNTS.INVENTORY_ASSET);
      lines.push({ account_id: cogsAcc.id, debit_amount: cogsAmount, credit_amount: 0, narration: "Cost of Goods Sold" });
      lines.push({ account_id: invAcc.id, debit_amount: 0, credit_amount: cogsAmount, narration: "Inventory Consumption" });
    }

    return JournalRepository.createJournalEntry({
      posting_date: new Date().toISOString(),
      reference_type: "pos_receipt",
      reference_id: receiptId,
      narration: `POS Sale Receipt ${receiptNumber}`,
      lines: lines
    });
  }

  static async postSalesOrder(orderId: string, orderNumber: string, totalAmount: number, paidAmount: number, customerAccountId?: string) {
    const cashAcc = await CoaRepository.getAccountByNumber(SYSTEM_ACCOUNTS.CASH);
    const revenueAcc = await CoaRepository.getAccountByNumber(SYSTEM_ACCOUNTS.SALES_REVENUE);
    
    const dueAmount = totalAmount - paidAmount;
    const lines: any[] = [];
    
    if (paidAmount > 0) {
      lines.push({ account_id: cashAcc.id, debit_amount: paidAmount, credit_amount: 0, narration: `Sales Order ${orderNumber} - Paid` });
    }
    
    if (dueAmount > 0) {
      let arAccountId = customerAccountId;
      if (!arAccountId) {
        const arAcc = await CoaRepository.getAccountByNumber(SYSTEM_ACCOUNTS.ACCOUNTS_RECEIVABLE);
        arAccountId = arAcc.id;
      }
      lines.push({ account_id: arAccountId, debit_amount: dueAmount, credit_amount: 0, narration: `Sales Order ${orderNumber} - Due` });
    }

    lines.push({ account_id: revenueAcc.id, debit_amount: 0, credit_amount: totalAmount, narration: `Sales Order ${orderNumber}` });

    return JournalRepository.createJournalEntry({
      posting_date: new Date().toISOString(),
      reference_type: "sales_order",
      reference_id: orderId,
      narration: `Sales Order ${orderNumber}`,
      lines: lines
    });
  }

  static async postPurchaseOrder(orderId: string, orderNumber: string, totalAmount: number, paidAmount: number, supplierAccountId?: string) {
    const cashAcc = await CoaRepository.getAccountByNumber(SYSTEM_ACCOUNTS.CASH);
    // For immediate posting, assume inventory is debited (or a general purchase account). Using Inventory to mirror the sales side COGS/Inventory, but actually standard would be Inventory Asset.
    const invAcc = await CoaRepository.getAccountByNumber(SYSTEM_ACCOUNTS.INVENTORY_ASSET);
    
    const dueAmount = totalAmount - paidAmount;
    const lines: any[] = [];
    
    if (paidAmount > 0) {
      lines.push({ account_id: cashAcc.id, debit_amount: 0, credit_amount: paidAmount, narration: `Purchase Order ${orderNumber} - Paid` });
    }
    
    if (dueAmount > 0) {
      let apAccountId = supplierAccountId;
      if (!apAccountId) {
        const apAcc = await CoaRepository.getAccountByNumber(SYSTEM_ACCOUNTS.ACCOUNTS_PAYABLE);
        apAccountId = apAcc.id;
      }
      lines.push({ account_id: apAccountId, debit_amount: 0, credit_amount: dueAmount, narration: `Purchase Order ${orderNumber} - Due` });
    }

    lines.push({ account_id: invAcc.id, debit_amount: totalAmount, credit_amount: 0, narration: `Purchase Order ${orderNumber}` });

    return JournalRepository.createJournalEntry({
      posting_date: new Date().toISOString(),
      reference_type: "purchase_order",
      reference_id: orderId,
      narration: `Purchase Order ${orderNumber}`,
      lines: lines
    });
  }
  static async reverseSalesOrder(orderId: string) {
    const { data: existingJes } = await supabase
      .from("journal_entries")
      .select("*")
      .eq("reference_type", "sales_order")
      .eq("reference_id", orderId);

    if (!existingJes || existingJes.length === 0) return;

    for (const existingJe of existingJes) {
      // Fetch lines
      const { data: lines } = await supabase
        .from("journal_entry_lines")
        .select("*")
        .eq("journal_entry_id", existingJe.id);

      if (lines && lines.length > 0) {
        // Reverse balances
        for (const line of lines) {
          const { data: balanceRecord } = await supabase
            .from("account_balances")
            .select("*")
            .eq("account_id", line.account_id)
            .eq("fiscal_year_id", existingJe.fiscal_year_id)
            .maybeSingle();

          if (balanceRecord) {
            const newDebit = Number(balanceRecord.total_debit) - Number(line.debit_amount || 0);
            const newCredit = Number(balanceRecord.total_credit) - Number(line.credit_amount || 0);
            await supabase
              .from("account_balances")
              .update({
                total_debit: newDebit,
                total_credit: newCredit,
                balance: newDebit - newCredit,
                last_updated_at: new Date().toISOString(),
              })
              .eq("id", balanceRecord.id);
          }
        }

        // Delete lines
        await supabase.from("journal_entry_lines").delete().eq("journal_entry_id", existingJe.id);
      }

      // Delete journal entry
      await supabase.from("journal_entries").delete().eq("id", existingJe.id);
    }
  }

  static async reversePurchaseOrder(orderId: string) {
    const { data: existingJes } = await supabase
      .from("journal_entries")
      .select("*")
      .in("reference_type", ["purchase_order", "purchase_invoice"])
      .eq("reference_id", orderId);

    if (!existingJes || existingJes.length === 0) return;

    for (const existingJe of existingJes) {
      // Fetch lines
      const { data: lines } = await supabase
        .from("journal_entry_lines")
        .select("*")
        .eq("journal_entry_id", existingJe.id);

      if (lines && lines.length > 0) {
        // Reverse balances
        for (const line of lines) {
          const { data: balanceRecord } = await supabase
            .from("account_balances")
            .select("*")
            .eq("account_id", line.account_id)
            .eq("fiscal_year_id", existingJe.fiscal_year_id)
            .maybeSingle();

          if (balanceRecord) {
            const newDebit = Number(balanceRecord.total_debit) - Number(line.debit_amount || 0);
            const newCredit = Number(balanceRecord.total_credit) - Number(line.credit_amount || 0);
            await supabase
              .from("account_balances")
              .update({
                total_debit: newDebit,
                total_credit: newCredit,
                balance: newDebit - newCredit,
                last_updated_at: new Date().toISOString(),
              })
              .eq("id", balanceRecord.id);
          }
        }

        // Delete lines
        await supabase.from("journal_entry_lines").delete().eq("journal_entry_id", existingJe.id);
      }

      // Delete journal entry
      await supabase.from("journal_entries").delete().eq("id", existingJe.id);
    }
  }

  static async postPurchaseReceipt(receiptId: string, totalAmount: number, receiptNumber: string, customPayableAccountId?: string) {
    const existingJe = await JournalRepository.getJournalEntryByReference("purchase_receipt", receiptId);
    if (existingJe) {
      throw new Error(`Journal Entry (${existingJe.entry_number}) has already been posted for receipt ${receiptNumber}.`);
    }

    const invAcc = await CoaRepository.getAccountByNumber(SYSTEM_ACCOUNTS.INVENTORY_ASSET);
    let apAccountId = customPayableAccountId;

    if (!apAccountId) {
      const apAcc = await CoaRepository.getAccountByNumber(SYSTEM_ACCOUNTS.ACCOUNTS_PAYABLE);
      apAccountId = apAcc.id;
    }

    const lines = [
      { account_id: invAcc.id, debit_amount: totalAmount, credit_amount: 0, narration: `Goods Received ${receiptNumber}` },
      { account_id: apAccountId, debit_amount: 0, credit_amount: totalAmount, narration: `Accounts Payable - ${receiptNumber}` }
    ];

    return JournalRepository.createJournalEntry({
      posting_date: new Date().toISOString().split("T")[0],
      reference_type: "purchase_receipt",
      reference_id: receiptId,
      narration: `Purchase Receipt ${receiptNumber}`,
      lines: lines
    });
  }
}
