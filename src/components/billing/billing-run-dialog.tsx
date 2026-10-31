"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Magnetic,
  Orbit,
  RevealText,
  ScrambleNumber,
} from "@/components/motion";
import { formatDate } from "@/lib/format";
import type { ActionResult } from "@/lib/action";
import type { BillingPreview } from "@/lib/billing/preview";

type Props = {
  preview: () => Promise<ActionResult<BillingPreview>>;
  run: () => Promise<ActionResult<{ created: number }>>;
};

type Done = { created: number; message: string };

/** "Generate due invoices" as a small ceremony: dry-run preview → confirm → counted result. */
export function BillingRunDialog({ preview, run }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [data, setData] = useState<BillingPreview | null>(null);
  const [done, setDone] = useState<Done | null>(null);
  const [loading, startLoad] = useTransition();
  const [running, startRun] = useTransition();

  const openPreview = () => {
    setOpen(true);
    setData(null);
    setDone(null);
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
      setDone({ created: res.data?.created ?? 0, message: res.message ?? "" });
      router.refresh();
    });

  const nothing = data !== null && data.billable === 0;

  return (
    <>
      <Button onClick={openPreview}>
        <Play className="size-4" />
        Generate due invoices
      </Button>
      <Dialog open={open} onOpenChange={(o) => !running && setOpen(o)}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <p className="font-mono-num text-[11px] tracking-wider text-muted-foreground uppercase">
              Billing run · {formatDate(new Date())}
            </p>
            <DialogTitle className="font-display text-3xl leading-tight font-normal sm:text-4xl">
              {done ? (
                <>
                  <em className="text-ember">
                    <ScrambleNumber value={done.created} format="number" />
                  </em>{" "}
                  invoice{done.created === 1 ? "" : "s"} created.
                </>
              ) : !data ? (
                "Counting what’s due…"
              ) : nothing ? (
                <RevealText as="span" key="none">
                  You’re <em>all caught up</em>.
                </RevealText>
              ) : (
                <RevealText as="span" key="due">
                  <em className="text-ember">
                    {data.billable.toLocaleString("en-IN")}
                  </em>{" "}
                  subscription
                  {data.billable === 1 ? " is" : "s are"} due today.
                </RevealText>
              )}
            </DialogTitle>
            <DialogDescription>
              {done
                ? done.message.includes("still due")
                  ? done.message
                  : "They’re waiting under Draft — review and confirm them to start collecting."
                : nothing
                  ? "No active subscription has a billing date today or earlier. Check back on the next cycle."
                  : "Each one gets a draft invoice for its next period. Periods already billed are skipped, so running twice never double-bills."}
            </DialogDescription>
          </DialogHeader>

          {!done && (loading || !data) && (
            <div className="flex h-32 items-center justify-center text-sm text-muted-foreground">
              <Loader2 className="mr-2 size-4 animate-spin" /> Pricing every due
              subscription…
            </div>
          )}

          {running && data && (
            <div className="flex items-center gap-5 border-y py-5">
              <Orbit size={72} dots={3} speed={4} />
              <div>
                <p className="font-display text-2xl">
                  Billing <em>{data.billable.toLocaleString("en-IN")}</em>{" "}
                  subscriptions…
                </p>
                <p className="text-xs text-muted-foreground">
                  Numbering invoices, applying discounts, advancing billing
                  dates.
                </p>
              </div>
            </div>
          )}

          {!done && !running && data && !nothing && (
            <div className="border-y py-5">
              <p className="text-xs text-muted-foreground">
                Estimated to bill{data.sampled && " (extrapolated)"}
              </p>
              <ScrambleNumber
                value={data.estimatedTotal}
                format="money"
                className="font-mono-num mt-1 block text-4xl font-medium tracking-tight"
              />
              <dl className="mt-4 divide-y text-sm">
                <Fact label="Auto-discount applied" value={data.discounted} />
                <Fact label="Expired — will be skipped" value={data.expired} />
                <Fact
                  label="Incl. tax · first due period per subscription"
                  value={null}
                />
              </dl>
            </div>
          )}

          <DialogFooter>
            {done ? (
              <Button onClick={() => setOpen(false)}>Done</Button>
            ) : (
              <>
                <Button
                  variant="outline"
                  onClick={() => setOpen(false)}
                  disabled={running}
                >
                  Cancel
                </Button>
                {!nothing && (
                  <Magnetic className="w-full sm:w-auto">
                    <Button
                      onClick={confirm}
                      disabled={loading || !data || running}
                      className="w-full bg-ember text-white hover:bg-ember/90 sm:w-auto"
                    >
                      {running && <Loader2 className="size-4 animate-spin" />}
                      {running
                        ? "Billing…"
                        : data && !nothing
                          ? `Create ${data.billable.toLocaleString("en-IN")} invoice${data.billable === 1 ? "" : "s"}`
                          : "Create invoices"}
                    </Button>
                  </Magnetic>
                )}
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

function Fact({ label, value }: { label: string; value: number | null }) {
  return (
    <div className="flex items-center justify-between py-2">
      <dt className="text-muted-foreground">{label}</dt>
      {value !== null && (
        <dd className="font-mono-num">{value.toLocaleString("en-IN")}</dd>
      )}
    </div>
  );
}
