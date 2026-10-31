"use client";
import { useTransition, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import type { ActionResult } from "@/lib/action";

type Props = {
  action: () => Promise<ActionResult<unknown>>;
  children: ReactNode;
  variant?: "default" | "outline" | "secondary" | "ghost" | "destructive";
  size?: "default" | "sm" | "lg";
  /** If set, asks for confirmation first. */
  confirm?: { title: string; description?: string; confirmLabel?: string };
  successMessage?: string;
  /** Navigate after success (otherwise router.refresh()). */
  redirectTo?: string;
};

/**
 * Button that runs a server action, shows a toast, refreshes the page.
 * Use for row actions: Confirm, Cancel, Send, Activate, Delete …
 */
export function ActionButton({ action, children, variant = "outline", size = "sm", confirm, successMessage, redirectTo }: Props) {
  const [pending, start] = useTransition();
  const router = useRouter();
  const run = () =>
    start(async () => {
      const res = await action();
      if (res.ok) {
        toast.success(res.message ?? successMessage ?? "Done");
        if (redirectTo) router.push(redirectTo);
        else router.refresh();
      } else toast.error(res.error);
    });

  const btn = (onClick?: () => void) => (
    <Button variant={variant} size={size} disabled={pending} onClick={onClick}>
      {pending && <Loader2 className="size-4 animate-spin" />}
      {children}
    </Button>
  );

  if (!confirm) return btn(run);
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>{btn()}</AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{confirm.title}</AlertDialogTitle>
          {confirm.description && <AlertDialogDescription>{confirm.description}</AlertDialogDescription>}
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={run}>{confirm.confirmLabel ?? "Continue"}</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
