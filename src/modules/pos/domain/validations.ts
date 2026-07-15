import { z } from "zod";

export const OpenShiftSchema = z.object({
  register_id: z.string().uuid("Register is required"),
  opening_cash: z.number().min(0, "Opening cash cannot be negative"),
});

export const CloseShiftSchema = z.object({
  closing_cash_actual: z.number().min(0, "Closing cash cannot be negative"),
});

export const PaymentItemSchema = z.object({
  method: z.enum(["Cash", "Card", "Bank Transfer"]),
  amount: z.number().min(0.01, "Amount must be at least 0.01"),
  reference_code: z.string().optional(),
});
