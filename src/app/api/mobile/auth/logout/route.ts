import { revokeMobileSessionByRefreshToken } from "@/lib/mobileAuth";
import { RATE_LIMITS, getClientIp, hitRateLimit, rateLimitKey } from "@/lib/rateLimit";
import { logMobileAuthError, mobileJson, readJsonObject, serverError, tooManyRequests } from "../shared";

// POST /api/mobile/auth/logout  { refreshToken }
// Idempotent: always 200 for a well-formed request, whether or not the token matched a live session,
// so the app can clear its stored tokens unconditionally and the response reveals nothing.
export async function POST(request: Request) {
  try {
    const body = await readJsonObject(request);
    const refreshToken = typeof body?.refreshToken === "string" ? body.refreshToken : "";
    if (!refreshToken || refreshToken.length > 200) {
      return mobileJson({ error: "Geçersiz istek.", code: "INVALID_REQUEST" }, 400);
    }

    const revoked = await revokeMobileSessionByRefreshToken(refreshToken);
    if (!revoked) {
      const limit = await hitRateLimit(rateLimitKey("mlogout", "ip", getClientIp(request.headers)), RATE_LIMITS.mobileUnknownTokenIp);
      if (!limit.allowed) return tooManyRequests(limit);
    }
    return mobileJson({ success: true });
  } catch (error) {
    logMobileAuthError("logout", error);
    return serverError();
  }
}
