import { NextResponse } from "next/server";
import { setSessionCookie } from "@/lib/auth";
import { authenticateMobileAccessToken, getBearerToken, getEligibleMobileUser, signWebHandoff, verifyWebHandoff } from "@/lib/mobileAuth";
import { hitRateLimit } from "@/lib/rateLimit";

// Opens a web panel page (e.g. the page builder) inside the mobile app with the app's session:
//   POST (Bearer)            → one-time link valid for 60 seconds
//   GET ?code=…&next=/dashboard/… → sets the normal web session cookie and redirects there
// Only /dashboard paths are allowed as targets, and each code works once.

const DEFAULT_NEXT = "/dashboard/page-builder";

function safeNext(value: string | null): string {
  if (!value || !value.startsWith("/dashboard") || value.startsWith("//") || value.includes("\\")) return DEFAULT_NEXT;
  return value;
}

export async function POST(req: Request) {
  try {
    const token = getBearerToken(req.headers);
    const auth = token ? await authenticateMobileAccessToken(token) : null;
    if (!auth) return NextResponse.json({ error: "Oturum bulunamadı.", code: "UNAUTHORIZED" }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const next = safeNext(typeof body.next === "string" ? body.next : null);
    const code = signWebHandoff(auth.user.id);
    const path = `/api/mobile/web-session?code=${encodeURIComponent(code)}&next=${encodeURIComponent(next)}`;
    return NextResponse.json({ path }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("[mobile-web-session] create failed", { name: (error as Error)?.name });
    return NextResponse.json({ error: "Bağlantı oluşturulamadı." }, { status: 500 });
  }
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const fail = () => NextResponse.redirect(new URL("/login", url.origin));
  try {
    const claims = verifyWebHandoff(url.searchParams.get("code") ?? "");
    if (!claims) return fail();

    // One use per code: the first hit counts 1, any replay within the code's lifetime is refused.
    const use = await hitRateLimit(`webhandoff:${claims.jti}`, { limit: 1, windowSeconds: 120 });
    if (!use.allowed) return fail();

    const user = await getEligibleMobileUser(claims.userId);
    if (!user) return fail();

    await setSessionCookie({
      userId: user.id,
      email: user.email,
      role: user.role,
      businessId: user.business.id,
      businessSlug: user.business.slug,
    });
    const res = NextResponse.redirect(new URL(safeNext(url.searchParams.get("next")), url.origin));
    res.headers.set("Cache-Control", "no-store");
    return res;
  } catch (error) {
    console.error("[mobile-web-session] exchange failed", { name: (error as Error)?.name });
    return fail();
  }
}
