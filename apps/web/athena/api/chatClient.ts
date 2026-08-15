/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 *
 * Athena BFF chat endpoints, prefix /api/v1/chat (see athena/config.ts). The BFF resolves
 * the caller's workspace from their session the same way every other Athena route does
 * (apps/bff/src/routes/workItems.ts's resolveActiveWorkspaceId) — Plane's :workspaceSlug is
 * a Plane URL/routing concern only and is never sent to Athena.
 */

import { athenaFetch } from "./http";
import type {
  ChatChannelListResponse,
  ChatDmChannel,
  ChatDmListResponse,
  ChatMemberListResponse,
  ChatMessage,
  ChatMessageListResponse,
  ChatReactionSummary,
  PostChatMessageInput,
} from "../types/chat";

export function listChatChannels(): Promise<ChatChannelListResponse> {
  return athenaFetch<ChatChannelListResponse>("/chat/channels");
}

export function listChatMessages(channelId: string, limit = 100): Promise<ChatMessageListResponse> {
  return athenaFetch<ChatMessageListResponse>(
    `/chat/channels/${encodeURIComponent(channelId)}/messages?limit=${limit}`
  );
}

export function postChatMessage(channelId: string, input: PostChatMessageInput): Promise<ChatMessage> {
  return athenaFetch<ChatMessage>(`/chat/channels/${encodeURIComponent(channelId)}/messages`, {
    method: "POST",
    body: JSON.stringify(input),
  });
}

/** Backs @mention autocomplete — humans and agents in one list (see chat-composer). */
export function listChatMembers(): Promise<ChatMemberListResponse> {
  return athenaFetch<ChatMemberListResponse>("/chat/members");
}

export interface AthenaMe {
  readonly id: string;
  readonly email: string;
}

/** Not chat-prefixed: GET /api/v1/me (apps/bff/src/routes/me.ts). Used only to know "who
 * am I" for the optimistic send bubble — see hooks/use-chat-messages.ts. */
export function getAthenaMe(): Promise<{ user: AthenaMe }> {
  return athenaFetch<{ user: AthenaMe }>("/me");
}

/** Toggling is two calls, not one: the server has a distinct add and remove, and the button
 * already knows which one it is from `hasReacted`. */
export function addReaction(messageId: string, emoji: string): Promise<{ reactions: readonly ChatReactionSummary[] }> {
  return athenaFetch(`/chat/messages/${encodeURIComponent(messageId)}/reactions`, {
    method: "POST",
    body: JSON.stringify({ emoji }),
  });
}

export function removeReaction(
  messageId: string,
  emoji: string
): Promise<{ reactions: readonly ChatReactionSummary[] }> {
  return athenaFetch(`/chat/messages/${encodeURIComponent(messageId)}/reactions/${encodeURIComponent(emoji)}`, {
    method: "DELETE",
  });
}

export function listDms(): Promise<ChatDmListResponse> {
  return athenaFetch<ChatDmListResponse>("/chat/dms");
}

/** Idempotent server-side: starting a DM that already exists returns the existing one. */
export function createDm(userId: string): Promise<ChatDmChannel> {
  return athenaFetch<ChatDmChannel>("/chat/dms", { method: "POST", body: JSON.stringify({ userId }) });
}

/** A person in the workspace. `id` is a USER id — what starting a DM needs, unlike
 * /chat/members, which answers with chat identity ids. */
export interface AthenaWorkspaceMember {
  readonly id: string;
  readonly email: string;
  readonly role: string;
}

export function listWorkspaceMembers(): Promise<{ members: readonly AthenaWorkspaceMember[] }> {
  return athenaFetch("/workspace/members");
}
