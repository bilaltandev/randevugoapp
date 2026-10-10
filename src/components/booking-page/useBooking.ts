"use client";

import { useEffect, useMemo, useState } from "react";
import { toDateKey, useClientMinute, minuteToDate } from "./time";
import { getDefaultStaffSelection } from "@/lib/utils";
import type { RestaurantArea, RestaurantTable } from "@/components/restaurant/types";
import type { BookingBusiness, BookingEmployee, BookingService, FlowStep } from "./types";

/**
 * Booking state and server calls for the public booking page.
 * Rules, payload and endpoints are carried over unchanged from the previous BookingWizard;
 * only the presentation moved into separate components.
 */
export function useBooking(business: BookingBusiness, services: BookingService[], employees: BookingEmployee[]) {
  const [selectedService, setSelectedService] = useState<BookingService | null>(null);
  const [chosenEmployee, setChosenEmployee] = useState<string>("any");
  const [chosenDate, setChosenDate] = useState<string>("");
  const [selectedTime, setSelectedTime] = useState<string>("");

  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [notes, setNotes] = useState("");
  const [plateNumber, setPlateNumber] = useState("");
  const isRestaurant = business.sector === "RESTORAN" || business.sector === "RESTAURANT";
  const isAutoService = business.sector === "OTO_SERVIS";
  const [guestCount, setGuestCount] = useState("2");

  // Restaurant tables
  const [restaurantTables, setRestaurantTables] = useState<RestaurantTable[]>([]);
  const [restaurantAreas, setRestaurantAreas] = useState<RestaurantArea[]>([]);
  const [selectedTable, setSelectedTable] = useState<RestaurantTable | null>(null);
  const [loadingTables, setLoadingTables] = useState(false);

  const [availableSlots, setAvailableSlots] = useState<string[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [slotError, setSlotError] = useState("");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [bookingResult, setBookingResult] = useState<{ whatsappUrl?: string } | null>(null);

  const isExpired = business.subscription?.status === "expired";

  // Owner setting wins; otherwise the sector default (off for restaurants and auto service).
  const staffSelectionEnabled =
    business.enableStaffSelection !== undefined
      ? Boolean(business.enableStaffSelection)
      : getDefaultStaffSelection(business.sector);

  const flowSteps: FlowStep[] = staffSelectionEnabled ? ["staff", "datetime", "details"] : ["datetime", "details"];

  // Employees who can perform the selected service
  const eligibleEmployees = useMemo(() => {
    if (!selectedService) return employees;
    const hasAssignments = employees.some((e) => Array.isArray(e.employeeServices) && e.employeeServices.length > 0);
    if (!hasAssignments) return employees;
    return employees.filter(
      (e) =>
        !e.employeeServices ||
        e.employeeServices.length === 0 ||
        e.employeeServices.some((es) => es.serviceId === selectedService.id)
    );
  }, [employees, selectedService]);

  // A chosen employee who can't do the newly selected service falls back to "any".
  const selectedEmployee =
    chosenEmployee !== "any" && !eligibleEmployees.some((e) => e.id === chosenEmployee) ? "any" : chosenEmployee;

  // Date defaults to today in the visitor's timezone (known only on the client).
  const minute = useClientMinute();
  const todayKey = minute !== null ? toDateKey(minuteToDate(minute)) : "";
  const selectedDate = chosenDate || todayKey;

  // Available slots for the chosen date / employee / service
  useEffect(() => {
    if (!selectedDate || !business.id) return;
    let ignore = false;
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
        if (ignore) return;
        if (data.slots) {
          setAvailableSlots(data.slots);
          if (data.slots.length === 0 && data.message) setSlotError(data.message);
        } else {
          setAvailableSlots([]);
          setSlotError(data.error || "Saatler yüklenemedi.");
        }
      } catch {
        if (!ignore) setSlotError("Uygun saatler yüklenirken bir problem oluştu.");
      } finally {
        if (!ignore) setLoadingSlots(false);
      }
    }
    fetchSlots();
    // A newer request supersedes this one (e.g. tapping through days quickly).
    return () => {
      ignore = true;
    };
  }, [selectedDate, selectedEmployee, selectedService, business.id]);

  // Restaurant: areas and table availability for the chosen time and party size
  useEffect(() => {
    if (!isRestaurant || !business.id || !selectedDate || !selectedTime) return;

    async function fetchTablesAndAreas() {
      setLoadingTables(true);
      try {
        const areasRes = await fetch(`/api/restaurant/areas?businessId=${business.id}`);
        const areasData = await areasRes.json();
        if (areasData.areas) {
          setRestaurantAreas(areasData.areas);
        }

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
    // eslint-disable-next-line react-hooks/exhaustive-deps -- same triggers as before; selectedTable is only read
  }, [isRestaurant, business.id, selectedDate, selectedTime, guestCount, selectedService]);

  /** Picking a different service invalidates the chosen time (durations differ). */
  const selectService = (srv: BookingService) => {
    if (selectedService?.id !== srv.id) setSelectedTime("");
    setSelectedService(srv);
  };

  const selectEmployee = (id: string) => {
    if (id !== selectedEmployee) setSelectedTime("");
    setChosenEmployee(id);
  };

  const selectDate = (date: string) => {
    setChosenDate(date);
    setSelectedTime("");
  };

  /** Returns true when the booking was created. */
  const submitBooking = async (): Promise<boolean> => {
    if (!customerName || !customerPhone || !selectedService || !selectedDate || !selectedTime) {
      setSubmitError("Lütfen zorunlu alanları doldurunuz.");
      return false;
    }
    setIsSubmitting(true);
    setSubmitError("");
    try {
      const sectorData: Record<string, unknown> = {};
      if (isAutoService && plateNumber) sectorData.plateNumber = plateNumber;
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
        return false;
      }
      setBookingResult(data);
      return true;
    } catch {
      setSubmitError("Bağlantı hatası oluştu. Lütfen tekrar deneyiniz.");
      return false;
    } finally {
      setIsSubmitting(false);
    }
  };

  /** Start over after a completed booking (customer details are kept for convenience). */
  const resetForNewBooking = () => {
    setSelectedService(null);
    setSelectedTime("");
    setSelectedTable(null);
    setBookingResult(null);
    setSubmitError("");
  };

  return {
    // flags
    isRestaurant,
    isAutoService,
    isExpired,
    staffSelectionEnabled,
    flowSteps,
    // selection
    selectedService,
    selectService,
    selectedEmployee,
    selectEmployee,
    selectedStaffMember: employees.find((e) => e.id === selectedEmployee) ?? null,
    eligibleEmployees,
    selectedDate,
    todayKey,
    selectDate,
    selectedTime,
    setSelectedTime,
    // slots
    availableSlots,
    loadingSlots,
    slotError,
    // restaurant
    guestCount,
    setGuestCount,
    restaurantTables,
    restaurantAreas,
    selectedTable,
    setSelectedTable,
    loadingTables,
    // customer
    customerName,
    setCustomerName,
    customerPhone,
    setCustomerPhone,
    customerEmail,
    setCustomerEmail,
    notes,
    setNotes,
    plateNumber,
    setPlateNumber,
    // submit
    isSubmitting,
    submitError,
    bookingResult,
    submitBooking,
    resetForNewBooking,
  };
}

export type BookingState = ReturnType<typeof useBooking>;
