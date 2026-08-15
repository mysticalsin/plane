/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { Hash, Users } from "lucide-react";
import { ChatEmptyState } from "./ChatEmptyState";
import { ChatErrorState } from "./ChatErrorState";
import { MessagePaneSkeleton } from "./ChatSkeletons";
import { MessageComposer } from "./MessageComposer";
import { MessageList } from "./MessageList";
import type { ChatFetchStatus } from "../hooks/types";
import type { ChatChannel, ChatMember, ChatMessage } from "../types/chat";

interface MessagePaneProps {
  readonly channel: ChatChannel | undefined;
  readonly messages: readonly ChatMessage[];
  readonly members: readonly ChatMember[];
  readonly status: ChatFetchStatus;
  readonly error: string | null;
  readonly onRetry: () => void;
  readonly onSend: (content: string, threadRootId?: string) => Promise<{ ok: boolean }>;
  readonly onToggleReaction: (messageId: string, emoji: string) => void;
  readonly composerDisabled: boolean;
}

function MessagePaneBody(props: Omit<MessagePaneProps, "composerDisabled" | "onSend">) {
  const { channel, messages, members, status, error, onRetry, onToggleReaction } = props;
  if (status === "loading") return <MessagePaneSkeleton />;
  if (status === "error") return <ChatErrorState message={error ?? "Could not load messages."} onRetry={onRetry} />;
  if (messages.length === 0) {
    return (
      <ChatEmptyState
        title={`No messages in #${channel?.name ?? "this channel"} yet`}
        description="Be the first to say something — humans and agents both post here."
      />
    );
  }
  return (
    <MessageList channelId={channel!.id} messages={messages} members={members} onToggleReaction={onToggleReaction} />
  );
}

export function MessagePane(props: MessagePaneProps) {
  const { channel, onSend, composerDisabled } = props;

  if (!channel) {
    return (
      <ChatEmptyState title="Pick a channel" description="Choose a channel from the sidebar to see its messages." />
    );
  }

  return (
    <div className="flex h-full min-w-0 flex-1 flex-col">
      <header className="flex items-center gap-2 border-b border-subtle px-4 py-3">
        {channel.kind === "DM" ? (
          <Users className="size-4 text-tertiary" strokeWidth={1.75} />
        ) : (
          <Hash className="size-4 text-tertiary" strokeWidth={1.75} />
        )}
        <h2 className="text-14 font-semibold text-primary">{channel.name}</h2>
        {channel.topic && (
          <>
            <span className="text-tertiary" aria-hidden>
              ·
            </span>
            <p className="min-w-0 truncate text-13 text-secondary" title={channel.topic}>
              {channel.topic}
            </p>
          </>
        )}
      </header>
      <div className="min-h-0 flex-1">
        <MessagePaneBody {...props} />
      </div>
      <MessageComposer
        members={props.members}
        disabled={composerDisabled}
        placeholder={channel.kind === "DM" ? `Message ${channel.name}` : `Message #${channel.name}`}
        onSend={onSend}
      />
    </div>
  );
}
