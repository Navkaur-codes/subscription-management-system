export type LineValue = {
  key: string;
  productId: string;
  variantId: string;
  quantity: number;
  unitPrice: number;
  taxRate: number;
};

export type SubscriptionFormValues = {
  customerId: string;
  planId: string;
  startDate: string;
  expiryDate: string;
  quotationExpiry: string;
  paymentTerms: number;
  discountId: string;
  notes: string;
  lines: LineValue[];
};
