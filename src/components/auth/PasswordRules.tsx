import React from "react";
import { Check } from "lucide-react";
import { PASSWORD_RULES } from "@/lib/passwordPolicy";
import { cn } from "@/lib/utils";

/** Live checklist under a new-password field. */
export function PasswordRules({ password, className }: { password: string; className?: string }) {
  return (
    <ul className={cn("grid grid-cols-2 gap-x-3 gap-y-1 text-xs", className)} aria-label="Şifre kuralları">
      {PASSWORD_RULES.map((rule) => {
        const met = rule.test(password);
        return (
          <li key={rule.label} className={cn("flex items-center gap-1.5", met ? "text-brand-ink" : "text-ink-3")}>
            <span
              className={cn(
                "flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded-full border",
                met ? "border-brand bg-brand" : "border-line-strong"
              )}
              aria-hidden="true"
            >
              {met && <Check className="h-2.5 w-2.5 text-white" />}
            </span>
            {rule.label}
          </li>
        );
      })}
    </ul>
  );
}
