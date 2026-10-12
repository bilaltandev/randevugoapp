import { ApiError, NetworkError } from '../api/authClient'; // relative: unit-tested from the repo root

/** User-facing Turkish text for a failed API call. The API's own message is used when it sends one. */
export function errorMessage(error: unknown): string {
  if (error instanceof NetworkError) return 'Sunucuya ulaşılamadı. Bağlantınızı kontrol edip tekrar deneyin.';
  if (error instanceof ApiError) return error.message || 'İşlem tamamlanamadı.';
  return 'Beklenmeyen bir hata oluştu.';
}
