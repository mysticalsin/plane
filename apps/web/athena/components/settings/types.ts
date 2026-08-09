/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 *
 * CHAT SETTINGS WIRE CONTRACT MIRROR — read this before touching anything under
 * athena/components/settings/**. Same rationale as athena/types/chat.ts: Plane's web
 * workspace cannot import @mantu/athena-domain (separate pnpm workspaces, no project
 * reference), so this hand-mirror of apps/bff/src/routes/chatSettings/*.ts's zod response
 * schemas is the one accepted source of truth on this side. Verified field-for-field against
 * that route file and its 16 passing tests (chatSettings.test.ts) on 2026-08-09.
 */

export interface ChatSettingsHealth {
  readonly ok: boolean;
  readonly latencyMs: number;
  readonly error?: string;
}

export interface RelaySettings {
  readonly relayUrl: string;
  readonly communityHost: string;
  readonly health: ChatSettingsHealth;
}

export interface IdentitySettings {
  readonly displayName: string;
  readonly pubkey: string;
}

/** Kept independent of athena/types/chat.ts's ChatChannelKind — same values, but this
 * settings surface has no dependency edge back into the chat surface it extends (see this
 * file's module comment). */
export type SettingsChannelKind = "WORKSPACE" | "PROJECT" | "DM";

export interface ChannelSettings {
  readonly id: string;
  readonly name: string;
  readonly kind: SettingsChannelKind;
  readonly projectId: string | null;
  readonly topic: string | null;
  readonly isPrivate: boolean;
  readonly archived: boolean;
  readonly memberCount: number;
}

export interface ChannelListResponse {
  readonly channels: readonly ChannelSettings[];
}

export interface CreateChannelInput {
  readonly name: string;
  readonly topic?: string | null;
  readonly isPrivate?: boolean;
}

export interface UpdateChannelInput {
  readonly name?: string;
  readonly topic?: string | null;
  readonly isPrivate?: boolean;
  readonly archived?: boolean;
}

/** Matches apps/bff/src/routes/chatSettings/shared.ts's chatProviderSchema exactly — the
 * three providers the BYOK surface and the agent roster both validate against. */
export type ChatModelProvider = "deepseek" | "moonshot" | "anthropic";

export interface AgentRegistration {
  readonly id: string;
  readonly name: string;
  readonly pubkey: string;
  readonly model: string;
  readonly provider: ChatModelProvider;
  readonly enabled: boolean;
  readonly lastAnsweredAt: string | null;
}

export interface AgentListResponse {
  readonly agents: readonly AgentRegistration[];
}

export interface CreateAgentInput {
  readonly name: string;
  readonly model: string;
  readonly provider: ChatModelProvider;
}

export interface UpdateAgentInput {
  readonly enabled?: boolean;
  readonly model?: string;
}

export interface ProviderKeyStatus {
  readonly provider: ChatModelProvider;
  readonly connected: boolean;
  readonly lastFour: string | null;
  readonly updatedAt: string | null;
}

export interface ProviderListResponse {
  readonly providers: readonly ProviderKeyStatus[];
}

export interface TestProviderResult {
  readonly ok: boolean;
  readonly error?: string;
}

export interface NotificationPref {
  readonly channelId: string;
  readonly channelName: string;
  readonly muted: boolean;
  readonly mentionOnly: boolean;
}

export interface NotificationPrefListResponse {
  readonly prefs: readonly NotificationPref[];
}

export interface UpdateNotificationPrefInput {
  readonly muted?: boolean;
  readonly mentionOnly?: boolean;
}

/** Shared by every settings data hook — identical shape to athena/hooks/types.ts's
 * ChatFetchStatus, redeclared here rather than imported so this panel's data layer has no
 * dependency edge back into the chat surface it extends. */
export type SettingsFetchStatus = "loading" | "error" | "ready";
