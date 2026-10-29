"use client";

import React, { useState } from "react";
import { Star, Reply, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";
import { Modal } from "@/components/Modal";
import { PageHeader } from "@/components/ui/PageHeader";
import { Panel } from "@/components/ui/Panel";
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
    <div className="space-y-5">
      <PageHeader
        accent="violet"
        title="Yorumlar"
        description="Yalnızca randevusu tamamlanmış müşteriler yorum yapabilir. Yorumları buradan yanıtlayın."
        actions={
          <div className="flex items-center gap-3 rounded-panel border border-line bg-surface px-4 py-2">
            <span className="text-2xl font-semibold tracking-tight tabular-nums text-ink">{avgRating}</span>
            <div>
              <Stars rating={Math.round(Number(avgRating))} />
              <p className="mt-0.5 text-xs text-ink-3">{reviews.length} değerlendirme</p>
            </div>
          </div>
        }
      />

      <Panel flush>
        {reviews.length === 0 ? (
          <EmptyState
            icon={Star}
            title="Henüz değerlendirme yok"
            description="Tamamlanan randevulardan sonra gelen yorumlar burada görünür."
          />
        ) : (
          <ul className="divide-y divide-line">
            {reviews.map((rev) => (
              <li key={rev.id} className="space-y-3 px-4 py-4 sm:px-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex min-w-0 items-start gap-3">
                    <Avatar name={rev.customerName} />
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                        <span className="text-sm font-medium text-ink">{rev.customerName}</span>
                        <span className="inline-flex items-center gap-1 text-xs text-brand-ink">
                          <ShieldCheck className="h-3.5 w-3.5" aria-hidden="true" />
                          Doğrulanmış randevu
                        </span>
                      </div>
                      <p className="text-sm text-ink-3">
                        {[rev.appointment?.service?.name, new Date(rev.createdAt).toLocaleDateString("tr-TR")]
                          .filter(Boolean)
                          .join(" · ")}
                      </p>
                    </div>
                  </div>
                  <Stars rating={rev.rating} />
                </div>

                <p className="text-sm leading-relaxed text-ink-2">{rev.comment}</p>

                {rev.businessReply ? (
                  <div className="rounded-control border-l-2 border-brand bg-surface-muted px-3 py-2">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-medium text-ink-2">Yanıtınız</span>
                      <Button size="sm" variant="ghost" className="h-6 px-1.5" onClick={() => handleOpenReply(rev)}>
                        Düzenle
                      </Button>
                    </div>
                    <p className="mt-0.5 text-sm text-ink-2">{rev.businessReply}</p>
                  </div>
                ) : (
                  <Button size="sm" onClick={() => handleOpenReply(rev)}>
                    <Reply className="w-3.5 h-3.5" aria-hidden="true" />
                    Yanıtla
                  </Button>
                )}
              </li>
            ))}
          </ul>
        )}
      </Panel>

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
          className={cn("h-3.5 w-3.5", s <= rating ? "fill-amber-400 text-amber-400" : "fill-line text-line-strong")}
          aria-hidden="true"
        />
      ))}
    </span>
  );
}
