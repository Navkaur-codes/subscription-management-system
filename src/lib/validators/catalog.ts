import { z } from "zod";

const optDate = z.preprocess((v) => (v === "" || v == null ? null : v), z.coerce.date().nullable());
const optText = z.preprocess((v) => (typeof v === "string" && v.trim() === "" ? null : v), z.string().trim().nullable());
const optInt = z.preprocess((v) => (v === "" || v == null ? null : v), z.coerce.number().int().min(0).nullable());

export const taxSchema = z.object({
  name: z.string().trim().min(1, "Name is required"),
  rate: z.coerce.number({ message: "Enter a rate" }).min(0, "Rate cannot be negative").max(100, "Rate cannot exceed 100"),
  isActive: z.boolean().default(true),
});
export type TaxInput = z.input<typeof taxSchema>;

export const variantSchema = z.object({
  id: z.string().optional(),
  attribute: z.string().trim().min(1, "Attribute is required"),
  value: z.string().trim().min(1, "Value is required"),
  extraPrice: z.coerce.number().min(0, "Cannot be negative").default(0),
});

export const productSchema = z
  .object({
    name: z.string().trim().min(1, "Name is required"),
    type: z.enum(["SERVICE", "GOODS"]),
    salesPrice: z.coerce.number({ message: "Enter a price" }).min(0, "Cannot be negative"),
    costPrice: z.coerce.number().min(0, "Cannot be negative").default(0),
    notes: optText,
    isActive: z.boolean().default(true),
    taxIds: z.array(z.string()).default([]),
    variants: z.array(variantSchema).default([]),
  })
  .superRefine((p, ctx) => {
    const seen = new Set<string>();
    p.variants.forEach((v, i) => {
      const k = `${v.attribute.toLowerCase()}|${v.value.toLowerCase()}`;
      if (seen.has(k)) ctx.addIssue({ code: "custom", path: ["variants", i, "value"], message: "Duplicate variant" });
      seen.add(k);
    });
  });
export type ProductInput = z.input<typeof productSchema>;

export const planSchema = z
  .object({
    name: z.string().trim().min(1, "Name is required"),
    price: z.coerce.number({ message: "Enter a price" }).min(0, "Cannot be negative"),
    billingPeriod: z.enum(["DAILY", "WEEKLY", "MONTHLY", "YEARLY"]),
    minQuantity: z.coerce.number().int().min(1, "At least 1"),
    startDate: optDate,
    endDate: optDate,
    autoClose: z.boolean().default(false),
    closable: z.boolean().default(true),
    pausable: z.boolean().default(true),
    renewable: z.boolean().default(true),
    isActive: z.boolean().default(true),
    notes: optText,
  })
  .refine((p) => !p.startDate || !p.endDate || p.endDate >= p.startDate, {
    path: ["endDate"],
    message: "End date must be on or after the start date",
  });
export type PlanInput = z.input<typeof planSchema>;

export const discountSchema = z
  .object({
    name: z.string().trim().min(1, "Name is required"),
    code: z.preprocess(
      (v) => (typeof v === "string" && v.trim() !== "" ? v.trim().toUpperCase() : null),
      z.string().regex(/^[A-Z0-9_-]+$/, "Letters, digits, - and _ only").nullable()
    ),
    type: z.enum(["FIXED", "PERCENT"]),
    value: z.coerce.number({ message: "Enter a value" }).gt(0, "Must be greater than 0"),
    scope: z.enum(["SUBSCRIPTION", "PRODUCT"]),
    productIds: z.array(z.string()).default([]),
    minPurchase: z.coerce.number().min(0, "Cannot be negative").default(0),
    minQuantity: z.coerce.number().int().min(0, "Cannot be negative").default(0),
    startDate: optDate,
    endDate: optDate,
    usageLimit: optInt,
    isActive: z.boolean().default(true),
  })
  .superRefine((d, ctx) => {
    if (d.type === "PERCENT" && d.value > 100) ctx.addIssue({ code: "custom", path: ["value"], message: "Percent cannot exceed 100" });
    if (d.scope === "PRODUCT" && d.productIds.length === 0)
      ctx.addIssue({ code: "custom", path: ["productIds"], message: "Select at least one product" });
    if (d.startDate && d.endDate && d.endDate < d.startDate)
      ctx.addIssue({ code: "custom", path: ["endDate"], message: "End date must be on or after the start date" });
  });
export type DiscountInput = z.input<typeof discountSchema>;

export const templateSchema = z.object({
  name: z.string().trim().min(1, "Name is required"),
  planId: z.string().min(1, "Select a plan"),
  validityDays: z.coerce.number().int().min(1, "At least 1 day"),
  paymentTerms: z.coerce.number().int().min(0, "Cannot be negative"),
  notes: optText,
  lines: z
    .array(
      z.object({
        productId: z.string().min(1, "Select a product"),
        variantId: z.preprocess((v) => (v === "" ? null : v), z.string().nullable().optional()),
        quantity: z.coerce.number().int().min(1, "At least 1"),
      })
    )
    .min(1, "Add at least one line"),
});
export type TemplateInput = z.input<typeof templateSchema>;
