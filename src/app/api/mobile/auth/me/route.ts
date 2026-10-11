import { authenticateMobileAccessToken, getBearerToken } from "@/lib/mobileAuth";
import { logMobileAuthError, mobileJson, serverError, toMobileProfile } from "../shared";

// GET /api/mobile/auth/me   Authorization: Bearer <accessToken>
// Bearer only: cookies are ignored here, and web cookie tokens are not valid mobile tokens.
export async function GET(request: Request) {
  try {
    const token = getBearerToken(request.headers);
    const auth = token ? await authenticateMobileAccessToken(token) : null;
    if (!auth) {
      return mobileJson({ error: "Yetkisiz erişim.", code: "UNAUTHORIZED" }, 401, { "WWW-Authenticate": "Bearer" });
    }
    return mobileJson(toMobileProfile(auth.user));
  } catch (error) {
    logMobileAuthError("me", error);
    return serverError();
  }
}
