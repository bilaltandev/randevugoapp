import { findSessionIdByRefreshToken, rotateRefreshToken } from "@/lib/mobileAuth";
import { RATE_LIMITS, getClientIp, hitRateLimit, rateLimitKey } from "@/lib/rateLimit";
import { logMobileAuthError, mobileJson, readJsonObject, serverError, tooManyRequests, toMobileProfile } from "../shared";

// POST /api/mobile/auth/refresh  { refreshToken }
//   200 new token pair · 409 REFRESH_RACE (re-read the stored token, nothing was revoked)
//   401 SESSION_INVALID (sign in again) · 429 rate limited
export async function POST(request: Request) {
  try {
    const body = await readJsonObject(request);
    const refreshToken = typeof body?.refreshToken === "string" ? body.refreshToken : "";
    if (!refreshToken || refreshToken.length > 200) {
      return mobileJson({ error: "Geçersiz istek.", code: "INVALID_REQUEST" }, 400);
    }

    const sessionId = await findSessionIdByRefreshToken(refreshToken);
    const limit = sessionId
      ? await hitRateLimit(rateLimitKey("mrefresh", "session", sessionId), RATE_LIMITS.mobileRefresh)
      : await hitRateLimit(rateLimitKey("mrefresh", "ip", getClientIp(request.headers)), RATE_LIMITS.mobileUnknownTokenIp);
    if (!limit.allowed) return tooManyRequests(limit);

    const result = await rotateRefreshToken(refreshToken);
    if (result.ok) {
      return mobileJson({
        accessToken: result.accessToken,
        accessTokenExpiresAt: result.accessTokenExpiresAt,
        refreshToken: result.refreshToken,
        ...toMobileProfile(result.user),
      });
    }
    if (result.reason === "RACE") {
      return mobileJson({ error: "Oturum başka bir istekte yenilendi.", code: "REFRESH_RACE" }, 409);
    }
    // INVALID / EXPIRED / REVOKED / REUSE / NOT_ELIGIBLE all mean the same to the app: sign in again.
    return mobileJson({ error: "Oturumunuz sona erdi. Lütfen tekrar giriş yapın.", code: "SESSION_INVALID" }, 401);
  } catch (error) {
    logMobileAuthError("refresh", error);
    return serverError();
  }
}
