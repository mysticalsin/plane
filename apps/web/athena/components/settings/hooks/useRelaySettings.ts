/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 *
 * Mirrors athena/hooks/useChatChannels.ts's status/error/retry shape. Read-only by design —
 * GET /chat/settings/relay has no matching PATCH (see the route's own module comment).
 */

import { useCallback, useEffect, useState } from "react";
import { ChatApiError } from "../../../api/http";
import { getRelaySettings } from "../api/chatSettingsClient";
import type { RelaySettings, SettingsFetchStatus } from "../types";

export interface UseRelaySettingsResult {
  readonly status: SettingsFetchStatus;
  readonly relay: RelaySettings | null;
  readonly error: string | null;
  readonly retry: () => void;
}

export function useRelaySettings(): UseRelaySettingsResult {
  const [status, setStatus] = useState<SettingsFetchStatus>("loading");
  const [relay, setRelay] = useState<RelaySettings | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setStatus("loading");
    setError(null);
    getRelaySettings()
      .then((res) => {
        if (cancelled) return;
        setRelay(res);
        setStatus("ready");
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setError(err instanceof ChatApiError ? err.message : "Could not reach the Buzz relay.");
        setStatus("error");
      });
    return () => {
      cancelled = true;
    };
  }, [attempt]);

  const retry = useCallback(() => setAttempt((n) => n + 1), []);

  return { status, relay, error, retry };
}
