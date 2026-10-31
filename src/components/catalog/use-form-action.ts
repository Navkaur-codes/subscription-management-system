"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import type { ActionResult } from "@/lib/action";

/** Runs a save action, surfaces field errors, toasts and redirects on success. */
export function useFormAction<T>(save: (data: T) => Promise<ActionResult<unknown>>, redirectTo?: string) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [errors, setErrors] = useState<Record<string, string>>({});
  const submit = (data: T, after?: () => void) =>
    start(async () => {
      setErrors({});
      const res = await save(data);
      if (res.ok) {
        toast.success(res.message ?? "Saved");
        after?.();
        if (redirectTo) router.push(redirectTo);
        else router.refresh();
      } else {
        setErrors(res.fieldErrors ?? {});
        toast.error(res.error);
      }
    });
  return { pending, errors, submit };
}
