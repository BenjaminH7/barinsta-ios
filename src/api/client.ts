/**
 * Thin fetch wrapper for Instagram's private API, mirroring barinsta: every
 * request carries just the captured session cookies and the Instagram app
 * User-Agent, aimed at i.instagram.com. barinsta's AddCookiesInterceptor adds
 * nothing else (no X-IG-App-ID, no web headers) — see constants.ts.
 */
import { BASE_URL, USER_AGENT } from './constants';
import { requireSession } from './session';

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public body?: unknown,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

function baseHeaders(): Record<string, string> {
  const session = requireSession();
  // barinsta's AddCookiesInterceptor sends exactly these two on every call.
  return {
    'User-Agent': USER_AGENT,
    'Cookie': session.cookieHeader,
  };
}

export async function apiGet<T>(path: string, query?: Record<string, string>): Promise<T> {
  const qs = query ? '?' + new URLSearchParams(query).toString() : '';
  const res = await fetch(`${BASE_URL}${path}${qs}`, {
    method: 'GET',
    headers: baseHeaders(),
  });
  return handle<T>(res);
}

/**
 * POST a form-urlencoded body. Private write endpoints expect the usual
 * signed-form fields; we inject the shared ones (_csrftoken, _uuid, _uid)
 * automatically unless the caller already provided them.
 */
export async function apiPostForm<T>(
  path: string,
  form: Record<string, string> = {},
): Promise<T> {
  const session = requireSession();
  const body = new URLSearchParams({
    _csrftoken: session.csrfToken,
    _uuid: session.deviceUuid,
    _uid: session.userId,
    ...form,
  }).toString();

  const res = await fetch(`${BASE_URL}${path}`, {
    method: 'POST',
    headers: {
      ...baseHeaders(),
      'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
    },
    body,
  });
  return handle<T>(res);
}

/**
 * POST raw bytes to a `rupload_*` endpoint. Instagram's resumable-upload
 * endpoints expect the file body as `application/octet-stream` plus a set of
 * `X-Entity-*` / `X-Instagram-Rupload-Params` headers describing the payload.
 * The caller supplies those extra headers; we add the session headers.
 */
export async function apiPostRaw<T>(
  path: string,
  body: Blob,
  extraHeaders: Record<string, string>,
): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    method: 'POST',
    headers: {
      ...baseHeaders(),
      ...extraHeaders,
    },
    body,
  });
  return handle<T>(res);
}

async function handle<T>(res: Response): Promise<T> {
  const text = await res.text();
  let json: unknown;
  try {
    json = text ? JSON.parse(text) : {};
  } catch {
    json = { raw: text };
  }
  if (!res.ok) {
    const message =
      (json as { message?: string })?.message || `Request failed (${res.status})`;
    throw new ApiError(message, res.status, json);
  }
  return json as T;
}
