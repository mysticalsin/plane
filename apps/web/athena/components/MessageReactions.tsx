/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 *
 * Reactions on a message.
 *
 * The BFF has served a per-message tally on every message since chat shipped and nothing rendered
 * it, so a reaction could be counted and never seen. The picker is a fixed, small set rather than
 * a full emoji keyboard: the point of a reaction is to answer without writing a message, and a
 * grid of two thousand glyphs is a worse way to say "yes" than typing it.
 */
import { useState } from "react";
import { SmilePlus } from "lucide-react";
import { cn } from "@plane/utils";
import { FOCUS_RING } from "../utils/focusRing";
import type { ChatReactionSummary } from "../types/chat";

/** Chosen for a bid team's actual vocabulary: agreement, attention, done, thanks, thinking. */
const QUICK_REACTIONS = ["👍", "👀", "✅", "🙏", "🤔"] as const;

interface MessageReactionsProps {
  readonly messageId: string;
  readonly reactions: readonly ChatReactionSummary[];
  readonly onToggle: (messageId: string, emoji: string) => void;
  /** Hidden for a message that has not reached the relay yet — it has no id to react to. */
  readonly disabled: boolean;
}

export function MessageReactions(props: MessageReactionsProps) {
  const { messageId, reactions, onToggle, disabled } = props;
  const [pickerOpen, setPickerOpen] = useState(false);

  if (disabled) return null;

  return (
    <div className="mt-1 flex flex-wrap items-center gap-1">
      {reactions.map((reaction) => (
        <button
          key={reaction.emoji}
          type="button"
          onClick={() => onToggle(messageId, reaction.emoji)}
          aria-pressed={reaction.hasReacted}
          aria-label={`${reaction.emoji} ${reaction.count}${reaction.hasReacted ? ", including you" : ""}`}
          className={cn(
            "flex items-center gap-1 rounded-full border px-1.5 py-0.5 text-12 tabular-nums transition-colors motion-reduce:transition-none",
            reaction.hasReacted
              ? "border-accent-primary/40 bg-accent-primary/10 text-accent-primary"
              : "border-subtle text-secondary hover:bg-layer-2",
            FOCUS_RING
          )}
        >
          <span aria-hidden>{reaction.emoji}</span>
          {reaction.count}
        </button>
      ))}

      <div className="relative">
        <button
          type="button"
          onClick={() => setPickerOpen((open) => !open)}
          aria-label="Add a reaction"
          aria-expanded={pickerOpen}
          className={cn(
            "flex size-6 items-center justify-center rounded-full text-tertiary hover:bg-layer-2 hover:text-primary",
            // Visible on hover of the message, or whenever the picker is open, or when there is
            // nothing else in the row to hint that reacting is possible.
            reactions.length > 0 && !pickerOpen && "opacity-0 group-hover:opacity-100",
            FOCUS_RING
          )}
        >
          <SmilePlus className="size-3.5" strokeWidth={1.75} />
        </button>

        {pickerOpen && (
          <div className="shadow-md absolute bottom-full left-0 z-10 mb-1 flex gap-0.5 rounded-md border border-subtle bg-surface-1 p-1">
            {QUICK_REACTIONS.map((emoji) => (
              <button
                key={emoji}
                type="button"
                onClick={() => {
                  onToggle(messageId, emoji);
                  setPickerOpen(false);
                }}
                aria-label={`React with ${emoji}`}
                className={cn("rounded px-1.5 py-0.5 text-14 hover:bg-layer-2", FOCUS_RING)}
              >
                {emoji}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
