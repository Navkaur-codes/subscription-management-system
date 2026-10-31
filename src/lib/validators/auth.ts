import { z } from "zod";

// PS: more than eight characters, with uppercase, lowercase and a special character.
export const passwordSchema = z
  .string()
  .min(9, "Password must be more than 8 characters")
  .regex(/[A-Z]/, "Password needs an uppercase letter")
  .regex(/[a-z]/, "Password needs a lowercase letter")
  .regex(/[^A-Za-z0-9]/, "Password needs a special character");

export const emailSchema = z.string().trim().toLowerCase().email("Enter a valid email");

export const signupSchema = z
  .object({
    name: z.string().trim().min(2, "Enter your name"),
    email: emailSchema,
    password: passwordSchema,
    confirmPassword: z.string(),
  })
  .refine((d) => d.password === d.confirmPassword, {
    path: ["confirmPassword"],
    message: "Passwords do not match",
  });

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, "Enter your password"),
});

export const forgotSchema = z.object({ email: emailSchema });

export const resetSchema = z
  .object({
    token: z.string().min(10),
    password: passwordSchema,
    confirmPassword: z.string(),
  })
  .refine((d) => d.password === d.confirmPassword, {
    path: ["confirmPassword"],
    message: "Passwords do not match",
  });
