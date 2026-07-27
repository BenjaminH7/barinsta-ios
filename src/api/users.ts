/**
 * User lookup — search by name/handle and fetch a single profile. Mirrors
 * barinsta's UserSearchService / ProfileService (the private endpoints
 * /users/search/ and /users/{pk}/info/). We normalise `pk` to a string
 * because Instagram returns it as a number here.
 */
import { apiGet } from './client';
import {
  IgUser,
  IgUserProfile,
  UserInfoResponse,
  UserSearchResponse,
} from '../types/instagram';

/** Typeahead search for people by username or full name. */
export async function searchUsers(query: string): Promise<IgUser[]> {
  const q = query.trim();
  if (!q) return [];
  const res = await apiGet<UserSearchResponse>('/api/v1/users/search/', {
    q,
    count: '30',
  });
  return (res.users ?? []).map((u) => ({ ...u, pk: String(u.pk) }));
}

/** Full profile (identity + bio + friendship status) for one user. */
export async function getUserInfo(userId: string): Promise<IgUserProfile> {
  const res = await apiGet<UserInfoResponse>(`/api/v1/users/${userId}/info/`);
  return { ...res.user, pk: String(res.user.pk) };
}
