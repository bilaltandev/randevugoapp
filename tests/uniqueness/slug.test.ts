// Unit tests for src/lib/slug.ts and its copy in the mobile app. No network, no database:
//   npx tsx --test tests/uniqueness/slug.test.ts
import { test } from "node:test";
import assert from "node:assert/strict";
import { businessSlug } from "../../src/lib/slug";
import { businessSlug as mobileBusinessSlug } from "../../mobile/src/lib/slug";

const NAMES = ["Çiçek Şölen", "Ahmet Berber & Stil", "  GÜZELLİK  ", "Işık Kuaför", "Admin", "login", "!!!", ""];

test("Turkish letters are mapped, not dropped", () => {
  assert.equal(businessSlug("Çiçek Şölen"), "cicek-solen");
  assert.equal(businessSlug("Ahmet Berber & Stil"), "ahmet-berber-stil");
});

test("names without usable characters fall back to a default", () => {
  assert.equal(businessSlug("!!!"), "isletme");
});

test("addresses the site uses itself are not given to a business", () => {
  assert.equal(businessSlug("Admin"), "admin-isletme");
  assert.equal(businessSlug("Aydınlatma Metni"), "aydinlatma-metni-isletme");
});

test("the mobile copy gives the same result", () => {
  for (const name of NAMES) assert.equal(mobileBusinessSlug(name), businessSlug(name));
});
