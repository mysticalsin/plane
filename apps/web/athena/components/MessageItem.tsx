/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { format } from "date-fns";
import { Bot, MessageSquarePlus } from "lucide-react";
import { useTheme } from "next-themes";
import { Avatar } from "@plane/ui";
import { cn } from "@plane/utils";
import { authorColor } from "../utils/authorColor";
import { splitMentions } from "../utils/mentions";
import { FOCUS_RING } from "../utils/focusRing";
import { useChatUi } from "./ChatUiContext";
import { MessageReactions } from "./MessageReactions";
import type { ChatMember, ChatMessage } from "../types/chat";

interface MessageItemProps {
  readonly message: ChatMessage;
  readonly members: readonly ChatMember[];
  readonly showThreadAction: boolean;
  readonly onToggleReaction: (messageId: string, emoji: string) => void;
}

function MessageContent(props: { content: string; members: readonly ChatMember[] }) {
  const segments = splitMentions(props.content, props.members);
  return (
    <p className="text-14 break-words whitespace-pre-wrap text-primary">
      {segments.map((segment, i) =>
        segment.type === "mention" ? (
          <span
            key={i}
            className={cn(
              "rounded px-1 py-0.5 font-medium",
              segment.member?.kind === "AGENT" ? "bg-accent-primary/15 text-accent-primary" : "bg-layer-2 text-primary"
            )}
          >
            {segment.value}
          </span>
        ) : (
          <span key={i}>{segment.value}</span>
        )
      )}
    </p>
  );
}

export function MessageItem(props: MessageItemProps) {
  const { message, members, showThreadAction, onToggleReaction } = props;
  const { resolvedTheme } = useTheme();
  const { openThread } = useChatUi();
  const mode = resolvedTheme === "light" ? "light" : "dark";
  const isPending = message.id.startsWith("optimistic-");

  return (
    <div className={cn("group flex gap-2.5 rounded-md px-2 py-1.5 hover:bg-layer-1", isPending && "opacity-60")}>
      <Avatar
        name={message.authorDisplayName}
        size={28}
        fallbackBackgroundColor={authorColor(message.authorPubkey, mode)}
      />
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline gap-1.5">
          <span className="text-13 font-semibold text-primary">{message.authorDisplayName}</span>
          {message.authorKind === "AGENT" && (
            <span className="flex items-center gap-1 rounded-full bg-accent-primary/15 px-1.5 py-0.5 text-11 font-medium text-accent-primary">
              <Bot className="size-2.5" strokeWidth={2} />
              Agent
            </span>
          )}
          <span className="text-11 text-tertiary">{format(new Date(message.createdAt), "h:mm a")}</span>
        </div>
        <MessageContent content={message.content} members={members} />
        <MessageReactions
          messageId={message.id}
          reactions={message.reactions}
          onToggle={onToggleReaction}
          disabled={isPending}
        />
      </div>
      {showThreadAction && !isPending && (
        <button
          type="button"
          onClick={() => openThread(message.id)}
          aria-label="Reply in thread"
          className={cn(
            "flex size-7 flex-shrink-0 items-center justify-center rounded-md text-tertiary opacity-0 group-hover:opacity-100 hover:bg-layer-2 hover:text-primary",
            FOCUS_RING
          )}
        >
          <MessageSquarePlus className="size-4" strokeWidth={1.75} />
        </button>
      )}
    </div>
  );
}
