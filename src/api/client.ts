/**
 * Thin fetch wrapper for the private API. Every request carries the session
 * cookies, the web app-id and a mobile User-Agent — the combination barinsta
 * relies on.
 */
import { BASE_URL, USER_AGENT, X_IG_APP_ID } from './constants';
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
  return {
    'User-Agent': USER_AGENT,
    'X-IG-App-ID': X_IG_APP_ID,
    'X-CSRFToken': session.csrfToken,
    'Cookie': session.cookieHeader,
    'Accept': '*/*',
    'Accept-Language': 'en-US',
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
