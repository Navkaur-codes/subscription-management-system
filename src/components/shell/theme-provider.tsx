"use client";
import { ThemeProvider as NextThemes } from "next-themes";
import type { ReactNode } from "react";

/** next-themes, class strategy — `.dark` on <html>. Light by default. */
export function ThemeProvider({ children }: { children: ReactNode }) {
  return (
    <NextThemes attribute="class" defaultTheme="light" enableSystem={false} disableTransitionOnChange>
      {children}
    </NextThemes>
  );
}
