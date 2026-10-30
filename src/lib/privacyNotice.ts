// The KVKK privacy notice ("Aydınlatma Metni") shown at sign-up. Pure (no database).

export const PRIVACY_NOTICE_PATH = "/aydinlatma-metni";

/** Stored with each sign-up. Change it whenever the text changes, so we know which version a user saw. */
export const PRIVACY_NOTICE_VERSION = "2026-10-30";

export const PRIVACY_NOTICE_REQUIRED = "Devam etmek için aydınlatma metnini okuduğunuzu onaylayın.";

/** The user ticked the box. Clients must send `privacyNoticeAccepted: true`. */
export function privacyNoticeAccepted(body: { privacyNoticeAccepted?: unknown }): boolean {
  return body.privacyNoticeAccepted === true;
}

/** The fields that record the acknowledgement on a new User. */
export function privacyNoticeRecord(now = new Date()) {
  return { privacyNoticeAcceptedAt: now, privacyNoticeVersion: PRIVACY_NOTICE_VERSION };
}
