"use client";

import React, { useState } from "react";
import { Star, Reply, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";
import { Modal } from "@/components/Modal";
import { PageHeader } from "@/components/ui/PageHeader";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { Avatar } from "@/components/ui/Avatar";
import { Field, Textarea } from "@/components/ui/Field";

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
      : "—";

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

  // App Store style summary: how many reviews gave each score.
  const distribution = [5, 4, 3, 2, 1].map((score) => ({ score, count: reviews.filter((r) => r.rating === score).length }));
  const biggest = Math.max(1, ...distribution.map((d) => d.count));

  return (
    <div className="space-y-5">
      <PageHeader title="Yorumlar" />

      {reviews.length === 0 ? (
        <div className="ios-group">
          <EmptyState icon={Star} title="Henüz değerlendirme yok" description="Tamamlanan randevulardan sonra gelen yorumlar burada görünür." />
        </div>
      ) : (
        <div className="grid items-start gap-5 lg:grid-cols-[300px_minmax(0,1fr)]">
          <section className="dash-widget lg:sticky lg:top-0" aria-label="Puan özeti">
            <p className="font-display text-[56px] font-semibold leading-none tracking-[-0.04em] text-ink tabular-nums">{avgRating.replace(".", ",")}</p>
            <div className="mt-2">
              <Stars rating={Math.round(Number(avgRating))} />
            </div>
            <p className="mt-1 text-[13px] text-ink-3">{reviews.length} değerlendirme</p>
            <ul className="mt-4 space-y-1.5">
              {distribution.map(({ score, count }) => (
                <li key={score} className="flex items-center gap-2 text-xs text-ink-3" title={`${score} yıldız: ${count}`}>
                  <span className="w-2 tabular-nums">{score}</span>
                  <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-surface-muted">
                    <span className="block h-full rounded-full bg-[#FF9F0A]" style={{ width: `${(count / biggest) * 100}%` }} />
                  </span>
                  <span className="w-5 text-right tabular-nums">{count}</span>
                </li>
              ))}
            </ul>
            <p className="mt-4 text-xs leading-5 text-ink-3">Yalnızca randevusu tamamlanan müşteriler yorum yapabilir.</p>
          </section>

          <ul className="space-y-3">
            {reviews.map((rev) => (
              <li key={rev.id} className="dash-widget space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-3">
                    <Avatar name={rev.customerName} />
                    <div className="min-w-0">
                      <p className="truncate text-[15px] font-semibold text-ink">{rev.customerName}</p>
                      <p className="truncate text-[13px] text-ink-3">
                        {[rev.appointment?.service?.name, new Date(rev.createdAt).toLocaleDateString("tr-TR")].filter(Boolean).join(" · ")}
                      </p>
                    </div>
                  </div>
                  <Stars rating={rev.rating} />
                </div>

                <p className="text-[15px] leading-relaxed text-ink-2">{rev.comment}</p>

                <p className="inline-flex items-center gap-1 text-xs text-brand-ink">
                  <ShieldCheck className="h-3.5 w-3.5" aria-hidden="true" />
                  Doğrulanmış randevu
                </p>

                {rev.businessReply ? (
                  <div className="rounded-[14px] bg-surface-muted/60 px-3.5 py-2.5">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[13px] font-semibold text-ink-2">Yanıtınız</span>
                      <button type="button" onClick={() => handleOpenReply(rev)} className="text-[13px] font-medium text-brand hover:text-brand-hover">
                        Düzenle
                      </button>
                    </div>
                    <p className="mt-0.5 text-sm text-ink-2">{rev.businessReply}</p>
                  </div>
                ) : (
                  <div>
                    <Button size="sm" onClick={() => handleOpenReply(rev)}>
                      <Reply className="w-3.5 h-3.5" aria-hidden="true" />
                      Yanıtla
                    </Button>
                  </div>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Reply Modal */}
      {selectedReview && (
        <Modal isOpen={!!selectedReview} onClose={() => setSelectedReview(null)} title="Yorumu yanıtla">
          <form onSubmit={handleSaveReply} className="space-y-4">
            <blockquote className="rounded-control border border-line bg-surface-muted px-3 py-2 text-sm text-ink-2">
              {selectedReview.comment}
            </blockquote>

            <Field label="Yanıtınız *" htmlFor="review-reply">
              <Textarea
                id="review-reply"
                rows={4}
                required
                placeholder="Müşterinize teşekkür edin veya deneyimini yanıtlayın..."
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
              />
            </Field>

            <Button type="submit" variant="primary" disabled={submitting} className="w-full">
              {submitting ? "Kaydediliyor..." : "Yanıtı yayınla"}
            </Button>
          </form>
        </Modal>
      )}
    </div>
  );
}

function Stars({ rating }: { rating: number }) {
  return (
    <span className="flex shrink-0 items-center gap-0.5" aria-label={`5 üzerinden ${rating} yıldız`}>
      {[1, 2, 3, 4, 5].map((s) => (
        <Star
          key={s}
          className={cn("h-3.5 w-3.5", s <= rating ? "fill-[#FF9F0A] text-[#FF9F0A]" : "fill-surface-muted text-surface-muted")}
          aria-hidden="true"
        />
      ))}
    </span>
  );
}
