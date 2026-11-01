import assert from "node:assert/strict";
import { test } from "node:test";
import { THEME_REGISTRY, getSectorRecommendations } from "../../src/lib/themes/registry";
import { getContrastRatio } from "../../src/lib/themes/utils";
import { canUsePremiumThemes, isPremiumTheme, themeForPlan } from "../../src/lib/themes/premium";

const now = new Date("2026-11-01T12:00:00Z");
const paid = { status: "active", trialEndDate: null, subscriptionEndDate: new Date("2027-01-01") };
const lapsed = { status: "active", trialEndDate: null, subscriptionEndDate: new Date("2026-10-01") };
const free = { status: "free", trialEndDate: null, subscriptionEndDate: null };
const premium = Object.values(THEME_REGISTRY).filter((t) => t.isPremium);

test("there are five premium themes, one per sector", () => {
  assert.equal(premium.length, 5);
  assert.deepEqual(premium.map((t) => t.supportedCategories[0]).sort(), ["BERBER", "GUZELLIK", "KLINIK", "OTO_SERVIS", "RESTORAN"]);
  for (const t of premium) assert.equal(getSectorRecommendations(t.supportedCategories[0])[0], t.id);
});

test("every premium theme falls back to a free theme", () => {
  for (const t of premium) {
    assert.ok(t.signature, t.id);
    assert.ok(t.sampleImage?.startsWith("https://"), t.id);
    assert.ok(THEME_REGISTRY[t.fallbackThemeId!], t.id);
    assert.equal(THEME_REGISTRY[t.fallbackThemeId!].isPremium, false, t.id);
  }
});

test("premium palettes stay readable", () => {
  for (const { id, colors: c } of premium) {
    assert.ok(getContrastRatio(c.text, c.background) >= 7, `${id} text`);
    assert.ok(getContrastRatio(c.text, c.surface) >= 7, `${id} surface text`);
    assert.ok(getContrastRatio(c.mutedText, c.surface) >= 4.5, `${id} muted`);
    assert.ok(getContrastRatio(c.primary, c.surface) >= 3, `${id} accent`);
  }
});

test("only paid plans and running trials may use premium themes", () => {
  assert.equal(canUsePremiumThemes(paid, now), true);
  assert.equal(canUsePremiumThemes({ status: "trial", trialEndDate: new Date("2026-11-05") }, now), true);
  assert.equal(canUsePremiumThemes(free, now), false);
  assert.equal(canUsePremiumThemes(lapsed, now), false);
  assert.equal(canUsePremiumThemes(null, now), false);
});

test("the page falls back when the plan ends, and free themes never change", () => {
  assert.equal(themeForPlan("noir-usta", paid, now), "noir-usta");
  assert.equal(themeForPlan("noir-usta", lapsed, now), "obsidyen-bakir");
  assert.equal(themeForPlan("sofra", free, now), "restaurant-dark");
  assert.equal(themeForPlan("nordik", free, now), "nordik");
  assert.equal(isPremiumTheme("does-not-exist"), false);
});
