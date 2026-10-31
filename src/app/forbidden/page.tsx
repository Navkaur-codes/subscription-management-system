import Link from "next/link";
import { Button } from "@/components/ui/button";

export const metadata = { title: "Access denied" };

export default function Forbidden() {
  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-3 px-6 text-center">
      <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">403</p>
      <h1 className="text-2xl font-semibold">You don&apos;t have access to this page</h1>
      <p className="max-w-sm text-sm text-muted-foreground">Ask an administrator if you think you should.</p>
      <Button asChild variant="outline" className="mt-2">
        <Link href="/">Go to home</Link>
      </Button>
    </div>
  );
}
