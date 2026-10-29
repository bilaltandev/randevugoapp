// Unit tests for src/lib/pushMessages.ts. No network, no database:
//   npx tsx --test tests/push/messages.test.ts
import { test } from "node:test";
import assert from "node:assert/strict";
import { bookingWhen, isExpoPushToken, newBookingMessage } from "../../src/lib/pushMessages";

test("only Expo push tokens are accepted", () => {
  assert.equal(isExpoPushToken("ExponentPushToken[xxxxxxxxxxxxxxxxxxxxxx]"), true);
  assert.equal(isExpoPushToken("ExpoPushToken[abc]"), true);
  assert.equal(isExpoPushToken(""), false);
  assert.equal(isExpoPushToken("abc"), false);
  assert.equal(isExpoPushToken("ExponentPushToken[]"), false);
  assert.equal(isExpoPushToken(42), false);
  assert.equal(isExpoPushToken(`ExponentPushToken[${"a".repeat(300)}]`), false);
});

test("booking time reads as day, Turkish month and time", () => {
  assert.equal(bookingWhen("2026-10-30", "14:00"), "30 Ekim 14:00");
  assert.equal(bookingWhen("2026-01-05", "09:30"), "5 Ocak 09:30");
  assert.equal(bookingWhen("bad", "09:30"), "bad 09:30");
});

test("new booking alert names the customer, service, table and time", () => {
  const m = newBookingMessage({ appointmentId: "a1", customerName: "Ayşe Kaya", serviceName: "Saç kesimi", date: "2026-10-30", startTime: "14:00" });
  assert.equal(m.body, "Ayşe Kaya · Saç kesimi · 30 Ekim 14:00");
  assert.deepEqual(m.data, { type: "NEW_APPOINTMENT", appointmentId: "a1", date: "2026-10-30" });
  const withTable = newBookingMessage({ appointmentId: "a2", customerName: "Ali", serviceName: "Akşam yemeği", date: "2026-10-30", startTime: "20:00", tableName: "Masa 4" });
  assert.equal(withTable.body, "Ali · Akşam yemeği · Masa 4 · 30 Ekim 20:00");
});
