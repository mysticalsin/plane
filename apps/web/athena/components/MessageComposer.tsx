/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 *
 * Enter sends, Shift+Enter inserts a newline, Escape (when no mention popup is open) is
 * left to bubble up to ChatShell's global handler, which closes the thread panel.
 */

import { useRef, useState } from "react";
import type { KeyboardEvent } from "react";
import { Send } from "lucide-react";
import { TextArea } from "@plane/ui";
import { cn } from "@plane/utils";
import { detectMentionTrigger, matchMembers } from "../hooks/useMentionTrigger";
import { FOCUS_RING } from "../utils/focusRing";
import { MentionAutocomplete } from "./MentionAutocomplete";
import type { ChatMember } from "../types/chat";

interface MessageComposerProps {
  readonly members: readonly ChatMember[];
  readonly disabled: boolean;
  readonly placeholder: string;
  readonly onSend: (content: string, threadRootId?: string) => Promise<{ ok: boolean }>;
  readonly threadRootId?: string;
}

export function MessageComposer(props: MessageComposerProps) {
  const { members, disabled, placeholder, onSend, threadRootId } = props;
  const [value, setValue] = useState("");
  const [sending, setSending] = useState(false);
  const [trigger, setTrigger] = useState<{ query: string; startIndex: number } | null>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const matches = trigger ? matchMembers(members, trigger.query) : [];

  function updateTriggerFromCaret(nextValue: string) {
    const caret = textareaRef.current?.selectionStart ?? nextValue.length;
    setTrigger(detectMentionTrigger(nextValue, caret));
    setActiveIndex(0);
  }

  function insertMention(member: ChatMember) {
    if (!trigger) return;
    const caret = textareaRef.current?.selectionStart ?? value.length;
    const before = value.slice(0, trigger.startIndex);
    const after = value.slice(caret);
    setValue(`${before}@${member.displayName} ${after}`);
    setTrigger(null);
    requestAnimationFrame(() => {
      const pos = before.length + member.displayName.length + 2;
      textareaRef.current?.setSelectionRange(pos, pos);
      textareaRef.current?.focus();
    });
  }

  async function send() {
    const content = value.trim();
    if (!content || sending) return;
    setValue(""); // optimistic: clear immediately
    setSending(true);
    const result = await onSend(content, threadRootId);
    setSending(false);
    if (!result.ok) setValue(content); // rollback — hand the typed text back, Slack-style
  }

  function handleKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (matches.length > 0 && handleAutocompleteKey(e)) return;
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      void send();
    }
  }

  /** Returns true if the key was consumed by the open mention popup. */
  function handleAutocompleteKey(e: KeyboardEvent<HTMLTextAreaElement>): boolean {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => (i + 1) % matches.length);
      return true;
    }
    if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => (i - 1 + matches.length) % matches.length);
      return true;
    }
    if (e.key === "Enter" || e.key === "Tab") {
      e.preventDefault();
      insertMention(matches[activeIndex]);
      return true;
    }
    if (e.key === "Escape") {
      e.preventDefault();
      e.stopPropagation(); // close the popup only, not the thread panel
      setTrigger(null);
      return true;
    }
    return false;
  }

  return (
    <div className="relative border-t border-subtle bg-surface-1 p-3">
      <MentionAutocomplete matches={matches} activeIndex={activeIndex} onSelect={insertMention} />
      <div className="flex items-end gap-2">
        <TextArea
          ref={textareaRef}
          value={value}
          disabled={disabled}
          placeholder={placeholder}
          mode="primary"
          textAreaSize="sm"
          className={cn("max-h-40 min-h-11", FOCUS_RING)}
          onChange={(e) => {
            setValue(e.target.value);
            updateTriggerFromCaret(e.target.value);
          }}
          onKeyDown={handleKeyDown}
        />
        <button
          type="button"
          onClick={() => void send()}
          disabled={disabled || sending || value.trim().length === 0}
          aria-label="Send message"
          className={cn(
            "flex size-11 flex-shrink-0 items-center justify-center rounded-md bg-accent-primary text-on-color transition-colors motion-reduce:transition-none",
            "disabled:cursor-not-allowed disabled:bg-layer-1 disabled:text-placeholder",
            FOCUS_RING
          )}
        >
          <Send className="size-4" strokeWidth={1.75} />
        </button>
      </div>
    </div>
  );
}
