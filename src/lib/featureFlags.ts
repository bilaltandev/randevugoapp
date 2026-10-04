import prisma from "./prisma";

/**
 * Universal feature flag evaluator for any business & sector.
 * Evaluates:
 * 1. If flag is globally enabled/disabled.
 * 2. If businessId is explicitly blacklisted in `disabledBusinessIds`.
 * 3. If businessId is explicitly whitelisted in `enabledBusinessIds`.
 * 4. If sector filter applies.
 */
export async function isFeatureEnabled(
  featureKey: string,
  businessId?: string | null,
  sector?: string | null
): Promise<boolean> {
  try {
    const flag = await prisma.featureFlag.findUnique({
      where: { key: featureKey },
    });

    if (!flag) return true; // Default enabled if flag record doesn't exist

    // Check explicit business blacklist
    if (businessId && flag.disabledBusinessIds) {
      try {
        const disabledList = JSON.parse(flag.disabledBusinessIds);
        if (Array.isArray(disabledList) && disabledList.includes(businessId)) {
          return false;
        }
      } catch {}
    }

    // Check explicit business whitelist
    if (businessId && flag.enabledBusinessIds) {
      try {
        const enabledList = JSON.parse(flag.enabledBusinessIds);
        if (Array.isArray(enabledList) && enabledList.includes(businessId)) {
          return true;
        }
      } catch {}
    }

    // Check sector restriction
    if (sector && flag.enabledSectors) {
      try {
        const sectorsList = JSON.parse(flag.enabledSectors);
        if (Array.isArray(sectorsList) && sectorsList.length > 0) {
          if (!sectorsList.includes(sector)) {
            return false;
          }
        }
      } catch {}
    }

    return flag.isEnabled;
  } catch (error) {
    console.error(`Error checking feature flag [${featureKey}]:`, error);
    return true; // Fallback to enabled so production flow doesn't crash
  }
}
