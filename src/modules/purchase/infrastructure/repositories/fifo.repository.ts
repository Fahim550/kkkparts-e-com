import { supabase } from "@/integrations/supabase/client";
import { CreateFifoLedgerDTO } from "../../domain/types";

export class FifoRepository {
  static async createLedger(payload: CreateFifoLedgerDTO): Promise<void> {
    const { error } = await supabase
      .from("fifo_ledgers")
      .insert(payload);

    if (error) throw error;
  }
}
