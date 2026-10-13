import { getCurrentUser } from "./auth";

/**
 * Who is working on a business's bookings in this request:
 * - "owner": the business owner (web cookie or mobile Bearer) — sees and changes every booking;
 * - "member": a TEAM plan member (mobile Bearer only) — only the bookings of their own staff record.
 *
 * Only the appointment routes and the dashboard summary accept members; every other owner route keeps
 * requiring `user.business`, which members never have.
 */
type ActorSubscription = { status: string; trialEndDate: Date; subscriptionEndDate: Date | null } | null;

export type StaffActor =
  | { kind: "owner"; userId: string; businessId: string; employeeId: null; subscription: ActorSubscription }
  | { kind: "member"; userId: string; businessId: string; employeeId: string; subscription: ActorSubscription };

export async function getStaffActor(): Promise<StaffActor | null> {
  const user = await getCurrentUser();
  if (!user) return null;
  if (user.business) {
    return { kind: "owner", userId: user.id, businessId: user.business.id, employeeId: null, subscription: user.business.subscription };
  }
  const member = "member" in user ? user.member : null;
  if (member) {
    return {
      kind: "member",
      userId: user.id,
      businessId: member.business.id,
      employeeId: member.employeeId,
      subscription: member.business.subscription,
    };
  }
  return null;
}
