// Unit tests for mobile/src/lib/forms.ts:
//   npx tsx --test tests/mobile-client/forms.test.ts
import { test } from "node:test";
import assert from "node:assert/strict";
import { hoursProblem, isOptionalEmail, isPhone, isTime, normalizeTime, parseDuration, parsePrice } from "../../mobile/src/lib/forms";

test("times: strict HH:mm, with typing help", () => {
  assert.ok(isTime("09:30") && isTime("23:59") && isTime("00:00"));
  assert.ok(!isTime("9:30") && !isTime("24:00") && !isTime("12:60") && !isTime(""));
  assert.equal(normalizeTime("930"), "09:30");
  assert.equal(normalizeTime("9:5"), "09:05");
  assert.equal(normalizeTime("14.15"), "14:15");
  assert.equal(normalizeTime("2530"), "2530", "unclear input is left for validation");
});

const day = (over: Partial<Parameters<typeof hoursProblem>[0]> = {}) => ({
  isOpen: true, openTime: "09:00", closeTime: "19:00", breakStartTime: "13:00", breakEndTime: "14:00", ...over,
});

test("working hours: open before close, break inside the day, both break ends or none", () => {
  assert.equal(hoursProblem(day()), null);
  assert.equal(hoursProblem(day({ breakStartTime: "", breakEndTime: "" })), null);
  assert.equal(hoursProblem(day({ isOpen: false, openTime: "x" })), null, "closed days are not checked");
  assert.ok(hoursProblem(day({ openTime: "19:00", closeTime: "09:00" })));
  assert.ok(hoursProblem(day({ breakEndTime: "" })));
  assert.ok(hoursProblem(day({ breakStartTime: "14:00", breakEndTime: "13:00" })));
  assert.ok(hoursProblem(day({ breakStartTime: "08:00", breakEndTime: "09:30" })));
  assert.ok(hoursProblem(day({ openTime: "9" })));
});

test("prices and durations", () => {
  assert.equal(parsePrice("250"), 250);
  assert.equal(parsePrice("1.250,50"), 1250.5);
  assert.equal(parsePrice("99.9"), 99.9);
  assert.equal(parsePrice("0"), 0);
  assert.equal(parsePrice("-5"), null);
  assert.equal(parsePrice("abc"), null);
  assert.equal(parseDuration("45"), 45);
  assert.equal(parseDuration("0"), null);
  assert.equal(parseDuration("1441"), null);
  assert.equal(parseDuration("30.5"), null);
});

test("contact fields", () => {
  assert.ok(isPhone("0532 111 22 33"));
  assert.ok(!isPhone("12345"));
  assert.ok(isOptionalEmail("") && isOptionalEmail("a@b.co"));
  assert.ok(!isOptionalEmail("a@b"));
});
