import { z } from "zod";

export const CustomerSchema = z.object({
  name: z.string().min(2, "Customer name must be at least 2 characters"),
  customer_group: z.string().optional(),
  tax_id: z.string().optional(),
  contact_email: z.string().email("Invalid email").or(z.literal("")).optional(),
  contact_phone: z.string().optional(),
  billing_address: z.string().optional(),
  shipping_address: z.string().optional(),
  receivable_account_id: z.string().uuid("Please select a receivable account"),
  credit_limit: z.number().min(0, "Credit limit cannot be negative").default(0),
  is_active: z.boolean().default(true),
});
