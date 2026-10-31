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
        <p className="rounded-xl bg-danger-soft px-3.5 py-2.5 text-sm text-danger ring-1 ring-current/15 ring-inset">{state.error}</p>
      )}
      {state.success && (
        <div className="rounded-xl bg-success-soft px-3.5 py-2.5 text-sm text-foreground ring-1 ring-success/20 ring-inset">
          {state.success}
          {state.previewUrl && (
            <a href={state.previewUrl} target="_blank" rel="noreferrer" className="mt-1 block font-medium text-brand underline-offset-4 hover:underline">
              Open test inbox preview →
            </a>
          )}
        </div>
      )}
      <Button type="submit" size="lg" disabled={pending} className="mt-2 w-full">
        {pending && <Loader2 className="size-4 animate-spin" />}
        {submitLabel}
      </Button>
      {footer && <div className="mt-2 text-center text-sm text-muted-foreground [&_a]:text-brand">{footer}</div>}
    </form>
  );
}

export function AuthHeading({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div className="mb-8">
      <h1 className="text-[28px] leading-9 font-semibold tracking-tight">{title}</h1>
      <p className="mt-1.5 text-sm text-muted-foreground">{subtitle}</p>
    </div>
  );
}
