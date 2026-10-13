import { t } from '../i18n/core';
import { ApiError, NetworkError, SessionExpiredError } from '../api/authClient'; // relative: also unit-tested from the repo root (tests/mobile-client)

/** User-facing Turkish text for a failed sign-in. Never includes server internals or credentials. */
export function loginErrorMessage(error: unknown): string {
  if (error instanceof NetworkError) {
    return t('Sunucuya ulaşılamadı. İnternet bağlantınızı kontrol edip tekrar deneyin.');
  }
  if (error instanceof SessionExpiredError) {
    return t('Oturumunuzun süresi doldu. Lütfen tekrar giriş yapın.');
  }
  if (error instanceof ApiError) {
    switch (error.code) {
      case 'INVALID_CREDENTIALS':
        return t('E-posta veya şifre hatalı.');
      case 'INVALID_REQUEST':
        return t('Lütfen e-posta adresinizi ve şifrenizi girin.');
      case 'ACCOUNT_INACTIVE':
        return t('Hesabınız pasif durumda. Lütfen yöneticinizle iletişime geçin.');
      case 'NOT_ELIGIBLE':
        return t('Mobil uygulama yalnızca işletme sahibi hesaplarıyla kullanılabilir.');
      case 'RATE_LIMITED': {
        const minutes = Math.max(1, Math.ceil((error.retryAfterSeconds ?? 60) / 60));
        return t('Çok fazla deneme yaptınız. Lütfen {0} dakika sonra tekrar deneyin.', minutes);
      }
    }
  }
  return t('Şu anda giriş yapılamıyor. Lütfen biraz sonra tekrar deneyin.');
}
