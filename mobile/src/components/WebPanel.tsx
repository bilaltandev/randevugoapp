import { Stack } from 'expo-router';
import { useCallback, useEffect, useRef, useState, type ComponentType, type ReactElement, type Ref } from 'react';
import { BackHandler, Pressable, View, type NativeSyntheticEvent, type StyleProp, type ViewStyle } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { WebView as RNWebView, type WebViewNavigation } from 'react-native-webview';

import { useAuth } from '@/auth/AuthProvider';
import { Icon, icons } from '@/components/Icon';
import { ErrorView, LoadingView } from '@/components/StateViews';
import { API_URL } from '@/config';
import { errorMessage } from '@/lib/errorMessage';
import { makeStyles, useTheme } from '@/theme';
import { t } from '@/i18n';

// react-native-webview 14's typings collapse to `never` against RN 0.88's types; type the props we use.
type WebViewHandle = { goBack: () => void; reload: () => void };
const WebView = RNWebView as unknown as ComponentType<{
  ref?: Ref<WebViewHandle>;
  source: { uri: string };
  style?: StyleProp<ViewStyle>;
  sharedCookiesEnabled?: boolean;
  thirdPartyCookiesEnabled?: boolean;
  pullToRefreshEnabled?: boolean;
  allowsBackForwardNavigationGestures?: boolean;
  setSupportMultipleWindows?: boolean;
  startInLoadingState?: boolean;
  renderLoading?: () => ReactElement;
  onLoadProgress?: (e: NativeSyntheticEvent<{ progress: number }>) => void;
  onNavigationStateChange?: (s: WebViewNavigation) => void;
}>;

/**
 * A web panel page (e.g. the page builder) inside the app, exactly as on the web. The app's session is
 * exchanged for a one-time link (POST /api/mobile/web-session), so the owner doesn't sign in again.
 * The WebView keeps its own cookies; signing out of the app does not touch the browser on the phone.
 */
export function WebPanel({ next }: { next: string }) {
  const { colors } = useTheme();
  const styles = useStyles();
  const { client } = useAuth();
  const webRef = useRef<WebViewHandle>(null);
  const [attempt, setAttempt] = useState(0);
  // The link result remembers which attempt it belongs to, so a retry shows "loading" without a reset.
  const [link, setLink] = useState<{ attempt: number; uri?: string; error?: string } | null>(null);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [canGoBack, setCanGoBack] = useState(false);
  const progress = useSharedValue(0);

  useEffect(() => {
    if (!client || !API_URL) return;
    let cancelled = false;
    client
      .request<{ path: string }>('/api/mobile/web-session', { method: 'POST', body: { next } })
      .then(({ path }) => !cancelled && setLink({ attempt, uri: `${API_URL!.replace(/\/+$/, '')}${path}` }))
      .catch((e) => !cancelled && setLink({ attempt, error: errorMessage(e) }));
    return () => {
      cancelled = true;
    };
  }, [client, next, attempt]);

  const retry = useCallback(() => {
    setLoginError(null);
    setAttempt((n) => n + 1);
  }, []);

  const current = link?.attempt === attempt ? link : null;
  const uri = current?.uri ?? null;
  const error = loginError ?? current?.error ?? null;

  // Android back: go back inside the web page first.
  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      if (!canGoBack) return false;
      webRef.current?.goBack();
      return true;
    });
    return () => sub.remove();
  }, [canGoBack]);

  const bar = useAnimatedStyle(() => ({ width: `${progress.get() * 100}%`, opacity: progress.get() < 1 ? 1 : 0 }));

  if (error) return <ErrorView message={error} onRetry={retry} />;
  if (!uri) return <LoadingView />;

  return (
    <View style={styles.flex}>
      <Stack.Screen
        options={{
          headerRight: () => (
            <Pressable onPress={() => webRef.current?.reload()} hitSlop={12} accessibilityRole="button" accessibilityLabel={t('Yenile')}>
              <Icon name={icons.refresh} size={20} color={colors.brand} />
            </Pressable>
          ),
        }}
      />
      <Animated.View style={[styles.progress, bar]} />
      <WebView
        ref={webRef}
        source={{ uri }}
        style={styles.flex}
        sharedCookiesEnabled
        thirdPartyCookiesEnabled
        pullToRefreshEnabled
        allowsBackForwardNavigationGestures
        setSupportMultipleWindows={false}
        startInLoadingState
        renderLoading={() => <LoadingView />}
        onLoadProgress={(e) => progress.set(withTiming(e.nativeEvent.progress, { duration: 150 }))}
        onNavigationStateChange={(s: WebViewNavigation) => {
          setCanGoBack(s.canGoBack);
          // Landing on the web login page means the one-time link didn't work (expired or used).
          if (/\/login(?:[/?#]|$)/.test(s.url.replace(/^https?:\/\/[^/]+/, ''))) {
            setLoginError(t('Web paneline giriş yapılamadı. Bağlantının süresi dolmuş olabilir.'));
          }
        }}
      />
    </View>
  );
}

const useStyles = makeStyles((colors) => ({
  flex: { flex: 1, backgroundColor: colors.canvas },
  progress: { height: 2, backgroundColor: colors.brand, marginBottom: -2, zIndex: 1 },
}));
