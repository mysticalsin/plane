/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 *
 * Populates the two filter dropdowns. Channels reuse ../../api/chatClient's listChatChannels
 * (../../hooks/useChatChannels already validates that shape) rather than a second channel
 * fetcher — one channel list for the whole app. A failure here degrades to "All
 * engagements"/"All channels" only, rather than blocking the files table behind a second
 * error screen for what is a secondary, non-essential filter.
 */
import { useEffect, useState } from "react";
import { listChatChannels } from "../../api/chatClient";
import type { ChatChannel } from "../../types/chat";
import { listEngagementOptions, type EngagementOption } from "./engagementsApi";

export interface UseFilterOptionsResult {
  readonly engagements: readonly EngagementOption[];
  readonly channels: readonly ChatChannel[];
}

export function useFilterOptions(): UseFilterOptionsResult {
  const [engagements, setEngagements] = useState<readonly EngagementOption[]>([]);
  const [channels, setChannels] = useState<readonly ChatChannel[]>([]);

  useEffect(() => {
    let cancelled = false;
    listEngagementOptions()
      .then((options) => {
        if (!cancelled) setEngagements(options);
      })
      .catch(() => undefined);
    listChatChannels()
      .then((res) => {
        if (!cancelled) setChannels(res.channels);
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, []);

  return { engagements, channels };
}
