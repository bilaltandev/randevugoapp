import Constants from 'expo-constants';
import * as Device from 'expo-device';
import { createContext, use, useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { Platform } from 'react-native';

import { createAuthClient, type AuthClient, type Profile } from '@/api/authClient';
import { secureTokenStore } from '@/auth/tokenStore';
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
  signOut: () => Promise<void>;
  retryRestore: () => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<AuthStatus>(API_URL ? 'loading' : 'signedOut');
  const [profile, setProfile] = useState<Profile | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [restoreAttempt, setRestoreAttempt] = useState(0);
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
            onSessionExpired: () => {
              if (signingOut.current) return;
              setProfile(null);
              setStatus('signedOut');
              setNotice('Oturumunuzun süresi doldu. Lütfen tekrar giriş yapın.');
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
      if (!client) throw new Error('API adresi yapılandırılmamış.');
      const signedIn = await client.login(email, password);
      setNotice(null);
      setProfile(signedIn);
      setStatus('signedIn');
    },
    [client]
  );

  const signOut = useCallback(async () => {
    signingOut.current = true;
    try {
      await client?.logout();
    } finally {
      signingOut.current = false;
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
      signOut,
      retryRestore: () => setRestoreAttempt((n) => n + 1),
    }),
    [status, profile, notice, client, signIn, signOut]
  );

  return <AuthContext value={value}>{children}</AuthContext>;
}

export function useAuth(): AuthContextValue {
  const value = use(AuthContext);
  if (!value) throw new Error('useAuth must be used inside <AuthProvider>.');
  return value;
}
