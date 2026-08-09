/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 *
 * BYOK model providers. `testResults` and `pending` are keyed by provider so three cards can
 * each be mid-save or mid-test independently without racing each other's UI state.
 */

import { useCallback, useEffect, useState } from "react";
import { ChatApiError } from "../../../api/http";
import { deleteProviderKey, listProviderSettings, setProviderKey, testProviderKey } from "../api/chatSettingsClient";
import type { ChatModelProvider, ProviderKeyStatus, SettingsFetchStatus, TestProviderResult } from "../types";

export interface UseProviderSettingsResult {
  readonly status: SettingsFetchStatus;
  readonly providers: readonly ProviderKeyStatus[];
  readonly error: string | null;
  readonly retry: () => void;
  readonly pending: ReadonlySet<ChatModelProvider>;
  readonly testResults: ReadonlyMap<ChatModelProvider, TestProviderResult>;
  readonly saveKey: (provider: ChatModelProvider, apiKey: string) => Promise<{ ok: boolean; error?: string }>;
  readonly removeKey: (provider: ChatModelProvider) => Promise<{ ok: boolean; error?: string }>;
  readonly testConnection: (provider: ChatModelProvider) => Promise<void>;
}

function withPending(
  prev: ReadonlySet<ChatModelProvider>,
  provider: ChatModelProvider,
  isPending: boolean
): ReadonlySet<ChatModelProvider> {
  const next = new Set(prev);
  if (isPending) next.add(provider);
  else next.delete(provider);
  return next;
}

function replaceProvider(list: readonly ProviderKeyStatus[], status: ProviderKeyStatus): readonly ProviderKeyStatus[] {
  return list.map((p) => (p.provider === status.provider ? status : p));
}

export function useProviderSettings(): UseProviderSettingsResult {
  const [status, setStatus] = useState<SettingsFetchStatus>("loading");
  const [providers, setProviders] = useState<readonly ProviderKeyStatus[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);
  const [pending, setPending] = useState<ReadonlySet<ChatModelProvider>>(new Set());
  const [testResults, setTestResults] = useState<ReadonlyMap<ChatModelProvider, TestProviderResult>>(new Map());

  useEffect(() => {
    let cancelled = false;
    setStatus("loading");
    setError(null);
    listProviderSettings()
      .then((res) => {
        if (cancelled) return;
        setProviders(res.providers);
        setStatus("ready");
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setError(err instanceof ChatApiError ? err.message : "Could not load model provider settings.");
        setStatus("error");
      });
    return () => {
      cancelled = true;
    };
  }, [attempt]);

  const retry = useCallback(() => setAttempt((n) => n + 1), []);

  const saveKey = useCallback(async (provider: ChatModelProvider, apiKey: string) => {
    setPending((prev) => withPending(prev, provider, true));
    try {
      const updated = await setProviderKey(provider, apiKey);
      setProviders((prev) => replaceProvider(prev, updated));
      setTestResults((prev) => {
        const next = new Map(prev);
        next.delete(provider);
        return next;
      });
      return { ok: true };
    } catch (err) {
      return { ok: false, error: err instanceof ChatApiError ? err.message : "Could not save this key." };
    } finally {
      setPending((prev) => withPending(prev, provider, false));
    }
  }, []);

  const removeKey = useCallback(async (provider: ChatModelProvider) => {
    setPending((prev) => withPending(prev, provider, true));
    try {
      await deleteProviderKey(provider);
      setProviders((prev) => replaceProvider(prev, { provider, connected: false, lastFour: null, updatedAt: null }));
      setTestResults((prev) => {
        const next = new Map(prev);
        next.delete(provider);
        return next;
      });
      return { ok: true };
    } catch (err) {
      return { ok: false, error: err instanceof ChatApiError ? err.message : "Could not remove this key." };
    } finally {
      setPending((prev) => withPending(prev, provider, false));
    }
  }, []);

  const testConnection = useCallback(async (provider: ChatModelProvider) => {
    setPending((prev) => withPending(prev, provider, true));
    try {
      const result = await testProviderKey(provider);
      setTestResults((prev) => new Map(prev).set(provider, result));
    } catch (err) {
      const message = err instanceof ChatApiError ? err.message : "Could not reach the provider.";
      setTestResults((prev) => new Map(prev).set(provider, { ok: false, error: message }));
    } finally {
      setPending((prev) => withPending(prev, provider, false));
    }
  }, []);

  return { status, providers, error, retry, pending, testResults, saveKey, removeKey, testConnection };
}
