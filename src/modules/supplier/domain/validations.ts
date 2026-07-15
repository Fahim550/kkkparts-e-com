import { z } from "zod";

export const SupplierSchema = z.object({
  name: z.string().min(1, "Supplier name is required"),
  contact_email: z.string().email("Invalid email address").optional().or(z.literal("")).nullable(),
  contact_phone: z.string().optional().nullable(),
  address: z.string().optional().nullable(),
  tax_id: z.string().optional().nullable(),
  payable_account_id: z.string().uuid("Payable account is required"),
  is_active: z.boolean().default(true),
});
