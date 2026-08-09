/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import type { ChatMember } from "../types/chat";

export interface MentionTrigger {
  readonly query: string;
  readonly startIndex: number;
}

/** Finds the `@query` immediately before the caret, if any — the `@` must sit at the
 * start of the text or after whitespace, and nothing between it and the caret may itself
 * contain whitespace (otherwise the mention was already "finished" by a space). */
export function detectMentionTrigger(value: string, caret: number): MentionTrigger | null {
  const upToCaret = value.slice(0, caret);
  const atIndex = upToCaret.lastIndexOf("@");
  if (atIndex === -1) return null;

  const before = upToCaret[atIndex - 1];
  if (before !== undefined && !/\s/.test(before)) return null;

  const between = upToCaret.slice(atIndex + 1);
  if (/\s/.test(between)) return null;

  return { query: between, startIndex: atIndex };
}

export function matchMembers(members: readonly ChatMember[], query: string): ChatMember[] {
  const q = query.toLowerCase();
  return members.filter((m) => m.displayName.toLowerCase().includes(q)).slice(0, 6);
}
