/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 *
 * ATHENA WIRE CONTRACT MIRROR — read this before touching anything in athena/**.
 *
 * The build brief for this surface says to mirror @mantu/athena-domain's chat schemas
 * rather than redeclare them. Verified against the actual repo on 2026-08-08: D:/Athena's
 * packages/domain/src/ has NO chat.ts and no chat-shaped export anywhere in api.ts, and
 * apps/bff/src/app.ts registers no chat route file — only health/auth/me/engagements/
 * work-items. So there is nothing yet to mirror; this file is — for now — the ONLY
 * definition of Athena chat's wire shape, written to the contract the build brief
 * specifies (GET/POST /api/v1/chat/**, GET /api/v1/chat/members for mentions).
 *
 * The Plane workspace cannot import an Athena package — they are separate pnpm
 * workspaces with no project reference between them — so this hand-mirror is the one
 * accepted exception to "never redeclare a shape". Every field Athena's chat API can
 * return belongs in THIS file and nowhere else in athena/**, so the day
 * @mantu/athena-domain grows real chat schemas, a diff against this file makes drift
 * obvious immediately instead of silently rotting in two places.
 *
 * No zod: @mantu/athena-domain validates with zod, but zod is not a declared dependency
 * of apps/web (checked package.json before writing this) and this surface's writable
 * scope forbids adding one. The `isChatX` guards below are hand-rolled shape checks, not
 * full schema validation — good enough to stop a malformed response from crashing the
 * render, not a replacement for the server-side validation Athena's BFF already does.
 */

export type ChatMemberKind = "HUMAN" | "AGENT";
export type ChatChannelKind = "PROJECT" | "WORKSPACE" | "DM";

export interface ChatMember {
  readonly id: string;
  readonly displayName: string;
  readonly pubkey: string;
  readonly kind: ChatMemberKind;
}

export interface ChatChannel {
  readonly id: string;
  readonly name: string;
  readonly kind: ChatChannelKind;
  /** Set only for kind "PROJECT" — the Plane project this channel belongs to. */
  readonly projectId: string | null;
  /** What the channel is for. Editable in settings; shown in the channel header. */
  readonly topic: string | null;
}

/** One emoji's tally on a message, and whether the reader is part of it. */
export interface ChatReactionSummary {
  readonly emoji: string;
  readonly count: number;
  readonly hasReacted: boolean;
}

export interface ChatMessage {
  readonly id: string;
  readonly channelId: string;
  readonly authorId: string;
  readonly authorDisplayName: string;
  readonly authorPubkey: string;
  readonly authorKind: ChatMemberKind;
  readonly content: string;
  /** ISO 8601 — Buzz's own `createdAt` is Unix seconds (see integrations/buzz/src/client.ts's
   * BuzzMessage); the BFF is expected to convert to ISO for the wire, matching every other
   * Athena timestamp (ApiWorkItemSchema uses `.toISOString()`). */
  readonly createdAt: string;
  /** Set when this message is a reply — the id of the message it replies to (NIP-10 'e' tag). */
  readonly threadRootId: string | null;
  readonly reactions: readonly ChatReactionSummary[];
}

/**
 * A direct message conversation — a private two-member channel, not NIP-17 gift wrap: the relay
 * operator can read it like any other channel. Stated here as well as on the server's own schema
 * so neither side can quietly assume more privacy than exists.
 */
export interface ChatDmChannel {
  readonly id: string;
  readonly otherMember: {
    readonly userId: string;
    readonly email: string;
    readonly displayName: string;
  };
  readonly createdAt: string;
}

export interface ChatDmListResponse {
  readonly dms: readonly ChatDmChannel[];
}

export interface ChatChannelListResponse {
  readonly channels: readonly ChatChannel[];
}

export interface ChatMessageListResponse {
  readonly messages: readonly ChatMessage[];
}

export interface ChatMemberListResponse {
  readonly members: readonly ChatMember[];
}

export interface PostChatMessageInput {
  readonly content: string;
  readonly threadRootId?: string;
}

/** Athena's BFF error envelope, verified against apps/bff/src/plugins/errorHandler.ts. */
export interface ChatApiErrorBody {
  readonly error: {
    readonly code: string;
    readonly message: string;
    readonly correlationId?: string;
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

export function isChatMessage(value: unknown): value is ChatMessage {
  if (!isRecord(value)) return false;
  return (
    typeof value.id === "string" &&
    typeof value.channelId === "string" &&
    typeof value.authorId === "string" &&
    typeof value.authorDisplayName === "string" &&
    typeof value.authorPubkey === "string" &&
    (value.authorKind === "HUMAN" || value.authorKind === "AGENT") &&
    typeof value.content === "string" &&
    typeof value.createdAt === "string" &&
    (value.threadRootId === null || typeof value.threadRootId === "string") &&
    Array.isArray(value.reactions)
  );
}

export function isChatChannel(value: unknown): value is ChatChannel {
  if (!isRecord(value)) return false;
  return (
    typeof value.id === "string" &&
    typeof value.name === "string" &&
    (value.kind === "PROJECT" || value.kind === "WORKSPACE" || value.kind === "DM") &&
    (value.projectId === null || typeof value.projectId === "string")
  );
}

export function isChatMember(value: unknown): value is ChatMember {
  if (!isRecord(value)) return false;
  return (
    typeof value.id === "string" &&
    typeof value.displayName === "string" &&
    typeof value.pubkey === "string" &&
    (value.kind === "HUMAN" || value.kind === "AGENT")
  );
}
