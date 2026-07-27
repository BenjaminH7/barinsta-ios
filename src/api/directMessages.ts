/**
 * Direct messages API — inbox, message requests (pending inbox), a single
 * thread, sending text, and approving/declining a request thread.
 * Endpoints mirror barinsta's DirectMessagesService.
 */
import { apiGet, apiPostForm, apiPostRaw } from './client';
import { requireSession } from './session';
import {
  DirectInboxResponse,
  DirectThreadResponse,
} from '../types/instagram';

/** Random integer used to keep upload names unique. */
function randInt(): number {
  return Math.floor(Math.random() * 1_000_000_000);
}

/** Shared broadcast fields (client_context / mutation_token / device_id). */
function broadcastMeta(): Record<string, string> {
  const session = requireSession();
  const token = `${Date.now()}`;
  return {
    client_context: `${session.deviceUuid}-${token}`,
    mutation_token: token,
    device_id: session.deviceUuid,
  };
}

/** Read a local file URI into a Blob (React Native fetch supports file URIs). */
async function blobFromUri(uri: string): Promise<Blob> {
  const res = await fetch(uri);
  return res.blob();
}

/** Main inbox (accepted conversations). */
export function getInbox(cursor?: string): Promise<DirectInboxResponse> {
  const query: Record<string, string> = {
    visual_message_return_type: 'unseen',
    thread_message_limit: '10',
    persistentBadging: 'true',
    limit: '20',
  };
  if (cursor) query.cursor = cursor;
  return apiGet<DirectInboxResponse>('/api/v1/direct_v2/inbox/', query);
}

/** Message requests — people who aren't in your inbox yet. */
export function getPendingInbox(cursor?: string): Promise<DirectInboxResponse> {
  const query: Record<string, string> = { visual_message_return_type: 'unseen' };
  if (cursor) query.cursor = cursor;
  return apiGet<DirectInboxResponse>('/api/v1/direct_v2/pending_inbox/', query);
}

/** Fetch a single conversation with its recent items. */
export function getThread(threadId: string, cursor?: string): Promise<DirectThreadResponse> {
  const query: Record<string, string> = { visual_message_return_type: 'unseen' };
  if (cursor) query.cursor = cursor;
  return apiGet<DirectThreadResponse>(
    `/api/v1/direct_v2/threads/${threadId}/`,
    query,
  );
}

/** Send a plain text message to an existing thread. */
export function sendText(threadId: string, text: string): Promise<unknown> {
  const session = requireSession();
  return apiPostForm('/api/v1/direct_v2/threads/broadcast/text/', {
    action: 'send_item',
    thread_ids: `[${threadId}]`,
    client_context: `${session.deviceUuid}-${Date.now()}`,
    device_id: session.deviceUuid,
    mutation_token: `${Date.now()}`,
    text,
  });
}

// ---- Media: photo (incl. view-once) & voice ----

/** How a photo should be shown to the recipient. */
export type ViewMode = 'permanent' | 'once' | 'replayable';

/**
 * rupload a JPEG to Instagram and return the `upload_id` to configure with.
 * Mirrors barinsta's MediaService photo upload.
 */
export async function uploadPhoto(uri: string): Promise<string> {
  const uploadId = `${Date.now()}`;
  const name = `${uploadId}_0_${randInt()}`;
  const blob = await blobFromUri(uri);
  const ruploadParams = {
    upload_id: uploadId,
    media_type: '1',
    retry_context: '{"num_step_auto_retry":0,"num_reupload":0,"num_step_manual_retry":0}',
    image_compression: '{"lib_name":"moz","lib_version":"3.1.m","quality":"80"}',
    xsharing_user_ids: '[]',
  };
  await apiPostRaw(`/rupload_igphoto/${name}`, blob, {
    'X-Instagram-Rupload-Params': JSON.stringify(ruploadParams),
    'X-Entity-Type': 'image/jpeg',
    'X-Entity-Name': name,
    'X-Entity-Length': String(blob.size),
    'Offset': '0',
    'Content-Type': 'application/octet-stream',
  });
  return uploadId;
}

/**
 * Send an already-uploaded photo to a thread. `viewMode` controls whether it is
 * a normal photo (`permanent`), a view-once (`once`) or replayable photo.
 */
export function sendPhoto(
  threadId: string,
  uploadId: string,
  viewMode: ViewMode = 'permanent',
): Promise<unknown> {
  return apiPostForm('/api/v1/direct_v2/threads/broadcast/configure_photo/', {
    action: 'send_item',
    thread_ids: `[${threadId}]`,
    upload_id: uploadId,
    allow_full_aspect_ratio: 'true',
    view_mode: viewMode,
    ...broadcastMeta(),
  });
}

/**
 * rupload an audio recording and return its `upload_id`. Voice messages use the
 * `rupload_igaudio` endpoint with `media_type` 11.
 */
export async function uploadAudio(uri: string): Promise<string> {
  const uploadId = `${Date.now()}`;
  const blob = await blobFromUri(uri);
  const ruploadParams = {
    upload_id: uploadId,
    media_type: '11',
    retry_context: '{"num_step_auto_retry":0,"num_reupload":0,"num_step_manual_retry":0}',
    xsharing_user_ids: '[]',
  };
  await apiPostRaw(`/rupload_igaudio/${uploadId}`, blob, {
    'X-Instagram-Rupload-Params': JSON.stringify(ruploadParams),
    'X-Entity-Type': 'audio/mp4',
    'X-Entity-Name': uploadId,
    'X-Entity-Length': String(blob.size),
    'Offset': '0',
    'Content-Type': 'application/octet-stream',
  });
  return uploadId;
}

/**
 * Send an already-uploaded voice recording. `waveform` is a list of 0..1
 * amplitudes used only for the visual bars; the API accepts a rough one.
 */
export function sendVoice(
  threadId: string,
  uploadId: string,
  waveform: number[],
): Promise<unknown> {
  return apiPostForm('/api/v1/direct_v2/threads/broadcast/share_voice/', {
    action: 'send_item',
    thread_ids: `[${threadId}]`,
    upload_id: uploadId,
    waveform: JSON.stringify(waveform),
    waveform_sampling_frequency_hz: '10',
    ...broadcastMeta(),
  });
}

/**
 * Mark a single item as seen — sends the read receipt ("Vu"/"Ouvert") to the
 * sender. We NEVER call this automatically: the thread is read silently and the
 * user chooses when (or whether) to reveal that they saw a message.
 */
export function markItemSeen(threadId: string, itemId: string): Promise<unknown> {
  return apiPostForm(
    `/api/v1/direct_v2/threads/${threadId}/items/${itemId}/seen/`,
    {
      action: 'mark_seen',
      thread_id: threadId,
      item_id: itemId,
      use_unified_inbox: 'true',
    },
  );
}

/** Accept a message request so it moves into the main inbox. */
export function approveThread(threadId: string): Promise<unknown> {
  return apiPostForm(`/api/v1/direct_v2/threads/${threadId}/approve/`);
}

/** Decline (reject) a message request. */
export function declineThread(threadId: string): Promise<unknown> {
  return apiPostForm(`/api/v1/direct_v2/threads/${threadId}/decline/`);
}
