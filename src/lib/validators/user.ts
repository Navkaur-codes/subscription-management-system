import { z } from "zod";
import { emailSchema, passwordSchema } from "./auth";

export const staffSchema = z.object({
  name: z.string().trim().min(2, "Enter a name"),
  email: emailSchema,
  password: passwordSchema,
  role: z.enum(["STAFF", "ADMIN"]),
});

export type StaffInput = z.input<typeof staffSchema>;
