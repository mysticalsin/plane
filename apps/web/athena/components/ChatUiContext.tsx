/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 *
 * Thread-panel open/close state, shared between MessageList (the "reply in thread"
 * affordance) and ThreadPanel/ChatShell (the panel itself and its Escape-to-close
 * handler) without threading a prop through every intermediate layer.
 */

import { createContext, useContext } from "react";

export interface ChatUiState {
  readonly openThreadRootId: string | null;
  readonly openThread: (messageId: string) => void;
  readonly closeThread: () => void;
}

const ChatUiContext = createContext<ChatUiState | null>(null);

export const ChatUiProvider = ChatUiContext.Provider;

export function useChatUi(): ChatUiState {
  const ctx = useContext(ChatUiContext);
  if (!ctx) throw new Error("useChatUi must be used within ChatShell");
  return ctx;
}
