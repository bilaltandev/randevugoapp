"use client";

import React, { useState } from "react";
import {
  Star,
  MessageSquare,
  Reply,
  CheckCircle2,
  Calendar,
  User,
  ShieldCheck,
} from "lucide-react";
import { Modal } from "@/components/Modal";

interface ReviewsClientProps {
  businessId: string;
  initialReviews: any[];
}

export default function ReviewsClient({
  businessId,
  initialReviews,
}: ReviewsClientProps) {
  const [reviews, setReviews] = useState(initialReviews);
  const [selectedReview, setSelectedReview] = useState<any>(null);
  const [replyText, setReplyText] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const avgRating =
    reviews.length > 0
      ? (reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length).toFixed(1)
      : "5.0";

  const handleOpenReply = (rev: any) => {
    setSelectedReview(rev);
    setReplyText(rev.businessReply || "");
  };

  const handleSaveReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedReview) return;
    setSubmitting(true);
    try {
      const res = await fetch("/api/reviews", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: selectedReview.id, businessReply: replyText }),
      });
      const data = await res.json();
      if (data.review) {
        setReviews((prev) =>
          prev.map((r) => (r.id === selectedReview.id ? data.review : r))
        );
        setSelectedReview(null);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header & Average Rating Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-100">
            Müşteri Değerlendirmeleri
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
            Sadece tamamlanmış gerçek randevu sahipleri yorum yapabilir. Yorumları buradan yanıtlayabilirsiniz.
          </p>
        </div>

        {/* Rating Summary Card */}
        <div className="flex items-center gap-3 rounded-2xl border border-slate-800 bg-slate-900/60 px-5 py-3 backdrop-blur-xl">
          <div className="flex text-amber-400">
            {[1, 2, 3, 4, 5].map((s) => (
              <Star key={s} className="w-5 h-5 fill-amber-400" />
            ))}
          </div>
          <div>
            <div className="flex items-baseline gap-1">
              <span className="text-xl font-extrabold text-slate-100">{avgRating}</span>
              <span className="text-xs text-slate-400">/ 5.0</span>
            </div>
            <span className="text-[11px] text-slate-400">{reviews.length} gerçek değerlendirme</span>
          </div>
        </div>
      </div>

      {/* Reviews List */}
      <div className="space-y-4">
        {reviews.length === 0 ? (
          <div className="p-12 text-center rounded-3xl border border-dashed border-slate-800 text-slate-400 text-xs">
            <Star className="w-10 h-10 text-slate-600 mx-auto mb-3" />
            Henüz tamamlanmış bir randevu değerlendirmesi bulunmuyor.
          </div>
        ) : (
          reviews.map((rev) => (
            <div
              key={rev.id}
              className="rounded-3xl border border-slate-800 bg-slate-900/60 p-6 backdrop-blur-xl space-y-4 hover:border-slate-700 transition-colors"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-500/20 text-indigo-400 font-bold text-sm">
                    {rev.customerName.slice(0, 1)}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-slate-100 text-sm">{rev.customerName}</span>
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 text-[10px] font-semibold text-emerald-400">
                        <ShieldCheck className="w-3 h-3" />
                        Doğrulanmış Randevu
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-slate-400 mt-0.5">
                      <span>{rev.appointment?.service?.name}</span>
                      <span>•</span>
                      <span>{new Date(rev.createdAt).toLocaleDateString("tr-TR")}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1 text-amber-400 self-start sm:self-auto">
                  {[...Array(rev.rating)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-amber-400" />
                  ))}
                </div>
              </div>

              <p className="text-slate-200 text-sm leading-relaxed italic bg-slate-950/40 p-4 rounded-2xl border border-slate-800/80">
                "{rev.comment}"
              </p>

              {/* Business Reply Display */}
              {rev.businessReply ? (
                <div className="ml-4 sm:ml-8 pl-4 border-l-2 border-indigo-500 py-1 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-indigo-400">İşletmenizin Yanıtı:</span>
                    <button
                      onClick={() => handleOpenReply(rev)}
                      className="text-[11px] text-slate-500 hover:text-indigo-400 font-medium"
                    >
                      Düzenle
                    </button>
                  </div>
                  <p className="text-xs text-slate-300">{rev.businessReply}</p>
                </div>
              ) : (
                <div className="flex justify-end">
                  <button
                    onClick={() => handleOpenReply(rev)}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-slate-800 bg-slate-950/60 px-3.5 py-1.5 text-xs font-semibold text-indigo-400 hover:bg-slate-800 transition-colors"
                  >
                    <Reply className="w-3.5 h-3.5" />
                    <span>Bu Yorumu Yanıtla</span>
                  </button>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Reply Modal */}
      {selectedReview && (
        <Modal
          isOpen={!!selectedReview}
          onClose={() => setSelectedReview(null)}
          title="Yoruma İşletme Cevabı Yaz"
        >
          <form onSubmit={handleSaveReply} className="space-y-4 text-xs">
            <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 text-slate-300 italic">
              "{selectedReview.comment}"
            </div>

            <div>
              <label className="block font-semibold text-slate-300 mb-1">
                İşletme Yanıtınız *
              </label>
              <textarea
                rows={4}
                required
                placeholder="Müşterinize teşekkür edin veya deneyimini yanıtlayın..."
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                className="w-full rounded-xl border border-slate-800 bg-slate-950/60 p-3.5 text-sm text-slate-100 focus:border-indigo-500 focus:outline-none"
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full rounded-xl bg-indigo-600 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-600/30 hover:bg-indigo-500 transition-all"
            >
              {submitting ? "Kaydediliyor..." : "Cevabı Yayınla"}
            </button>
          </form>
        </Modal>
      )}
    </div>
  );
}
