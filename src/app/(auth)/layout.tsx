import Link from "next/link";
import { ShieldCheck } from "lucide-react";
import { FadeIn } from "@/components/motion";
import { Logo } from "@/components/shell/logo";
import { AuthPreview } from "./auth-preview";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid min-h-svh bg-background lg:grid-cols-[1fr_1.05fr]">
      <div className="flex flex-col px-6 py-8 sm:px-12">
        <Link href="/login" aria-label="Brightloop" className="w-fit">
          <Logo />
        </Link>
        <div className="flex flex-1 items-center justify-center py-10">
          <FadeIn className="w-full max-w-[380px]">{children}</FadeIn>
        </div>
        <p className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground lg:justify-start">
          <ShieldCheck className="size-3.5" />
          Encrypted sessions · GST-ready invoicing · Built for Indian SaaS teams
        </p>
      </div>

      <div className="relative m-3 hidden overflow-hidden rounded-[28px] bg-brand-gradient lg:block">
        <div className="absolute inset-0 bg-grid [mask-image:radial-gradient(ellipse_at_center,black_30%,transparent_75%)]" />
        <div className="absolute -top-32 -right-24 size-96 rounded-full bg-white/20 blur-3xl" />
        <div className="absolute -bottom-40 -left-20 size-[28rem] rounded-full bg-[#1e1b4b]/60 blur-3xl" />
        <div className="relative flex h-full flex-col justify-between p-12 text-white">
          <span className="w-fit rounded-full bg-white/15 px-3 py-1 text-xs font-medium ring-1 ring-white/20 backdrop-blur">
            Subscription management, done right
          </span>
          <AuthPreview />
          <div>
            <p className="max-w-md text-[28px] leading-tight font-semibold tracking-tight">
              Plans, subscriptions and recurring billing — in one place.
            </p>
            <p className="mt-3 max-w-md text-sm text-white/75">
              Invoices that create themselves, payments matched to the right bill, and revenue you can actually see.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
