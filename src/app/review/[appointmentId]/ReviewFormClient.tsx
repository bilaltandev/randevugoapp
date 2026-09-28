"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Star, CheckCircle2, AlertCircle } from "lucide-react";
import confetti from "canvas-confetti";

export default function ReviewFormClient({ appointment }: { appointment: any }) {
  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState("");
  const [customerName, setCustomerName] = useState(appointment.customerName || "");
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  if (appointment.review || success) {
    return (
      <div className="text-center py-6">
        <div className="w-14 h-14 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center mx-auto mb-4">
          <CheckCircle2 className="w-8 h-8" />
        </div>
        <h3 className="text-xl font-bold text-slate-100 mb-2">Değerlendirmeniz Kaydedildi!</h3>
        <p className="text-xs text-slate-400 max-w-sm mx-auto mb-6">
          Görüşleriniz <span className="text-slate-200 font-semibold">{appointment.business.name}</span> işletmesinin rezervasyon sayfasında yayınlanacaktır.
        </p>
        <Link
          href={`/${appointment.business.slug}`}
          className="inline-flex items-center justify-center rounded-xl bg-indigo-600 px-5 py-2.5 text-xs font-semibold text-white hover:bg-indigo-500 transition-colors"
        >
          İşletme Sayfasına Dön
        </Link>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!comment.trim()) {
      setError("Lütfen bir yorum yazınız.");
      return;
    }

    setSubmitting(true);
    setError("");

    try {
      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          appointmentId: appointment.id,
          rating,
          comment,
          customerName,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Değerlendirme kaydedilemedi.");
      } else {
        setSuccess(true);
        confetti({ particleCount: 70, spread: 60 });
      }
    } catch (err) {
      setError("Bağlantı hatası oluştu.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-slate-100 mb-1">{appointment.business.name}</h2>
        <p className="text-xs text-slate-400">
          {appointment.date} tarihindeki {appointment.service.name} hizmetinizi değerlendirin.
        </p>
      </div>

      {error && (
        <div className="mb-4 rounded-xl bg-rose-500/10 border border-rose-500/20 p-3 text-xs text-rose-300">
          {error}
        </div>
      )}

      {/* Star Selector */}
      <div className="flex items-center justify-center gap-2 mb-6">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => setRating(star)}
            onMouseEnter={() => setHoverRating(star)}
            onMouseLeave={() => setHoverRating(0)}
            className="p-1 text-slate-600 hover:scale-110 transition-transform"
          >
            <Star
              className={`w-8 h-8 transition-colors ${
                (hoverRating || rating) >= star
                  ? "fill-amber-400 text-amber-400"
                  : "text-slate-700"
              }`}
            />
          </button>
        ))}
      </div>

      <div className="space-y-4 mb-6">
        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1.5">
            Adınız Soyadınız
          </label>
          <input
            type="text"
            required
            value={customerName}
            onChange={(e) => setCustomerName(e.target.value)}
            className="w-full rounded-xl border border-slate-800 bg-slate-950/60 px-4 py-2.5 text-sm text-slate-100 focus:border-indigo-500 focus:outline-none"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1.5">
            Yorumunuz *
          </label>
          <textarea
            required
            rows={4}
            placeholder="Hizmet, çalışan ve işletme ile ilgili deneyiminiz nasıldı?"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            className="w-full rounded-xl border border-slate-800 bg-slate-950/60 px-4 py-2.5 text-sm text-slate-100 placeholder-slate-600 focus:border-indigo-500 focus:outline-none"
          />
        </div>
      </div>

      <button
        type="submit"
        disabled={submitting}
        className="w-full rounded-xl bg-indigo-600 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-600/30 hover:bg-indigo-500 disabled:opacity-50 transition-all"
      >
        {submitting ? "Gönderiliyor..." : "Değerlendirmeyi Yayınla"}
      </button>
    </form>
  );
}
