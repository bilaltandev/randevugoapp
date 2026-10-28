// Unit tests for src/lib/uniquenessKeys.ts. No network, no database:
//   npx tsx --test tests/uniqueness/keys.test.ts
import { test } from "node:test";
import assert from "node:assert/strict";
import { businessNameChanged, businessNameKey, phoneChanged, phoneKey } from "../../src/lib/uniquenessKeys";

test("business names match regardless of case, spacing, punctuation and Turkish letters", () => {
  assert.equal(businessNameKey("Ahmet Berber & Stil"), "ahmetberberstil");
  assert.equal(businessNameKey("  ahmet-berber   stil "), "ahmetberberstil");
  assert.equal(businessNameKey("GÜZELLİK Şöleni"), businessNameKey("guzellik soleni"));
  assert.equal(businessNameKey("Işık Kuaför"), businessNameKey("isik kuafor"));
  assert.notEqual(businessNameKey("Ahmet Berber"), businessNameKey("Ahmet Berber 2"));
});

test("names without Latin letters fall back to a plain comparison", () => {
  assert.equal(businessNameKey("صالون"), "");
  assert.equal(businessNameChanged("صالون", " صالون "), false);
  assert.equal(businessNameChanged("صالون", "مطعم"), true);
});

test("a rename that only changes case or spacing is not a change", () => {
  assert.equal(businessNameChanged("Ahmet Berber", "AHMET  berber"), false);
  assert.equal(businessNameChanged("Ahmet Berber", "Mehmet Berber"), true);
});

test("phone numbers match in every common Turkish format", () => {
  const key = "5321112233";
  for (const p of ["0532 111 22 33", "+90 532 111 2233", "905321112233", "(0532) 111-22-33", "5321112233"]) {
    assert.equal(phoneKey(p), key, p);
  }
  assert.equal(phoneChanged("0532 111 22 33", "+90 (532) 111 22 33"), false);
  assert.equal(phoneChanged("0532 111 22 33", "0532 111 22 34"), true);
});

test("empty or too short phone numbers are ignored", () => {
  assert.equal(phoneKey(""), null);
  assert.equal(phoneKey(null), null);
  assert.equal(phoneKey("123"), null);
  assert.equal(phoneChanged(null, ""), false);
});
