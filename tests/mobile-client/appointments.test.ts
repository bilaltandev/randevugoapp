// Unit tests for the Expo app's appointment rules (mobile/src/lib/appointments.ts). No network, no database.
import { test } from "node:test";
import assert from "node:assert/strict";
import {
  addDays,
  availableActions,
  dateKey,
  forDay,
  formatPrice,
  longDate,
  matchesSearch,
  sectorDetails,
  shortDateFromKey,
  statusMeta,
  summarizeDay,
  weekOf,
  type Appointment,
} from "../../mobile/src/lib/appointments";

let n = 0;
const appt = (over: Partial<Appointment> = {}): Appointment => ({
  id: `a${++n}`,
  date: "2026-10-10",
  startTime: "10:00",
  endTime: "10:30",
  status: "PENDING",
  customerName: "Ayşe Yılmaz",
  customerPhone: "0532 111 22 33",
  customerEmail: null,
  notes: null,
  price: 250,
  sectorData: null,
  isBlockedSlot: false,
  service: { name: "Kesim", durationMinutes: 30 },
  employee: { name: "Usta" },
  table: null,
  ...over,
});

test("status actions match the web appointments list", () => {
  const labels = (s: Appointment["status"], blocked = false) => availableActions({ status: s, isBlockedSlot: blocked }).map((a) => a.status);
  assert.deepEqual(labels("PENDING"), ["CONFIRMED", "CANCELLED"]);
  assert.deepEqual(labels("CONFIRMED"), ["COMPLETED", "CANCELLED"]);
  assert.deepEqual(labels("COMPLETED"), ["CANCELLED"]);
  assert.deepEqual(labels("CANCELLED"), []);
  assert.deepEqual(labels("CONFIRMED", true), ["CANCELLED"], "a closed slot can only be reopened");
  assert.deepEqual(labels("CANCELLED", true), []);
  assert.equal(availableActions({ status: "PENDING", isBlockedSlot: false }).find((a) => a.status === "CANCELLED")?.destructive, true);
});

test("status labels, including closed slots", () => {
  assert.equal(statusMeta({ status: "PENDING", isBlockedSlot: false }).label, "Onay bekliyor");
  assert.equal(statusMeta({ status: "CONFIRMED", isBlockedSlot: true }).tone, "blocked");
  assert.equal(statusMeta({ status: "CANCELLED", isBlockedSlot: true }).label, "Açıldı");
});

test("day summary: counts real bookings, expected revenue and upcoming", () => {
  const list = [
    appt({ startTime: "09:00", endTime: "09:30", status: "COMPLETED", price: 100 }),
    appt({ startTime: "11:00", endTime: "11:30", status: "CONFIRMED", price: 200 }),
    appt({ startTime: "15:00", endTime: "15:30", status: "PENDING", price: 300 }),
    appt({ startTime: "16:00", endTime: "16:30", status: "CANCELLED", price: 999 }),
    appt({ startTime: "13:00", endTime: "14:00", status: "CONFIRMED", price: 0, isBlockedSlot: true }),
    appt({ date: "2026-10-11", startTime: "10:00", status: "PENDING", price: 500 }),
  ];
  const s = summarizeDay(list, "2026-10-10", "11:15");
  assert.equal(s.total, 3, "completed + confirmed + pending; not cancelled, not closed slot, not other days");
  assert.equal(s.pending, 1);
  assert.equal(s.completed, 1);
  assert.equal(s.revenue, 600);
  assert.deepEqual(s.upcoming.map((a) => a.startTime), ["11:00", "15:00"], "in progress or later, pending/confirmed only");
});

test("forDay filters and sorts by time", () => {
  const list = [appt({ startTime: "15:00" }), appt({ startTime: "09:00" }), appt({ date: "2026-10-11", startTime: "08:00" })];
  assert.deepEqual(forDay(list, "2026-10-10").map((a) => a.startTime), ["09:00", "15:00"]);
});

test("search matches customer name (Turkish case-insensitive) or phone digits", () => {
  const a = appt({ customerName: "İsmail Işık", customerPhone: "0532 111 22 33" });
  assert.ok(matchesSearch(a, "ismail"));
  assert.ok(matchesSearch(a, "IŞIK"));
  assert.ok(matchesSearch(a, "1112233"));
  assert.ok(matchesSearch(a, "  "));
  assert.ok(!matchesSearch(a, "mehmet"));
  assert.ok(!matchesSearch(a, "999"));
});

test("sector details are parsed safely", () => {
  assert.deepEqual(sectorDetails(JSON.stringify({ guestCount: 4, tableName: "Masa 3", areaName: "Bahçe" })), ["4 kişi", "Bahçe · Masa 3"]);
  assert.deepEqual(sectorDetails(JSON.stringify({ plateNumber: "34abc12" })), ["34ABC12"]);
  assert.deepEqual(sectorDetails("not json"), []);
  assert.deepEqual(sectorDetails(null), []);
});

test("dates: local keys, Monday-first weeks, Turkish labels", () => {
  const sat = new Date(2026, 9, 10); // Saturday 10 Oct 2026
  assert.equal(dateKey(sat), "2026-10-10");
  assert.equal(dateKey(addDays(sat, 1)), "2026-10-11");
  assert.equal(dateKey(addDays(new Date(2026, 11, 31), 1)), "2027-01-01");
  const week = weekOf(sat);
  assert.equal(week.length, 7);
  assert.equal(dateKey(week[0]), "2026-10-05", "Monday");
  assert.equal(dateKey(week[6]), "2026-10-11", "Sunday");
  assert.equal(longDate(sat), "10 Ekim Cumartesi");
  assert.equal(shortDateFromKey("2026-02-03"), "3 Şubat");
});

test("price formatting uses Turkish thousands separators", () => {
  assert.equal(formatPrice(0), "0 ₺");
  assert.equal(formatPrice(250), "250 ₺");
  assert.equal(formatPrice(1250), "1.250 ₺");
  assert.equal(formatPrice(1234567.4), "1.234.567 ₺");
});
