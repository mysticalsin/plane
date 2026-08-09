/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 *
 * A right-hand panel, never a modal and never a new page — Linear's inline detail-panel
 * pattern rather than Slack's popover-style thread window, since Plane's own issue detail
 * already uses a right panel for exactly this kind of "more about this one item" view.
 */

import { X } from "lucide-react";
import { cn } from "@plane/utils";
import { FOCUS_RING } from "../utils/focusRing";
import { MessageComposer } from "./MessageComposer";
import { MessageItem } from "./MessageItem";
import type { ChatMember, ChatMessage } from "../types/chat";

interface ThreadPanelProps {
  readonly rootMessage: ChatMessage | undefined;
  readonly replies: readonly ChatMessage[];
  readonly members: readonly ChatMember[];
  readonly onClose: () => void;
  readonly onSend: (content: string, threadRootId?: string) => Promise<{ ok: boolean }>;
  readonly disabled: boolean;
}

export function ThreadPanel(props: ThreadPanelProps) {
  const { rootMessage, replies, members, onClose, onSend, disabled } = props;

  return (
    <aside className="flex h-full w-96 flex-shrink-0 flex-col border-l border-subtle bg-surface-1">
      <div className="flex items-center justify-between border-b border-subtle px-3 py-3">
        <h3 className="text-14 font-semibold text-primary">Thread</h3>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close thread"
          className={cn(
            "flex size-8 items-center justify-center rounded-md text-tertiary hover:bg-layer-1 hover:text-primary",
            FOCUS_RING
          )}
        >
          <X className="size-4" strokeWidth={1.75} />
        </button>
      </div>
      <div className="flex-1 overflow-y-auto px-2 py-3">
        {rootMessage && <MessageItem message={rootMessage} members={members} showThreadAction={false} />}
        <div className="my-2 border-t border-subtle px-2 py-1.5 text-11 font-medium tracking-wide text-tertiary uppercase">
          {replies.length} {replies.length === 1 ? "reply" : "replies"}
        </div>
        <div className="flex flex-col gap-0.5">
          {replies.map((reply) => (
            <MessageItem key={reply.id} message={reply} members={members} showThreadAction={false} />
          ))}
        </div>
      </div>
      <MessageComposer
        members={members}
        disabled={disabled || !rootMessage}
        placeholder="Reply in thread…"
        onSend={onSend}
        threadRootId={rootMessage?.id}
      />
    </aside>
  );
}
