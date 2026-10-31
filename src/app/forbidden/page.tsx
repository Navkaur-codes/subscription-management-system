import Link from "next/link";
import { ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/shell/logo";
import { Orbit, RevealText } from "@/components/motion";

export const metadata = { title: "Access denied" };

export default function Forbidden() {
  return (
    <div className="flex min-h-svh flex-col bg-canvas">
      <div className="flex items-center justify-between border-b border-border px-6 py-5 sm:px-10">
        <Logo />
        <span className="font-mono-num text-[11px] tracking-[0.16em] text-muted-foreground uppercase">Error 403</span>
      </div>
      <div className="flex flex-1 flex-col items-center justify-center gap-4 px-6 py-16 text-center">
        <Orbit size={140} dots={2} className="mb-4 text-foreground">
          <ShieldAlert className="size-6 text-ember" strokeWidth={1.75} />
        </Orbit>
        <RevealText as="h1" className="max-w-xl font-display text-[40px] leading-[1.05] sm:text-[52px] [&_em]:text-ember">
          This loop is <em>closed</em> to you.
        </RevealText>
        <p className="max-w-sm text-sm text-muted-foreground">
          Your role doesn&apos;t have access to this page. Ask an administrator if you think it should.
        </p>
        <Button asChild size="lg" className="mt-2">
          <Link href="/">Back to home</Link>
        </Button>
      </div>
    </div>
  );
}
