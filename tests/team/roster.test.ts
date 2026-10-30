// Unit tests for src/lib/teamRoster.ts. No network, no database:
//   npx tsx --test tests/team/roster.test.ts
import { test } from "node:test";
import assert from "node:assert/strict";
import { buildTeamRoster } from "../../src/lib/teamRoster";

const owner = { name: "Ahmet Yıldız", email: "ahmet@ornek.com" };
const staff = [
  { id: "e1", name: "Ahmet Yıldız", specialty: "İşletme Sahibi & Uzman", photo: "a.jpg", email: "Ahmet@Ornek.com" },
  { id: "e2", name: "Zeynep Koç", specialty: "Cilt bakımı", photo: null, email: "zeynep@ornek.com" },
  { id: "e3", name: "Can Doğan", specialty: "Sakal tıraşı", photo: "c.jpg", email: null },
];

test("the owner is the manager and is not listed again among the members", () => {
  const roster = buildTeamRoster(owner, staff, "e2");
  assert.deepEqual(roster.manager, { name: "Ahmet Yıldız", specialty: "İşletme Sahibi & Uzman", photo: "a.jpg" });
  assert.deepEqual(roster.members.map((m) => m.id), ["e2", "e3"]);
});

test("the member's own row is marked", () => {
  const roster = buildTeamRoster(owner, staff, "e3");
  assert.deepEqual(roster.members.map((m) => m.isMe), [false, true]);
});

test("an owner without a staff record is still the manager", () => {
  const roster = buildTeamRoster(owner, staff.slice(1), "e2");
  assert.deepEqual(roster.manager, { name: "Ahmet Yıldız", specialty: null, photo: null });
  assert.equal(roster.members.length, 2);
});

test("contact details never reach a member", () => {
  const json = JSON.stringify(buildTeamRoster(owner, staff, "e2"));
  assert.equal(json.includes("@"), false);
  assert.equal(json.includes("email"), false);
});
