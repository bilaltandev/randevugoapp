"use client";

import React, { useState, useEffect } from "react";
import confetti from "canvas-confetti";
import {
  Calendar,
  Clock,
  User,
  Phone,
  Mail,
  CheckCircle2,
  ChevronRight,
  ChevronLeft,
  Scissors,
  Sparkles,
  MessageSquare,
  AlertCircle,
  Car,
  Utensils,
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";

interface Service {
  id: string;
  name: string;
  durationMinutes: number;
  price: number;
  description?: string | null;
  image?: string | null;
}

interface Employee {
  id: string;
  name: string;
  specialty: string;
  photo?: string | null;
}

/** Minimal subset of theme colors needed by the wizard */
export interface BookingThemeColors {
  background: string;
  surface: string;
  surfaceHover: string;
  primary: string;
  primaryText: string;   // readable text on primary bg
  text: string;
  mutedText: string;
  border: string;
  borderLight: string;
  accentGlow: string;
  badgeBg: string;
  badgeText: string;
}

interface BookingWizardProps {
  business: {
    id: string;
    name: string;
    slug: string;
    sector: string;
    phone: string;
    whatsappNumber?: string | null;
    subscription?: {
      status: string;
      trialEndDate?: string;
    } | null;
  };
  services: Service[];
  employees: Employee[];
  /** Optional: pass theme colors for branded styling */
  themeColors?: BookingThemeColors | null;
  /** Optional: border radius preset */
  themeRadius?: "none" | "small" | "medium" | "large" | "full";
}

// ---------------------------------------------------------------------------
// Default fallback colors (dark, neutral — safe for dashboard use)
// ---------------------------------------------------------------------------
const DEFAULT_COLORS: BookingThemeColors = {
  background: "#080C10",
  surface: "#101620",
  surfaceHover: "#1E293B",
  primary: "#6366F1",       // indigo – legacy look when no theme passed
  primaryText: "#FFFFFF",
  text: "#F1F5F9",
  mutedText: "#94A3B8",
  border: "#1E293B",
  borderLight: "#334155",
  accentGlow: "rgba(99,102,241,0.18)",
  badgeBg: "rgba(99,102,241,0.14)",
  badgeText: "#818CF8",
};

// Radius map
const RADIUS: Record<string, { card: string; button: string; badge: string; input: string }> = {
  none:   { card: "rounded-none",  button: "rounded-none",  badge: "rounded-none",  input: "rounded-none"  },
  small:  { card: "rounded-lg",    button: "rounded-md",    badge: "rounded-md",    input: "rounded-md"    },
  medium: { card: "rounded-2xl",   button: "rounded-xl",    badge: "rounded-lg",    input: "rounded-xl"    },
  large:  { card: "rounded-3xl",   button: "rounded-2xl",   badge: "rounded-xl",    input: "rounded-xl"    },
  full:   { card: "rounded-3xl",   button: "rounded-full",  badge: "rounded-full",  input: "rounded-2xl"   },
};

function isLightColor(colorStr?: string): boolean {
  if (!colorStr) return false;
  if (colorStr.startsWith("#") && colorStr.length >= 7) {
    const r = parseInt(colorStr.slice(1, 3), 16);
    const g = parseInt(colorStr.slice(3, 5), 16);
    const b = parseInt(colorStr.slice(5, 7), 16);
    return (0.299 * r + 0.587 * g + 0.114 * b) > 160;
  }
  return false;
}

export function BookingWizard({
  business,
  services,
  employees,
  themeColors,
  themeRadius = "large",
}: BookingWizardProps) {
  const c = themeColors ?? DEFAULT_COLORS;
  const r = RADIUS[themeRadius] ?? RADIUS.large;
  const isLight = isLightColor(c.surface) || isLightColor(c.background);

  const [step, setStep] = useState(1);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [selectedEmployee, setSelectedEmployee] = useState<string>("any");
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [selectedTime, setSelectedTime] = useState<string>("");

  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [notes, setNotes] = useState("");
  const [plateNumber, setPlateNumber] = useState("");
  const [guestCount, setGuestCount] = useState("2");

  const [availableSlots, setAvailableSlots] = useState<string[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [slotError, setSlotError] = useState("");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [bookingResult, setBookingResult] = useState<any>(null);

  useEffect(() => {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, "0");
    const dd = String(today.getDate()).padStart(2, "0");
    setSelectedDate(`${yyyy}-${mm}-${dd}`);
  }, []);

  useEffect(() => {
    if (!selectedDate || !business.id) return;
    async function fetchSlots() {
      setLoadingSlots(true);
      setSlotError("");
      try {
        const query = new URLSearchParams({
          businessId: business.id,
          date: selectedDate,
          employeeId: selectedEmployee,
          ...(selectedService ? { serviceId: selectedService.id } : {}),
        });
        const res = await fetch(`/api/appointments/available-slots?${query.toString()}`);
        const data = await res.json();
        if (data.slots) {
          setAvailableSlots(data.slots);
          if (data.slots.length === 0 && data.message) setSlotError(data.message);
        } else {
          setAvailableSlots([]);
          setSlotError(data.error || "Saatler yüklenemedi.");
        }
      } catch {
        setSlotError("Uygun saatler yüklenirken bir problem oluştu.");
      } finally {
        setLoadingSlots(false);
      }
    }
    fetchSlots();
  }, [selectedDate, selectedEmployee, selectedService, business.id]);

  const handleNextStep = () => {
    if (step === 1 && !selectedService) return;
    if (step === 3 && (!selectedDate || !selectedTime)) return;
    setStep(step + 1);
  };
  const handlePrevStep = () => { if (step > 1) setStep(step - 1); };

  const handleSubmitBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName || !customerPhone || !selectedService || !selectedDate || !selectedTime) {
      setSubmitError("Lütfen zorunlu alanları doldurunuz.");
      return;
    }
    setIsSubmitting(true);
    setSubmitError("");
    try {
      const sectorData: Record<string, string> = {};
      if (business.sector === "OTO_SERVIS" && plateNumber) sectorData.plateNumber = plateNumber;
      if (business.sector === "RESTORAN" && guestCount) sectorData.guestCount = guestCount;

      const res = await fetch("/api/appointments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          businessId: business.id,
          serviceId: selectedService.id,
          employeeId: selectedEmployee,
          date: selectedDate,
          startTime: selectedTime,
          customerName,
          customerPhone,
          customerEmail,
          notes,
          sectorData,
        }),
      });
      const data = await res.json();
      if (!res.ok || data.error) {
        setSubmitError(data.error || "Rezervasyon oluşturulamadı.");
        setIsSubmitting(false);
        return;
      }
      setBookingResult(data);
      setStep(5);
      confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
    } catch {
      setSubmitError("Bağlantı hatası oluştu. Lütfen tekrar deneyiniz.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedStaffMember = employees.find((e) => e.id === selectedEmployee);

  // Expired subscription guard
  if (business.subscription?.status === "expired") {
    return (
      <div
        className={`border p-8 text-center max-w-xl mx-auto ${r.card}`}
        style={{
          backgroundColor: `${c.surface}`,
          borderColor: "rgba(239,68,68,0.3)",
        }}
      >
        <AlertCircle className="w-12 h-12 mx-auto mb-3" style={{ color: "#F87171" }} />
        <h3 className="text-xl font-bold mb-2" style={{ color: c.text }}>
          Rezervasyon Sistemi Kapalıdır
        </h3>
        <p className="text-sm" style={{ color: c.mutedText }}>
          Bu işletmenin online randevu kotası veya aboneliği şu an aktif değildir.
          Lütfen doğrudan telefonla iletişime geçiniz:
        </p>
        <p className="font-semibold mt-3 text-lg" style={{ color: c.primary }}>
          {business.phone}
        </p>
      </div>
    );
  }

  // Shared input className
  const inputCls = `w-full ${r.input} border px-4 py-2.5 text-sm focus:outline-none transition-colors`;

  return (
    <div
      className={`w-full max-w-3xl mx-auto shadow-2xl overflow-hidden ${r.card}`}
      style={{
        backgroundColor: c.surface,
        borderWidth: 1,
        borderStyle: "solid",
        borderColor: c.border,
      }}
    >
      {/* ── Progress Header ── */}
      <div
        className="border-b px-6 py-4"
        style={{
          backgroundColor: c.surfaceHover,
          borderColor: c.border,
        }}
      >
        <div className="flex items-center justify-between">
          {[
            { num: 1, label: "Hizmet" },
            { num: 2, label: "Uzman" },
            { num: 3, label: "Tarih & Saat" },
            { num: 4, label: "İletişim" },
          ].map((item) => (
            <div key={item.num} className="flex items-center gap-2">
              <div
                className={`flex h-7 w-7 items-center justify-center ${r.badge} text-xs font-bold transition-all`}
                style={
                  step === item.num
                    ? {
                        backgroundColor: c.primary,
                        color: c.primaryText,
                        boxShadow: `0 0 0 4px ${c.accentGlow}`,
                      }
                    : step > item.num
                    ? {
                        backgroundColor: c.badgeBg,
                        color: c.primary,
                        border: `1px solid ${c.borderLight || c.border}`,
                      }
                    : {
                        backgroundColor: c.surfaceHover,
                        color: c.mutedText,
                        border: `1px solid ${c.border}`,
                      }
                }
              >
                {step > item.num ? <CheckCircle2 className="w-4 h-4" /> : item.num}
              </div>
              <span
                className="hidden sm:inline text-xs font-medium"
                style={{
                  color: step === item.num ? c.primary : c.mutedText,
                  fontWeight: step === item.num ? 700 : 500,
                }}
              >
                {item.label}
              </span>
              {item.num < 4 && (
                <div
                  className="hidden sm:block w-8 h-[1px] ml-2"
                  style={{
                    backgroundColor: step > item.num ? c.primary : c.border,
                    opacity: step > item.num ? 0.7 : 1,
                  }}
                />
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="p-6 sm:p-8">

        {/* ── STEP 1: Select Service ── */}
        {step === 1 && (
          <div>
            <h3 className="text-xl font-bold mb-1" style={{ color: c.text }}>
              Hizmet Seçimi
            </h3>
            <p className="text-xs mb-6" style={{ color: c.mutedText }}>
              Lütfen almak istediğiniz işlemi listeden belirleyin.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 max-h-[380px] overflow-y-auto pr-1">
              {services.map((srv) => {
                const isSelected = selectedService?.id === srv.id;
                return (
                  <div
                    key={srv.id}
                    onClick={() => setSelectedService(srv)}
                    className={`cursor-pointer border p-4 transition-all relative ${r.card}`}
                    style={{
                      backgroundColor: isSelected ? c.badgeBg : c.surfaceHover,
                      borderColor: isSelected ? c.primary : c.border,
                      boxShadow: isSelected ? `0 0 0 2px ${c.accentGlow}, 0 4px 16px ${c.accentGlow}` : undefined,
                    }}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="font-semibold text-sm" style={{ color: c.text }}>
                        {srv.name}
                      </h4>
                      <span
                        className={`font-bold text-sm px-2 py-0.5 ${r.badge} border`}
                        style={{
                          backgroundColor: isSelected ? c.primary : c.badgeBg,
                          color: isSelected ? c.primaryText : c.badgeText,
                          borderColor: isSelected ? c.primary : (c.borderLight || c.border),
                        }}
                      >
                        {srv.price === 0 ? "Ücretsiz" : formatCurrency(srv.price)}
                      </span>
                    </div>
                    {srv.description && (
                      <p className="text-xs line-clamp-2 mb-3" style={{ color: c.mutedText }}>
                        {srv.description}
                      </p>
                    )}
                    <div className="flex items-center gap-1.5 text-xs" style={{ color: c.mutedText }}>
                      <Clock className="w-3.5 h-3.5" style={{ color: c.primary }} />
                      <span>{srv.durationMinutes} dakika</span>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="mt-8 flex justify-end">
              <button
                onClick={handleNextStep}
                disabled={!selectedService}
                className={`inline-flex items-center gap-2 px-6 py-3 text-sm font-semibold shadow-lg transition-all disabled:opacity-40 disabled:cursor-not-allowed ${r.button}`}
                style={{
                  backgroundColor: c.primary,
                  color: c.primaryText,
                  boxShadow: `0 4px 20px ${c.accentGlow}`,
                }}
              >
                <span>Devam Et: Uzman Seç</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* ── STEP 2: Select Specialist ── */}
        {step === 2 && (
          <div>
            <h3 className="text-xl font-bold mb-1" style={{ color: c.text }}>
              Uzman / Çalışan Seçimi
            </h3>
            <p className="text-xs mb-6" style={{ color: c.mutedText }}>
              Hizmeti kimden almak istersiniz?
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 mb-8">
              {/* Any available */}
              <div
                onClick={() => setSelectedEmployee("any")}
                className={`cursor-pointer border p-4 transition-all flex items-center gap-3.5 ${r.card}`}
                style={{
                  backgroundColor: selectedEmployee === "any" ? c.badgeBg : c.surfaceHover,
                  borderColor: selectedEmployee === "any" ? c.primary : c.border,
                  boxShadow: selectedEmployee === "any" ? `0 0 0 2px ${c.accentGlow}` : undefined,
                }}
              >
                <div
                  className={`flex h-12 w-12 items-center justify-center font-bold ${r.badge} border`}
                  style={{
                    backgroundColor: c.badgeBg,
                    color: c.primary,
                    borderColor: `${c.primary}30`,
                  }}
                >
                  <Sparkles className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="font-semibold text-sm" style={{ color: c.text }}>
                    Fark Etmez / İlk Müsait
                  </h4>
                  <p className="text-xs" style={{ color: c.mutedText }}>
                    En erken randevu saatini bulur
                  </p>
                </div>
              </div>

              {employees.map((emp) => {
                const isSelected = selectedEmployee === emp.id;
                return (
                  <div
                    key={emp.id}
                    onClick={() => setSelectedEmployee(emp.id)}
                    className={`cursor-pointer border p-4 transition-all flex items-center gap-3.5 ${r.card}`}
                    style={{
                      backgroundColor: isSelected ? c.badgeBg : c.surfaceHover,
                      borderColor: isSelected ? c.primary : c.border,
                      boxShadow: isSelected ? `0 0 0 2px ${c.accentGlow}` : undefined,
                    }}
                  >
                    {emp.photo ? (
                      <img
                        src={emp.photo}
                        alt={emp.name}
                        className={`w-12 h-12 object-cover border ${r.badge}`}
                        style={{ borderColor: c.borderLight }}
                      />
                    ) : (
                      <div
                        className={`flex h-12 w-12 items-center justify-center font-bold text-base ${r.badge} border`}
                        style={{
                          backgroundColor: c.badgeBg,
                          color: c.primary,
                          borderColor: c.borderLight,
                        }}
                      >
                        {emp.name.slice(0, 1)}
                      </div>
                    )}
                    <div>
                      <h4 className="font-semibold text-sm" style={{ color: c.text }}>
                        {emp.name}
                      </h4>
                      <p className="text-xs" style={{ color: c.primary }}>
                        {emp.specialty}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="flex justify-between items-center">
              <button
                onClick={handlePrevStep}
                className={`inline-flex items-center gap-1.5 border px-4 py-2.5 text-xs font-medium transition-colors ${r.button}`}
                style={{
                  backgroundColor: c.surfaceHover,
                  borderColor: c.border,
                  color: c.mutedText,
                }}
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Geri</span>
              </button>
              <button
                onClick={handleNextStep}
                className={`inline-flex items-center gap-2 px-6 py-3 text-sm font-semibold shadow-lg transition-all ${r.button}`}
                style={{
                  backgroundColor: c.primary,
                  color: c.primaryText,
                  boxShadow: `0 4px 20px ${c.accentGlow}`,
                }}
              >
                <span>Devam Et: Tarih & Saat</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* ── STEP 3: Date & Slot ── */}
        {step === 3 && (
          <div>
            <h3 className="text-xl font-bold mb-1" style={{ color: c.text }}>
              Tarih & Saat Seçimi
            </h3>
            <p className="text-xs mb-6" style={{ color: c.mutedText }}>
              Müsait randevu takviminden size uygun zamanı işaretleyin.
            </p>

            <div className="mb-6">
              <label className="block text-xs font-semibold mb-2" style={{ color: c.text }}>
                Randevu Tarihi
              </label>
              <input
                type="date"
                min={new Date().toISOString().split("T")[0]}
                value={selectedDate}
                onChange={(e) => { setSelectedDate(e.target.value); setSelectedTime(""); }}
                className={`w-full sm:w-64 ${r.input} border px-4 py-2.5 text-sm focus:outline-none`}
                style={{
                  backgroundColor: c.surfaceHover,
                  borderColor: c.border,
                  color: c.text,
                  outlineColor: c.primary,
                  colorScheme: isLight ? "light" : "dark",
                }}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold mb-2.5" style={{ color: c.text }}>
                Müsait Saatler ({selectedDate})
              </label>

              {loadingSlots ? (
                <div className="p-8 text-center text-sm" style={{ color: c.mutedText }}>
                  <div
                    className="w-6 h-6 border-2 border-t-transparent rounded-full animate-spin mx-auto mb-2"
                    style={{ borderColor: `${c.primary} transparent transparent transparent` }}
                  />
                  Müsait saatler kontrol ediliyor...
                </div>
              ) : slotError ? (
                <div
                  className={`p-4 text-xs ${r.card} border`}
                  style={{
                    backgroundColor: "rgba(245,158,11,0.08)",
                    borderColor: "rgba(245,158,11,0.25)",
                    color: "#FCD34D",
                  }}
                >
                  {slotError}
                </div>
              ) : availableSlots.length === 0 ? (
                <div
                  className={`p-6 text-center text-xs border ${r.card}`}
                  style={{
                    backgroundColor: c.surfaceHover,
                    borderColor: c.border,
                    color: c.mutedText,
                  }}
                >
                  Bu tarihte uygun randevu saati kalmadı. Lütfen başka bir gün seçiniz.
                </div>
              ) : (
                <div className="grid grid-cols-3 sm:grid-cols-5 md:grid-cols-6 gap-2.5 max-h-[220px] overflow-y-auto pr-1">
                  {availableSlots.map((slot) => {
                    const isSelected = selectedTime === slot;
                    return (
                      <button
                        key={slot}
                        type="button"
                        onClick={() => setSelectedTime(slot)}
                        className={`py-2 px-3 text-xs font-semibold transition-all ${r.badge} border`}
                        style={
                          isSelected
                            ? {
                                backgroundColor: c.primary,
                                color: c.primaryText,
                                borderColor: c.primary,
                                boxShadow: `0 2px 12px ${c.accentGlow}`,
                              }
                            : {
                                backgroundColor: c.surfaceHover,
                                color: c.text,
                                borderColor: c.border,
                              }
                        }
                      >
                        {slot}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="mt-8 flex justify-between items-center">
              <button
                onClick={handlePrevStep}
                className={`inline-flex items-center gap-1.5 border px-4 py-2.5 text-xs font-medium transition-colors ${r.button}`}
                style={{
                  backgroundColor: c.surfaceHover,
                  borderColor: c.border,
                  color: c.mutedText,
                }}
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Geri</span>
              </button>
              <button
                onClick={handleNextStep}
                disabled={!selectedTime}
                className={`inline-flex items-center gap-2 px-6 py-3 text-sm font-semibold shadow-lg transition-all disabled:opacity-40 disabled:cursor-not-allowed ${r.button}`}
                style={{
                  backgroundColor: c.primary,
                  color: c.primaryText,
                  boxShadow: `0 4px 20px ${c.accentGlow}`,
                }}
              >
                <span>Devam Et: Bilgileriniz</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* ── STEP 4: Customer Details ── */}
        {step === 4 && (
          <form onSubmit={handleSubmitBooking}>
            <h3 className="text-xl font-bold mb-1" style={{ color: c.text }}>
              İletişim & Onay
            </h3>
            <p className="text-xs mb-6" style={{ color: c.mutedText }}>
              Rezervasyon teyidi ve WhatsApp bilgilendirmesi için bilgilerinizi giriniz.
            </p>

            {/* Summary Card */}
            <div
              className={`mb-6 border p-4 ${r.card}`}
              style={{
                backgroundColor: c.badgeBg,
                borderColor: c.borderLight || c.border,
              }}
            >
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div>
                  <span className="block mb-0.5" style={{ color: c.mutedText }}>Hizmet</span>
                  <span className="font-semibold" style={{ color: c.text }}>{selectedService?.name}</span>
                </div>
                <div>
                  <span className="block mb-0.5" style={{ color: c.mutedText }}>Uzman</span>
                  <span className="font-semibold" style={{ color: c.text }}>
                    {selectedStaffMember ? selectedStaffMember.name : "İlk Müsait Uzman"}
                  </span>
                </div>
                <div>
                  <span className="block mb-0.5" style={{ color: c.mutedText }}>Tarih & Saat</span>
                  <span className="font-semibold" style={{ color: c.primary }}>
                    {selectedDate} • {selectedTime}
                  </span>
                </div>
                <div>
                  <span className="block mb-0.5" style={{ color: c.mutedText }}>Tutar</span>
                  <span className="font-semibold" style={{ color: c.text }}>
                    {selectedService?.price === 0 ? "Ücretsiz" : formatCurrency(selectedService?.price || 0)}
                  </span>
                </div>
              </div>
            </div>

            {submitError && (
              <div
                className={`mb-4 border p-3 text-xs ${r.card}`}
                style={{
                  backgroundColor: "rgba(239,68,68,0.08)",
                  borderColor: "rgba(239,68,68,0.25)",
                  color: "#FCA5A5",
                }}
              >
                {submitError}
              </div>
            )}

            <div className="space-y-4 mb-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Name */}
                <div>
                  <label className="block text-xs font-semibold mb-1.5" style={{ color: c.text }}>
                    Adınız Soyadınız *
                  </label>
                  <div className="relative">
                    <User className="absolute left-3.5 top-3 w-4 h-4" style={{ color: c.mutedText }} />
                    <input
                      type="text"
                      required
                      placeholder="Ahmet Yılmaz"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      className={`${inputCls} pl-10 pr-4`}
                      style={{
                        backgroundColor: c.surfaceHover,
                        borderColor: c.border,
                        color: c.text,
                      }}
                    />
                  </div>
                </div>

                {/* Phone */}
                <div>
                  <label className="block text-xs font-semibold mb-1.5" style={{ color: c.text }}>
                    Telefon Numaranız *
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-3.5 top-3 w-4 h-4" style={{ color: c.mutedText }} />
                    <input
                      type="tel"
                      required
                      placeholder="0532 000 00 00"
                      value={customerPhone}
                      onChange={(e) => setCustomerPhone(e.target.value)}
                      className={`${inputCls} pl-10 pr-4`}
                      style={{
                        backgroundColor: c.surfaceHover,
                        borderColor: c.border,
                        color: c.text,
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* Email */}
              <div>
                <label className="block text-xs font-semibold mb-1.5" style={{ color: c.text }}>
                  E-Posta (İsteğe bağlı)
                </label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-3 w-4 h-4" style={{ color: c.mutedText }} />
                  <input
                    type="email"
                    placeholder="ornek@mail.com"
                    value={customerEmail}
                    onChange={(e) => setCustomerEmail(e.target.value)}
                    className={`${inputCls} pl-10 pr-4`}
                    style={{
                      backgroundColor: c.surfaceHover,
                      borderColor: c.border,
                      color: c.text,
                    }}
                  />
                </div>
              </div>

              {/* Sector: Oto Servis */}
              {business.sector === "OTO_SERVIS" && (
                <div>
                  <label className="block text-xs font-semibold mb-1.5" style={{ color: c.text }}>
                    Araç Plakası & Modeli
                  </label>
                  <div className="relative">
                    <Car className="absolute left-3.5 top-3 w-4 h-4" style={{ color: c.mutedText }} />
                    <input
                      type="text"
                      placeholder="34 ABC 123 (Renault Megane 2021)"
                      value={plateNumber}
                      onChange={(e) => setPlateNumber(e.target.value)}
                      className={`${inputCls} pl-10 pr-4`}
                      style={{
                        backgroundColor: c.surfaceHover,
                        borderColor: c.border,
                        color: c.text,
                      }}
                    />
                  </div>
                </div>
              )}

              {/* Sector: Restoran */}
              {business.sector === "RESTORAN" && (
                <div>
                  <label className="block text-xs font-semibold mb-1.5" style={{ color: c.text }}>
                    Kişi Sayısı
                  </label>
                  <div className="relative">
                    <Utensils className="absolute left-3.5 top-3 w-4 h-4" style={{ color: c.mutedText }} />
                    <select
                      value={guestCount}
                      onChange={(e) => setGuestCount(e.target.value)}
                      className={`${inputCls} pl-10 pr-4`}
                      style={{
                        backgroundColor: c.surfaceHover,
                        borderColor: c.border,
                        color: c.text,
                      }}
                    >
                      {[1, 2, 3, 4, 5, 6, 8, 10, "10+"].map((n) => (
                        <option
                          key={n}
                          value={n}
                          style={{ backgroundColor: c.surface, color: c.text }}
                        >
                          {n} Kişi
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              )}

              {/* Notes */}
              <div>
                <label className="block text-xs font-semibold mb-1.5" style={{ color: c.text }}>
                  Özel Not / İstek
                </label>
                <textarea
                  rows={2}
                  placeholder="Eklemek istediğiniz özel bir durum var mı?"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className={`${inputCls}`}
                  style={{
                    backgroundColor: c.surfaceHover,
                    borderColor: c.border,
                    color: c.text,
                  }}
                />
              </div>
            </div>

            <div className="flex justify-between items-center">
              <button
                type="button"
                onClick={handlePrevStep}
                className={`inline-flex items-center gap-1.5 border px-4 py-2.5 text-xs font-medium transition-colors ${r.button}`}
                style={{
                  backgroundColor: c.surfaceHover,
                  borderColor: c.border,
                  color: c.mutedText,
                }}
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Geri</span>
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className={`inline-flex items-center gap-2 px-7 py-3 text-sm font-semibold shadow-lg transition-all disabled:opacity-50 ${r.button}`}
                style={{
                  backgroundColor: c.primary,
                  color: c.primaryText,
                  boxShadow: `0 4px 20px ${c.accentGlow}`,
                }}
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>{isSubmitting ? "Oluşturuluyor..." : "Rezervasyonu Onayla"}</span>
              </button>
            </div>
          </form>
        )}

        {/* ── STEP 5: Success ── */}
        {step === 5 && bookingResult && (
          <div className="text-center py-4">
            <div
              className={`flex h-16 w-16 items-center justify-center mx-auto mb-4 border ${r.badge}`}
              style={{
                backgroundColor: "rgba(16,185,129,0.15)",
                borderColor: "rgba(16,185,129,0.3)",
                color: "#4ADE80",
              }}
            >
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <h3 className="text-2xl font-bold mb-2" style={{ color: c.text }}>
              Rezervasyonunuz Alındı! 🎉
            </h3>
            <p className="text-sm max-w-md mx-auto mb-6" style={{ color: c.mutedText }}>
              Talebiniz{" "}
              <span className="font-semibold" style={{ color: c.text }}>
                {business.name}
              </span>{" "}
              işletmesine başarıyla iletildi.
            </p>

            <div
              className={`border p-5 max-w-md mx-auto mb-6 text-left text-xs space-y-2.5 ${r.card}`}
              style={{
                backgroundColor: c.surfaceHover,
                borderColor: c.border,
              }}
            >
              <div className="flex justify-between">
                <span style={{ color: c.mutedText }}>Tarih & Saat:</span>
                <span className="font-semibold" style={{ color: c.text }}>
                  {selectedDate} • {selectedTime}
                </span>
              </div>
              <div className="flex justify-between">
                <span style={{ color: c.mutedText }}>Hizmet:</span>
                <span className="font-semibold" style={{ color: c.text }}>
                  {selectedService?.name}
                </span>
              </div>
              <div className="flex justify-between">
                <span style={{ color: c.mutedText }}>Müşteri:</span>
                <span className="font-semibold" style={{ color: c.text }}>
                  {customerName} ({customerPhone})
                </span>
              </div>
            </div>

            {bookingResult.whatsappUrl && (
              <div className="space-y-3 max-w-md mx-auto">
                <a
                  href={bookingResult.whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`inline-flex items-center justify-center gap-2 w-full px-6 py-3.5 text-sm font-semibold text-white shadow-lg transition-all ${r.button}`}
                  style={{
                    backgroundColor: "#16A34A",
                    boxShadow: "0 4px 16px rgba(22,163,74,0.3)",
                  }}
                >
                  <MessageSquare className="w-5 h-5" />
                  <span>WhatsApp ile İşletmeye Bildir</span>
                </a>
                <p className="text-[11px]" style={{ color: c.mutedText }}>
                  İşletmeyle hemen WhatsApp üzerinden teyitleşmek için yukarıdaki butona tıklayabilirsiniz.
                </p>
              </div>
            )}

            <div
              className="mt-8 pt-4 border-t"
              style={{ borderColor: c.border }}
            >
              <button
                onClick={() => {
                  setStep(1);
                  setSelectedService(null);
                  setSelectedTime("");
                  setBookingResult(null);
                }}
                className="text-xs font-medium hover:underline"
                style={{ color: c.primary }}
              >
                Yeni Bir Randevu Daha Al
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
