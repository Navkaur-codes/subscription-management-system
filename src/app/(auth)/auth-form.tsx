"use client";
import { useActionState, useRef, type ReactNode } from "react";
import { ArrowRight, Loader2 } from "lucide-react";
import { gsap, useGSAP, SplitText, reduced } from "@/components/motion/gsap";
import { cn } from "@/lib/utils";
import type { AuthState } from "./actions";

type Field = { name: string; label: string; type?: string; placeholder?: string; hint?: string; autoComplete?: string };
export type DemoLogin = { label: string; email: string; password: string };


/** Shared form for login / signup / forgot / reset. */
export function AuthForm({
  action,
  fields,
  submitLabel,
  hidden,
  footer,
  demo,
}: {
  action: (s: AuthState, fd: FormData) => Promise<AuthState>;
  fields: Field[];
  submitLabel: string;
  hidden?: Record<string, string>;
  footer?: ReactNode;
  /** One-click demo accounts (login page only) so evaluators can try every role. */
  demo?: DemoLogin[];
}) {
  const [state, formAction, pending] = useActionState(action, {});
  const form = useRef<HTMLFormElement>(null);

  useGSAP(
    () => {
      if (reduced()) return;
      gsap.from(form.current!.querySelectorAll("[data-enter]"), {
        opacity: 0,
        y: 14,
        duration: 0.7,
        stagger: 0.07,
        ease: "power3.out",
        delay: 0.35,
      });
    },
    { scope: form }
  );

  const signInAs = (d: DemoLogin) => {
    const f = form.current;
    if (!f) return;
    (f.elements.namedItem("email") as HTMLInputElement).value = d.email;
    (f.elements.namedItem("password") as HTMLInputElement).value = d.password;
    f.requestSubmit();
  };

  return (
    <form ref={form} action={formAction} className="grid gap-5">
      {hidden && Object.entries(hidden).map(([k, v]) => <input key={k} type="hidden" name={k} value={v} />)}
      {fields.map((f) => {
        const error = state.fieldErrors?.[f.name];
        return (
          <label key={f.name} data-enter className="group grid gap-2">
            <span className="font-mono-num text-[11px] font-medium tracking-[0.14em] text-muted-foreground uppercase">
              {f.label}
            </span>
            <input
              id={f.name}
              name={f.name}
              type={f.type ?? "text"}
              placeholder={f.placeholder}
              autoComplete={f.autoComplete}
              defaultValue={f.type === "password" ? undefined : state.values?.[f.name]}
              aria-invalid={!!error}
              className={cn(
                "h-12 w-full rounded-lg border border-input bg-card px-4 text-[15px] text-foreground transition-[border-color,box-shadow] outline-none placeholder:text-muted-foreground/60",
                "focus:border-ember focus:shadow-[0_0_0_4px_var(--ember-soft)]",
                error && "border-destructive focus:border-destructive"
              )}
            />
            {error ? (
              <span className="text-xs text-destructive">{error}</span>
            ) : f.hint ? (
              <span className="text-xs text-muted-foreground">{f.hint}</span>
            ) : null}
          </label>
        );
      })}

      {state.error && (
        <p data-enter className="border-l-2 border-destructive bg-danger-soft px-3.5 py-2.5 text-sm text-destructive">
          {state.error}
        </p>
      )}
      {state.success && (
        <div className="border-l-2 border-ember bg-ember-soft px-3.5 py-2.5 text-sm text-foreground">
          {state.success}
          {state.previewUrl && (
            <a href={state.previewUrl} target="_blank" rel="noreferrer" className="mt-1 block font-medium text-ember underline-offset-4 hover:underline">
              Open test inbox preview →
            </a>
          )}
        </div>
      )}

      <button
        data-enter
        type="submit"
        disabled={pending}
        className="group relative mt-1 flex h-12 w-full items-center justify-between overflow-hidden rounded-lg bg-primary px-5 text-[15px] font-medium text-primary-foreground transition-transform active:scale-[0.99] disabled:opacity-70"
      >
        {/* ember sweep on hover */}
        <span className="absolute inset-0 origin-left scale-x-0 bg-ember transition-transform duration-500 ease-[cubic-bezier(.19,1,.22,1)] group-hover:scale-x-100" />
        <span className="relative">{submitLabel}</span>
        <span className="relative flex size-7 items-center justify-center rounded-full bg-primary-foreground/10 transition-transform duration-500 group-hover:translate-x-1">
          {pending ? <Loader2 className="size-4 animate-spin" /> : <ArrowRight className="size-4" />}
        </span>
      </button>

      {demo && (
        <div data-enter className="grid gap-2.5 border-t border-dashed border-border pt-5">
          <span className="font-mono-num text-[11px] tracking-[0.14em] text-muted-foreground uppercase">
            Evaluating? Jump straight in as
          </span>
          <div className="grid grid-cols-3 gap-2">
            {demo.map((d) => (
              <button
                key={d.label}
                type="button"
                disabled={pending}
                onClick={() => signInAs(d)}
                className="rounded-lg border border-border bg-card px-3 py-2.5 text-left transition-colors hover:border-ember hover:bg-ember-soft"
              >
                <span className="block text-[13px] font-medium">{d.label}</span>
                <span className="block truncate font-mono-num text-[10.5px] text-muted-foreground">{d.email.split("@")[0]}@</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {footer && (
        <div data-enter className="text-sm text-muted-foreground [&_a]:font-medium [&_a]:text-foreground [&_a]:underline [&_a]:decoration-ember [&_a]:decoration-2 [&_a]:underline-offset-4">
          {footer}
        </div>
      )}
    </form>
  );
}

/** Mono eyebrow + serif headline (wrap the accent word in <em>) revealed line by line. */
export function AuthHeading({ eyebrow, title, subtitle }: { eyebrow?: string; title: ReactNode; subtitle: string }) {
  const root = useRef<HTMLDivElement>(null);
  useGSAP(
    () => {
      if (reduced()) return;
      const q = gsap.utils.selector(root);
      SplitText.create(q("h1"), {
        type: "lines",
        mask: "lines",
        autoSplit: true,
        onSplit: (self) => gsap.from(self.lines, { yPercent: 110, duration: 1, stagger: 0.08, ease: "expo.out" }),
      });
      gsap.from(q("[data-sub]"), { opacity: 0, y: 8, duration: 0.8, stagger: 0.08, ease: "power3.out", delay: 0.25 });
    },
    { scope: root }
  );
  return (
    <div ref={root} className="mb-9">
      {eyebrow && (
        <p data-sub className="mb-5 flex items-center gap-3 font-mono-num text-[11px] tracking-[0.18em] text-muted-foreground uppercase">
          <span className="h-px w-8 bg-ember" />
          {eyebrow}
        </p>
      )}
      <h1 className="font-display text-[52px] leading-[1.02] text-foreground [&_em]:text-ember">{title}</h1>
      <p data-sub className="mt-4 text-[15px] leading-relaxed text-muted-foreground">
        {subtitle}
      </p>
    </div>
  );
}
