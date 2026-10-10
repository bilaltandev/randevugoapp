import prisma from "./prisma";

export interface CreateAuditLogParams {
  adminEmail: string;
  adminName?: string | null;
  action:
    | "BUSINESS_STATUS_CHANGE"
    | "TRIAL_EXTENDED"
    | "SUBSCRIPTION_CHANGE"
    | "FEATURE_FLAG_CHANGE"
    | "SECTOR_CHANGE"
    | "PRICE_CHANGE"
    | "ADMIN_PROFILE_UPDATE"
    | "ADMIN_PASSWORD_CHANGE"
    | "SUPPORT_AGENT_CREATE"
    | "SUPPORT_AGENT_UPDATE"
    | "SUPPORT_AGENT_DELETE"
    | "SUPPORT_TRIAL_EXTENDED"
    | "SUPPORT_PASSWORD_RESET"
    | "COUPON_CREATE"
    | "COUPON_UPDATE"
    | "COUPON_DELETE";
  target: string;
  targetId?: string | null;
  oldValue?: string | null;
  newValue?: string | null;
  details?: string | null;
}

export async function createAuditLog(params: CreateAuditLogParams) {
  try {
    if (!(prisma as any).auditLog) {
      console.warn("AuditLog model is not available on prisma client.");
      return null;
    }
    return await (prisma as any).auditLog.create({
      data: {
        adminEmail: params.adminEmail,
        adminName: params.adminName || null,
        action: params.action,
        target: params.target,
        targetId: params.targetId || null,
        oldValue: params.oldValue !== undefined ? String(params.oldValue) : null,
        newValue: params.newValue !== undefined ? String(params.newValue) : null,
        details: params.details || null,
      },
    });
  } catch (error) {
    console.error("Audit log error:", error);
    return null;
  }
}
