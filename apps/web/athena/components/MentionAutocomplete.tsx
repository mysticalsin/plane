/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 *
 * Anchored above the composer rather than at the caret's pixel position — good enough for
 * a single-line-to-a-few-lines composer and avoids adding a caret-measurement dependency
 * for this build.
 */

import { Bot, User } from "lucide-react";
import { cn } from "@plane/utils";
import type { ChatMember } from "../types/chat";

interface MentionAutocompleteProps {
  readonly matches: readonly ChatMember[];
  readonly activeIndex: number;
  readonly onSelect: (member: ChatMember) => void;
}

export function MentionAutocomplete(props: MentionAutocompleteProps) {
  const { matches, activeIndex, onSelect } = props;
  if (matches.length === 0) return null;

  return (
    <div
      role="listbox"
      aria-label="Mention someone"
      className="shadow-lg absolute bottom-full left-0 mb-1.5 max-h-56 w-64 overflow-y-auto rounded-md border border-subtle bg-surface-1 p-1"
    >
      {matches.map((member, i) => {
        const Icon = member.kind === "AGENT" ? Bot : User;
        return (
          <button
            key={member.id}
            type="button"
            role="option"
            aria-selected={i === activeIndex}
            // onMouseDown (not onClick) fires before the textarea's blur, so the mention
            // insert runs while selection state is still intact.
            onMouseDown={(e) => {
              e.preventDefault();
              onSelect(member);
            }}
            className={cn(
              "flex min-h-9 w-full items-center gap-2 rounded px-2 py-1.5 text-left text-13",
              i === activeIndex
                ? "bg-layer-transparent-active text-primary"
                : "text-secondary hover:bg-layer-transparent-hover"
            )}
          >
            <Icon
              className={cn(
                "size-3.5 flex-shrink-0",
                member.kind === "AGENT" ? "text-accent-primary" : "text-tertiary"
              )}
              strokeWidth={1.75}
            />
            <span className="truncate">{member.displayName}</span>
            {member.kind === "AGENT" && <span className="ml-auto text-11 text-accent-primary">Agent</span>}
          </button>
        );
      })}
    </div>
  );
}
