/**
 * CalendlyGo mobile API client with token handling. Pure TypeScript (no React Native imports) so the
 * same logic is unit-tested in Node and exercised against the TEST backend.
 *
 * - The access token lives only in memory; the refresh token is persisted through `store`
 *   (SecureStore in the app). The new refresh token is always persisted before it is used.
 * - Refreshes are single-flight: concurrent callers share one in-flight refresh.
 * - 409 REFRESH_RACE: re-read the stored token; if another flow already stored a newer one, retry with it
 *   once. Otherwise the new token was lost (e.g. the app died mid-refresh): the session cannot be
 *   recovered safely, so it is cleared and the user must sign in again.
 * - Network errors never sign the user out; only the server saying the session is over does.
 * - Tokens and passwords are never logged or put into error messages.
 */

export type Profile = {
  user: { id: string; name: string; email: string; role: string };
  /** Set for a TEAM plan member: the app then shows only their own bookings. Null for the owner. */
  member?: { employeeId: string; employeeName: string } | null;
  business: {
    id: string;
    name: string;
    slug: string;
    sector: string | null;
    logo: string | null;
    isActive: boolean;
    subscription: {
      status: string;
      planType: string;
      plan?: 'PERSON' | 'TEAM';
      trialEndDate: string | null;
      subscriptionEndDate: string | null;
      /** False once the trial or paid period is over (missing on older servers: treat as active). */
      active?: boolean;
    } | null;
  };
};

export interface RefreshTokenStore {
  get(): Promise<string | null>;
  set(token: string): Promise<void>;
  clear(): Promise<void>;
}

export type RegisterInput = {
  name: string;
  email: string;
  password: string;
  phone: string;
  businessName: string;
  sector: string;
  city: string;
  district: string;
  address: string;
  whatsappNumber?: string;
  plan?: 'PERSON' | 'TEAM';
  privacyNoticeAccepted: boolean;
};

/** "Hazır ekibe katıl": a team member's sign-up with the invite code the owner gave them. */
export type JoinTeamInput = { code: string; name: string; email: string; password: string; phone: string; privacyNoticeAccepted: boolean };

export type DeviceInfo = { deviceName?: string | null; platform?: string | null; appVersion?: string | null };

/** The server answered with an error (wrong password, rate limit, …). `code` comes from the API. */
export class ApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
    message: string,
    public readonly retryAfterSeconds?: number
  ) {
    super(message);
    this.name = "ApiError";
  }
}

/** The server could not be reached (offline, timeout, wrong address). Tokens are kept. */
export class NetworkError extends Error {
  constructor() {
    super("Sunucuya ulaşılamadı.");
    this.name = "NetworkError";
  }
}

/** The session is over on the server side; local tokens have been cleared. */
export class SessionExpiredError extends Error {
  constructor() {
    super("Oturumunuz sona erdi.");
    this.name = "SessionExpiredError";
  }
}

type Options = {
  baseUrl: string;
  store: RefreshTokenStore;
  device?: DeviceInfo;
  fetch?: typeof fetch;
  timeoutMs?: number;
  /** Called once whenever the session ends without the user asking (refresh rejected). */
  onSessionExpired?: () => void;
  /** Called when a request is refused because the business's trial or subscription is over (402). */
  onSubscriptionRequired?: () => void;
  now?: () => number;
  /** App language (e.g. "en"); sent as X-App-Locale so the API answers in it. Web clients never send it. */
  language?: () => string;
};

type TokenResponse = Profile & { accessToken: string; accessTokenExpiresAt: string; refreshToken: string };

/** Refresh this long before the access token actually expires. */
const EXPIRY_MARGIN_MS = 60 * 1000;
const FALLBACK_TTL_MS = 15 * 60 * 1000;

/** Access-token lifetime from its own iat/exp, so device clock skew doesn't matter. */
function accessTokenTtlMs(token: string): number {
  try {
    const b64 = token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/");
    const payload = JSON.parse(atob(b64.padEnd(Math.ceil(b64.length / 4) * 4, "=")));
    const ttl = (payload.exp - payload.iat) * 1000;
    return Number.isFinite(ttl) && ttl > 0 ? ttl : FALLBACK_TTL_MS;
  } catch {
    return FALLBACK_TTL_MS;
  }
}

export function createAuthClient(options: Options) {
  const baseUrl = options.baseUrl.replace(/\/+$/, "");
  const fetchFn = options.fetch ?? fetch;
  const timeoutMs = options.timeoutMs ?? 15000;
  const now = options.now ?? Date.now;

  let access: { token: string; refreshAt: number } | null = null;
  let profile: Profile | null = null;
  let inflightRefresh: Promise<Profile> | null = null;

  async function send(path: string, init: { method: string; body?: unknown; token?: string }): Promise<Response> {
    const controller = new AbortController();
    // Uploads (FormData) get more time and set their own multipart Content-Type.
    const isForm = typeof FormData !== "undefined" && init.body instanceof FormData;
    const timer = setTimeout(() => controller.abort(), isForm ? Math.max(timeoutMs, 60000) : timeoutMs);
    try {
      return await fetchFn(baseUrl + path, {
        method: init.method,
        headers: {
          Accept: "application/json",
          ...(options.language ? { "X-App-Locale": options.language() } : {}),
          ...(init.body !== undefined && !isForm ? { "Content-Type": "application/json" } : {}),
          ...(init.token ? { Authorization: `Bearer ${init.token}` } : {}),
        },
        body: init.body === undefined ? undefined : isForm ? (init.body as FormData) : JSON.stringify(init.body),
        credentials: "omit",
        signal: controller.signal,
      });
    } catch {
      throw new NetworkError();
    } finally {
      clearTimeout(timer);
    }
  }

  async function readJson(res: Response): Promise<Record<string, unknown>> {
    try {
      const body = await res.json();
      return body && typeof body === "object" ? body : {};
    } catch {
      return {};
    }
  }

  function apiError(res: Response, body: Record<string, unknown>): ApiError {
    const retryAfter = Number(res.headers.get("retry-after"));
    return new ApiError(
      res.status,
      typeof body.code === "string" ? body.code : `HTTP_${res.status}`,
      typeof body.error === "string" ? body.error : "Beklenmeyen bir hata oluştu.",
      Number.isFinite(retryAfter) && retryAfter > 0 ? retryAfter : undefined
    );
  }

  async function adopt(body: TokenResponse): Promise<Profile> {
    // Persist first: if the app dies after this point, the stored token is the valid one.
    await options.store.set(body.refreshToken);
    access = { token: body.accessToken, refreshAt: now() + accessTokenTtlMs(body.accessToken) - EXPIRY_MARGIN_MS };
    profile = { user: body.user, business: body.business };
    return profile;
  }

  async function dropLocalSession() {
    access = null;
    profile = null;
    await options.store.clear().catch(() => {});
  }

  async function expire(revokeToken: string | null): Promise<never> {
    await dropLocalSession();
    if (revokeToken) {
      // Best effort: free the server-side session we can no longer use.
      void send("/api/mobile/auth/logout", { method: "POST", body: { refreshToken: revokeToken } }).catch(() => {});
    }
    options.onSessionExpired?.();
    throw new SessionExpiredError();
  }

  async function refreshWith(token: string, allowRaceRetry: boolean): Promise<Profile> {
    const res = await send("/api/mobile/auth/refresh", { method: "POST", body: { refreshToken: token } });
    const body = await readJson(res);
    if (res.ok) return adopt(body as TokenResponse);

    if (res.status === 409) {
      const stored = await options.store.get().catch(() => null);
      if (allowRaceRetry && stored && stored !== token) return refreshWith(stored, false);
      return expire(token);
    }
    if (res.status === 401) return expire(null);
    throw apiError(res, body); // 429 / 5xx: keep the session, let the caller retry later
  }

  /** Single-flight refresh: every concurrent caller awaits the same request. */
  function refresh(): Promise<Profile> {
    inflightRefresh ??= (async () => {
      const token = await options.store.get().catch(() => null);
      if (!token) return expire(null);
      return refreshWith(token, true);
    })().finally(() => {
      inflightRefresh = null;
    });
    return inflightRefresh;
  }

  async function accessToken(): Promise<string> {
    if (!access || now() >= access.refreshAt) await refresh();
    return access!.token;
  }

  return {
    /** Signs in with the same email/password as the web panel. Throws ApiError or NetworkError. */
    async login(email: string, password: string): Promise<Profile> {
      const res = await send("/api/mobile/auth/login", {
        method: "POST",
        body: { email, password, ...options.device },
      });
      const body = await readJson(res);
      if (!res.ok) throw apiError(res, body);
      return adopt(body as TokenResponse);
    },

    /**
     * Creates a business owner account through the same endpoint as the web sign-up, then signs in with
     * it on this device. Throws ApiError (e.g. e-mail already used) or NetworkError.
     */
    async register(input: RegisterInput): Promise<Profile> {
      const res = await send("/api/auth/register", { method: "POST", body: input });
      const body = await readJson(res);
      if (!res.ok) throw apiError(res, body);
      return this.login(input.email, input.password);
    },

    /** Asks for a password reset e-mail. Answers the same whether or not the account exists. */
    async requestPasswordReset(email: string): Promise<void> {
      const res = await send("/api/auth/password-reset/request", { method: "POST", body: { email } });
      const body = await readJson(res);
      if (!res.ok) throw apiError(res, body);
    },

    /**
     * Joins a team with an invite code (creates a member account), then signs in with it on this device.
     * Throws ApiError (e.g. invalid code, e-mail already used, team full) or NetworkError.
     */
    async joinTeam(input: JoinTeamInput): Promise<Profile> {
      const res = await send("/api/team/join", { method: "POST", body: input });
      const body = await readJson(res);
      if (!res.ok) throw apiError(res, body);
      return this.login(input.email, input.password);
    },

    /**
     * Resumes a stored session at app start. Returns null when there is none (or it was rejected);
     * throws NetworkError when the server can't be reached, so the app can offer a retry.
     */
    async restore(): Promise<Profile | null> {
      const token = await options.store.get().catch(() => null);
      if (!token) return null;
      try {
        return await refresh();
      } catch (error) {
        if (error instanceof SessionExpiredError) return null;
        throw error;
      }
    },

    /**
     * Authenticated request with a JSON body, or a FormData body for file uploads.
     * Refreshes ahead of expiry and once more on a 401.
     */
    async request<T = unknown>(path: string, init: { method?: string; body?: unknown } = {}): Promise<T> {
      const method = init.method ?? "GET";
      let res = await send(path, { method, body: init.body, token: await accessToken() });
      if (res.status === 401) {
        // refresh() itself ends the session when the server rejects it. If the fresh token is refused
        // too, the session is fine and this route just isn't open to this account (e.g. an owner-only
        // route for a team member): an error for the caller, not a sign-out.
        await refresh();
        res = await send(path, { method, body: init.body, token: access!.token });
      }
      const body = await readJson(res);
      if (!res.ok) {
        const error = apiError(res, body);
        if (error instanceof ApiError && error.code === "SUBSCRIPTION_REQUIRED") options.onSubscriptionRequired?.();
        throw error;
      }
      return body as T;
    },

    /** Signs out locally right away and revokes the server session when reachable. */
    async logout(): Promise<void> {
      const token = await options.store.get().catch(() => null);
      await dropLocalSession();
      if (token) {
        await send("/api/mobile/auth/logout", { method: "POST", body: { refreshToken: token } }).catch(() => {});
      }
    },

    getProfile: () => profile,
  };
}

export type AuthClient = ReturnType<typeof createAuthClient>;
