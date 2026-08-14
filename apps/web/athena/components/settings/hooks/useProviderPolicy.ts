/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 *
 * Who may manage this workspace's provider keys, and which provider is live.
 *
 * Separate from useProviderSettings because the key cards and the permission strip answer
 * different questions and fail independently: a policy that will not load must not blank the key
 * list, and a key list that will not load must not hide who is allowed to fix it.
 */

import { useCallback, useEffect, useState } from "react";
import { ChatApiError } from "../../../api/http";
import { getProviderPolicy, setActiveProvider, setProviderPolicy } from "../api/chatSettingsClient";
import type { ChatModelProvider, ProviderPolicy, SettingsFetchStatus } from "../types";

export interface UseProviderPolicyResult {
  readonly status: SettingsFetchStatus;
  readonly policy: ProviderPolicy | null;
  readonly error: string | null;
  readonly busy: boolean;
  readonly retry: () => void;
  readonly changePolicy: (policy: ProviderPolicy["policy"]) => Promise<{ ok: boolean; error?: string }>;
  readonly changeActiveProvider: (provider: ChatModelProvider | null) => Promise<{ ok: boolean; error?: string }>;
}

export function useProviderPolicy(): UseProviderPolicyResult {
  const [status, setStatus] = useState<SettingsFetchStatus>("loading");
  const [policy, setPolicy] = useState<ProviderPolicy | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setStatus("loading");
    setError(null);
    getProviderPolicy()
      .then((result) => {
        if (cancelled) return;
        setPolicy(result);
        setStatus("ready");
      })
      .catch((cause: unknown) => {
        if (cancelled) return;
        setError(cause instanceof ChatApiError ? cause.message : "Could not load key permissions.");
        setStatus("error");
      });
    return () => {
      cancelled = true;
    };
  }, [attempt]);

  const retry = useCallback(() => setAttempt((n) => n + 1), []);

  const changePolicy = useCallback(async (next: ProviderPolicy["policy"]) => {
    setBusy(true);
    try {
      await setProviderPolicy(next);
      // Re-read rather than patch locally: changing the rule also changes whether THIS viewer may
      // manage keys, and that is the server's call to make, not a value this hook can infer.
      setAttempt((n) => n + 1);
      return { ok: true };
    } catch (cause) {
      return { ok: false, error: cause instanceof ChatApiError ? cause.message : "Could not change the policy." };
    } finally {
      setBusy(false);
    }
  }, []);

  const changeActiveProvider = useCallback(async (provider: ChatModelProvider | null) => {
    setBusy(true);
    try {
      const result = await setActiveProvider(provider);
      setPolicy((prev) => (prev ? { ...prev, activeProvider: result.activeProvider } : prev));
      return { ok: true };
    } catch (cause) {
      return {
        ok: false,
        error: cause instanceof ChatApiError ? cause.message : "Could not change the active provider.",
      };
    } finally {
      setBusy(false);
    }
  }, []);

  return { status, policy, error, busy, retry, changePolicy, changeActiveProvider };
}
