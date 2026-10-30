// What a team member may see of their team: names, specialties and photos. Never phone numbers or e-mail
// addresses; those stay with the business owner. Pure (no database) so tests can use it.

export type RosterStaff = {
  id: string;
  name: string;
  specialty: string;
  photo: string | null;
  email: string | null;
};

export type TeamRoster = {
  manager: { name: string; specialty: string | null; photo: string | null };
  members: { id: string; name: string; specialty: string; photo: string | null; isMe: boolean }[];
};

/**
 * The owner is the team's manager. Sign-up gives them a staff record too (same e-mail): it supplies their
 * specialty and photo, and is left out of the members so they aren't listed twice.
 */
export function buildTeamRoster(owner: { name: string; email: string }, staff: RosterStaff[], myEmployeeId: string): TeamRoster {
  const ownerEmail = owner.email.trim().toLowerCase();
  const ownRecord = staff.find((s) => s.email?.trim().toLowerCase() === ownerEmail);
  return {
    manager: { name: owner.name, specialty: ownRecord?.specialty ?? null, photo: ownRecord?.photo ?? null },
    members: staff
      .filter((s) => s !== ownRecord)
      .map(({ id, name, specialty, photo }) => ({ id, name, specialty, photo, isMe: id === myEmployeeId })),
  };
}
