import crypto from "crypto";
import prisma from "@/lib/prisma";
import { hashPassword, verifyPassword } from "@/lib/auth";
import { createMobileSession, getEligibleMobileUser } from "@/lib/mobileAuth";
import { RATE_LIMITS, getClientIp, hitRateLimit, rateLimitKey, resetRateLimit } from "@/lib/rateLimit";
import { logMobileAuthError, mobileJson, readJsonObject, serverError, tooManyRequests, toMobileProfile } from "../shared";

const INVALID_CREDENTIALS = { error: "Geçersiz e-posta veya şifre.", code: "INVALID_CREDENTIALS" };

// Compared against when the email is unknown, so response time doesn't reveal which accounts exist.
let dummyHash: Promise<string> | undefined;
const getDummyHash = () => (dummyHash ??= hashPassword(crypto.randomBytes(16).toString("hex")));

// POST /api/mobile/auth/login  { email, password, deviceName?, platform?, appVersion? }
export async function POST(request: Request) {
  try {
    const body = await readJsonObject(request);
    const email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";
    const password = typeof body?.password === "string" ? body.password : "";
    if (!email || !password || email.length > 254 || password.length > 200) {
      return mobileJson({ error: "E-posta ve şifre zorunludur.", code: "INVALID_REQUEST" }, 400);
    }

    const ipLimit = await hitRateLimit(rateLimitKey("mlogin", "ip", getClientIp(request.headers)), RATE_LIMITS.mobileLoginIp);
    if (!ipLimit.allowed) return tooManyRequests(ipLimit);
    const emailKey = rateLimitKey("mlogin", "email", email);
    const emailLimit = await hitRateLimit(emailKey, RATE_LIMITS.mobileLoginEmail);
    if (!emailLimit.allowed) return tooManyRequests(emailLimit);

    const account = await prisma.user.findUnique({ where: { email }, select: { id: true, password: true, isActive: true } });
    const passwordOk = await verifyPassword(password, account?.password ?? (await getDummyHash()));
    if (!account || !passwordOk) return mobileJson(INVALID_CREDENTIALS, 401);

    // Only revealed to someone who knows the password, same as the web login.
    if (!account.isActive) {
      return mobileJson({ error: "Hesabınız pasif durumda. Lütfen yöneticinizle iletişime geçin.", code: "ACCOUNT_INACTIVE" }, 403);
    }
    const user = await getEligibleMobileUser(account.id);
    if (!user) {
      return mobileJson({ error: "Mobil uygulama yalnızca işletme hesaplarıyla kullanılabilir.", code: "NOT_ELIGIBLE" }, 403);
    }

    await resetRateLimit(emailKey);
    const session = await createMobileSession(user.id, {
      deviceName: typeof body?.deviceName === "string" ? body.deviceName : null,
      platform: typeof body?.platform === "string" ? body.platform : null,
      appVersion: typeof body?.appVersion === "string" ? body.appVersion : null,
    });

    return mobileJson({
      accessToken: session.accessToken,
      accessTokenExpiresAt: session.accessTokenExpiresAt,
      refreshToken: session.refreshToken,
      ...toMobileProfile(user),
    });
  } catch (error) {
    logMobileAuthError("login", error);
    return serverError();
  }
}
