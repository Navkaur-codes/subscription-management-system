"use client";
import { useTransition } from "react";
import { toast } from "sonner";
import { Loader2, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { emailQuotationAction } from "@/app/(app)/subscriptions/actions";

/** Emails the quotation summary; toast links to the Ethereal preview when available. */
export function EmailQuotationButton({ id }: { id: string }) {
  const [pending, start] = useTransition();
  const run = () =>
    start(async () => {
      const res = await emailQuotationAction(id);
      if (!res.ok) return void toast.error(res.error);
      const url = res.data;
      toast.success(res.message ?? "Quotation sent", {
        action: url ? { label: "Preview", onClick: () => window.open(url, "_blank") } : undefined,
      });
    });
  return (
    <Button variant="outline" size="sm" onClick={run} disabled={pending}>
      {pending ? <Loader2 className="size-4 animate-spin" /> : <Mail className="size-4" />}
      Email quotation
    </Button>
  );
}
