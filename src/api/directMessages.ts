/**
 * Direct messages API — inbox, message requests (pending inbox), a single
 * thread, sending text, and approving/declining a request thread.
 * Endpoints mirror barinsta's DirectMessagesService.
 */
import { apiGet, apiPostForm } from './client';
import { requireSession } from './session';
import {
  DirectInboxResponse,
  DirectThreadResponse,
} from '../types/instagram';

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

/** Accept a message request so it moves into the main inbox. */
export function approveThread(threadId: string): Promise<unknown> {
  return apiPostForm(`/api/v1/direct_v2/threads/${threadId}/approve/`);
}

/** Decline (reject) a message request. */
export function declineThread(threadId: string): Promise<unknown> {
  return apiPostForm(`/api/v1/direct_v2/threads/${threadId}/decline/`);
}
