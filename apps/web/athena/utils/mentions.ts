/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 *
 * Splits message content into plain-text and @mention segments so MessageItem can render
 * agent mentions distinctly from human mentions. Deliberately simple: match `@DisplayName`
 * against the channel's known member list rather than parsing a formal mention markup —
 * there is no mention markup on the wire, `content` is the raw string Buzz stored.
 */

import type { ChatMember } from "../types/chat";

export interface MentionSegment {
  readonly type: "text" | "mention";
  readonly value: string;
  readonly member?: ChatMember;
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function splitMentions(content: string, members: readonly ChatMember[]): MentionSegment[] {
  if (members.length === 0 || !content.includes("@")) {
    return [{ type: "text", value: content }];
  }

  // Longest name first so "@Ada" can't shadow a match inside "@AdaBot".
  const byName = new Map(members.map((m) => [m.displayName, m] as const));
  // Spread-then-sort rather than toSorted: this app's TS lib target predates ES2023. The spread
  // already makes a copy, so nothing the caller owns is mutated.
  // oxlint-disable-next-line unicorn/no-array-sort
  const names = [...byName.keys()].sort((a, b) => b.length - a.length).map(escapeRegExp);
  const pattern = new RegExp(`@(${names.join("|")})\\b`, "g");

  const segments: MentionSegment[] = [];
  let lastIndex = 0;
  for (const match of content.matchAll(pattern)) {
    const index = match.index ?? 0;
    if (index > lastIndex) segments.push({ type: "text", value: content.slice(lastIndex, index) });
    const member = byName.get(match[1]);
    segments.push({ type: "mention", value: match[0], member });
    lastIndex = index + match[0].length;
  }
  if (lastIndex < content.length) segments.push({ type: "text", value: content.slice(lastIndex) });
  return segments.length > 0 ? segments : [{ type: "text", value: content }];
}
