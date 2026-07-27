/**
 * Reads Instagram's cookies out of the WebView cookie jar after a successful
 * login. sessionid is httpOnly, so we can't get it via document.cookie — we
 * use the native CookieManager (@react-native-cookies/cookies) which can read
 * httpOnly cookies. This requires a dev/EAS build (not Expo Go).
 */
import CookieManager from '@react-native-cookies/cookies';
import { WEB_BASE_URL, COOKIE_KEYS, CookieKey } from './constants';
import { createSession, Session } from './session';

export async function extractSessionFromCookieJar(): Promise<Session | null> {
  // On iOS the login cookies can live in the WKWebView store (useWebKit=true)
  // and/or the shared NSHTTPCookieStorage (useWebKit=false), depending on how
  // `sharedCookiesEnabled` routed them. Read both and merge so we don't miss
  // the httpOnly `sessionid`.
  const cookies: Partial<Record<CookieKey, string>> = {};
  for (const useWebKit of [true, false] as const) {
    let jar: Awaited<ReturnType<typeof CookieManager.get>>;
    try {
      jar = await CookieManager.get(WEB_BASE_URL, useWebKit);
    } catch {
      continue;
    }
    for (const key of COOKIE_KEYS) {
      const c = jar[key];
      if (c?.value && !cookies[key]) cookies[key] = c.value;
    }
  }
  return createSession(cookies);
}

/** Wipe the WebView cookie jar (used on logout). */
export async function clearCookieJar(): Promise<void> {
  await CookieManager.clearAll(true);
}
