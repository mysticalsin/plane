/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useCallback, useEffect, useState } from "react";
import { createDm, listChatChannels, listDms } from "../api/chatClient";
import { ChatApiError } from "../api/http";
import type { ChatChannel } from "../types/chat";
import type { ChatFetchStatus } from "./types";

export interface UseChatChannelsResult {
  readonly status: ChatFetchStatus;
  /** Channels and DMs in one list — the sidebar groups them, and everything downstream (unread,
   * the message pane, the composer) treats a DM as the channel it actually is. */
  readonly channels: readonly ChatChannel[];
  readonly error: string | null;
  readonly retry: () => void;
  /** Starts (or reopens) a DM with a workspace member and returns its channel id. */
  readonly startDm: (userId: string) => Promise<{ ok: boolean; channelId?: string; error?: string }>;
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
    // DMs live behind their own endpoint because each one is named for a different person
    // depending on who is asking. They are merged here so there is one channel list, not two.
    Promise.all([listChatChannels(), listDms()])
      .then(([channelsResponse, dmsResponse]) => {
        if (cancelled) return;
        const dms: ChatChannel[] = dmsResponse.dms.map((dm) => ({
          id: dm.id,
          name: dm.otherMember.displayName,
          kind: "DM",
          projectId: null,
        }));
        setChannels([...channelsResponse.channels, ...dms]);
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

  const startDm = useCallback(async (userId: string) => {
    try {
      const dm = await createDm(userId);
      // The server is idempotent here, so this is also the "open the existing one" path.
      setAttempt((n) => n + 1);
      return { ok: true, channelId: dm.id };
    } catch (err) {
      return { ok: false, error: err instanceof ChatApiError ? err.message : "Could not start that conversation." };
    }
  }, []);

  return { status, channels, error, retry, startDm };
}
