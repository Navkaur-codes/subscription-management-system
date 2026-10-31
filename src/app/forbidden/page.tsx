import Link from "next/link";
import { ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/shell/logo";

export const metadata = { title: "Access denied" };

export default function Forbidden() {
  return (
    <div className="relative flex min-h-svh flex-col items-center justify-center gap-3 overflow-hidden bg-canvas px-6 text-center">
      <div
        aria-hidden
        className="pointer-events-none absolute -top-40 left-1/2 size-[36rem] -translate-x-1/2 rounded-full bg-brand-soft blur-3xl"
      />
      <Logo className="absolute top-8 left-8" />
      <div className="relative mb-3 rounded-3xl bg-brand-gradient p-px shadow-[0_16px_40px_-16px_rgb(76_50_220/0.7)]">
        <div className="flex size-16 items-center justify-center rounded-[23px] bg-card">
          <ShieldAlert className="size-7 text-brand" />
        </div>
      </div>
      <p className="eyebrow relative">Error 403</p>
      <h1 className="relative text-[28px] leading-9 font-semibold tracking-tight">You don&apos;t have access to this page</h1>
      <p className="relative max-w-sm text-sm text-muted-foreground">Ask an administrator if you think you should.</p>
      <Button asChild size="lg" className="relative mt-3">
        <Link href="/">Go to home</Link>
      </Button>
    </div>
  );
}
