/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 *
 * Slack's stick-to-bottom rule: new messages append without moving the viewport unless the
 * reader was already at (or near) the bottom when they arrived. Switching channels always
 * lands at the bottom, like opening a Slack channel fresh.
 */

import { useEffect, useLayoutEffect, useRef } from "react";
import { cn } from "@plane/utils";
import { useChatUi } from "./ChatUiContext";
import { MessageItem } from "./MessageItem";
import type { ChatMember, ChatMessage } from "../types/chat";

const BOTTOM_THRESHOLD_PX = 80;

interface MessageListProps {
  readonly channelId: string;
  readonly messages: readonly ChatMessage[];
  readonly members: readonly ChatMember[];
}

export function MessageList(props: MessageListProps) {
  const { channelId, messages, members } = props;
  const { openThreadRootId } = useChatUi();
  const containerRef = useRef<HTMLDivElement>(null);
  const isAtBottomRef = useRef(true);

  const topLevel = messages.filter((m) => m.threadRootId === null);
  const replyCountByRoot = new Map<string, number>();
  for (const m of messages) {
    if (m.threadRootId) replyCountByRoot.set(m.threadRootId, (replyCountByRoot.get(m.threadRootId) ?? 0) + 1);
  }

  const handleScroll = () => {
    const el = containerRef.current;
    if (!el) return;
    const distanceFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
    isAtBottomRef.current = distanceFromBottom < BOTTOM_THRESHOLD_PX;
  };

  useLayoutEffect(() => {
    const el = containerRef.current;
    if (el && isAtBottomRef.current) el.scrollTop = el.scrollHeight;
  }, [messages]);

  useEffect(() => {
    isAtBottomRef.current = true;
    const el = containerRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [channelId]);

  return (
    <div ref={containerRef} onScroll={handleScroll} className="h-full overflow-y-auto px-2 py-3">
      <div className="flex flex-col gap-0.5">
        {topLevel.map((message) => (
          <div key={message.id} className={cn(message.id === openThreadRootId && "rounded-md bg-layer-1")}>
            <MessageItem message={message} members={members} showThreadAction />
            {replyCountByRoot.has(message.id) && (
              <ReplyCountBadge count={replyCountByRoot.get(message.id) ?? 0} messageId={message.id} />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function ReplyCountBadge(props: { count: number; messageId: string }) {
  const { openThread } = useChatUi();
  return (
    <button
      type="button"
      onClick={() => openThread(props.messageId)}
      className="ml-11 rounded px-1.5 py-0.5 text-13 font-medium text-accent-primary hover:underline"
    >
      {props.count} {props.count === 1 ? "reply" : "replies"}
    </button>
  );
}
