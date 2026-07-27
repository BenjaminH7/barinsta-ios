/**
 * Constants for talking to Instagram's private API.
 *
 * We mirror the open-source Android client barinsta exactly: authenticated
 * calls hit the app host i.instagram.com carrying ONLY the captured session
 * cookies and an Instagram *app* User-Agent — no X-IG-App-ID and no web headers
 * (barinsta's AddCookiesInterceptor adds just Cookie + User-Agent). Pairing a
 * web app-id with the app host/UA is what made Instagram answer HTTP 400.
 */

export const BASE_URL = 'https://i.instagram.com';
export const WEB_BASE_URL = 'https://www.instagram.com';
export const LOGIN_URL = 'https://www.instagram.com/accounts/login/';

/**
 * User-Agent presented to the private API — barinsta's exact app UA
 * (Constants.I_USER_AGENT). Instagram accepts this alongside the cookies we
 * captured from the WebView login.
 */
export const USER_AGENT =
  'Instagram 161.0.0.37.121 Android (27/8.1.0; 320dpi; 720x1362; motorola; motorola one; deen_sprout; qcom; pt_BR; 248310224)';

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
