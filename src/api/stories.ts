/**
 * Stories API — the reels tray (who has a story) and the media inside a reel.
 * Mirrors barinsta's StoriesService.
 */
import { apiGet } from './client';
import { ReelsMediaResponse, ReelsTrayResponse } from '../types/instagram';

/**
 * People (you follow) who currently have an active story.
 *
 * Matches barinsta's StoriesRepository: a plain GET with no params. The tray
 * was coming back empty ("aucune story") because our requests carried an iOS
 * User-Agent while sending the web app-id — reels_tray rejects that mismatch.
 * The fix lives in the shared client (Android app UA, like barinsta).
 */
export function getReelsTray(): Promise<ReelsTrayResponse> {
  return apiGet<ReelsTrayResponse>('/api/v1/feed/reels_tray/');
}

/**
 * Fetch the actual story items for a set of user ids. Instagram accepts
 * repeated `reel_ids` query params; the user id doubles as the reel id for a
 * personal story.
 */
export function getReelsMedia(userIds: string[]): Promise<ReelsMediaResponse> {
  const qs = userIds.map((id) => `reel_ids=${encodeURIComponent(id)}`).join('&');
  return apiGet<ReelsMediaResponse>(`/api/v1/feed/reels_media/?${qs}`);
}

/** Fetch a single user's story reel directly. */
export function getUserStory(userId: string): Promise<unknown> {
  return apiGet(`/api/v1/feed/user/${userId}/story/`);
}
