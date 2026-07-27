/**
 * Session state: the cookies + identifiers we captured at login, kept in
 * memory for fast access and mirrored into expo-secure-store so the user stays
 * logged in across app launches.
 */
import * as SecureStore from 'expo-secure-store';
import { COOKIE_KEYS, CookieKey } from './constants';

const STORE_KEY = 'ig_session_v1';

export interface Session {
  /** Raw cookie string ready to drop into a `Cookie:` header. */
  cookieHeader: string;
  /** Individual cookie values, keyed by name. */
  cookies: Partial<Record<CookieKey, string>>;
  /** Numeric user id of the logged-in account (from ds_user_id). */
  userId: string;
  /** CSRF token required by write endpoints. */
  csrfToken: string;
  /** Stable device UUID we generate once and reuse. */
  deviceUuid: string;
}

let current: Session | null = null;

/** RFC4122-ish v4 uuid without extra deps. */
export function generateUuid(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/** Build a `Cookie:` header value from a name→value map. */
export function buildCookieHeader(cookies: Partial<Record<CookieKey, string>>): string {
  return COOKIE_KEYS.filter((k) => cookies[k])
    .map((k) => `${k}=${cookies[k]}`)
    .join('; ');
}

export function createSession(cookies: Partial<Record<CookieKey, string>>): Session | null {
  if (!cookies.sessionid || !cookies.ds_user_id) return null;
  return {
    cookies,
    cookieHeader: buildCookieHeader(cookies),
    userId: cookies.ds_user_id,
    csrfToken: cookies.csrftoken ?? '',
    deviceUuid: generateUuid(),
  };
}

export function getSession(): Session | null {
  return current;
}

export function requireSession(): Session {
  if (!current) throw new Error('Not authenticated');
  return current;
}

export async function saveSession(session: Session): Promise<void> {
  current = session;
  await SecureStore.setItemAsync(STORE_KEY, JSON.stringify(session));
}

export async function loadSession(): Promise<Session | null> {
  try {
    const raw = await SecureStore.getItemAsync(STORE_KEY);
    if (!raw) return null;
    current = JSON.parse(raw) as Session;
    return current;
  } catch {
    return null;
  }
}

export async function clearSession(): Promise<void> {
  current = null;
  await SecureStore.deleteItemAsync(STORE_KEY);
}
