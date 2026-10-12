// Unit tests for src/lib/appointmentRules.ts. No network, no database:
//   npx tsx --test tests/appointments/rules.test.ts
import { test } from "node:test";
import assert from "node:assert/strict";
import {
  appointmentRange,
  businessNow,
  isPastSlot,
  dayOfWeekFromKey,
  employeesForService,
  findOverlap,
  fitsWorkingHour,
  isValidDateKey,
  minutesToTime,
  parseTime,
  rangesOverlap,
} from "../../src/lib/appointmentRules";

const range = (start: string, minutes: number) => appointmentRange(start, minutes)!;
const appt = (startTime: string, endTime: string, status = "PENDING") => ({ startTime, endTime, status });

test("overlap: same start, partial, containment and enclosure all conflict", () => {
  const existing = [appt("10:00", "11:00")];
  assert.ok(findOverlap(existing, range("10:00", 60)), "same time");
  assert.ok(findOverlap(existing, range("10:30", 60)), "partial (starts inside)");
  assert.ok(findOverlap(existing, range("09:30", 60)), "partial (ends inside)");
  assert.ok(findOverlap(existing, range("10:15", 30)), "fully inside");
  assert.ok(findOverlap(existing, range("09:00", 180)), "fully encloses");
});

test("overlap: back-to-back appointments do not conflict", () => {
  const existing = [appt("10:00", "11:00")];
  assert.equal(findOverlap(existing, range("11:00", 30)), null);
  assert.equal(findOverlap(existing, range("09:30", 30)), null);
  assert.equal(rangesOverlap(600, 660, 660, 690), false);
});

test("overlap: cancelled and completed appointments free the time", () => {
  assert.equal(findOverlap([appt("10:00", "11:00", "CANCELLED")], range("10:00", 60)), null);
  assert.equal(findOverlap([appt("10:00", "11:00", "COMPLETED")], range("10:00", 60)), null);
  assert.ok(findOverlap([appt("10:00", "11:00", "CONFIRMED")], range("10:00", 60)));
});

test("overlap: times are compared as numbers, not strings (9:00 vs 10:00)", () => {
  assert.ok(findOverlap([appt("9:30", "10:30")], range("10:00", 30)));
  // An unreadable stored time is treated as busy rather than ignored.
  assert.ok(findOverlap([appt("bozuk", "10:30")], range("15:00", 30)));
});

test("input validation: strict HH:mm and real calendar dates", () => {
  assert.equal(parseTime("09:05"), 545);
  for (const bad of ["9:05", "24:00", "12:60", "12:5", "", null, 900]) assert.equal(parseTime(bad), null, String(bad));
  assert.ok(isValidDateKey("2099-02-28"));
  for (const bad of ["2099-02-30", "2099-13-01", "2099-1-01", "yarın", undefined]) assert.equal(isValidDateKey(bad), false, String(bad));
});

test("an appointment may not run past midnight", () => {
  assert.equal(appointmentRange("23:30", 30)?.end, 1440);
  assert.equal(appointmentRange("23:45", 30), null);
  assert.equal(appointmentRange("10:00", 0), null);
  assert.equal(minutesToTime(630), "10:30");
});

test("working hours: inside opening hours and clear of the break", () => {
  const rule = { isOpen: true, openTime: "09:00", closeTime: "19:00", breakStartTime: "13:00", breakEndTime: "14:00" };
  assert.ok(fitsWorkingHour(rule, range("09:00", 60)));
  assert.ok(fitsWorkingHour(rule, range("12:00", 60)), "ends exactly when the break starts");
  assert.ok(fitsWorkingHour(rule, range("18:00", 60)), "ends exactly at closing");
  assert.equal(fitsWorkingHour(rule, range("08:30", 60)), false);
  assert.equal(fitsWorkingHour(rule, range("12:30", 60)), false, "runs into the break");
  assert.equal(fitsWorkingHour(rule, range("18:30", 60)), false, "runs past closing");
  assert.equal(fitsWorkingHour({ ...rule, isOpen: false }, range("10:00", 30)), false, "closed day");
  assert.ok(fitsWorkingHour({ ...rule, breakStartTime: null, breakEndTime: null }, range("13:00", 60)));
});

test("day of week does not depend on the server time zone", () => {
  assert.equal(dayOfWeekFromKey("2026-10-11"), 0); // Sunday
  assert.equal(dayOfWeekFromKey("2026-10-12"), 1);
});

test("employees for a service follow the booking wizard rule", () => {
  const a = { id: "a", employeeServices: [{ serviceId: "s1" }] };
  const b = { id: "b", employeeServices: [] };
  const c = { id: "c", employeeServices: [{ serviceId: "s2" }] };
  assert.deepEqual(employeesForService([a, b, c], "s1").map((e) => e.id), ["a", "b"]);
  assert.deepEqual(employeesForService([{ ...b }, { id: "d", employeeServices: [] }], "s1").map((e) => e.id), ["b", "d"]);
});

test("business time is Türkiye time (UTC+3), whatever the server time zone", () => {
  // 2026-10-12 21:30 UTC is already 13 Oct 00:30 in Istanbul.
  assert.deepEqual(businessNow(new Date("2026-10-12T21:30:00Z")), { dateKey: "2026-10-13", minutes: 30 });
  assert.deepEqual(businessNow(new Date("2026-10-12T07:00:00Z")), { dateKey: "2026-10-12", minutes: 600 });
});

test("past slots: earlier days, and today's times that have started", () => {
  const now = new Date("2026-10-12T07:00:00Z"); // 10:00 in Istanbul
  assert.ok(isPastSlot("2026-10-11", 23 * 60, now));
  assert.ok(isPastSlot("2026-10-12", 9 * 60 + 30, now));
  assert.ok(isPastSlot("2026-10-12", 10 * 60, now), "a slot starting right now has begun");
  assert.ok(!isPastSlot("2026-10-12", 10 * 60 + 30, now));
  assert.ok(!isPastSlot("2026-10-13", 0, now));
});
