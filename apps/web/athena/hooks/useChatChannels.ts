/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useCallback, useEffect, useState } from "react";
import { listChatChannels } from "../api/chatClient";
import { ChatApiError } from "../api/http";
import type { ChatChannel } from "../types/chat";
import type { ChatFetchStatus } from "./types";

export interface UseChatChannelsResult {
  readonly status: ChatFetchStatus;
  readonly channels: readonly ChatChannel[];
  readonly error: string | null;
  readonly retry: () => void;
}

export function useChatChannels(): UseChatChannelsResult {
  const [status, setStatus] = useState<ChatFetchStatus>("loading");
  const [channels, setChannels] = useState<readonly ChatChannel[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setStatus("loading");
    setError(null);
    listChatChannels()
      .then((res) => {
        if (cancelled) return;
        setChannels(res.channels);
        setStatus("ready");
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setError(err instanceof ChatApiError ? err.message : "Could not load channels.");
        setStatus("error");
      });
    return () => {
      cancelled = true;
    };
  }, [attempt]);

  const retry = useCallback(() => setAttempt((n) => n + 1), []);

  return { status, channels, error, retry };
}
