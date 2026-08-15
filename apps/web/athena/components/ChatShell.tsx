/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 *
 * The three-pane Slack/Linear layout: a channel sidebar, a message pane, and — only when a
 * thread is open — a right-hand thread panel. Shared by all three routes this build adds
 * (workspace chat index, workspace chat channel, project chat) so channel switching between
 * a project's channel and a workspace channel works identically from either shell.
 */

import { useCallback, useState } from "react";
import { useAthenaIdentity } from "../hooks/useAthenaIdentity";
import { useChatChannels } from "../hooks/useChatChannels";
import { useChatMembers } from "../hooks/useChatMembers";
import { useChatMessages } from "../hooks/useChatMessages";
import { useEscapeKey } from "../hooks/useEscapeKey";
import { useUnread } from "../hooks/useUnread";
import { groupChannels } from "../utils/groupChannels";
import { ChannelSidebar } from "./ChannelSidebar";
import { ChatUiProvider, type ChatUiState } from "./ChatUiContext";
import { MessagePane } from "./MessagePane";
import { ThreadPanel } from "./ThreadPanel";

interface ChatShellProps {
  readonly workspaceSlug: string;
  /** Set on the workspace chat routes (null on the bare /chat index until a channel is picked). */
  readonly activeChannelId?: string | null;
  /** Set on the project chat route instead of activeChannelId — ChatShell resolves it to
   * that project's own channel once the channel list has loaded. */
  readonly projectId?: string;
}

function resolveActiveChannel(channels: ReturnType<typeof useChatChannels>["channels"], props: ChatShellProps) {
  if (props.activeChannelId) return channels.find((c) => c.id === props.activeChannelId);
  if (props.projectId) return channels.find((c) => c.kind === "PROJECT" && c.projectId === props.projectId);
  return undefined;
}

export function ChatShell(props: ChatShellProps) {
  const { workspaceSlug } = props;
  const channelsResult = useChatChannels();
  const { members } = useChatMembers();
  const me = useAthenaIdentity();
  const [openThreadRootId, setOpenThreadRootId] = useState<string | null>(null);
  const closeThread = useCallback(() => setOpenThreadRootId(null), []);
  useEscapeKey(openThreadRootId !== null, closeThread);

  const activeChannel = resolveActiveChannel(channelsResult.channels, props);
  const messagesResult = useChatMessages(activeChannel?.id ?? null, me);
  const unread = useUnread(activeChannel?.id ?? null);
  const uiState: ChatUiState = { openThreadRootId, openThread: setOpenThreadRootId, closeThread };

  return (
    <ChatUiProvider value={uiState}>
      <div className="flex h-full w-full overflow-hidden">
        <ChannelSidebar
          workspaceSlug={workspaceSlug}
          grouped={groupChannels(channelsResult.channels)}
          unread={unread.byChannel}
          activeChannelId={activeChannel?.id ?? null}
          status={channelsResult.status}
          error={channelsResult.error}
          onRetry={channelsResult.retry}
          onStartDm={channelsResult.startDm}
          currentUserId={me?.id ?? null}
        />
        <MessagePane
          channel={activeChannel}
          messages={messagesResult.messages}
          members={members}
          status={activeChannel ? messagesResult.status : "ready"}
          error={messagesResult.error}
          onRetry={messagesResult.retry}
          onSend={messagesResult.send}
          onToggleReaction={(messageId, emoji) => void messagesResult.toggleReaction(messageId, emoji)}
          composerDisabled={!me || !activeChannel}
        />
        {openThreadRootId && (
          <ThreadPanel
            rootMessage={messagesResult.messages.find((m) => m.id === openThreadRootId)}
            replies={messagesResult.messages.filter((m) => m.threadRootId === openThreadRootId)}
            members={members}
            onClose={closeThread}
            onSend={messagesResult.send}
            onToggleReaction={(messageId, emoji) => void messagesResult.toggleReaction(messageId, emoji)}
            disabled={!me}
          />
        )}
      </div>
    </ChatUiProvider>
  );
}
