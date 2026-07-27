/**
 * Constants for talking to Instagram's private API.
 *
 * Our session cookies come from a WebView login on www.instagram.com, so we
 * must present a *web* identity end-to-end: the web app-id (936619743392459),
 * a browser User-Agent, and the www host. Hitting the app host i.instagram.com
 * with these web credentials makes Instagram reject the request with HTTP 400.
 */

export const BASE_URL = 'https://www.instagram.com';
export const WEB_BASE_URL = 'https://www.instagram.com';
export const LOGIN_URL = 'https://www.instagram.com/accounts/login/';

/** Instagram web app-id, sent as X-IG-App-ID on every private-API request. */
export const X_IG_APP_ID = '936619743392459';

/**
 * User-Agent presented to the private API. We use the exact Android Instagram
 * UA that barinsta sends (Constants.APP_UA). The web app-id above is only
 * accepted alongside a native app UA of the *same* platform — pairing it with
 * an iOS UA makes stricter endpoints like reels_tray return an empty body,
 * which is why the stories tray came back empty ("aucune story").
 */
export const USER_AGENT =
  'Instagram 195.0.0.31.123 Android (25/7.1.1; 440dpi; 2880x5884; Xiaomi; Mi Note 3; jason; qcom; en_US; 302733772)';

/**
 * User-Agent for the *WebView login page*. This MUST look like a normal mobile
 * Safari — instagram.com serves a broken/dead-end login form to anything whose
 * UA contains the native "Instagram" token, which silently swallows the login
 * button. Do not reuse USER_AGENT (the app UA) here.
 */
export const WEB_USER_AGENT =
  'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1';

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
