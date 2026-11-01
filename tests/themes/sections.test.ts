import assert from "node:assert/strict";
import { test } from "node:test";
import { pageSectionOrder } from "../../src/lib/themes/sections";

test("keeps the owner's order and drops entries that aren't sections", () => {
  assert.deepEqual(pageSectionOrder(["Hero", "Location", "Services", "Booking", "Staff", "Gallery", "Reviews"]), [
    "Location",
    "Services",
    "Staff",
    "Gallery",
    "Reviews",
  ]);
});

test("sections missing from a saved order follow at the end", () => {
  assert.deepEqual(pageSectionOrder(["Reviews"]), ["Reviews", "Services", "Gallery", "Staff", "Location"]);
});

test("no saved order and repeated entries are both safe", () => {
  assert.deepEqual(pageSectionOrder(null), ["Services", "Gallery", "Staff", "Reviews", "Location"]);
  assert.equal(pageSectionOrder(["Staff", "Staff"]).length, 5);
});
