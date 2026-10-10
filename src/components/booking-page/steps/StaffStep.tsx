import React from "react";
import { Check, Users } from "lucide-react";
import { cn } from "@/lib/utils";
import type { BookingState } from "../useBooking";
import { choice, Initial } from "../ui";

function Tick({ on }: { on: boolean }) {
  return (
    <span
      className={cn(
        "flex h-5 w-5 shrink-0 items-center justify-center rounded-full border",
        on ? "border-brand bg-brand text-(color:--bk-on-brand)" : "border-line-strong"
      )}
      aria-hidden="true"
    >
      {on && <Check className="h-3 w-3" strokeWidth={3} />}
    </span>
  );
}

export function StaffStep({ booking }: { booking: BookingState }) {
  const { eligibleEmployees, selectedEmployee, selectEmployee } = booking;

  return (
    <div>
      <p className="mb-4 text-sm text-ink-3">
        Hizmeti kimden almak istediğinizi seçin. Fark etmiyorsa ilk müsait uzmana atanırsınız.
      </p>
      <div role="radiogroup" aria-label="Uzman" className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        <button
          type="button"
          role="radio"
          aria-checked={selectedEmployee === "any"}
          onClick={() => selectEmployee("any")}
          className={choice(selectedEmployee === "any", "flex items-center gap-3 p-3.5")}
        >
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-surface-muted">
            <Users className="h-5 w-5 text-ink-2" aria-hidden="true" />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-sm font-medium text-ink">Fark etmez</span>
            <span className="block text-sm text-ink-3">İlk müsait uzman</span>
          </span>
          <Tick on={selectedEmployee === "any"} />
        </button>

        {eligibleEmployees.map((emp) => {
          const on = selectedEmployee === emp.id;
          return (
            <button
              key={emp.id}
              type="button"
              role="radio"
              aria-checked={on}
              onClick={() => selectEmployee(emp.id)}
              className={choice(on, "flex items-center gap-3 p-3.5")}
            >
              {emp.photo ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={emp.photo} alt="" className="h-12 w-12 shrink-0 rounded-full object-cover" />
              ) : (
                <Initial name={emp.name} className="h-12 w-12 shrink-0 rounded-full" />
              )}
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-medium text-ink">{emp.name}</span>
                {emp.specialty && <span className="block truncate text-sm text-ink-3">{emp.specialty}</span>}
              </span>
              <Tick on={on} />
            </button>
          );
        })}
      </div>
    </div>
  );
}
