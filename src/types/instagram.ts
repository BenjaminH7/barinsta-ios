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
}

// ---- Direct messages ----

export interface DirectItem {
  item_id: string;
  item_type: string; // 'text' | 'media' | 'reel_share' | ...
  user_id: number;
  timestamp: number;
  text?: string;
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
