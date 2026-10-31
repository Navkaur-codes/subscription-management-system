"use client";
import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { ActionResult } from "@/lib/action";

/** Sends the invoice email; toast links to the Ethereal preview when available. */
export function SendButton({ action }: { action: () => Promise<ActionResult<{ previewUrl?: string }>> }) {
  const [pending, start] = useTransition();
  const router = useRouter();
  const run = () =>
    start(async () => {
      const res = await action();
      if (!res.ok) return void toast.error(res.error);
      const url = res.data?.previewUrl;
      toast.success(res.message ?? "Invoice sent", {
        action: url ? { label: "Preview", onClick: () => window.open(url, "_blank", "noopener") } : undefined,
        duration: url ? 10000 : 4000,
      });
      router.refresh();
    });
  return (
    <Button variant="outline" size="sm" onClick={run} disabled={pending}>
      {pending ? <Loader2 className="size-4 animate-spin" /> : <Mail className="size-4" />}
      Send
    </Button>
  );
}
