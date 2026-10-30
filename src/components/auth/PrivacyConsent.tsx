import React from "react";
import { PRIVACY_NOTICE_PATH } from "@/lib/privacyNotice";

/** The required "I read the privacy notice" tick on the sign-up forms. */
export function PrivacyConsent({ id, checked, onChange }: { id: string; checked: boolean; onChange: (checked: boolean) => void }) {
  return (
    <div className="flex items-start gap-2.5 text-sm text-ink-2">
      <input
        id={id}
        type="checkbox"
        required
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="mt-0.5 h-4 w-4 shrink-0 accent-brand"
      />
      <label htmlFor={id}>
        <a href={PRIVACY_NOTICE_PATH} target="_blank" rel="noopener" className="font-medium text-brand hover:text-brand-hover">
          Aydınlatma Metni
        </a>
        &apos;ni okudum ve anladım.
      </label>
    </div>
  );
}
