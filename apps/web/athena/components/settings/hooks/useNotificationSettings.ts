/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useCallback, useEffect, useState } from "react";
import { ChatApiError } from "../../../api/http";
import { listNotificationPrefs, updateNotificationPref } from "../api/chatSettingsClient";
import type { NotificationPref, SettingsFetchStatus, UpdateNotificationPrefInput } from "../types";

export interface UseNotificationSettingsResult {
  readonly status: SettingsFetchStatus;
  readonly prefs: readonly NotificationPref[];
  readonly error: string | null;
  readonly retry: () => void;
  readonly updatePref: (
    channelId: string,
    input: UpdateNotificationPrefInput
  ) => Promise<{ ok: boolean; error?: string }>;
}

export function useNotificationSettings(): UseNotificationSettingsResult {
  const [status, setStatus] = useState<SettingsFetchStatus>("loading");
  const [prefs, setPrefs] = useState<readonly NotificationPref[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setStatus("loading");
    setError(null);
    listNotificationPrefs()
      .then((res) => {
        if (cancelled) return;
        setPrefs(res.prefs);
        setStatus("ready");
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setError(err instanceof ChatApiError ? err.message : "Could not load notification preferences.");
        setStatus("error");
      });
    return () => {
      cancelled = true;
    };
  }, [attempt]);

  const retry = useCallback(() => setAttempt((n) => n + 1), []);

  const updatePref = useCallback(async (channelId: string, input: UpdateNotificationPrefInput) => {
    try {
      const updated = await updateNotificationPref(channelId, input);
      setPrefs((prev) => prev.map((p) => (p.channelId === channelId ? updated : p)));
      return { ok: true };
    } catch (err) {
      return { ok: false, error: err instanceof ChatApiError ? err.message : "Could not update this preference." };
    }
  }, []);

  return { status, prefs, error, retry, updatePref };
}
