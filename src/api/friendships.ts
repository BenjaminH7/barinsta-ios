/**
 * Follow requests — list people who asked to follow you, then approve or
 * ignore each one. Mirrors barinsta's FriendshipService (the generic
 * /friendships/{action}/{id}/ endpoint with actions approve/ignore).
 */
import { apiGet, apiPostForm } from './client';
import {
  FriendshipChangeResponse,
  PendingFriendshipsResponse,
} from '../types/instagram';

/** Incoming follow requests waiting on your decision. */
export function getPendingFollowRequests(
  maxId?: string,
): Promise<PendingFriendshipsResponse> {
  const query: Record<string, string> = {};
  if (maxId) query.max_id = maxId;
  return apiGet<PendingFriendshipsResponse>(
    '/api/v1/friendships/pending/',
    query,
  );
}

/** Accept a follow request. */
export function approveFollowRequest(userId: string): Promise<FriendshipChangeResponse> {
  return apiPostForm<FriendshipChangeResponse>(
    `/api/v1/friendships/approve/${userId}/`,
    { user_id: userId },
  );
}

/** Refuse / ignore a follow request. */
export function ignoreFollowRequest(userId: string): Promise<FriendshipChangeResponse> {
  return apiPostForm<FriendshipChangeResponse>(
    `/api/v1/friendships/ignore/${userId}/`,
    { user_id: userId },
  );
}

/** Follow a user (or send a follow request if their account is private). */
export function followUser(userId: string): Promise<FriendshipChangeResponse> {
  return apiPostForm<FriendshipChangeResponse>(
    `/api/v1/friendships/create/${userId}/`,
    { user_id: userId },
  );
}

/** Unfollow a user (also cancels a pending outgoing request). */
export function unfollowUser(userId: string): Promise<FriendshipChangeResponse> {
  return apiPostForm<FriendshipChangeResponse>(
    `/api/v1/friendships/destroy/${userId}/`,
    { user_id: userId },
  );
}
