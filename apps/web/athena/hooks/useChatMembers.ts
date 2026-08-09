/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useEffect, useState } from "react";
import { listChatMembers } from "../api/chatClient";
import type { ChatMember } from "../types/chat";
import type { ChatFetchStatus } from "./types";

export interface UseChatMembersResult {
  readonly status: ChatFetchStatus;
  readonly members: readonly ChatMember[];
}

/** Backs @mention autocomplete and mention rendering. Failure degrades silently to an empty
 * list — a stalled member directory should never block reading or sending messages. */
export function useChatMembers(): UseChatMembersResult {
  const [status, setStatus] = useState<ChatFetchStatus>("loading");
  const [members, setMembers] = useState<readonly ChatMember[]>([]);

  useEffect(() => {
    let cancelled = false;
    listChatMembers()
      .then((res) => {
        if (cancelled) return;
        setMembers(res.members);
        setStatus("ready");
      })
      .catch(() => {
        if (cancelled) return;
        setStatus("error");
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return { status, members };
}
