// Unit tests for src/lib/passwordPolicy.ts and its copy in the mobile app. No network, no database:
//   npx tsx --test tests/uniqueness/password.test.ts
import { test } from "node:test";
import assert from "node:assert/strict";
import { isStrongPassword } from "../../src/lib/passwordPolicy";
import { isStrongPassword as mobileIsStrongPassword } from "../../mobile/src/lib/password";

const CASES: [string, boolean][] = [
  ["Guclu1!sifre", true],
  ["Şifre12*", true],
  ["kisa1!A", false],
  ["hepsikucuk1!", false],
  ["RakamYok!!", false],
  ["OzelYok123", false],
  ["Bosluk 123", false],
  [`A1!${"x".repeat(198)}`, false],
];

test("a password needs length, an upper-case letter, a digit and a special character", () => {
  for (const [password, expected] of CASES) assert.equal(isStrongPassword(password), expected, password);
});

test("anything but a string is rejected", () => {
  assert.equal(isStrongPassword(undefined), false);
  assert.equal(isStrongPassword(12345678), false);
});

test("the mobile copy agrees", () => {
  for (const [password, expected] of CASES) assert.equal(mobileIsStrongPassword(password), expected, password);
});
