/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 *
 * Owns both reading and sending for one channel — they share the same local `messages`
 * array (sending needs to splice in an optimistic entry the read side doesn't know about),
 * so one hook is simpler than two hooks passing state back and forth.
 *
 * Polling, not websockets: this build's scope explicitly excludes websockets. A 4s
 * interval keeps the pane feeling live without standing up a socket layer between the
 * browser, the BFF, and the Buzz relay (Buzz itself only speaks NIP-01 subscriptions over
 * its own relay protocol — bridging that to the browser is a separate piece of work).
 */

import { useCallback, useEffect, useState } from "react";
import { addReaction, listChatMessages, postChatMessage, removeReaction } from "../api/chatClient";
import { ChatApiError } from "../api/http";
import type { AthenaMe } from "../api/chatClient";
import type { ChatMessage, ChatReactionSummary } from "../types/chat";
import type { ChatFetchStatus } from "./types";

const POLL_INTERVAL_MS = 4_000;
const OPTIMISTIC_PREFIX = "optimistic-";

export interface SendOutcome {
  readonly ok: boolean;
}

export interface UseChatMessagesResult {
  readonly status: ChatFetchStatus;
  readonly messages: readonly ChatMessage[];
  readonly error: string | null;
  readonly retry: () => void;
  readonly send: (content: string, threadRootId?: string) => Promise<SendOutcome>;
  readonly toggleReaction: (messageId: string, emoji: string) => Promise<void>;
}

/** Keeps any optimistic message a poll hasn't reconciled yet, so a slow relay write
 * doesn't make a just-sent message flicker away for one poll cycle. */
function reconcileWithOptimistic(prev: readonly ChatMessage[], fresh: readonly ChatMessage[]): ChatMessage[] {
  const freshIds = new Set(fresh.map((m) => m.id));
  const stillPending = prev.filter((m) => m.id.startsWith(OPTIMISTIC_PREFIX) && !freshIds.has(m.id));
  return [...fresh, ...stillPending];
}

function buildOptimisticMessage(
  channelId: string,
  content: string,
  threadRootId: string | undefined,
  me: AthenaMe
): ChatMessage {
  return {
    id: `${OPTIMISTIC_PREFIX}${Date.now()}-${Math.random().toString(36).slice(2)}`,
    channelId,
    authorId: me.id,
    authorDisplayName: me.email,
    authorPubkey: me.id, // stand-in until the real message returns with the real pubkey
    authorKind: "HUMAN",
    content,
    createdAt: new Date().toISOString(),
    threadRootId: threadRootId ?? null,
    reactions: [],
  };
}

export function useChatMessages(channelId: string | null, me: AthenaMe | null): UseChatMessagesResult {
  const [status, setStatus] = useState<ChatFetchStatus>("loading");
  const [messages, setMessages] = useState<readonly ChatMessage[]>([]);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(
    async (background: boolean) => {
      if (!channelId) return;
      if (!background) setStatus("loading");
      try {
        const res = await listChatMessages(channelId);
        setMessages((prev) => reconcileWithOptimistic(prev, res.messages));
        setStatus("ready");
        setError(null);
      } catch (err) {
        // A background poll failure is swallowed — keep showing the last good state instead
        // of flashing an error over messages the user can already read.
        if (background) return;
        setError(err instanceof ChatApiError ? err.message : "Could not load messages.");
        setStatus("error");
      }
    },
    [channelId]
  );

  useEffect(() => {
    setMessages([]);
    void load(false);
    const timer = setInterval(() => void load(true), POLL_INTERVAL_MS);
    return () => clearInterval(timer);
  }, [channelId, load]);

  /** Applies the server's recount of one message's reactions. */
  const applyReactions = useCallback((messageId: string, reactions: readonly ChatReactionSummary[]) => {
    setMessages((prev) => prev.map((m) => (m.id === messageId ? { ...m, reactions } : m)));
  }, []);

  const toggleReaction = useCallback(
    async (messageId: string, emoji: string): Promise<void> => {
      const message = messages.find((m) => m.id === messageId);
      const mine = message?.reactions.find((r) => r.emoji === emoji)?.hasReacted ?? false;
      try {
        const result = mine ? await removeReaction(messageId, emoji) : await addReaction(messageId, emoji);
        applyReactions(messageId, result.reactions);
      } catch {
        // The count on screen is still the last thing the server said; a failed toggle leaves it
        // alone rather than inventing a number.
      }
    },
    [messages, applyReactions]
  );

  const send = useCallback(
    async (content: string, threadRootId?: string): Promise<SendOutcome> => {
      if (!channelId || !me) return { ok: false };
      const optimistic = buildOptimisticMessage(channelId, content, threadRootId, me);
      setMessages((prev) => [...prev, optimistic]);
      try {
        const sent = await postChatMessage(channelId, { content, threadRootId });
        setMessages((prev) => prev.map((m) => (m.id === optimistic.id ? sent : m)));
        return { ok: true };
      } catch {
        // Slack's rollback behaviour: drop the optimistic bubble; the composer restores
        // the typed text to the input so nothing is lost.
        setMessages((prev) => prev.filter((m) => m.id !== optimistic.id));
        return { ok: false };
      }
    },
    [channelId, me]
  );

  const retry = useCallback(() => void load(false), [load]);

  return { status, messages, error, retry, send, toggleReaction };
}
