/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 *
 * Athena BFF chat-settings endpoints, prefix /api/v1/chat/settings (see
 * apps/bff/src/routes/chatSettings.ts). Reuses athenaFetch from athena/api/http.ts — the one
 * place athena/** touches the network — rather than a second fetch wrapper for this surface.
 */

import { athenaFetch } from "../../../api/http";
// One definition of the roster call, in the chat client — this surface just re-exports it.
export { listWorkspaceMembers } from "../../../api/chatClient";
import type {
  AgentListResponse,
  AgentRegistration,
  ChannelListResponse,
  ChannelSettings,
  ChatModelProvider,
  CreateAgentInput,
  CreateMcpServerInput,
  CreateChannelInput,
  IdentitySettings,
  NotificationPref,
  NotificationPrefListResponse,
  ProviderKeyStatus,
  ProviderListResponse,
  ChannelMember,
  ProviderPolicy,
  RelaySettings,
  TestProviderResult,
  UpdateAgentInput,
  UpdateChannelInput,
  UpdateMcpServerInput,
  UpdateNotificationPrefInput,
  McpInventory,
  McpProbeResult,
  McpServer,
  McpServerListResponse,
  ModelCatalogResponse,
} from "../types";

export function getRelaySettings(): Promise<RelaySettings> {
  return athenaFetch<RelaySettings>("/chat/settings/relay");
}

export function getIdentitySettings(): Promise<IdentitySettings> {
  return athenaFetch<IdentitySettings>("/chat/settings/identity");
}

export function updateIdentitySettings(displayName: string): Promise<IdentitySettings> {
  return athenaFetch<IdentitySettings>("/chat/settings/identity", {
    method: "PATCH",
    body: JSON.stringify({ displayName }),
  });
}

export function listChannelSettings(): Promise<ChannelListResponse> {
  return athenaFetch<ChannelListResponse>("/chat/settings/channels");
}

export function createChannelSetting(input: CreateChannelInput): Promise<ChannelSettings> {
  return athenaFetch<ChannelSettings>("/chat/settings/channels", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function updateChannelSetting(id: string, input: UpdateChannelInput): Promise<ChannelSettings> {
  return athenaFetch<ChannelSettings>(`/chat/settings/channels/${encodeURIComponent(id)}`, {
    method: "PATCH",
    body: JSON.stringify(input),
  });
}

export function listAgentSettings(): Promise<AgentListResponse> {
  return athenaFetch<AgentListResponse>("/chat/settings/agents");
}

export function createAgentSetting(input: CreateAgentInput): Promise<AgentRegistration> {
  return athenaFetch<AgentRegistration>("/chat/settings/agents", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function updateAgentSetting(id: string, input: UpdateAgentInput): Promise<AgentRegistration> {
  return athenaFetch<AgentRegistration>(`/chat/settings/agents/${encodeURIComponent(id)}`, {
    method: "PATCH",
    body: JSON.stringify(input),
  });
}

export function listProviderSettings(): Promise<ProviderListResponse> {
  return athenaFetch<ProviderListResponse>("/chat/settings/providers");
}

/** `baseUrl` and `model` are required for the custom provider; `baseUrl` is refused for the
 * named vendors, whose endpoints are fixed. */
export function setProviderKey(
  provider: ChatModelProvider,
  apiKey: string,
  custom?: { baseUrl: string; model: string }
): Promise<ProviderKeyStatus> {
  return athenaFetch<ProviderKeyStatus>(`/chat/settings/providers/${provider}`, {
    method: "PUT",
    body: JSON.stringify(custom ? { apiKey, ...custom } : { apiKey }),
  });
}

/** 204 No Content on success — athenaFetch resolves to undefined for an empty body, so this
 * is typed void rather than cast to a response shape that was never sent. */
export function deleteProviderKey(provider: ChatModelProvider): Promise<void> {
  return athenaFetch<void>(`/chat/settings/providers/${provider}`, { method: "DELETE" });
}

export function testProviderKey(provider: ChatModelProvider): Promise<TestProviderResult> {
  return athenaFetch<TestProviderResult>(`/chat/settings/providers/${provider}/test`, { method: "POST" });
}

export function listNotificationPrefs(): Promise<NotificationPrefListResponse> {
  return athenaFetch<NotificationPrefListResponse>("/chat/settings/notifications");
}

export function updateNotificationPref(
  channelId: string,
  input: UpdateNotificationPrefInput
): Promise<NotificationPref> {
  return athenaFetch<NotificationPref>(`/chat/settings/notifications/${encodeURIComponent(channelId)}`, {
    method: "PATCH",
    body: JSON.stringify(input),
  });
}

export function getModelCatalog(): Promise<ModelCatalogResponse> {
  return athenaFetch<ModelCatalogResponse>("/chat/settings/models");
}

/** `modelId: null` selects automatic routing. */
export function setSelectedModel(modelId: string | null): Promise<{ selectedModelId: string | null }> {
  return athenaFetch<{ selectedModelId: string | null }>("/chat/settings/models", {
    method: "PUT",
    body: JSON.stringify({ modelId }),
  });
}

export function listMcpServers(): Promise<McpServerListResponse> {
  return athenaFetch<McpServerListResponse>("/chat/settings/mcp");
}

export function createMcpServer(input: CreateMcpServerInput): Promise<McpServer> {
  return athenaFetch<McpServer>("/chat/settings/mcp", { method: "POST", body: JSON.stringify(input) });
}

export function updateMcpServer(id: string, input: UpdateMcpServerInput): Promise<McpServer> {
  return athenaFetch<McpServer>(`/chat/settings/mcp/${id}`, { method: "PATCH", body: JSON.stringify(input) });
}

export function deleteMcpServer(id: string): Promise<void> {
  return athenaFetch<void>(`/chat/settings/mcp/${id}`, { method: "DELETE" });
}

export function testMcpServer(id: string): Promise<McpProbeResult> {
  return athenaFetch<McpProbeResult>(`/chat/settings/mcp/${id}/test`, { method: "POST" });
}

export function getProviderPolicy(): Promise<ProviderPolicy> {
  return athenaFetch<ProviderPolicy>("/chat/settings/providers/policy");
}

export function setProviderPolicy(policy: "admins_only" | "members"): Promise<{ policy: string }> {
  return athenaFetch<{ policy: string }>("/chat/settings/providers/policy", {
    method: "PUT",
    body: JSON.stringify({ policy }),
  });
}

export function setActiveProvider(
  provider: ChatModelProvider | null
): Promise<{ activeProvider: ChatModelProvider | null }> {
  return athenaFetch<{ activeProvider: ChatModelProvider | null }>("/chat/settings/providers/active", {
    method: "PUT",
    body: JSON.stringify({ provider }),
  });
}

export function listChannelMembers(channelId: string): Promise<{ members: readonly ChannelMember[] }> {
  return athenaFetch(`/chat/settings/channels/${encodeURIComponent(channelId)}/members`);
}

export function addChannelMember(channelId: string, userId: string): Promise<{ members: readonly ChannelMember[] }> {
  return athenaFetch(`/chat/settings/channels/${encodeURIComponent(channelId)}/members`, {
    method: "POST",
    body: JSON.stringify({ userId }),
  });
}

export function removeChannelMember(channelId: string, userId: string): Promise<{ members: readonly ChannelMember[] }> {
  return athenaFetch(`/chat/settings/channels/${encodeURIComponent(channelId)}/members/${encodeURIComponent(userId)}`, {
    method: "DELETE",
  });
}

/** What the workspace's MCP servers are actually offering right now, and which are refusing.
 * The same call the agent makes, so the panel shows the agent's own view rather than a guess. */
export function getMcpInventory(): Promise<McpInventory> {
  return athenaFetch<McpInventory>("/mcp/tools");
}
