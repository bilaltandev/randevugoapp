"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  Clock,
  Phone,
  CheckCircle2,
  ChevronRight,
  ChevronLeft,
  MessageSquare,
  AlertCircle,
  Car,
  UtensilsCrossed,
  LayoutGrid,
  Check,
  Loader2,
  Users,
} from "lucide-react";
import { formatCurrency, getDefaultStaffSelection } from "@/lib/utils";
import { publicThemeVars, pt, toDateKey, formatDateKey, useTodayKey } from "@/components/themes/publicTheme";
import { RestaurantTable, RestaurantArea } from "./restaurant/types";
import { FloorPlanCanvas } from "./restaurant/FloorPlanCanvas";
import { TableCardPreview } from "./restaurant/TableCardPreview";

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
  employeeServices?: { serviceId: string }[];
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
    enableStaffSelection?: boolean;
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
  /** Preselects a service picked elsewhere on the page; bump `nonce` to repeat the same pick. */
  requestedService?: { id: string; nonce: number } | null;
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
  large:  { card: "rounded-2xl",   button: "rounded-xl",    badge: "rounded-xl",    input: "rounded-xl"    },
  full:   { card: "rounded-2xl",   button: "rounded-full",  badge: "rounded-full",  input: "rounded-xl"    },
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
  requestedService = null,
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
  const isRestaurant = business.sector === "RESTORAN" || business.sector === "RESTAURANT";
  const [guestCount, setGuestCount] = useState("2");

  // Restaurant Table Management States
  const [restaurantTables, setRestaurantTables] = useState<RestaurantTable[]>([]);
  const [restaurantAreas, setRestaurantAreas] = useState<RestaurantArea[]>([]);
  const [selectedTable, setSelectedTable] = useState<RestaurantTable | null>(null);
  const [loadingTables, setLoadingTables] = useState(false);
  const [tableCardMode, setTableCardMode] = useState<"cards" | "canvas">("canvas");
  const [activeTableAreaId, setActiveTableAreaId] = useState<string>("ALL");

  const [availableSlots, setAvailableSlots] = useState<string[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [slotError, setSlotError] = useState("");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [bookingResult, setBookingResult] = useState<any>(null);

  // Business staff selection configuration (Sector default fallback, owner setting takes precedence)
  const staffSelectionEnabled =
    business.enableStaffSelection !== undefined
      ? Boolean(business.enableStaffSelection)
      : getDefaultStaffSelection(business.sector);

  // Eligible employees for the currently selected service
  const eligibleEmployees = useMemo(() => {
    if (!selectedService) return employees;
    const hasAssignments = employees.some(
      (e) => Array.isArray(e.employeeServices) && e.employeeServices.length > 0
    );
    if (!hasAssignments) return employees;
    return employees.filter(
      (e) =>
        !e.employeeServices ||
        e.employeeServices.length === 0 ||
        e.employeeServices.some((es) => es.serviceId === selectedService.id)
    );
  }, [employees, selectedService]);

  // Keep selected employee valid if service changes
  useEffect(() => {
    if (selectedEmployee !== "any" && !eligibleEmployees.some((e) => e.id === selectedEmployee)) {
      setSelectedEmployee("any");
    }
  }, [eligibleEmployees, selectedEmployee]);

  // Step definitions based on staffSelectionEnabled
  const stepsList = staffSelectionEnabled
    ? [
        { id: 1, label: "Hizmet" },
        { id: 2, label: "Uzman" },
        { id: 3, label: isRestaurant ? "Masa & Saat" : "Tarih & Saat" },
        { id: 4, label: "İletişim" },
      ]
    : [
        { id: 1, label: "Hizmet" },
        { id: 3, label: isRestaurant ? "Masa & Saat" : "Tarih & Saat" },
        { id: 4, label: "İletişim" },
      ];

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

  // Fetch restaurant areas and tables when date, time, or guest count changes
  useEffect(() => {
    if (!isRestaurant || !business.id || !selectedDate || !selectedTime) return;

    async function fetchTablesAndAreas() {
      setLoadingTables(true);
      try {
        // Fetch areas
        const areasRes = await fetch(`/api/restaurant/areas?businessId=${business.id}`);
        const areasData = await areasRes.json();
        if (areasData.areas) {
          setRestaurantAreas(areasData.areas);
        }

        // Fetch tables with computed status
        const query = new URLSearchParams({
          businessId: business.id,
          date: selectedDate,
          startTime: selectedTime,
          durationMinutes: String(selectedService?.durationMinutes || 90),
          guestCount: String(guestCount || "2"),
        });
        const tablesRes = await fetch(`/api/restaurant/tables?${query.toString()}`);
        const tablesData = await tablesRes.json();
        if (tablesData.tables) {
          setRestaurantTables(tablesData.tables);
          // If selected table is no longer available, deselect it
          if (selectedTable) {
            const found = tablesData.tables.find((t: RestaurantTable) => t.id === selectedTable.id);
            if (!found || !found.isAvailable) {
              setSelectedTable(null);
            }
          }
        }
      } catch (err) {
        console.error("Fetch tables error:", err);
      } finally {
        setLoadingTables(false);
      }
    }

    fetchTablesAndAreas();
  }, [isRestaurant, business.id, selectedDate, selectedTime, guestCount, selectedService]);

  const handleNextStep = () => {
    if (step === 1) {
      if (!selectedService) return;
      if (!staffSelectionEnabled) {
        setStep(3); // Skip specialist step entirely
        return;
      }
      setStep(2);
      return;
    }
    if (step === 2) {
      setStep(3);
      return;
    }
    if (step === 3) {
      if (!selectedDate || !selectedTime) return;
      setStep(4);
      return;
    }
    setStep(step + 1);
  };

  const handlePrevStep = () => {
    if (step === 3 && !staffSelectionEnabled) {
      setStep(1); // Jump back to step 1
      return;
    }
    if (step > 1) {
      setStep(step - 1);
    }
  };

  const handleSubmitBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName || !customerPhone || !selectedService || !selectedDate || !selectedTime) {
      setSubmitError("Lütfen zorunlu alanları doldurunuz.");
      return;
    }
    setIsSubmitting(true);
    setSubmitError("");
    try {
      const sectorData: Record<string, any> = {};
      if (business.sector === "OTO_SERVIS" && plateNumber) sectorData.plateNumber = plateNumber;
      if (isRestaurant) {
        if (guestCount) sectorData.guestCount = guestCount;
        if (selectedTable) {
          sectorData.tableId = selectedTable.id;
          sectorData.tableName = selectedTable.name;
          if (selectedTable.area?.name) sectorData.areaName = selectedTable.area.name;
        }
      }

      const res = await fetch("/api/appointments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          businessId: business.id,
          serviceId: selectedService.id,
          employeeId: selectedEmployee,
          date: selectedDate,
          startTime: selectedTime,
          tableId: selectedTable?.id || null,
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
    } catch {
      setSubmitError("Bağlantı hatası oluştu. Lütfen tekrar deneyiniz.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedStaffMember = employees.find((e) => e.id === selectedEmployee);

  // A service picked from the page's service list preselects it here.
  const [handledRequest, setHandledRequest] = useState<number | null>(null);
  if (requestedService && requestedService.nonce !== handledRequest) {
    setHandledRequest(requestedService.nonce);
    const srv = services.find((s) => s.id === requestedService.id);
    if (srv) {
      setSelectedService(srv);
      setSelectedTime("");
      setBookingResult(null);
      setStep(1);
    }
  }

  // Next 14 days for the quick date strip (built on the client only, to match the visitor's clock).
  const today = useTodayKey();
  const quickDays = useMemo(() => {
    if (!today) return [];
    const [y, m, d] = today.split("-").map(Number);
    return Array.from({ length: 14 }, (_, i) => new Date(y, m - 1, d + i));
  }, [today]);
  const dateInStrip = quickDays.some((d) => toDateKey(d) === selectedDate);

  // Group slots into parts of the day for easier scanning.
  const slotGroups = useMemo(() => {
    const groups: { label: string; slots: string[] }[] = [
      { label: "Sabah", slots: [] },
      { label: "Öğleden sonra", slots: [] },
      { label: "Akşam", slots: [] },
    ];
    for (const slot of availableSlots) {
      const h = Number(slot.split(":")[0]);
      groups[h < 12 ? 0 : h < 17 ? 1 : 2].slots.push(slot);
    }
    return groups.filter((g) => g.slots.length > 0);
  }, [availableSlots]);

  const vars = publicThemeVars(c, c.primaryText, isLight);
  const priceLabel = (price: number) => (price === 0 ? "Ücretsiz" : formatCurrency(price));
  const currentStepIndex = Math.max(0, stepsList.findIndex((s) => s.id === step));

  // Expired subscription guard
  if (business.subscription?.status === "expired") {
    return (
      <div style={vars} className={`w-full border p-6 text-center sm:p-8 ${pt.surface} ${pt.border} ${r.card}`}>
        <AlertCircle className="mx-auto mb-3 h-8 w-8 text-(color:--t-warning)" aria-hidden="true" />
        <h3 className={`text-lg font-semibold ${pt.text}`}>Online randevu şu an kapalı</h3>
        <p className={`mx-auto mt-1 max-w-sm text-sm ${pt.muted}`}>
          Bu işletme şu anda online randevu almıyor. Randevu için işletmeyi doğrudan arayabilirsiniz.
        </p>
        {business.phone && (
          <a
            href={`tel:${business.phone}`}
            className={`mt-4 inline-flex h-11 items-center justify-center gap-2 px-5 text-sm ${pt.primaryBtn} ${pt.focus} ${r.button}`}
          >
            <Phone className="h-4 w-4" aria-hidden="true" />
            {business.phone}
          </a>
        )}
      </div>
    );
  }

  const backButton = (
    <button
      type="button"
      onClick={handlePrevStep}
      className={`inline-flex h-11 items-center gap-1.5 px-4 text-sm ${pt.secondaryBtn} ${pt.focus} ${r.button}`}
    >
      <ChevronLeft className="h-4 w-4" aria-hidden="true" />
      Geri
    </button>
  );

  const nextButton = (label: string, disabled = false) => (
    <button
      type="button"
      onClick={handleNextStep}
      disabled={disabled}
      className={`inline-flex h-11 flex-1 items-center justify-center gap-2 px-5 text-sm sm:flex-none ${pt.primaryBtn} ${pt.focus} ${r.button}`}
    >
      {label}
      <ChevronRight className="h-4 w-4" aria-hidden="true" />
    </button>
  );

  const stepHeading = (title: string, hint?: string) => (
    <div className="mb-5">
      <h3 className={`text-lg font-semibold tracking-tight ${pt.text}`}>{title}</h3>
      {hint && <p className={`mt-0.5 text-sm ${pt.muted}`}>{hint}</p>}
    </div>
  );

  const radioDot = (selected: boolean) => (
    <span
      className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border ${
        selected ? "border-(color:--t-primary) bg-(color:--t-primary)" : pt.border2
      }`}
      aria-hidden="true"
    >
      {selected && <Check className="h-3 w-3 text-(color:--t-on-primary)" strokeWidth={3} />}
    </span>
  );

  const notice = (tone: "warning" | "danger" | "neutral", children: React.ReactNode) => (
    <div
      role={tone === "danger" ? "alert" : "status"}
      className={`flex items-start gap-2 border px-3.5 py-3 text-sm ${r.input} ${
        tone === "warning"
          ? "border-(color:--t-warning)/30 bg-(color:--t-warning-bg) text-(color:--t-warning)"
          : tone === "danger"
          ? "border-(color:--t-danger)/30 bg-(color:--t-danger-bg) text-(color:--t-danger)"
          : `${pt.border} ${pt.surface2} ${pt.muted}`
      }`}
    >
      {tone !== "neutral" && <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />}
      <div>{children}</div>
    </div>
  );

  // Running summary of what's been picked so far (from step 2 on).
  const summaryItems = [
    selectedService && {
      label: "Hizmet",
      value: `${selectedService.name} · ${selectedService.durationMinutes} dk`,
      onEdit: () => setStep(1),
    },
    staffSelectionEnabled &&
      step > 2 && {
        label: "Uzman",
        value: selectedStaffMember ? selectedStaffMember.name : "Fark etmez",
        onEdit: () => setStep(2),
      },
    step > 3 &&
      selectedTime && {
        label: "Tarih",
        value: `${formatDateKey(selectedDate, { weekday: "short", day: "numeric", month: "long" })} · ${selectedTime}`,
        onEdit: () => setStep(3),
      },
  ].filter(Boolean) as { label: string; value: string; onEdit: () => void }[];

  return (
    <div style={vars} className={`w-full overflow-hidden border ${pt.surface} ${pt.border} ${r.card}`}>
      {/* ── Progress ── */}
      {step <= 4 && (
        <div className={`border-b px-4 pb-3 pt-4 sm:px-6 ${pt.border}`}>
          <div className="flex items-baseline justify-between gap-3 text-sm">
            <span className={`font-medium ${pt.text}`}>{stepsList[currentStepIndex]?.label}</span>
            <span className={`text-xs tabular-nums ${pt.muted}`}>
              Adım {currentStepIndex + 1} / {stepsList.length}
            </span>
          </div>
          <ol className="mt-2.5 flex gap-1.5" aria-label="Rezervasyon adımları">
            {stepsList.map((s, i) => (
              <li
                key={s.id}
                className={`h-1 flex-1 rounded-full ${i <= currentStepIndex ? "bg-(color:--t-primary)" : "bg-(color:--t-border)"}`}
                aria-current={i === currentStepIndex ? "step" : undefined}
              >
                <span className="sr-only">{s.label}</span>
              </li>
            ))}
          </ol>

          {step > 1 && summaryItems.length > 0 && (
            <dl className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5 text-xs">
              {summaryItems.map((item) => (
                <div key={item.label} className="flex min-w-0 items-center gap-1.5">
                  <dt className={pt.muted}>{item.label}:</dt>
                  <dd className={`truncate font-medium ${pt.text}`}>{item.value}</dd>
                  <button
                    type="button"
                    onClick={item.onEdit}
                    className={`shrink-0 underline-offset-2 hover:underline ${pt.accent}`}
                  >
                    Değiştir
                  </button>
                </div>
              ))}
            </dl>
          )}
        </div>
      )}

      <div className="p-4 sm:p-6">
        {/* ── STEP 1: Service ── */}
        {step === 1 && (
          <div>
            {stepHeading(isRestaurant ? "Rezervasyon türü" : "Hizmet seçin", "Almak istediğiniz hizmeti seçin.")}

            {services.length === 0 ? (
              notice(
                "neutral",
                <>
                  Bu işletme henüz online randevuya açık bir hizmet eklememiş.
                  {business.phone && (
                    <>
                      {" "}Randevu için{" "}
                      <a href={`tel:${business.phone}`} className={`font-medium underline ${pt.text}`}>
                        {business.phone}
                      </a>{" "}
                      numarasını arayabilirsiniz.
                    </>
                  )}
                </>
              )
            ) : (
              <div role="radiogroup" aria-label="Hizmetler" className="space-y-2">
                {services.map((srv) => {
                  const isSelected = selectedService?.id === srv.id;
                  return (
                    <button
                      key={srv.id}
                      type="button"
                      role="radio"
                      aria-checked={isSelected}
                      onClick={() => setSelectedService(srv)}
                      className={`flex w-full items-start gap-3 border p-3.5 text-left transition-colors sm:p-4 ${pt.focus} ${r.input} ${
                        isSelected ? pt.selected : `${pt.border} hover:bg-(color:--t-surface-2)`
                      }`}
                    >
                      {radioDot(isSelected)}
                      <span className="min-w-0 flex-1">
                        <span className={`block text-sm font-medium ${pt.text}`}>{srv.name}</span>
                        {srv.description && (
                          <span className={`mt-0.5 line-clamp-2 block text-sm ${pt.muted}`}>{srv.description}</span>
                        )}
                        <span className={`mt-1 flex items-center gap-1 text-xs ${pt.muted}`}>
                          <Clock className="h-3.5 w-3.5" aria-hidden="true" />
                          {srv.durationMinutes} dk
                        </span>
                      </span>
                      <span className={`shrink-0 text-sm font-semibold tabular-nums ${pt.text}`}>
                        {priceLabel(srv.price)}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}

            <div className="mt-6 flex justify-end">
              {nextButton("Devam et", !selectedService)}
            </div>
          </div>
        )}

        {/* ── STEP 2: Specialist ── */}
        {step === 2 && (
          <div>
            {stepHeading("Uzman seçin", "Hizmeti kimden almak istersiniz?")}

            <div role="radiogroup" aria-label="Uzmanlar" className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              <button
                type="button"
                role="radio"
                aria-checked={selectedEmployee === "any"}
                onClick={() => setSelectedEmployee("any")}
                className={`flex items-center gap-3 border p-3.5 text-left transition-colors ${pt.focus} ${r.input} ${
                  selectedEmployee === "any" ? pt.selected : `${pt.border} hover:bg-(color:--t-surface-2)`
                }`}
              >
                <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full border ${pt.border} ${pt.surface2}`}>
                  <Users className={`h-5 w-5 ${pt.muted}`} aria-hidden="true" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className={`block text-sm font-medium ${pt.text}`}>Fark etmez</span>
                  <span className={`block text-xs ${pt.muted}`}>İlk müsait uzman</span>
                </span>
                {radioDot(selectedEmployee === "any")}
              </button>

              {eligibleEmployees.map((emp) => {
                const isSelected = selectedEmployee === emp.id;
                return (
                  <button
                    key={emp.id}
                    type="button"
                    role="radio"
                    aria-checked={isSelected}
                    onClick={() => setSelectedEmployee(emp.id)}
                    className={`flex items-center gap-3 border p-3.5 text-left transition-colors ${pt.focus} ${r.input} ${
                      isSelected ? pt.selected : `${pt.border} hover:bg-(color:--t-surface-2)`
                    }`}
                  >
                    {emp.photo ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={emp.photo}
                        alt=""
                        className={`h-11 w-11 shrink-0 rounded-full border object-cover ${pt.border}`}
                      />
                    ) : (
                      <span
                        className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full border text-sm font-semibold ${pt.border} ${pt.surface2} ${pt.text}`}
                      >
                        {emp.name.slice(0, 1).toLocaleUpperCase("tr-TR")}
                      </span>
                    )}
                    <span className="min-w-0 flex-1">
                      <span className={`block truncate text-sm font-medium ${pt.text}`}>{emp.name}</span>
                      {emp.specialty && <span className={`block truncate text-xs ${pt.muted}`}>{emp.specialty}</span>}
                    </span>
                    {radioDot(isSelected)}
                  </button>
                );
              })}
            </div>

            <div className="mt-6 flex justify-between gap-2">
              {backButton}
              {nextButton("Devam et")}
            </div>
          </div>
        )}

        {/* ── STEP 3: Date & time ── */}
        {step === 3 && (
          <div>
            {stepHeading("Tarih ve saat", "Size uygun günü ve saati seçin.")}

            {/* Day strip */}
            <div className="-mx-4 overflow-x-auto px-4 pb-1 sm:-mx-6 sm:px-6" role="radiogroup" aria-label="Gün">
              <div className="flex gap-2">
                {quickDays.map((d) => {
                  const key = toDateKey(d);
                  const isSelected = key === selectedDate;
                  return (
                    <button
                      key={key}
                      type="button"
                      role="radio"
                      aria-checked={isSelected}
                      aria-label={formatDateKey(key)}
                      onClick={() => {
                        setSelectedDate(key);
                        setSelectedTime("");
                      }}
                      className={`flex w-14 shrink-0 flex-col items-center border py-2 transition-colors ${pt.focus} ${r.input} ${
                        isSelected
                          ? "border-(color:--t-primary) bg-(color:--t-primary) text-(color:--t-on-primary)"
                          : `${pt.border} ${pt.text} hover:bg-(color:--t-surface-2)`
                      }`}
                    >
                      <span className={`text-xs ${isSelected ? "" : pt.muted}`}>
                        {key === today ? "Bugün" : d.toLocaleDateString("tr-TR", { weekday: "short" })}
                      </span>
                      <span className="text-lg font-semibold tabular-nums leading-tight">{d.getDate()}</span>
                      <span className={`text-[11px] ${isSelected ? "" : pt.muted}`}>
                        {d.toLocaleDateString("tr-TR", { month: "short" })}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="mt-3 flex flex-wrap items-center gap-2 text-sm">
              <label htmlFor="booking-date" className={pt.muted}>
                Başka bir tarih:
              </label>
              <input
                id="booking-date"
                type="date"
                min={today || undefined}
                value={selectedDate}
                onChange={(e) => {
                  setSelectedDate(e.target.value);
                  setSelectedTime("");
                }}
                className={`h-9 w-auto ${pt.input} ${r.input} ${!dateInStrip && selectedDate ? "border-(color:--t-primary)" : ""}`}
              />
            </div>

            {/* Slots */}
            <div className="mt-6">
              <p className={`mb-2.5 text-sm font-medium ${pt.text}`}>
                {selectedDate ? formatDateKey(selectedDate) : "Uygun saatler"}
              </p>

              {loadingSlots ? (
                <div className="grid grid-cols-4 gap-2 sm:grid-cols-6" aria-busy="true" aria-label="Saatler yükleniyor">
                  {Array.from({ length: 12 }).map((_, i) => (
                    <span key={i} className={`h-10 animate-pulse ${pt.surface2} ${r.input}`} />
                  ))}
                </div>
              ) : slotError ? (
                notice("warning", slotError)
              ) : availableSlots.length === 0 ? (
                notice("neutral", "Bu tarihte boş saat kalmadı. Lütfen başka bir gün seçin.")
              ) : (
                <div className="space-y-4">
                  {slotGroups.map((group) => (
                    <div key={group.label}>
                      <p className={`mb-1.5 text-xs ${pt.muted}`}>{group.label}</p>
                      <div className="grid grid-cols-4 gap-2 sm:grid-cols-6" role="radiogroup" aria-label={group.label}>
                        {group.slots.map((slot) => {
                          const isSelected = selectedTime === slot;
                          return (
                            <button
                              key={slot}
                              type="button"
                              role="radio"
                              aria-checked={isSelected}
                              onClick={() => setSelectedTime(slot)}
                              className={`h-10 border text-sm font-medium tabular-nums transition-colors ${pt.focus} ${r.input} ${
                                isSelected
                                  ? "border-(color:--t-primary) bg-(color:--t-primary) text-(color:--t-on-primary)"
                                  : `${pt.border} ${pt.text} hover:bg-(color:--t-surface-2)`
                              }`}
                            >
                              {slot}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Restaurant: guests & table */}
            {isRestaurant && (
              <div className={`mt-6 border-t pt-5 ${pt.border}`}>
                <p className={`text-sm font-medium ${pt.text}`}>Kişi sayısı</p>
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  {[1, 2, 4, 6, 8].map((n) => {
                    const isSelected = guestCount === String(n);
                    return (
                      <button
                        key={n}
                        type="button"
                        aria-pressed={isSelected}
                        onClick={() => setGuestCount(String(n))}
                        className={`h-10 min-w-11 border px-3 text-sm font-medium tabular-nums transition-colors ${pt.focus} ${r.input} ${
                          isSelected
                            ? "border-(color:--t-primary) bg-(color:--t-primary) text-(color:--t-on-primary)"
                            : `${pt.border} ${pt.text} hover:bg-(color:--t-surface-2)`
                        }`}
                      >
                        {n}
                      </button>
                    );
                  })}
                  <select
                    aria-label="Diğer kişi sayısı"
                    value={["1", "2", "4", "6", "8"].includes(guestCount) ? "" : guestCount}
                    onChange={(e) => {
                      if (e.target.value) setGuestCount(e.target.value);
                    }}
                    className={`h-10 w-auto ${pt.input} ${r.input}`}
                  >
                    <option value="" disabled>
                      Diğer
                    </option>
                    {[3, 5, 7, 9, 10, 12, 16, 20].map((n) => (
                      <option key={n} value={String(n)}>
                        {n} kişi
                      </option>
                    ))}
                  </select>
                </div>

                <p className={`mt-5 text-sm font-medium ${pt.text}`}>Masa seçimi</p>
                <p className={`mb-3 text-sm ${pt.muted}`}>
                  {selectedTime
                    ? "İsterseniz oturmak istediğiniz masayı seçin."
                    : "Uygun masaları görmek için önce bir saat seçin."}
                </p>

                {selectedTime &&
                  (loadingTables ? (
                    <div className={`flex items-center gap-2 text-sm ${pt.muted}`} aria-busy="true">
                      <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                      Masaların doluluk durumu kontrol ediliyor...
                    </div>
                  ) : restaurantTables.length === 0 ? (
                    notice("neutral", "Bu işletmede tanımlı masa yok. Rezervasyonunuzu masa seçmeden tamamlayabilirsiniz.")
                  ) : (
                    <div className="space-y-3">
                      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                        <div className="-mx-1 flex gap-1.5 overflow-x-auto px-1 pb-1">
                          {[{ id: "ALL", name: "Tümü" }, ...restaurantAreas].map((area) => {
                            const count = restaurantTables.filter(
                              (t) => (area.id === "ALL" || t.areaId === area.id) && t.isActive && !t.insufficientCapacity
                            ).length;
                            const isActive = activeTableAreaId === area.id;
                            return (
                              <button
                                key={area.id}
                                type="button"
                                aria-pressed={isActive}
                                onClick={() => setActiveTableAreaId(area.id)}
                                className={`h-8 shrink-0 border px-3 text-xs font-medium transition-colors ${pt.focus} ${r.input} ${
                                  isActive ? pt.selected + " " + pt.text : `${pt.border} ${pt.muted}`
                                }`}
                              >
                                {area.name} <span className="tabular-nums opacity-70">{count}</span>
                              </button>
                            );
                          })}
                        </div>
                        <div className={`flex shrink-0 self-start border p-0.5 sm:self-auto ${pt.border} ${r.input}`}>
                          {(
                            [
                              { id: "cards", label: "Liste", icon: LayoutGrid },
                              { id: "canvas", label: "Masa planı", icon: UtensilsCrossed },
                            ] as const
                          ).map((v) => (
                            <button
                              key={v.id}
                              type="button"
                              aria-pressed={tableCardMode === v.id}
                              onClick={() => setTableCardMode(v.id)}
                              className={`inline-flex h-7 items-center gap-1 px-2.5 text-xs font-medium ${r.input} ${
                                tableCardMode === v.id ? `${pt.surface2} ${pt.text}` : pt.muted
                              }`}
                            >
                              <v.icon className="h-3.5 w-3.5" aria-hidden="true" />
                              {v.label}
                            </button>
                          ))}
                        </div>
                      </div>

                      {selectedTable && (
                        <div
                          className={`flex items-center justify-between gap-3 border px-3.5 py-2.5 text-sm ${pt.selected} ${r.input}`}
                        >
                          <span className={pt.text}>
                            <span className="font-medium">{selectedTable.name}</span>
                            <span className={pt.muted}>
                              {" "}· {selectedTable.area?.name || "Restoran"} · {selectedTable.capacity} kişilik
                            </span>
                          </span>
                          <button
                            type="button"
                            onClick={() => setSelectedTable(null)}
                            className={`shrink-0 text-xs font-medium underline-offset-2 hover:underline ${pt.accent}`}
                          >
                            Kaldır
                          </button>
                        </div>
                      )}

                      {tableCardMode === "canvas" ? (
                        <FloorPlanCanvas
                          tables={restaurantTables}
                          areas={restaurantAreas}
                          activeAreaId={activeTableAreaId}
                          mode="booking"
                          selectedTableId={selectedTable?.id}
                          onSelectTable={(tbl) => {
                            if (tbl.isAvailable) setSelectedTable(tbl);
                          }}
                          readOnly={true}
                        />
                      ) : (
                        <div className="grid max-h-[420px] grid-cols-1 gap-2 overflow-y-auto pr-1 sm:grid-cols-2">
                          {restaurantTables
                            .filter((t) => {
                              if (activeTableAreaId !== "ALL" && t.areaId !== activeTableAreaId) return false;
                              if (t.insufficientCapacity) return false;
                              return t.isActive;
                            })
                            .map((tbl) => {
                              const isSelected = selectedTable?.id === tbl.id;
                              const isAvailable = tbl.isAvailable;
                              return (
                                <button
                                  key={tbl.id}
                                  type="button"
                                  disabled={!isAvailable}
                                  aria-pressed={isSelected}
                                  onClick={() => {
                                    if (isAvailable) setSelectedTable(tbl);
                                  }}
                                  className={`flex overflow-hidden border text-left transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${pt.focus} ${r.input} ${
                                    isSelected ? pt.selected : `${pt.border} enabled:hover:bg-(color:--t-surface-2)`
                                  }`}
                                >
                                  {tbl.imageUrl && (
                                    // eslint-disable-next-line @next/next/no-img-element
                                    <img src={tbl.imageUrl} alt="" className="h-auto w-20 shrink-0 object-cover" />
                                  )}
                                  <span className="flex min-w-0 flex-1 items-start justify-between gap-2 p-3">
                                    <span className="min-w-0">
                                      <span className={`block text-sm font-medium ${pt.text}`}>{tbl.name}</span>
                                      <span className={`block text-xs ${pt.muted}`}>
                                        {tbl.area?.name || "Restoran"} · {tbl.capacity} kişilik
                                      </span>
                                      {tbl.description && (
                                        <span className={`mt-0.5 line-clamp-1 block text-xs ${pt.muted}`}>
                                          {tbl.description}
                                        </span>
                                      )}
                                    </span>
                                    <span
                                      className={`shrink-0 text-xs font-medium ${
                                        isAvailable ? "text-(color:--t-success)" : "text-(color:--t-danger)"
                                      }`}
                                    >
                                      {isSelected ? "Seçildi" : isAvailable ? "Müsait" : "Dolu"}
                                    </span>
                                  </span>
                                </button>
                              );
                            })}
                        </div>
                      )}
                    </div>
                  ))}
              </div>
            )}

            <div className="mt-6 flex justify-between gap-2">
              {backButton}
              {nextButton("Devam et", !selectedTime)}
            </div>
          </div>
        )}

        {/* ── STEP 4: Contact & confirm ── */}
        {step === 4 && (
          <form onSubmit={handleSubmitBooking}>
            {stepHeading("Bilgileriniz", "Randevunuzla ilgili size ulaşabilmemiz için.")}

            <div className="space-y-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="bk-name" className={`mb-1.5 block text-sm font-medium ${pt.text}`}>
                    Ad soyad *
                  </label>
                  <input
                    id="bk-name"
                    type="text"
                    required
                    autoComplete="name"
                    placeholder="Ahmet Yılmaz"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    className={`h-11 ${pt.input} ${r.input}`}
                  />
                </div>
                <div>
                  <label htmlFor="bk-phone" className={`mb-1.5 block text-sm font-medium ${pt.text}`}>
                    Telefon *
                  </label>
                  <input
                    id="bk-phone"
                    type="tel"
                    required
                    autoComplete="tel"
                    inputMode="tel"
                    placeholder="0532 000 00 00"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    className={`h-11 ${pt.input} ${r.input}`}
                  />
                </div>
              </div>

              <div>
                <label htmlFor="bk-email" className={`mb-1.5 block text-sm font-medium ${pt.text}`}>
                  E-posta <span className={`font-normal ${pt.muted}`}>(isteğe bağlı)</span>
                </label>
                <input
                  id="bk-email"
                  type="email"
                  autoComplete="email"
                  inputMode="email"
                  placeholder="ornek@mail.com"
                  value={customerEmail}
                  onChange={(e) => setCustomerEmail(e.target.value)}
                  className={`h-11 ${pt.input} ${r.input}`}
                />
              </div>

              {business.sector === "OTO_SERVIS" && (
                <div>
                  <label htmlFor="bk-plate" className={`mb-1.5 block text-sm font-medium ${pt.text}`}>
                    Araç plakası ve modeli
                  </label>
                  <div className="relative">
                    <Car className={`pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 ${pt.muted}`} aria-hidden="true" />
                    <input
                      id="bk-plate"
                      type="text"
                      placeholder="34 ABC 123 (Renault Megane 2021)"
                      value={plateNumber}
                      onChange={(e) => setPlateNumber(e.target.value)}
                      className={`h-11 pl-9 ${pt.input} ${r.input}`}
                    />
                  </div>
                </div>
              )}

              <div>
                <label htmlFor="bk-notes" className={`mb-1.5 block text-sm font-medium ${pt.text}`}>
                  Not <span className={`font-normal ${pt.muted}`}>(isteğe bağlı)</span>
                </label>
                <textarea
                  id="bk-notes"
                  rows={2}
                  placeholder="İşletmenin bilmesini istediğiniz bir şey var mı?"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className={`py-2.5 ${pt.input} ${r.input}`}
                />
              </div>
            </div>

            {/* Summary */}
            <div className={`mt-6 border ${pt.border} ${pt.surface2} ${r.input}`}>
              <p className={`border-b px-4 py-2.5 text-sm font-medium ${pt.border} ${pt.text}`}>Randevu özeti</p>
              <dl className={`divide-y text-sm ${pt.divide}`}>
                {[
                  ["Hizmet", selectedService ? `${selectedService.name} · ${selectedService.durationMinutes} dk` : ""],
                  ...(staffSelectionEnabled
                    ? [["Uzman", selectedStaffMember ? selectedStaffMember.name : "İlk müsait uzman"]]
                    : []),
                  ["Tarih", formatDateKey(selectedDate)],
                  ["Saat", selectedTime],
                  ...(isRestaurant ? [["Kişi", `${guestCount} kişi`]] : []),
                  ...(isRestaurant && selectedTable
                    ? [["Masa", `${selectedTable.name} · ${selectedTable.area?.name || "Restoran"}`]]
                    : []),
                ].map(([label, value]) => (
                  <div key={label} className="flex justify-between gap-4 px-4 py-2">
                    <dt className={pt.muted}>{label}</dt>
                    <dd className={`text-right font-medium ${pt.text}`}>{value}</dd>
                  </div>
                ))}
                <div className="flex justify-between gap-4 px-4 py-2.5">
                  <dt className={`font-medium ${pt.text}`}>Tutar</dt>
                  <dd className={`text-right font-semibold tabular-nums ${pt.text}`}>
                    {priceLabel(selectedService?.price || 0)}
                  </dd>
                </div>
              </dl>
            </div>

            {submitError && <div className="mt-4">{notice("danger", submitError)}</div>}

            <div className="mt-6 flex justify-between gap-2">
              {backButton}
              <button
                type="submit"
                disabled={isSubmitting}
                className={`inline-flex h-11 flex-1 items-center justify-center gap-2 px-5 text-sm sm:flex-none ${pt.primaryBtn} ${pt.focus} ${r.button}`}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                    Gönderiliyor...
                  </>
                ) : (
                  <>
                    <Check className="h-4 w-4" aria-hidden="true" />
                    Randevuyu onayla
                  </>
                )}
              </button>
            </div>
          </form>
        )}

        {/* ── STEP 5: Success ── */}
        {step === 5 && bookingResult && (
          <div className="py-2 text-center" role="status">
            <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-(color:--t-success-bg) text-(color:--t-success)">
              <CheckCircle2 className="h-7 w-7" aria-hidden="true" />
            </span>
            <h3 className={`mt-4 text-xl font-semibold tracking-tight ${pt.text}`}>Randevu talebiniz alındı</h3>
            <p className={`mx-auto mt-1 max-w-sm text-sm ${pt.muted}`}>
              Talebiniz <span className={`font-medium ${pt.text}`}>{business.name}</span> işletmesine iletildi.
              İşletme onayladığında randevunuz kesinleşir.
            </p>

            <dl className={`mx-auto mt-6 max-w-sm divide-y border text-left text-sm ${pt.border} ${pt.divide} ${r.input}`}>
              {[
                ["Tarih", formatDateKey(selectedDate)],
                ["Saat", selectedTime],
                ["Hizmet", selectedService?.name || ""],
                ...(selectedStaffMember ? [["Uzman", selectedStaffMember.name]] : []),
                ...(selectedTable
                  ? [["Masa", `${selectedTable.name} · ${selectedTable.area?.name || "Restoran"} · ${guestCount} kişi`]]
                  : []),
                ["Ad soyad", customerName],
                ["Telefon", customerPhone],
              ].map(([label, value]) => (
                <div key={label} className="flex justify-between gap-4 px-4 py-2">
                  <dt className={pt.muted}>{label}</dt>
                  <dd className={`text-right font-medium ${pt.text}`}>{value}</dd>
                </div>
              ))}
            </dl>

            {bookingResult.whatsappUrl && (
              <div className="mx-auto mt-6 max-w-sm">
                <a
                  href={bookingResult.whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`inline-flex h-11 w-full items-center justify-center gap-2 bg-[#16A34A] px-5 text-sm font-semibold text-white transition-opacity hover:opacity-90 ${pt.focus} ${r.button}`}
                >
                  <MessageSquare className="h-4 w-4" aria-hidden="true" />
                  WhatsApp ile işletmeye bildir
                </a>
                <p className={`mt-2 text-xs ${pt.muted}`}>İsterseniz randevunuzu WhatsApp üzerinden de teyit edebilirsiniz.</p>
              </div>
            )}

            <button
              type="button"
              onClick={() => {
                setStep(1);
                setSelectedService(null);
                setSelectedTime("");
                setBookingResult(null);
              }}
              className={`mt-6 text-sm font-medium underline-offset-2 hover:underline ${pt.accent}`}
            >
              Yeni bir randevu al
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
