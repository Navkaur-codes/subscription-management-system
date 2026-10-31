import { z } from "zod";
import { emailSchema } from "./auth";

const optional = z
  .string()
  .trim()
  .optional()
  .transform((v) => (v ? v : undefined));

export const customerSchema = z.object({
  name: z.string().trim().min(2, "Enter the customer name"),
  email: emailSchema,
  phone: optional,
  company: optional,
  address: optional,
  city: optional,
  gstin: optional,
});

export type CustomerInput = z.input<typeof customerSchema>;
