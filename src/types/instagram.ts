/**
 * Minimal response types. We intentionally model ONLY what this app shows:
 * messages, stories and follow requests. We do NOT expose follower/following
 * counts or a user's posts anywhere in the app — those fields are omitted on
 * purpose even though the raw API returns them.
 */

/** A user, reduced to just identity fields (no counts, no media). */
export interface IgUser {
  pk: string;
  username: string;
  full_name: string;
  profile_pic_url: string;
  is_verified?: boolean;
  is_private?: boolean;
}

/**
 * A user's relationship to you. Drives the follow button's label/action.
 * We read `following` / `outgoing_request` only — never counts.
 */
export interface FriendshipStatus {
  following?: boolean;
  followed_by?: boolean;
  incoming_request?: boolean;
  outgoing_request?: boolean;
  is_private?: boolean;
}

/**
 * A profile, still deliberately count-free: identity + bio + friendship
 * status. We do NOT model follower_count / following_count / media_count.
 */
export interface IgUserProfile extends IgUser {
  biography?: string;
  friendship_status?: FriendshipStatus;
}

/** `/api/v1/users/search/` — typeahead results. */
export interface UserSearchResponse {
  users: IgUser[];
  status: string;
}

/** `/api/v1/users/{pk}/info/` — a single profile. */
export interface UserInfoResponse {
  user: IgUserProfile;
  status: string;
}

// ---- Direct messages ----

/** Candidate image (thumbnail/full) shared by media and visual items. */
export interface ImageCandidate {
  url: string;
  width: number;
  height: number;
}

/** A photo/video payload as embedded inside a direct item. */
export interface DirectMedia {
  media_type?: number; // 1 = image, 2 = video
  image_versions2?: { candidates: ImageCandidate[] };
  video_versions?: ImageCandidate[];
}

/** Voice message payload (item_type === 'voice_media'). */
export interface DirectVoiceMedia {
  media?: {
    audio?: {
      audio_src?: string;
      duration?: number;
      waveform_data?: number[];
    };
  };
}

/**
 * A view-once / replayable photo (item_type === 'visual_media' or the legacy
 * 'raven_media'). `seen_count` / `view_mode` tell us whether it's ephemeral.
 */
export interface DirectVisualMedia {
  view_mode?: string; // 'once' | 'replayable' | 'permanent'
  seen_count?: number;
  media?: DirectMedia;
}

export interface DirectItem {
  item_id: string;
  // 'text' | 'media' | 'voice_media' | 'visual_media' | 'raven_media'
  // | 'animated_media' | 'reel_share' | ...
  item_type: string;
  user_id: number;
  timestamp: number;
  text?: string;
  media?: DirectMedia;
  voice_media?: DirectVoiceMedia;
  visual_media?: DirectVisualMedia;
}

export interface DirectThread {
  thread_id: string;
  thread_title: string;
  users: IgUser[];
  items: DirectItem[];
  last_activity_at: number;
  read_state?: number;
  is_group?: boolean;
  pending?: boolean;
}

export interface DirectInbox {
  threads: DirectThread[];
  has_older?: boolean;
  oldest_cursor?: string;
}

export interface DirectInboxResponse {
  inbox: DirectInbox;
  pending_requests_total?: number;
  status: string;
}

export interface DirectThreadResponse {
  thread: DirectThread;
  status: string;
}

// ---- Stories ----

export interface StoryMediaImageVersion {
  url: string;
  width: number;
  height: number;
}

export interface StoryVideoVersion {
  url: string;
  width: number;
  height: number;
}

export interface StoryItem {
  id: string;
  pk: string;
  taken_at: number;
  media_type: number; // 1 = image, 2 = video
  image_versions2?: { candidates: StoryMediaImageVersion[] };
  video_versions?: StoryVideoVersion[];
}

export interface Reel {
  id: string | number;
  user: IgUser;
  items?: StoryItem[];
  seen?: number;
  latest_reel_media?: number;
}

export interface ReelsTrayItem {
  user: IgUser;
  id: string | number;
  seen?: number;
  latest_reel_media?: number;
}

export interface ReelsTrayResponse {
  tray: ReelsTrayItem[];
  status: string;
}

export interface ReelsMediaResponse {
  reels: Record<string, Reel>;
  reels_media: Reel[];
  status: string;
}

// ---- Friendships / follow requests ----

export interface PendingFriendshipsResponse {
  users: IgUser[];
  status: string;
  next_max_id?: string;
}

export interface FriendshipChangeResponse {
  status: string;
  friendship_status?: {
    following?: boolean;
    followed_by?: boolean;
    incoming_request?: boolean;
    outgoing_request?: boolean;
  };
}
