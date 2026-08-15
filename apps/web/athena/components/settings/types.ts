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
export type ChatModelProvider = "deepseek" | "moonshot" | "anthropic" | "custom";

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
  /** The running agent's 64-character Nostr public key — what a mention is addressed to. */
  readonly pubkey: string;
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

/** One model the gateway can route to — see apps/bff/src/services/modelCatalog.ts. */
export interface CatalogModel {
  readonly id: string;
  readonly label: string;
  /** The agent needs tools; a model without them is shown as unavailable rather than hidden. */
  readonly supportsTools: boolean;
  readonly contextLength: number | null;
  /** A gateway combo that routes automatically, rather than one concrete vendor model. */
  readonly isAuto: boolean;
  readonly ownedBy: string | null;
}

export interface ModelCatalogResponse {
  /** Null means automatic routing — a real choice, and the default. */
  readonly selectedModelId: string | null;
  /** True when the gateway is unreachable; the UI says so instead of showing an empty list. */
  readonly catalogUnavailable: boolean;
  readonly models: readonly CatalogModel[];
}

export interface McpServer {
  readonly id: string;
  readonly name: string;
  readonly transport: "http";
  readonly url: string;
  readonly enabled: boolean;
  /** Last four characters of the stored token, or null when the server needs no auth. */
  readonly authLastFour: string | null;
  readonly createdAt: string;
}

export interface McpServerListResponse {
  readonly servers: readonly McpServer[];
}

export interface CreateMcpServerInput {
  readonly name: string;
  readonly url: string;
  readonly enabled?: boolean;
  readonly authToken?: string;
}

export interface UpdateMcpServerInput {
  readonly name?: string;
  readonly url?: string;
  readonly enabled?: boolean;
  /** A string replaces the token, null clears it, omitted leaves it untouched. */
  readonly authToken?: string | null;
}

/** Result of the Test button — a failed probe is a successful test run with a reason. */
export interface McpProbeResult {
  readonly ok: boolean;
  readonly tools: readonly string[];
  readonly error?: string;
}

/** Who may manage provider keys here, and which provider is live. */
export interface ProviderPolicy {
  readonly policy: "admins_only" | "members";
  /** Whether THIS viewer may change keys, so the UI can disable rather than fail. */
  readonly canManageKeys: boolean;
  readonly isAdmin: boolean;
  readonly activeProvider: ChatModelProvider | null;
}
