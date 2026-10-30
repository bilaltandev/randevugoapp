import React from "react";
import { cn } from "@/lib/utils";

/** The slow-moving light behind the auth screens and the admin panel. `fixed` keeps it in place while the page scrolls. */
export function Aurora({ fixed }: { fixed?: boolean }) {
  return (
    <div className={cn("aurora", fixed && "aurora-fixed")} aria-hidden="true">
      <span className="aurora-orb aurora-orb-a" />
      <span className="aurora-orb aurora-orb-b" />
      <span className="aurora-orb aurora-orb-c" />
    </div>
  );
}
