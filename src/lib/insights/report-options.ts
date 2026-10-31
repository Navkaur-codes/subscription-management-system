export type ReportView = "subscriptions" | "invoices" | "payments";

export const STATUS_OPTIONS: Record<ReportView, string[]> = {
  subscriptions: ["DRAFT", "QUOTATION", "CONFIRMED", "ACTIVE", "PAUSED", "CLOSED"],
  invoices: ["DRAFT", "CONFIRMED", "PAID", "OVERDUE", "CANCELLED"],
  payments: ["CASH", "BANK_TRANSFER", "CARD", "UPI", "CHEQUE"],
};
