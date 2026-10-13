import { inviteRateLimited, joinTeamResponse } from "../shared";

// Public: "Hazır ekibe katıl" at sign-up. POST { code, name, email, password, phone?, specialty? } creates a
// member account with its own staff record in the team that issued the code; they then sign in to the app.
export async function POST(req: Request) {
  const blocked = await inviteRateLimited(req);
  if (blocked) return blocked;
  const body = await req.json().catch(() => ({}));
  const fields = body && typeof body === "object" ? (body as Record<string, unknown>) : {};
  return joinTeamResponse(typeof fields.code === "string" ? fields.code : "", fields);
}
