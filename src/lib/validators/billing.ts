import { z } from "zod";

export const PAYMENT_METHODS = ["CASH", "BANK_TRANSFER", "CARD", "UPI", "CHEQUE"] as const;

export const paymentSchema = z.object({
  invoiceId: z.string().min(1),
  method: z.enum(PAYMENT_METHODS),
  amount: z.coerce.number().positive("Amount must be greater than 0"),
  paymentDate: z.coerce.date({ invalid_type_error: "Pick a date" }),
  note: z.string().trim().max(500).optional().default(""),
  reference: z.string().trim().max(100).optional().default(""),
});

export type PaymentInput = z.input<typeof paymentSchema>;

export const METHOD_LABEL: Record<(typeof PAYMENT_METHODS)[number], string> = {
  CASH: "Cash",
  BANK_TRANSFER: "Bank transfer",
  CARD: "Card",
  UPI: "UPI",
  CHEQUE: "Cheque",
};
