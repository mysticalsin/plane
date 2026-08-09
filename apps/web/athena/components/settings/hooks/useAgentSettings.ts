/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useCallback, useEffect, useState } from "react";
import { ChatApiError } from "../../../api/http";
import { createAgentSetting, listAgentSettings, updateAgentSetting } from "../api/chatSettingsClient";
import type { AgentRegistration, CreateAgentInput, SettingsFetchStatus, UpdateAgentInput } from "../types";

export interface UseAgentSettingsResult {
  readonly status: SettingsFetchStatus;
  readonly agents: readonly AgentRegistration[];
  readonly error: string | null;
  readonly retry: () => void;
  readonly registerAgent: (input: CreateAgentInput) => Promise<{ ok: boolean; error?: string }>;
  readonly updateAgent: (id: string, input: UpdateAgentInput) => Promise<{ ok: boolean; error?: string }>;
}

function upsert(list: readonly AgentRegistration[], agent: AgentRegistration): readonly AgentRegistration[] {
  const existingIndex = list.findIndex((a) => a.id === agent.id);
  if (existingIndex === -1) return [...list, agent];
  const next = list.slice();
  next[existingIndex] = agent;
  return next;
}

export function useAgentSettings(): UseAgentSettingsResult {
  const [status, setStatus] = useState<SettingsFetchStatus>("loading");
  const [agents, setAgents] = useState<readonly AgentRegistration[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setStatus("loading");
    setError(null);
    listAgentSettings()
      .then((res) => {
        if (cancelled) return;
        setAgents(res.agents);
        setStatus("ready");
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setError(err instanceof ChatApiError ? err.message : "Could not load the agent roster.");
        setStatus("error");
      });
    return () => {
      cancelled = true;
    };
  }, [attempt]);

  const retry = useCallback(() => setAttempt((n) => n + 1), []);

  const registerAgent = useCallback(async (input: CreateAgentInput) => {
    try {
      const created = await createAgentSetting(input);
      setAgents((prev) => upsert(prev, created));
      return { ok: true };
    } catch (err) {
      return { ok: false, error: err instanceof ChatApiError ? err.message : "Could not register the agent." };
    }
  }, []);

  const updateAgent = useCallback(async (id: string, input: UpdateAgentInput) => {
    try {
      const updated = await updateAgentSetting(id, input);
      setAgents((prev) => upsert(prev, updated));
      return { ok: true };
    } catch (err) {
      return { ok: false, error: err instanceof ChatApiError ? err.message : "Could not update the agent." };
    }
  }, []);

  return { status, agents, error, retry, registerAgent, updateAgent };
}
