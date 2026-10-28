import Constants from 'expo-constants';
import * as Device from 'expo-device';
import { createContext, use, useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { Platform } from 'react-native';

import { createAuthClient, type AuthClient, type Profile, type RegisterInput, type JoinTeamInput } from '@/api/authClient';
import { secureTokenStore } from '@/auth/tokenStore';
import { getLanguage, t } from '@/i18n';
import { API_URL } from '@/config';

/**
 * loading      – checking the stored session at launch (splash stays up)
 * signedOut    – show the login screen
 * signedIn     – show the app
 * unreachable  – a stored session exists but the server can't be reached; offer a retry
 */
export type AuthStatus = 'loading' | 'signedOut' | 'signedIn' | 'unreachable';

type AuthContextValue = {
  status: AuthStatus;
  profile: Profile | null;
  /** Shown once on the login screen, e.g. after the session expired. */
  notice: string | null;
  clearNotice: () => void;
  /** null when EXPO_PUBLIC_API_URL is missing: the app cannot sign in at all. */
  client: AuthClient | null;
  signIn: (email: string, password: string) => Promise<void>;
  /** Creates an owner account (web sign-up endpoint) and signs in with it. */
  register: (input: RegisterInput) => Promise<void>;
  /** Joins a team with an invite code (member account) and signs in with it. */
  joinTeam: (input: JoinTeamInput) => Promise<void>;
  /** Re-reads the signed-in user and business, e.g. after editing the profile or settings. */
  reloadProfile: () => Promise<void>;
  /** True right after a new business signs up: the app shows the plan cards before anything else. */
  welcome: boolean;
  finishWelcome: () => void;
  /** True right after any sign-up (owner or team member): the intro slides come first, once. */
  intro: boolean;
  finishIntro: () => void;
  signOut: () => Promise<void>;
  retryRestore: () => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<AuthStatus>(API_URL ? 'loading' : 'signedOut');
  const [profile, setProfile] = useState<Profile | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [restoreAttempt, setRestoreAttempt] = useState(0);
  const [welcome, setWelcome] = useState(false);
  const [intro, setIntro] = useState(false);
  const signingOut = useRef(false);

  const client = useMemo(
    () =>
      API_URL
        ? createAuthClient({
            baseUrl: API_URL,
            store: secureTokenStore,
            device: {
              deviceName: Device.deviceName,
              platform: Platform.OS,
              appVersion: Constants.expoConfig?.version ?? null,
            },
            language: getLanguage,
            // The server refused an action because the trial or plan is over: show the lock screen now
            // instead of waiting for the next profile read.
            onSubscriptionRequired: () =>
              setProfile((current) =>
                current?.business.subscription
                  ? { ...current, business: { ...current.business, subscription: { ...current.business.subscription, active: false } } }
                  : current
              ),
            onSessionExpired: () => {
              if (signingOut.current) return;
              setProfile(null);
              setStatus('signedOut');
              setNotice(t('Oturumunuzun süresi doldu. Lütfen tekrar giriş yapın.'));
            },
          })
        : null,
    []
  );

  useEffect(() => {
    if (!client) return;
    let cancelled = false;
    setStatus('loading');
    client
      .restore()
      .then((restored) => {
        if (cancelled) return;
        setProfile(restored);
        setStatus(restored ? 'signedIn' : 'signedOut');
      })
      .catch(() => {
        // NetworkError (or a 5xx): keep the stored session and let the user retry.
        if (!cancelled) setStatus('unreachable');
      });
    return () => {
      cancelled = true;
    };
  }, [client, restoreAttempt]);

  const signIn = useCallback(
    async (email: string, password: string) => {
      if (!client) throw new Error(t('API adresi yapılandırılmamış.'));
      const signedIn = await client.login(email, password);
      setNotice(null);
      setProfile(signedIn);
      setStatus('signedIn');
    },
    [client]
  );

  const register = useCallback(
    async (input: RegisterInput) => {
      if (!client) throw new Error(t('API adresi yapılandırılmamış.'));
      const signedIn = await client.register(input);
      setNotice(null);
      setIntro(true);
      setWelcome(true);
      setProfile(signedIn);
      setStatus('signedIn');
    },
    [client]
  );

  const joinTeam = useCallback(
    async (input: JoinTeamInput) => {
      if (!client) throw new Error(t('API adresi yapılandırılmamış.'));
      const signedIn = await client.joinTeam(input);
      setNotice(null);
      setIntro(true);
      setProfile(signedIn);
      setStatus('signedIn');
    },
    [client]
  );

  const reloadProfile = useCallback(async () => {
    if (!client) return;
    try {
      setProfile(await client.request<Profile>('/api/mobile/auth/me'));
    } catch {
      // Keep the current profile; a lost session is handled by onSessionExpired.
    }
  }, [client]);

  const signOut = useCallback(async () => {
    signingOut.current = true;
    try {
      await client?.logout();
    } finally {
      signingOut.current = false;
      setIntro(false);
      setWelcome(false);
      setProfile(null);
      setStatus('signedOut');
    }
  }, [client]);

  const value = useMemo<AuthContextValue>(
    () => ({
      status,
      profile,
      notice,
      clearNotice: () => setNotice(null),
      client,
      signIn,
      register,
      joinTeam,
      reloadProfile,
      welcome,
      finishWelcome: () => setWelcome(false),
      intro,
      finishIntro: () => setIntro(false),
      signOut,
      retryRestore: () => setRestoreAttempt((n) => n + 1),
    }),
    [status, profile, notice, client, signIn, register, joinTeam, reloadProfile, welcome, intro, signOut]
  );

  return <AuthContext value={value}>{children}</AuthContext>;
}

export function useAuth(): AuthContextValue {
  const value = use(AuthContext);
  if (!value) throw new Error('useAuth must be used inside <AuthProvider>.');
  return value;
}

/**
 * Who is signed in: the business owner, or a TEAM plan member (who only sees their own bookings), and the
 * business's plan. Owner-only screens and menu entries check `isMember`.
 */
export function useAccount() {
  const { profile } = useAuth();
  return {
    isMember: !!profile?.member,
    memberEmployeeId: profile?.member?.employeeId ?? null,
    plan: profile?.business.subscription?.plan === 'TEAM' ? ('TEAM' as const) : ('PERSON' as const),
    /** Trial or paid period over: only the lock screen (and support) is available. */
    locked: profile?.business.subscription?.active === false,
  };
}
