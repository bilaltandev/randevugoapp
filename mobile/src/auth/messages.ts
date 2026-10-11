import { ApiError, NetworkError, SessionExpiredError } from '../api/authClient'; // relative: also unit-tested from the repo root (tests/mobile-client)

/** User-facing Turkish text for a failed sign-in. Never includes server internals or credentials. */
export function loginErrorMessage(error: unknown): string {
  if (error instanceof NetworkError) {
    return 'Sunucuya ulaşılamadı. İnternet bağlantınızı kontrol edip tekrar deneyin.';
  }
  if (error instanceof SessionExpiredError) {
    return 'Oturumunuzun süresi doldu. Lütfen tekrar giriş yapın.';
  }
  if (error instanceof ApiError) {
    switch (error.code) {
      case 'INVALID_CREDENTIALS':
        return 'E-posta veya şifre hatalı.';
      case 'INVALID_REQUEST':
        return 'Lütfen e-posta adresinizi ve şifrenizi girin.';
      case 'ACCOUNT_INACTIVE':
        return 'Hesabınız pasif durumda. Lütfen yöneticinizle iletişime geçin.';
      case 'NOT_ELIGIBLE':
        return 'Mobil uygulama yalnızca işletme sahibi hesaplarıyla kullanılabilir.';
      case 'RATE_LIMITED': {
        const minutes = Math.max(1, Math.ceil((error.retryAfterSeconds ?? 60) / 60));
        return `Çok fazla deneme yaptınız. Lütfen ${minutes} dakika sonra tekrar deneyin.`;
      }
    }
  }
  return 'Şu anda giriş yapılamıyor. Lütfen biraz sonra tekrar deneyin.';
}
