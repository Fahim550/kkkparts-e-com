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
