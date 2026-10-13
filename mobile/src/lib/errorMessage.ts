import { t } from '../i18n/core';
import { ApiError, NetworkError } from '../api/authClient'; // relative: unit-tested from the repo root

/** User-facing Turkish text for a failed API call. The API's own message is used when it sends one. */
export function errorMessage(error: unknown): string {
  if (error instanceof NetworkError) return t('Sunucuya ulaşılamadı. Bağlantınızı kontrol edip tekrar deneyin.');
  if (error instanceof ApiError) return error.message ? t(error.message) : t('İşlem tamamlanamadı.');
  return t('Beklenmeyen bir hata oluştu.');
}
