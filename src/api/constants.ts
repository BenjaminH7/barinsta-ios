/**
 * Constants for talking to Instagram's private mobile API.
 *
 * These mirror what the open-source Android client "barinsta" uses. We reuse
 * the web app-id (936619743392459) because our session cookies come from a
 * WebView login on instagram.com — that app-id is the one accepted alongside
 * web-session cookies.
 */

export const BASE_URL = 'https://i.instagram.com';
export const WEB_BASE_URL = 'https://www.instagram.com';
export const LOGIN_URL = 'https://www.instagram.com/accounts/login/';

/** Instagram web app-id, sent as X-IG-App-ID on every private-API request. */
export const X_IG_APP_ID = '936619743392459';

/**
 * User-Agent presented to the private API. We use an iOS Instagram UA so the
 * responses match what a real iPhone client would receive.
 */
export const USER_AGENT =
  'Instagram 219.0.0.12.117 (iPhone11,8; iOS 14_4; en_US; en-US; scale=2.00; 828x1792; 346138365) AppleWebKit/420+';

/** Cookie names we care about after login. sessionid is httpOnly. */
export const COOKIE_KEYS = [
  'sessionid',
  'ds_user_id',
  'csrftoken',
  'mid',
  'rur',
  'ig_did',
  'shbid',
  'shbts',
] as const;

export type CookieKey = (typeof COOKIE_KEYS)[number];
