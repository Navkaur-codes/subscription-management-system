import { FadeIn } from "@/components/motion";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid min-h-svh lg:grid-cols-2">
      <div className="flex flex-col px-6 py-8 sm:px-12">
        <div className="flex items-center gap-2 text-sm font-semibold">
          <span className="flex size-7 items-center justify-center rounded-lg bg-primary text-primary-foreground">B</span>
          Brightloop
        </div>
        <div className="flex flex-1 items-center justify-center">
          <FadeIn className="w-full max-w-sm">{children}</FadeIn>
        </div>
      </div>
      <div className="relative hidden overflow-hidden border-l bg-muted/40 lg:block">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,var(--brand-soft),transparent_55%)]" />
        <div className="relative flex h-full flex-col justify-end p-12">
          <p className="max-w-md text-2xl font-semibold leading-snug tracking-tight">
            Plans, subscriptions and recurring billing — in one place.
          </p>
          <p className="mt-3 max-w-md text-sm text-muted-foreground">
            Invoices that create themselves, payments matched to the right bill, and revenue you can actually see.
          </p>
        </div>
      </div>
    </div>
  );
}
