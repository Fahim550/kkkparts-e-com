import { CreateJournalEntryPayload } from "../../domain/types";
import { SYSTEM_ACCOUNTS } from "../../domain/constants";
import { CoaRepository } from "../../infrastructure/repositories/coa.repository";
import { JournalRepository } from "../../infrastructure/repositories/journal.repository";

export class AccountingEngine {
  
  static async postManualJournal(payload: CreateJournalEntryPayload) {
    return JournalRepository.createJournalEntry(payload);
  }

  static async postPosSale(receiptId: string, totalAmount: number, cogsAmount: number, receiptNumber: string) {
    // We need to fetch the IDs for our System Accounts
    // 1. Cash, 2. Sales Revenue, 3. COGS, 4. Inventory Asset
    const cashAcc = await CoaRepository.getAccountByNumber(SYSTEM_ACCOUNTS.CASH);
    const revenueAcc = await CoaRepository.getAccountByNumber(SYSTEM_ACCOUNTS.SALES_REVENUE);
    
    const lines = [
      { account_id: cashAcc.id, debit_amount: totalAmount, credit_amount: 0, narration: "POS Sale" },
      { account_id: revenueAcc.id, debit_amount: 0, credit_amount: totalAmount, narration: "POS Sale" }
    ];

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

  static async postPurchaseReceipt(receiptId: string, totalAmount: number, receiptNumber: string) {
    const invAcc = await CoaRepository.getAccountByNumber(SYSTEM_ACCOUNTS.INVENTORY_ASSET);
    const apAcc = await CoaRepository.getAccountByNumber(SYSTEM_ACCOUNTS.ACCOUNTS_PAYABLE);

    const lines = [
      { account_id: invAcc.id, debit_amount: totalAmount, credit_amount: 0, narration: "Goods Receive" },
      { account_id: apAcc.id, debit_amount: 0, credit_amount: totalAmount, narration: "Accounts Payable" }
    ];

    return JournalRepository.createJournalEntry({
      posting_date: new Date().toISOString(),
      reference_type: "purchase_receipt",
      reference_id: receiptId,
      narration: `Purchase Receipt ${receiptNumber}`,
      lines: lines
    });
  }
}
