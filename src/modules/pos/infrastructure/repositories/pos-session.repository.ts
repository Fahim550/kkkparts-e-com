import { supabase } from "@/integrations/supabase/client";
import { PosRegister, PosShift } from "../../domain/types";

export class PosSessionRepository {
  static async getRegisters(): Promise<PosRegister[]> {
    const { data, error } = await supabase
      .from("pos_registers")
      .select("*")
      .eq("is_active", true);

    if (error) throw error;
    return data;
  }

  static async getOpenShift(userId: string): Promise<PosShift | null> {
    const { data, error } = await supabase
      .from("pos_shifts")
      .select("*")
      .eq("user_id", userId)
      .eq("status", "Open")
      .maybeSingle();

    if (error) throw error;
    return data;
  }

  static async openShift(registerId: string, userId: string, openingCash: number): Promise<PosShift> {
    const { data, error } = await supabase
      .from("pos_shifts")
      .insert({
        register_id: registerId,
        user_id: userId,
        opening_cash: openingCash,
        opened_at: new Date().toISOString(),
        status: "Open"
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  static async closeShift(shiftId: string, closingCashActual: number): Promise<PosShift> {
    const { data, error } = await supabase
      .from("pos_shifts")
      .update({
        closed_at: new Date().toISOString(),
        closing_cash_actual: closingCashActual,
        status: "Closed"
      })
      .eq("id", shiftId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }
}
