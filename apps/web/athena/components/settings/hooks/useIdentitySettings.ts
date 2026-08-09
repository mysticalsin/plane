/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useCallback, useEffect, useState } from "react";
import { ChatApiError } from "../../../api/http";
import { getIdentitySettings, updateIdentitySettings } from "../api/chatSettingsClient";
import type { IdentitySettings, SettingsFetchStatus } from "../types";

export interface UseIdentitySettingsResult {
  readonly status: SettingsFetchStatus;
  readonly identity: IdentitySettings | null;
  readonly error: string | null;
  readonly retry: () => void;
  readonly saving: boolean;
  readonly saveDisplayName: (displayName: string) => Promise<{ ok: boolean; error?: string }>;
}

export function useIdentitySettings(): UseIdentitySettingsResult {
  const [status, setStatus] = useState<SettingsFetchStatus>("loading");
  const [identity, setIdentity] = useState<IdentitySettings | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setStatus("loading");
    setError(null);
    getIdentitySettings()
      .then((res) => {
        if (cancelled) return;
        setIdentity(res);
        setStatus("ready");
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setError(err instanceof ChatApiError ? err.message : "Could not load your identity.");
        setStatus("error");
      });
    return () => {
      cancelled = true;
    };
  }, [attempt]);

  const retry = useCallback(() => setAttempt((n) => n + 1), []);

  const saveDisplayName = useCallback(async (displayName: string) => {
    setSaving(true);
    try {
      const updated = await updateIdentitySettings(displayName);
      setIdentity(updated);
      return { ok: true };
    } catch (err) {
      return { ok: false, error: err instanceof ChatApiError ? err.message : "Could not update your display name." };
    } finally {
      setSaving(false);
    }
  }, []);

  return { status, identity, error, retry, saving, saveDisplayName };
}
