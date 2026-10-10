"use client";

import React from "react";
import { AlertCircle } from "lucide-react";
import type { BookingState } from "../useBooking";
import { inputCls } from "../ui";

export const DETAILS_FORM_ID = "bk-details-form";

function Label({ htmlFor, children, optional }: { htmlFor: string; children: React.ReactNode; optional?: boolean }) {
  return (
    <label htmlFor={htmlFor} className="mb-1.5 block text-sm font-medium text-ink">
      {children}
      {optional && <span className="font-normal text-ink-3"> (isteğe bağlı)</span>}
    </label>
  );
}

/** Contact details; the page-level primary button submits this form. */
export function DetailsStep({ booking, onSubmit }: { booking: BookingState; onSubmit: () => void }) {
  const b = booking;

  return (
    <form
      id={DETAILS_FORM_ID}
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit();
      }}
      className="space-y-4"
    >
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="bk-name">Ad soyad</Label>
          <input
            id="bk-name"
            type="text"
            required
            autoComplete="name"
            value={b.customerName}
            onChange={(e) => b.setCustomerName(e.target.value)}
            className={inputCls}
          />
        </div>
        <div>
          <Label htmlFor="bk-phone">Cep telefonu</Label>
          <input
            id="bk-phone"
            type="tel"
            required
            autoComplete="tel"
            inputMode="tel"
            placeholder="05XX XXX XX XX"
            value={b.customerPhone}
            onChange={(e) => b.setCustomerPhone(e.target.value)}
            className={inputCls}
          />
        </div>
      </div>

      <div>
        <Label htmlFor="bk-email" optional>
          E-posta
        </Label>
        <input
          id="bk-email"
          type="email"
          autoComplete="email"
          inputMode="email"
          value={b.customerEmail}
          onChange={(e) => b.setCustomerEmail(e.target.value)}
          className={inputCls}
        />
      </div>

      {b.isAutoService && (
        <div>
          <Label htmlFor="bk-plate" optional>
            Araç plakası ve modeli
          </Label>
          <input
            id="bk-plate"
            type="text"
            placeholder="34 ABC 123 · Renault Megane 2021"
            value={b.plateNumber}
            onChange={(e) => b.setPlateNumber(e.target.value)}
            className={inputCls}
          />
        </div>
      )}

      <div>
        <Label htmlFor="bk-notes" optional>
          İşletmeye not
        </Label>
        <textarea
          id="bk-notes"
          rows={3}
          value={b.notes}
          onChange={(e) => b.setNotes(e.target.value)}
          placeholder={b.isRestaurant ? "Özel gün, alerji, mama sandalyesi gibi istekleriniz" : "İşletmenin bilmesini istediğiniz bir şey var mı?"}
          className={`${inputCls} h-auto py-2.5`}
        />
      </div>

      {b.submitError && (
        <p role="alert" className="flex items-start gap-2 rounded-(--bk-r-ctl) border border-danger-line bg-danger-soft px-3.5 py-3 text-sm text-danger">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          {b.submitError}
        </p>
      )}

    </form>
  );
}
