import { z } from "zod";

export const subscriptionLineSchema = z.object({
  productId: z.string().min(1, "Choose a product"),
  variantId: z.string().optional().nullable(),
  description: z.string().max(200).optional().nullable(),
  quantity: z.coerce.number().int().min(1, "Quantity must be at least 1"),
  unitPrice: z.coerce.number().min(0, "Price cannot be negative"),
  taxRate: z.coerce.number().min(0).max(100),
});

export const subscriptionSchema = z
  .object({
    customerId: z.string().min(1, "Choose a customer"),
    planId: z.string().min(1, "Choose a plan"),
    startDate: z.coerce.date({ message: "Start date is required" }),
    expiryDate: z.coerce.date({ message: "Expiry date is required" }),
    quotationExpiry: z.coerce.date().optional().nullable(),
    paymentTerms: z.coerce.number().int().min(0).max(365),
    discountId: z.string().optional().nullable(),
    notes: z.string().max(1000).optional().nullable(),
    lines: z.array(subscriptionLineSchema).min(1, "Add at least one line"),
  })
  .refine((v) => v.expiryDate > v.startDate, {
    message: "Expiry must be after the start date",
    path: ["expiryDate"],
  });

export type SubscriptionInput = z.infer<typeof subscriptionSchema>;
export type SubscriptionLineInput = z.infer<typeof subscriptionLineSchema>;
