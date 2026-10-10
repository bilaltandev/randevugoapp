"use client";

import React, { useState } from "react";
import { Clock, MapPin, MessageSquare, Navigation, Phone } from "lucide-react";
import { cn } from "@/lib/utils";
import type { BookingEmployee, PublicReview } from "./types";
import { DAY_NAMES, hoursForDay, WEEK_ORDER, type WorkingHour } from "./time";
import { btn, Initial, SectionTitle, Stars } from "./ui";

export function TeamSection({ employees }: { employees: BookingEmployee[] }) {
  return (
    <section id="ekip" aria-labelledby="ekip-baslik" className="scroll-mt-28">
      <SectionTitle id="ekip-baslik">Ekip</SectionTitle>
      <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {employees.map((emp) => (
          <li key={emp.id} className="flex items-center gap-4 rounded-(--bk-r-card) border border-line bg-surface p-3">
            {emp.photo ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={emp.photo} alt="" className="h-16 w-16 shrink-0 rounded-(--bk-r-ctl) object-cover" loading="lazy" />
            ) : (
              <Initial name={emp.name} className="h-16 w-16 shrink-0 rounded-(--bk-r-ctl) text-xl" />
            )}
            <div className="min-w-0">
              <p className="truncate text-base font-semibold text-ink">{emp.name}</p>
              {emp.specialty && <p className="mt-0.5 line-clamp-2 text-sm text-ink-3">{emp.specialty}</p>}
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}

const INITIAL_REVIEWS = 4;

export function ReviewsSection({ reviews, average }: { reviews: PublicReview[]; average: number }) {
  const [expanded, setExpanded] = useState(false);
  const shown = expanded ? reviews : reviews.slice(0, INITIAL_REVIEWS);

  // Real distribution of star ratings
  const counts = [5, 4, 3, 2, 1].map((star) => ({
    star,
    count: reviews.filter((r) => Math.round(r.rating) === star).length,
  }));

  return (
    <section id="yorumlar" aria-labelledby="yorumlar-baslik" className="scroll-mt-28">
      <SectionTitle id="yorumlar-baslik">Değerlendirmeler</SectionTitle>

      <div className="flex flex-col gap-6 sm:flex-row sm:gap-10">
        <div className="shrink-0 sm:w-48">
          <p className="text-4xl font-semibold tracking-tight text-ink tabular-nums">
            {average.toLocaleString("tr-TR", { minimumFractionDigits: 1, maximumFractionDigits: 1 })}
          </p>
          <div className="mt-1">
            <Stars rating={average} size="md" />
          </div>
          <p className="mt-1 text-sm text-ink-3">{reviews.length} değerlendirme</p>
          <dl className="mt-4 space-y-1">
            {counts.map(({ star, count }) => (
              <div key={star} className="flex items-center gap-2 text-xs text-ink-3">
                <dt className="w-3 tabular-nums">{star}</dt>
                <dd className="h-1.5 flex-1 overflow-hidden rounded-full bg-surface-muted">
                  <span
                    className="block h-full rounded-full bg-amber-400"
                    style={{ width: `${reviews.length ? (count / reviews.length) * 100 : 0}%` }}
                  />
                </dd>
                <dd className="w-5 text-right tabular-nums">{count}</dd>
              </div>
            ))}
          </dl>
        </div>

        <div className="min-w-0 flex-1">
          <ul className="divide-y divide-line">
            {shown.map((rev) => (
              <li key={rev.id} className="py-4 first:pt-0">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-medium text-ink">{rev.customerName}</p>
                  {rev.createdAt && (
                    <time className="shrink-0 text-xs text-ink-3">
                      {new Date(rev.createdAt).toLocaleDateString("tr-TR", { day: "numeric", month: "long", year: "numeric" })}
                    </time>
                  )}
                </div>
                <div className="mt-1">
                  <Stars rating={rev.rating} />
                </div>
                {rev.comment && <p className="mt-2 text-sm leading-relaxed text-ink-2">{rev.comment}</p>}
                {rev.businessReply && (
                  <div className="mt-3 rounded-(--bk-r-ctl) bg-surface-muted px-3 py-2.5">
                    <p className="text-xs font-medium text-ink-2">İşletmenin yanıtı</p>
                    <p className="mt-0.5 text-sm text-ink-2">{rev.businessReply}</p>
                  </div>
                )}
              </li>
            ))}
          </ul>
          {reviews.length > INITIAL_REVIEWS && (
            <button type="button" onClick={() => setExpanded((v) => !v)} className={btn("secondary", "sm", "mt-2")}>
              {expanded ? "Daha az göster" : `Tüm değerlendirmeler (${reviews.length})`}
            </button>
          )}
        </div>
      </div>
    </section>
  );
}

interface AboutProps {
  description?: string | null;
  address?: string | null;
  city?: string | null;
  mapsUrl?: string | null;
  phone?: string | null;
  whatsappUrl?: string | null;
  hours: WorkingHour[];
  todayIndex: number | null;
}

export function AboutSection({ description, address, city, mapsUrl, phone, whatsappUrl, hours, todayIndex }: AboutProps) {
  const week = WEEK_ORDER.map((day) => ({ day, wh: hoursForDay(hours, day) })).filter((d) => d.wh);

  return (
    <section id="hakkinda" aria-labelledby="hakkinda-baslik" className="scroll-mt-28">
      <SectionTitle id="hakkinda-baslik">Hakkında</SectionTitle>
      {description && <p className="mb-6 max-w-2xl whitespace-pre-line text-[15px] leading-relaxed text-ink-2">{description}</p>}

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {week.length > 0 && (
          <div className="rounded-(--bk-r-card) border border-line bg-surface p-5">
            <h3 className="mb-2 flex items-center gap-2 text-sm font-semibold text-ink">
              <Clock className="h-4 w-4 text-ink-3" aria-hidden="true" />
              Çalışma saatleri
            </h3>
            <dl className="text-sm">
              {week.map(({ day, wh }) => {
                const isToday = day === todayIndex;
                return (
                  <div key={day} className={cn("flex justify-between gap-4 py-1.5", isToday ? "font-medium text-ink" : "text-ink-2")}>
                    <dt>
                      {DAY_NAMES[day]}
                      {isToday && <span className="ml-2 text-xs font-normal text-brand-ink">Bugün</span>}
                    </dt>
                    <dd className="tabular-nums">
                      {wh!.isOpen ? `${wh!.openTime} – ${wh!.closeTime}` : <span className="text-ink-3">Kapalı</span>}
                    </dd>
                  </div>
                );
              })}
            </dl>
          </div>
        )}

        {(address || phone || whatsappUrl) && (
          <div className="rounded-(--bk-r-card) border border-line bg-surface p-5">
            <h3 className="mb-3 text-sm font-semibold text-ink">İletişim</h3>
            <ul className="space-y-3 text-sm">
              {address && (
                <li className="flex items-start gap-2.5">
                  <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-ink-3" aria-hidden="true" />
                  <div>
                    <p className="text-ink-2">{address}</p>
                    {city && <p className="text-ink-3">{city}</p>}
                    {mapsUrl && (
                      <a
                        href={mapsUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-1 inline-flex items-center gap-1 font-medium text-brand-ink hover:underline"
                      >
                        <Navigation className="h-3.5 w-3.5" aria-hidden="true" />
                        Yol tarifi al
                      </a>
                    )}
                  </div>
                </li>
              )}
              {phone && (
                <li className="flex items-center gap-2.5">
                  <Phone className="h-4 w-4 shrink-0 text-ink-3" aria-hidden="true" />
                  <a href={`tel:${phone}`} className="font-medium text-ink hover:underline">
                    {phone}
                  </a>
                </li>
              )}
              {whatsappUrl && (
                <li className="flex items-center gap-2.5">
                  <MessageSquare className="h-4 w-4 shrink-0 text-ink-3" aria-hidden="true" />
                  <a href={whatsappUrl} target="_blank" rel="noopener noreferrer" className="font-medium text-ink hover:underline">
                    {"WhatsApp'tan yazın"}
                  </a>
                </li>
              )}
            </ul>
          </div>
        )}
      </div>
    </section>
  );
}
