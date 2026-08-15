/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 *
 * Which channels have something new in them.
 *
 * Polled rather than pushed: the chat surface already polls for messages, and a second live
 * transport for a badge would be a lot of machinery for a number that can be a few seconds stale.
 * Opening a channel marks it read, so the badge clears where the person actually looked.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { athenaFetch } from "../api/http";

export interface ChannelUnread {
  readonly channelId: string;
  readonly unreadCount: number;
  readonly hasMention: boolean;
  readonly muted: boolean;
  readonly mentionOnly: boolean;
}

const POLL_INTERVAL_MS = 15_000;

export interface UseUnreadResult {
  readonly byChannel: ReadonlyMap<string, ChannelUnread>;
  /** Call when a channel is opened — clears its badge locally, then tells the server. */
  readonly markRead: (channelId: string) => void;
}

export function useUnread(activeChannelId: string | null): UseUnreadResult {
  const [byChannel, setByChannel] = useState<ReadonlyMap<string, ChannelUnread>>(new Map());
  const activeRef = useRef<string | null>(activeChannelId);
  activeRef.current = activeChannelId;

  const load = useCallback(async () => {
    try {
      const result = await athenaFetch<{ channels: readonly ChannelUnread[] }>("/chat/unread");
      setByChannel((previous) => {
        const next = new Map(result.channels.map((entry) => [entry.channelId, entry]));
        // The channel being read never shows a badge, however the last poll raced the read.
        const open = activeRef.current;
        if (open && next.has(open)) {
          next.set(open, { ...next.get(open)!, unreadCount: 0, hasMention: false });
        }
        return next.size === 0 && previous.size === 0 ? previous : next;
      });
    } catch {
      // A badge is not worth an error state: leave the last known counts on screen.
    }
  }, []);

  useEffect(() => {
    void load();
    const timer = setInterval(() => void load(), POLL_INTERVAL_MS);
    return () => clearInterval(timer);
  }, [load]);

  const markRead = useCallback((channelId: string) => {
    setByChannel((previous) => {
      const entry = previous.get(channelId);
      if (!entry || (entry.unreadCount === 0 && !entry.hasMention)) return previous;
      const next = new Map(previous);
      next.set(channelId, { ...entry, unreadCount: 0, hasMention: false });
      return next;
    });
    athenaFetch(`/chat/channels/${encodeURIComponent(channelId)}/read`, { method: "POST" }).catch(() => undefined);
  }, []);

  // Opening a channel is what marks it read — the same gesture, not a separate button.
  useEffect(() => {
    if (activeChannelId) markRead(activeChannelId);
  }, [activeChannelId, markRead]);

  return { byChannel, markRead };
}
