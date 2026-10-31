"use client";
import { useActionState, type ReactNode } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FormField } from "@/components/shared/form-field";
import type { AuthState } from "./actions";

type Field = { name: string; label: string; type?: string; placeholder?: string; hint?: string; autoComplete?: string };

/** Shared form for login / signup / forgot / reset. */
export function AuthForm({
  action,
  fields,
  submitLabel,
  hidden,
  footer,
}: {
  action: (s: AuthState, fd: FormData) => Promise<AuthState>;
  fields: Field[];
  submitLabel: string;
  hidden?: Record<string, string>;
  footer?: ReactNode;
}) {
  const [state, formAction, pending] = useActionState(action, {});
  return (
    <form action={formAction} className="grid gap-4">
      {hidden && Object.entries(hidden).map(([k, v]) => <input key={k} type="hidden" name={k} value={v} />)}
      {fields.map((f) => (
        <FormField key={f.name} label={f.label} htmlFor={f.name} error={state.fieldErrors?.[f.name]} hint={f.hint}>
          <Input
            id={f.name}
            name={f.name}
            type={f.type ?? "text"}
            placeholder={f.placeholder}
            autoComplete={f.autoComplete}
            defaultValue={f.type === "password" ? undefined : state.values?.[f.name]}
            aria-invalid={!!state.fieldErrors?.[f.name]}
          />
        </FormField>
      ))}
      {state.error && (
        <p className="rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">{state.error}</p>
      )}
      {state.success && (
        <div className="rounded-lg border bg-muted/50 px-3 py-2 text-sm">
          {state.success}
          {state.previewUrl && (
            <a href={state.previewUrl} target="_blank" rel="noreferrer" className="mt-1 block font-medium text-brand underline-offset-4 hover:underline">
              Open test inbox preview →
            </a>
          )}
        </div>
      )}
      <Button type="submit" disabled={pending} className="mt-1 w-full">
        {pending && <Loader2 className="size-4 animate-spin" />}
        {submitLabel}
      </Button>
      {footer && <div className="text-center text-sm text-muted-foreground">{footer}</div>}
    </form>
  );
}

export function AuthHeading({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div className="mb-6">
      <h1 className="text-2xl font-semibold">{title}</h1>
      <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>
    </div>
  );
}
