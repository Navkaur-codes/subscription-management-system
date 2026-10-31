"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { CalendarClock, Loader2, Play, Receipt, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { formatMoney } from "@/lib/format";
import type { ActionResult } from "@/lib/action";
import type { BillingPreview } from "@/lib/billing/preview";

type Props = {
  preview: () => Promise<ActionResult<BillingPreview>>;
  run: () => Promise<ActionResult<{ created: number }>>;
};

/** "Generate due invoices" with a dry-run preview: how many subs are due and what they will bill. */
export function BillingRunDialog({ preview, run }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [data, setData] = useState<BillingPreview | null>(null);
  const [loading, startLoad] = useTransition();
  const [running, startRun] = useTransition();

  const openPreview = () => {
    setOpen(true);
    setData(null);
    startLoad(async () => {
      const res = await preview();
      if (res.ok && res.data) setData(res.data);
      else if (!res.ok) {
        toast.error(res.error);
        setOpen(false);
      }
    });
  };

  const confirm = () =>
    startRun(async () => {
      const res = await run();
      if (!res.ok) return void toast.error(res.error);
      toast.success(res.message ?? "Billing run complete");
      setOpen(false);
      router.refresh();
    });

  const nothing = data !== null && data.billable === 0;

  return (
    <>
      <Button onClick={openPreview} className="bg-brand-gradient text-brand-foreground hover:opacity-90">
        <Play className="size-4" />
        Generate due invoices
      </Button>
      <Dialog open={open} onOpenChange={(o) => !running && setOpen(o)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="mb-2 flex size-10 items-center justify-center rounded-xl bg-brand-gradient text-brand-foreground">
              <CalendarClock className="size-5" />
            </div>
            <DialogTitle>Run billing</DialogTitle>
            <DialogDescription>
              Preview of today&apos;s billing run. Draft invoices are created for every active subscription whose billing date has
              arrived; periods already billed are skipped.
            </DialogDescription>
          </DialogHeader>

          {loading || !data ? (
            <div className="flex h-36 items-center justify-center text-sm text-muted-foreground">
              <Loader2 className="mr-2 size-4 animate-spin" /> Calculating preview…
            </div>
          ) : (
            <div className="space-y-3">
              <div className="rounded-xl bg-brand-soft p-4">
                <p className="text-[11px] font-medium tracking-wider text-muted-foreground uppercase">
                  Estimated to bill{data.sampled && " (extrapolated)"}
                </p>
                <p className="num mt-1 text-3xl font-semibold tracking-tight">{formatMoney(data.estimatedTotal)}</p>
                <p className="mt-1 text-xs text-muted-foreground">First due period per subscription, incl. tax and auto-discounts</p>
              </div>
              <div className="grid grid-cols-3 gap-2 text-center">
                <Fact icon={<Receipt className="size-4" />} label="Invoices" value={data.billable} />
                <Fact icon={<Sparkles className="size-4" />} label="Discounted" value={data.discounted} />
                <Fact icon={<CalendarClock className="size-4" />} label="Expired, skip" value={data.expired} />
              </div>
              {nothing && <p className="text-center text-sm text-muted-foreground">Nothing is due today — you&apos;re all caught up.</p>}
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)} disabled={running}>
              Cancel
            </Button>
            <Button onClick={confirm} disabled={loading || !data || nothing || running}>
              {running && <Loader2 className="size-4 animate-spin" />}
              {data && !nothing ? `Create ${data.billable.toLocaleString("en-IN")} invoice${data.billable === 1 ? "" : "s"}` : "Create invoices"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

function Fact({ icon, label, value }: { icon: React.ReactNode; label: string; value: number }) {
  return (
    <div className="rounded-xl border bg-card p-3">
      <span className="mx-auto mb-1 flex w-fit text-muted-foreground">{icon}</span>
      <p className="num text-lg font-semibold">{value.toLocaleString("en-IN")}</p>
      <p className="text-[11px] text-muted-foreground">{label}</p>
    </div>
  );
}
